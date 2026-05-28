import { useState, useMemo } from 'react';
import { TRANSITION_DEFINITIONS } from '../../../engine/video-editor/constants';
import { Search, ArrowRightLeft, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowUpRight, ZoomIn, ZoomOut, RotateCw, Zap, Sparkles, Flame, Wand2, Moon, Sun } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, ArrowUpRight, ZoomIn, ZoomOut, RotateCw, Zap, Sparkles, Flame, Wand2, Moon, Sun,
  Blend: ArrowRightLeft, PanelLeft: ArrowLeft, PanelRight: ArrowRight, PanelTop: ArrowUp, PanelBottom: ArrowDown,
  ArrowLeftToLine: ArrowLeft, ArrowRightToLine: ArrowRight,
};

const CATEGORIES = ['All', 'Dissolve', 'Wipe', 'Slide', 'Zoom', '3D'];

import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';

export default function TransitionBrowser() {
  const { state, dispatch } = useVideoEditor();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    return TRANSITION_DEFINITIONS.filter(t => {
      if (category !== 'All' && t.category !== category) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, category]);

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transitions..."
          className="ve-number-input" style={{ width: '100%', paddingLeft: 26, textAlign: 'left', borderRadius: 6 }} />
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {CATEGORIES.map(cat => (
          <button key={cat}
            className={`ve-curve-tab ${category === cat ? 'active' : ''}`}
            style={{ color: category === cat ? '#FACC15' : undefined, borderColor: category === cat ? '#FACC15' : undefined }}
            onClick={() => setCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      <div className="ve-effect-grid">
        {filtered.map(t => {
          const Icon = ICON_MAP[t.icon] || ArrowRightLeft;
          return (
            <div key={t.type} className="ve-effect-card" draggable title={t.description}
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'transition', transitionType: t.type, duration: t.defaultDuration }));
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onDoubleClick={() => {
                if (state.selectedClipIds.length > 0) {
                  state.selectedClipIds.forEach(clipId => {
                    dispatch({
                      type: 'ADD_TRANSITION',
                      payload: {
                        clipId,
                        transition: {
                          id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          type: t.type,
                          duration: t.defaultDuration,
                          easing: 'ease-in-out',
                          edge: 'start'
                        }
                      }
                    });
                  });
                }
              }}>
              <div className="ve-effect-card-icon"><Icon size={16} /></div>
              <div className="ve-effect-card-name">{t.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>{t.defaultDuration}s</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', padding: '0 4px', borderRadius: 3 }}>{t.category}</span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="ve-empty">
          <ArrowRightLeft size={24} className="ve-empty-icon" />
          <div className="ve-empty-title">No transitions found</div>
        </div>
      )}
    </div>
  );
}
