import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { SlidersHorizontal, Sparkles, Palette, Type, Volume2, Layers } from 'lucide-react';
import PropertiesPanel from './PropertiesPanel';
import ColorGradingPanel from './ColorGradingPanel';
import TextPanel from './TextPanel';
import AudioPanel from './AudioPanel';
import MaskPanel from './MaskPanel';
import type { RightPanelTab } from '../../../engine/video-editor/types';

const tabs: { id: RightPanelTab; icon: React.ElementType }[] = [
  { id: 'properties', icon: SlidersHorizontal },
  { id: 'effects', icon: Sparkles },
  { id: 'color', icon: Palette },
  { id: 'text', icon: Type },
  { id: 'audio', icon: Volume2 },
  { id: 'mask', icon: Layers },
];

export default function RightPanel() {
  const { state, dispatch } = useVideoEditor();

  return (
    <div className="ve-right-panel">
      <div className="ve-panel">
        <div className="ve-panel-tabs">
          {tabs.map(tab => (
            <button key={tab.id}
              className={`ve-panel-tab ${state.activeRightPanel === tab.id ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_RIGHT_PANEL', payload: tab.id })}
              title={tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}>
              <tab.icon size={14} />
            </button>
          ))}
        </div>
        <div className="ve-panel-body">
          {state.activeRightPanel === 'properties' && <PropertiesPanel />}
          {state.activeRightPanel === 'effects' && <EffectsAppliedPanel />}
          {state.activeRightPanel === 'color' && <ColorGradingPanel />}
          {state.activeRightPanel === 'text' && <TextPanel />}
          {state.activeRightPanel === 'audio' && <AudioPanel />}
          {state.activeRightPanel === 'mask' && <MaskPanel />}
        </div>
      </div>
    </div>
  );
}

function EffectsAppliedPanel() {
  const { state, dispatch } = useVideoEditor();
  const clipId = state.selectedClipIds[0];

  if (!clipId || !state.project) {
    return (
      <div className="ve-empty">
        <Sparkles size={24} className="ve-empty-icon" />
        <div className="ve-empty-title">No clip selected</div>
        <div className="ve-empty-desc">Select a clip to view its effects</div>
      </div>
    );
  }

  const clip = state.project.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
  if (!clip) return null;

  return (
    <div>
      <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Applied Effects</div>
      {clip.effects.length === 0 ? (
        <div className="ve-empty">
          <Sparkles size={20} className="ve-empty-icon" />
          <div className="ve-empty-desc">Drag effects from the left panel</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {clip.effects.map(effect => (
            <div key={effect.id} style={{
              padding: '8px 10px', borderRadius: 6, background: 'var(--ve-bg-surface)',
              border: effect.id === state.selectedEffectId ? '1px solid var(--ve-accent)' : '1px solid var(--ve-border)',
              boxShadow: effect.id === state.selectedEffectId ? '0 0 0 1px rgba(250,204,21,0.18)' : undefined,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className={`ve-toggle ${effect.enabled ? 'active' : ''}`}
                  onClick={() => dispatch({ type: 'TOGGLE_EFFECT', payload: { clipId, effectId: effect.id } })} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{effect.name}</span>
              </div>
              <button className="ve-tool-btn" style={{ width: 20, height: 20 }}
                onClick={() => dispatch({ type: 'REMOVE_EFFECT', payload: { clipId, effectId: effect.id } })}>
                <span style={{ fontSize: 13, color: '#ef4444' }}>×</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
