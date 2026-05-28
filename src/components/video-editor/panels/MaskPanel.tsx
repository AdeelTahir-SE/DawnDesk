import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { Layers, Square, Circle, PenTool, Scissors, RotateCw, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="ve-slider-row">
      <span className="ve-slider-label">{label}</span>
      <input type="range" className="ve-slider" min={min} max={max} step={step ?? 1} value={value}
        onChange={e => onChange(Number(e.target.value))} />
      <span className="ve-slider-value">{value.toFixed(step && step < 1 ? 1 : 0)}</span>
    </div>
  );
}

export default function MaskPanel() {
  const { state, dispatch } = useVideoEditor();
  const mask = state.activeMask;
  const [chromaOpen, setChromaOpen] = useState(false);

  if (!mask) {
    return (
      <div>
        <div className="ve-empty" style={{ marginBottom: 16 }}>
          <Layers size={24} className="ve-empty-icon" />
          <div className="ve-empty-title">No mask active</div>
          <div className="ve-empty-desc">Create a mask to isolate or reveal parts of a clip</div>
        </div>

        <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Create Mask</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { type: 'rectangle', icon: Square, label: 'Rectangle' },
            { type: 'ellipse', icon: Circle, label: 'Ellipse' },
            { type: 'freehand', icon: PenTool, label: 'Freehand' },
            { type: 'pen', icon: Scissors, label: 'Pen' },
          ].map(m => (
            <button key={m.type} className="ve-effect-card" style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => dispatch({
                type: 'SET_MASK', payload: {
                  id: `mask-${Date.now()}`,
                  type: m.type as 'rectangle' | 'ellipse' | 'freehand' | 'pen',
                  points: [], feather: 10, opacity: 100, expansion: 0, inverted: false,
                  keyframes: [],
                  chromaKey: { enabled: false, keyColor: '#00ff00', tolerance: 40, edgeSoft: 10, spillSuppression: 50 },
                },
              })}>
              <m.icon size={14} style={{ color: '#FACC15' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="ve-panel-section-title">Mask — {mask.type}</span>
        <button className="ve-tool-btn" style={{ width: 24, height: 24 }} title="Reset Mask"
          onClick={() => dispatch({ type: 'SET_MASK', payload: null })}>
          <RotateCw size={12} />
        </button>
      </div>

      <div className="ve-panel-section">
        <Slider label="Feather" value={mask.feather} min={0} max={100}
          onChange={v => dispatch({ type: 'UPDATE_MASK', payload: { feather: v } })} />
        <Slider label="Opacity" value={mask.opacity} min={0} max={100}
          onChange={v => dispatch({ type: 'UPDATE_MASK', payload: { opacity: v } })} />
        <Slider label="Expansion" value={mask.expansion} min={-100} max={100}
          onChange={v => dispatch({ type: 'UPDATE_MASK', payload: { expansion: v } })} />
      </div>

      <div className="ve-panel-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className={`ve-toggle ${mask.inverted ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'UPDATE_MASK', payload: { inverted: !mask.inverted } })} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Invert Mask</span>
        </div>
      </div>

      {/* Chroma Key */}
      <div className="ve-panel-section">
        <div className="ve-panel-section-header" onClick={() => setChromaOpen(!chromaOpen)}>
          <span className="ve-panel-section-title">Chroma Key</span>
          {chromaOpen ? <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />}
        </div>
        {chromaOpen && mask.chromaKey && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <button className={`ve-toggle ${mask.chromaKey.enabled ? 'active' : ''}`} 
                 onClick={() => dispatch({ type: 'UPDATE_MASK', payload: { chromaKey: { ...mask.chromaKey!, enabled: !mask.chromaKey!.enabled } } })} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Enable</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Key Color</span>
              <input type="color" value={mask.chromaKey.keyColor}
                onChange={e => dispatch({ type: 'UPDATE_MASK', payload: { chromaKey: { ...mask.chromaKey!, keyColor: e.target.value } } })}
                style={{ width: 24, height: 24, border: '1px solid var(--ve-border)', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'none' }} />
            </div>
            <Slider label="Tolerance" value={mask.chromaKey.tolerance} min={0} max={100} 
               onChange={v => dispatch({ type: 'UPDATE_MASK', payload: { chromaKey: { ...mask.chromaKey!, tolerance: v } } })} />
            <Slider label="Edge Soft" value={mask.chromaKey.edgeSoft} min={0} max={100} 
               onChange={v => dispatch({ type: 'UPDATE_MASK', payload: { chromaKey: { ...mask.chromaKey!, edgeSoft: v } } })} />
            <Slider label="Spill Supp." value={mask.chromaKey.spillSuppression} min={0} max={100} 
               onChange={v => dispatch({ type: 'UPDATE_MASK', payload: { chromaKey: { ...mask.chromaKey!, spillSuppression: v } } })} />
          </div>
        )}
      </div>
    </div>
  );
}
