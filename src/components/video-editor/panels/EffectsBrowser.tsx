import { useState, useMemo, useRef } from 'react';
import { EFFECT_DEFINITIONS } from '../../../engine/video-editor/constants';
import { Search, CircleDot, Sun, MoveRight, Zap, Focus, Aperture, Circle, FlipHorizontal, Sparkles, Lightbulb, Grid3X3, Layers, ScanLine } from 'lucide-react';
import type { EffectCategory } from '../../../engine/video-editor/types';
import { useAppLogger } from '../../../utils/LoggerContext';
import type { Clip } from '../../../engine/video-editor/types';

const ICON_MAP: Record<string, React.ElementType> = {
  CircleDot, Sun, MoveRight, Zap, Focus, Aperture, Circle, FlipHorizontal, Sparkles, Lightbulb, Grid3X3, Layers, ScanLine,
};

const CATEGORIES: { id: EffectCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'blur', label: 'Blur' },
  { id: 'sharpen', label: 'Sharpen' },
  { id: 'distort', label: 'Distort' },
  { id: 'stylize', label: 'Stylize' },
];

import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';

export default function EffectsBrowser() {
  const { state, dispatch } = useVideoEditor();
  const { logSuccess, logWarning } = useAppLogger();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<EffectCategory | 'all'>('all');
  const [dragGhost, setDragGhost] = useState<{ effect: typeof EFFECT_DEFINITIONS[number]; x: number; y: number } | null>(null);
  const dragRef = useRef<{ effect: typeof EFFECT_DEFINITIONS[number]; startX: number; startY: number; active: boolean } | null>(null);

  const filtered = useMemo(() => {
    return EFFECT_DEFINITIONS.filter(e => {
      if (category !== 'all' && e.category !== category) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, category]);

  const createEffectInstance = (effect: typeof EFFECT_DEFINITIONS[number], startOffset?: number, duration?: number) => ({
    id: `fx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: effect.type,
    name: effect.name,
    category: effect.category,
    enabled: true,
    params: JSON.parse(JSON.stringify(effect.defaultParams)),
    keyframes: [],
    expanded: true,
    startOffset,
    duration,
  });

  const applyEffectToClip = (effect: typeof EFFECT_DEFINITIONS[number], clipId: string, startOffset?: number, duration?: number) => {
    dispatch({
      type: 'ADD_EFFECT',
      payload: {
        clipId,
        effect: createEffectInstance(effect, startOffset, duration),
      },
    });
  };

  const findClip = (clipId: string) => state.project?.tracks.flatMap(track => track.clips).find(clip => clip.id === clipId) ?? null;

  const getClipAtPoint = (clientX: number, clientY: number): { clip: Clip; clipEl: HTMLElement } | null => {
    const elements = document.elementsFromPoint(clientX, clientY);
    const clipEl = elements
      .map(el => (el instanceof HTMLElement ? el.closest('.ve-clip') : null))
      .find(Boolean) as HTMLElement | null;
    if (!clipEl?.dataset.clipId) return null;
    const clip = findClip(clipEl.dataset.clipId);
    return clip ? { clip, clipEl } : null;
  };

  const applyEffectAtPoint = (effect: typeof EFFECT_DEFINITIONS[number], clientX: number, clientY: number) => {
    const pointedClip = getClipAtPoint(clientX, clientY);
    if (pointedClip) {
      const { clip, clipEl } = pointedClip;
      if (!clip || clip.mediaType === 'audio') {
        logWarning('Audio skipped', 'Visual effects cannot be applied to audio clips');
        return;
      }
      const rect = clipEl.getBoundingClientRect();
      const startOffset = Math.max(0, Math.min(clip.duration - 0.1, (clientX - rect.left) / state.timelineZoom));
      applyEffectToClip(effect, clip.id, startOffset, Math.min(3, Math.max(0.1, clip.duration - startOffset)));
      logSuccess('Effect applied', `${effect.name} added to "${clip.label || clip.mediaName}"`);
      return;
    }

    const elements = document.elementsFromPoint(clientX, clientY);
    const trackEl = elements
      .map(el => (el instanceof HTMLElement ? el.closest('.ve-track-clips') : null))
      .find(Boolean) as HTMLElement | null;
    if (trackEl?.dataset.trackId && trackEl.dataset.trackType !== 'audio') {
      const track = state.project?.tracks.find(item => item.id === trackEl.dataset.trackId);
      const rect = trackEl.getBoundingClientRect();
      const dropTime = Math.max(0, (clientX - rect.left + trackEl.scrollLeft) / state.timelineZoom);
      const clip = track?.clips.find(item => dropTime >= item.startTime && dropTime < item.startTime + item.duration);
      if (clip && clip.mediaType !== 'audio') {
        const startOffset = Math.max(0, dropTime - clip.startTime);
        applyEffectToClip(effect, clip.id, startOffset, Math.min(3, Math.max(0.1, clip.duration - startOffset)));
        logSuccess('Effect applied', `${effect.name} added to "${clip.label || clip.mediaName}"`);
        return;
      }
    }

    logWarning('Drop on media', 'Drag the effect onto a video or image clip');
  };

  const clearDropTargets = () => {
    document.querySelectorAll('.ve-track-clips.drop-target').forEach(el => el.classList.remove('drop-target'));
    document.querySelectorAll('.ve-clip.drop-target').forEach(el => el.classList.remove('drop-target'));
  };

  const handleEffectMouseDown = (event: React.MouseEvent, effect: typeof EFFECT_DEFINITIONS[number]) => {
    if (event.button !== 0) return;
    dragRef.current = { effect, startX: event.clientX, startY: event.clientY, active: false };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = moveEvent.clientX - drag.startX;
      const dy = moveEvent.clientY - drag.startY;
      if (!drag.active && Math.abs(dx) + Math.abs(dy) < 5) return;
      drag.active = true;
      setDragGhost({ effect: drag.effect, x: moveEvent.clientX, y: moveEvent.clientY });
      clearDropTargets();

      const pointedClip = getClipAtPoint(moveEvent.clientX, moveEvent.clientY);
      if (pointedClip && pointedClip.clip.mediaType !== 'audio') {
        pointedClip.clipEl.classList.add('drop-target');
      } else {
        const elements = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY);
        const trackEl = elements
          .map(el => (el instanceof HTMLElement ? el.closest('.ve-track-clips') : null))
          .find(Boolean) as HTMLElement | null;
        if (trackEl?.dataset.trackType !== 'audio') trackEl?.classList.add('drop-target');
      }

      moveEvent.preventDefault();
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const drag = dragRef.current;
      dragRef.current = null;
      clearDropTargets();
      setDragGhost(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (drag?.active) {
        applyEffectAtPoint(drag.effect, upEvent.clientX, upEvent.clientY);
        upEvent.preventDefault();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search effects..."
          className="ve-number-input" style={{ width: '100%', paddingLeft: 26, textAlign: 'left', borderRadius: 6 }} />
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id}
            className={`ve-curve-tab ${category === cat.id ? 'active' : ''}`}
            style={{ color: category === cat.id ? '#FACC15' : undefined, borderColor: category === cat.id ? '#FACC15' : undefined }}
            onClick={() => setCategory(cat.id)}>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="ve-effect-grid">
        {filtered.map(effect => {
          const Icon = ICON_MAP[effect.icon] || Sparkles;
          return (
            <div key={effect.type} className="ve-effect-card"
              onMouseDown={(event) => handleEffectMouseDown(event, effect)}
              onDoubleClick={() => {
                if (state.selectedClipIds.length > 0) {
                  const selectedClips = state.project?.tracks
                    .flatMap(track => track.clips)
                    .filter(clip => state.selectedClipIds.includes(clip.id)) ?? [];
                  const visualClips = selectedClips.filter(clip => clip.mediaType !== 'audio');
                  visualClips.forEach(clip => {
                    dispatch({
                      type: 'ADD_EFFECT',
                      payload: {
                        clipId: clip.id,
                        effect: {
                          ...createEffectInstance(effect),
                        }
                      }
                    });
                  });
                  if (visualClips.length > 0) {
                    logSuccess('Effect applied', `${effect.name} added to ${visualClips.length} clip${visualClips.length === 1 ? '' : 's'}`);
                  }
                  if (visualClips.length < selectedClips.length) {
                    logWarning('Audio skipped', 'Visual effects cannot be applied to audio clips');
                  }
                } else {
                  logWarning('Select a clip first', `Double-click applies "${effect.name}" to selected clips`);
                }
              }}
              title={effect.description}>
              <div className="ve-effect-card-icon"><Icon size={16} /></div>
              <div className="ve-effect-card-name">{effect.name}</div>
              <div className="ve-effect-card-desc">{effect.description}</div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="ve-empty">
          <Sparkles size={24} className="ve-empty-icon" />
          <div className="ve-empty-title">No effects found</div>
          <div className="ve-empty-desc">Try a different search term or category</div>
        </div>
      )}

      {dragGhost && (
        <div className="ve-effect-drag-ghost" style={{ left: dragGhost.x + 12, top: dragGhost.y + 12 }}>
          <span className="ve-effect-drag-ghost-dot" />
          <span>{dragGhost.effect.name}</span>
        </div>
      )}
    </div>
  );
}
