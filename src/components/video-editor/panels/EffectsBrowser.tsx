import { useState, useMemo } from 'react';
import { EFFECT_DEFINITIONS } from '../../../engine/video-editor/constants';
import { Search, CircleDot, Sun, MoveRight, Zap, Focus, Aperture, Circle, FlipHorizontal, Sparkles, Lightbulb, Grid3X3, Layers, ScanLine } from 'lucide-react';
import type { EffectCategory } from '../../../engine/video-editor/types';
import { useAppLogger } from '../../../utils/LoggerContext';
import { setEffectDragData } from '../dragDrop';

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
  const { logInfo, logSuccess, logWarning } = useAppLogger();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<EffectCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return EFFECT_DEFINITIONS.filter(e => {
      if (category !== 'all' && e.category !== category) return false;
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, category]);

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
            <div key={effect.type} className="ve-effect-card" draggable={true}
              onDragStart={(e) => {
                setEffectDragData(e.dataTransfer, { dragKind: 'effect', effectType: effect.type });
                logInfo('Effect ready', `Drag "${effect.name}" onto a timeline clip`);
              }}
              onDoubleClick={() => {
                if (state.selectedClipIds.length > 0) {
                  state.selectedClipIds.forEach(clipId => {
                    dispatch({
                      type: 'ADD_EFFECT',
                      payload: {
                        clipId,
                        effect: {
                          id: `fx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          type: effect.type,
                          name: effect.name,
                          category: effect.category,
                          enabled: true,
                          params: JSON.parse(JSON.stringify(effect.defaultParams)),
                          keyframes: [],
                          expanded: true,
                        }
                      }
                    });
                  });
                  logSuccess('Effect applied', `${effect.name} added to ${state.selectedClipIds.length} clip${state.selectedClipIds.length === 1 ? '' : 's'}`);
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
    </div>
  );
}
