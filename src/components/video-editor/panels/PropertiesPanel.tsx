import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { SlidersHorizontal, RotateCw } from 'lucide-react';
import { BLEND_MODE_GROUPS } from '../../../engine/video-editor/constants';

export default function PropertiesPanel() {
  const { state, dispatch } = useVideoEditor();
  const clipId = state.selectedClipIds[0];

  if (!clipId || !state.project) {
    return (
      <div className="ve-empty">
        <SlidersHorizontal size={24} className="ve-empty-icon" />
        <div className="ve-empty-title">No clip selected</div>
        <div className="ve-empty-desc">Select a clip to view its properties</div>
      </div>
    );
  }

  const clip = state.project.tracks.flatMap(t => t.clips).find(c => c.id === clipId);
  if (!clip) return null;

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(2);
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div>
      {/* Clip Info */}
      <div className="ve-panel-section">
        <div className="ve-panel-section-header">
          <span className="ve-panel-section-title">Clip Info</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Name</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{clip.mediaName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Type</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>{clip.mediaType}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Duration</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'JetBrains Mono' }}>{formatDuration(clip.duration)}</span>
          </div>
        </div>
      </div>

      {/* Opacity */}
      {clip.mediaType === 'video' && (
        <div className="ve-panel-section">
          <div className="ve-panel-section-header">
            <span className="ve-panel-section-title">Opacity</span>
          </div>
          <div className="ve-slider-row">
            <input type="range" className="ve-slider" min={0} max={1} step={0.01} value={clip.opacity}
              onChange={e => dispatch({ type: 'SET_CLIP_OPACITY', payload: { clipId, opacity: Number(e.target.value) } })} />
            <span className="ve-slider-value">{Math.round(clip.opacity * 100)}%</span>
          </div>
        </div>
      )}

      {/* Volume */}
      <div className="ve-panel-section">
        <div className="ve-panel-section-header">
          <span className="ve-panel-section-title">Volume</span>
        </div>
        <div className="ve-slider-row">
          <input type="range" className="ve-slider" min={0} max={2} step={0.01} value={clip.volume}
            onChange={e => dispatch({ type: 'SET_CLIP_VOLUME', payload: { clipId, volume: Number(e.target.value) } })} />
          <span className="ve-slider-value">{Math.round(clip.volume * 100)}%</span>
        </div>
      </div>

      {/* Speed */}
      <div className="ve-panel-section">
        <div className="ve-panel-section-header">
          <span className="ve-panel-section-title">Speed</span>
          <button className="ve-tool-btn" style={{ width: 20, height: 20 }} title="Reset Speed"
            onClick={() => dispatch({ type: 'SET_CLIP_SPEED', payload: { clipId, speed: 1 } })}>
            <RotateCw size={10} />
          </button>
        </div>
        <div className="ve-slider-row">
          <input type="range" className="ve-slider" min={0.1} max={4} step={0.05} value={clip.speed}
            onChange={e => dispatch({ type: 'SET_CLIP_SPEED', payload: { clipId, speed: Number(e.target.value) } })} />
          <span className="ve-slider-value">{clip.speed.toFixed(2)}×</span>
        </div>
        <div style={{ marginTop: 6 }}>
          <button className={`ve-toggle ${clip.reversed ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'TOGGLE_CLIP_REVERSE', payload: clipId })} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>Reverse</span>
        </div>
      </div>

      {/* Blend Mode */}
      {clip.mediaType === 'video' && (
        <div className="ve-panel-section">
          <div className="ve-panel-section-header">
            <span className="ve-panel-section-title">Blend Mode</span>
          </div>
          <select className="ve-speed-select" style={{ width: '100%' }}>
            {BLEND_MODE_GROUPS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.modes.map(mode => (
                  <option key={mode} value={mode}>{mode.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {/* Label */}
      <div className="ve-panel-section">
        <div className="ve-panel-section-header">
          <span className="ve-panel-section-title">Label</span>
        </div>
        <input className="ve-number-input" style={{ width: '100%', textAlign: 'left' }} placeholder="Custom label..."
          value={clip.label} onChange={e => dispatch({ type: 'SET_CLIP_LABEL', payload: { clipId, label: e.target.value } })} />
      </div>
    </div>
  );
}
