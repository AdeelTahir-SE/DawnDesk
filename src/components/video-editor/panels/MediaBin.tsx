import { useState, useMemo, useRef } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { useFFmpeg } from '../../../engine/video-editor/useFFmpeg';
import { Search, Plus, Grid3X3, List, Film, Music, Image, X, Loader2 } from 'lucide-react';
import type { MediaItem, Track } from '../../../engine/video-editor/types';
import { convertFileSrc } from '@tauri-apps/api/core';
import { getDragMediaPayload } from '../dragDrop';

const typeIcons: Record<string, React.ElementType> = { video: Film, audio: Music, image: Image };

function formatDuration(sec: number): string {
  if (sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

function formatSize(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

const flagColors: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', yellow: '#FACC15',
  green: '#22c55e', blue: '#3b82f6', purple: '#a855f7',
};

function trackAcceptsMedia(track: Track, mediaType: MediaItem['type']) {
  return track.type === mediaType || (track.type === 'video' && mediaType === 'image');
}

function mediaOverlapsTrack(track: Track, startTime: number, duration: number) {
  const endTime = startTime + duration;
  return track.clips.some(clip =>
    startTime < clip.startTime + clip.duration &&
    endTime > clip.startTime
  );
}

export default function MediaBin() {
  const { state, dispatch } = useVideoEditor();
  const { importMedia } = useFFmpeg();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [brokenThumbIds, setBrokenThumbIds] = useState<Set<string>>(() => new Set());
  const [dragGhost, setDragGhost] = useState<{ item: MediaItem; x: number; y: number } | null>(null);
  const dragRef = useRef<{ item: MediaItem; startX: number; startY: number; active: boolean } | null>(null);

  const media = state.project?.mediaPool || [];

  const filtered = useMemo(() => {
    if (!search) return media;
    const q = search.toLowerCase();
    return media.filter(m => m.name.toLowerCase().includes(q) || m.type.includes(q) || m.codec.toLowerCase().includes(q));
  }, [media, search]);

  const getThumbnailSrc = (item: MediaItem) => {
    if (brokenThumbIds.has(item.id)) return '';
    if (item.thumbnail) {
      if (/^(data:|https?:|asset:)/i.test(item.thumbnail)) return item.thumbnail;
      return convertFileSrc(item.thumbnail);
    }
    return item.type === 'image' && item.path ? convertFileSrc(item.path) : '';
  };

  const markBrokenThumbnail = (itemId: string) => {
    setBrokenThumbIds(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  };

  const handleAddToTimeline = (item: MediaItem) => {
    if (!state.project) return;
    const acceptsMedia = (trackType: string) =>
      (item.type === 'audio' && trackType === 'audio') || (item.type !== 'audio' && trackType === 'video');
    const selectedTrack = state.selectedTrackId
      ? state.project.tracks.find(t => t.id === state.selectedTrackId && acceptsMedia(t.type) && !t.locked)
      : null;
    const targetTrack = selectedTrack || state.project.tracks.find(t =>
      (item.type === 'audio' && t.type === 'audio') || (item.type !== 'audio' && t.type === 'video')
    );
    if (!targetTrack) {
      dispatch({ type: 'ADD_MEDIA_TO_NEW_TRACK', payload: { media: getDragMediaPayload(item), startTime: state.playheadTime } });
      return;
    }
    const lastEnd = targetTrack.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
    dispatch({
      type: 'ADD_CLIP',
      payload: {
        trackId: targetTrack.id,
        clip: {
          id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          trackId: targetTrack.id, mediaId: item.id, mediaName: item.name, mediaType: item.type,
          startTime: lastEnd, duration: item.duration || 5, inPoint: item.inPoint, outPoint: item.outPoint,
          speed: 1, reversed: false, volume: 1, opacity: 1,
          positionX: 0, positionY: 0, scale: 1, rotation: 0,
          effects: [], transition: null, color: '', locked: false, label: '', path: item.path,
        },
      },
    });
  };

  const addMediaAtPointer = (item: MediaItem, clientX: number, clientY: number) => {
    if (!state.project) return;
    const elements = document.elementsFromPoint(clientX, clientY);
    const trackEl = elements
      .map(el => (el instanceof HTMLElement ? el.closest('.ve-track-clips') : null))
      .find(Boolean) as HTMLElement | null;
    const timelineEl = elements.find(el => el.classList.contains('ve-timeline-scroll')) as HTMLElement | undefined;

    const duration = item.duration || item.outPoint || 5;
    let startTime = state.playheadTime;

    if (trackEl) {
      const rect = trackEl.getBoundingClientRect();
      startTime = Math.max(0, (clientX - rect.left + trackEl.scrollLeft) / state.timelineZoom);
      const targetTrack = state.project.tracks.find(track => track.id === trackEl.dataset.trackId);
      if (targetTrack && trackAcceptsMedia(targetTrack, item.type) && !targetTrack.locked && !mediaOverlapsTrack(targetTrack, startTime, duration)) {
        dispatch({
          type: 'ADD_CLIP',
          payload: {
            trackId: targetTrack.id,
            clip: {
              id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              trackId: targetTrack.id,
              mediaId: item.id,
              mediaName: item.name,
              mediaType: item.type,
              startTime,
              duration,
              inPoint: item.inPoint || 0,
              outPoint: item.outPoint || duration,
              speed: 1,
              reversed: false,
              volume: 1,
              opacity: 1,
              positionX: 0,
              positionY: 0,
              scale: 1,
              rotation: 0,
              effects: [],
              transition: null,
              color: '',
              locked: false,
              label: '',
              path: item.path,
            },
          },
        });
        return;
      }
    } else if (timelineEl) {
      const rect = timelineEl.getBoundingClientRect();
      startTime = Math.max(0, (clientX - rect.left + timelineEl.scrollLeft) / state.timelineZoom);
    } else {
      return;
    }

    dispatch({ type: 'ADD_MEDIA_TO_NEW_TRACK', payload: { media: getDragMediaPayload(item), startTime } });
  };

  const handleMediaMouseDown = (e: React.MouseEvent, item: MediaItem) => {
    if (e.button !== 0) return;
    dragRef.current = { item, startX: e.clientX, startY: e.clientY, active: false };

    const handleMouseMove = (me: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = me.clientX - drag.startX;
      const dy = me.clientY - drag.startY;
      if (!drag.active && Math.abs(dx) + Math.abs(dy) < 5) return;
      drag.active = true;
      setDragGhost({ item: drag.item, x: me.clientX, y: me.clientY });
      const elements = document.elementsFromPoint(me.clientX, me.clientY);
      document.querySelectorAll('.ve-track-clips.drop-target').forEach(el => el.classList.remove('drop-target'));
      const trackEl = elements
        .map(el => (el instanceof HTMLElement ? el.closest('.ve-track-clips') : null))
        .find(Boolean);
      if (trackEl) trackEl.classList.add('drop-target');
      me.preventDefault();
    };

    const handleMouseUp = (me: MouseEvent) => {
      const drag = dragRef.current;
      dragRef.current = null;
      document.querySelectorAll('.ve-track-clips.drop-target').forEach(el => el.classList.remove('drop-target'));
      setDragGhost(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (drag?.active) {
        addMediaAtPointer(drag.item, me.clientX, me.clientY);
        me.preventDefault();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search media..."
            className="ve-number-input" style={{ width: '100%', paddingLeft: 26, textAlign: 'left', borderRadius: 6 }} />
          {search && <button style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} onClick={() => setSearch('')}><X size={10} /></button>}
        </div>
        <button className={`ve-tool-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid3X3 size={13} /></button>
        <button className={`ve-tool-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={13} /></button>
      </div>

      <button onClick={importMedia} disabled={state.isImporting} className="ve-tool-btn" style={{ width: '100%', height: 32, borderRadius: 6, border: '1px dashed rgba(255,255,255,0.15)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)', opacity: state.isImporting ? 0.5 : 1, pointerEvents: state.isImporting ? 'none' : 'auto' }}>
        {state.isImporting ? <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
        {state.isImporting ? 'Importing...' : 'Import Media'}
      </button>

      {viewMode === 'grid' ? (
        <div className="ve-media-grid">
          {filtered.map(item => {
            const Icon = typeIcons[item.type] || Film;
            const thumbnailSrc = getThumbnailSrc(item);
            return (
              <div key={item.id} className={`ve-media-item ${state.selectedMediaIds.includes(item.id) ? 'selected' : ''}`}
                onClick={() => dispatch({ type: 'SELECT_MEDIA', payload: [item.id] })}
                onDoubleClick={() => handleAddToTimeline(item)}
                onMouseDown={e => handleMediaMouseDown(e, item)}>
                <div className="ve-media-thumb">
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt=""
                      draggable={false}
                      onError={() => markBrokenThumbnail(item.id)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Icon size={20} />
                  )}
                  {item.duration > 0 && <span className="ve-media-duration">{formatDuration(item.duration)}</span>}
                  {item.flag !== 'none' && (
                    <span style={{ position: 'absolute', top: 3, left: 3, width: 6, height: 6, borderRadius: '50%', background: flagColors[item.flag] || 'transparent' }} />
                  )}
                </div>
                <div className="ve-media-name">{item.name}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(item => {
            const Icon = typeIcons[item.type] || Film;
            return (
              <div key={item.id} className={`ve-media-list-item ${state.selectedMediaIds.includes(item.id) ? 'selected' : ''}`}
                onClick={() => dispatch({ type: 'SELECT_MEDIA', payload: [item.id] })}
                onDoubleClick={() => handleAddToTimeline(item)}
                onMouseDown={e => handleMediaMouseDown(e, item)}>
                <Icon size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>{formatDuration(item.duration)}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{formatSize(item.fileSize)}</span>
              </div>
            );
          })}
        </div>
      )}
      {dragGhost && (
        <div className="ve-media-drag-ghost" style={{ left: dragGhost.x + 12, top: dragGhost.y + 12 }}>
          <span className="ve-media-drag-ghost-dot" />
          <span>{dragGhost.item.name}</span>
        </div>
      )}
    </div>
  );
}
