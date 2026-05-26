import { useState } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { TEXT_PRESETS } from '../../../engine/video-editor/constants';
import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from 'lucide-react';

export default function TextPanel() {
  const { state, dispatch } = useVideoEditor();
  const text = state.activeTextOverlay;
  const [showPresets, setShowPresets] = useState(false);

  if (!text) {
    return (
      <div>
        <div className="ve-empty" style={{ marginBottom: 16 }}>
          <Type size={24} className="ve-empty-icon" />
          <div className="ve-empty-title">No text selected</div>
          <div className="ve-empty-desc">Select the Text tool and click on the canvas, or choose a preset below</div>
        </div>

        <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Text Presets</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TEXT_PRESETS.map(preset => (
            <button key={preset.name} className="ve-effect-card" style={{ textAlign: 'left' }}
              onClick={() => dispatch({ type: 'SET_TEXT_OVERLAY', payload: { id: preset.id, text: preset.name, fontFamily: 'Sora', fontSize: 48, fontWeight: 700, color: '#ffffff', backgroundColor: 'transparent', backgroundOpacity: 0, alignment: 'center', lineHeight: 1.2, letterSpacing: 0, x: 0.5, y: 0.5, width: 1, rotation: 0, opacity: 1, shadow: { enabled: false, color: '#000', offsetX: 2, offsetY: 2, blur: 4 }, outline: { enabled: false, color: '#000', width: 2 }, animation: 'none', animationDuration: 0.5, ...preset.config } as any })}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{preset.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{preset.config.fontFamily || 'Sora'} · {preset.config.fontSize || 48}px</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const update = (patch: Record<string, unknown>) => dispatch({ type: 'UPDATE_TEXT_OVERLAY', payload: patch });

  return (
    <div>
      <div className="ve-panel-section">
        <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Text Content</div>
        <textarea value={text.text || ''} onChange={e => update({ text: e.target.value })}
          rows={3} style={{
            width: '100%', background: 'var(--ve-bg-surface)', border: '1px solid var(--ve-border)',
            borderRadius: 6, color: 'white', padding: '8px', fontSize: 12, fontFamily: 'inherit',
            resize: 'vertical', outline: 'none',
          }} />
      </div>

      <div className="ve-panel-section">
        <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Font</div>
        <select className="ve-speed-select" style={{ width: '100%', marginBottom: 6 }}
          value={text.fontFamily || 'Sora'} onChange={e => update({ fontFamily: e.target.value })}>
          {['Sora', 'Manrope', 'Inter', 'Roboto', 'Arial', 'Georgia', 'Times New Roman', 'Courier New'].map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Size</span>
            <input type="number" className="ve-number-input" style={{ width: '100%' }}
              value={text.fontSize || 48} min={8} max={200}
              onChange={e => update({ fontSize: Number(e.target.value) })} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Weight</span>
            <select className="ve-speed-select" style={{ width: '100%' }}
              value={text.fontWeight || 400} onChange={e => update({ fontWeight: Number(e.target.value) })}>
              {[300, 400, 500, 600, 700, 800, 900].map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="ve-panel-section">
        <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Alignment</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { align: 'left', icon: AlignLeft },
            { align: 'center', icon: AlignCenter },
            { align: 'right', icon: AlignRight },
          ].map(({ align, icon: Icon }) => (
            <button key={align}
              className={`ve-tool-btn ${text.textAlign === align ? 'active' : ''}`}
              onClick={() => update({ textAlign: align })}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className="ve-panel-section">
        <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Color</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="color" value={text.color || '#ffffff'}
            onChange={e => update({ color: e.target.value })}
            style={{ width: 28, height: 28, border: '1px solid var(--ve-border)', borderRadius: 4, padding: 0, cursor: 'pointer' }} />
          <input className="ve-number-input" style={{ flex: 1, textAlign: 'left' }}
            value={text.color || '#ffffff'} onChange={e => update({ color: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {['#ffffff', '#000000', '#FACC15', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316'].map(c => (
            <button key={c} style={{
              width: 20, height: 20, borderRadius: 4, background: c,
              border: text.color === c ? '2px solid #FACC15' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
            }} onClick={() => update({ color: c })} />
          ))}
        </div>
      </div>

      <div className="ve-panel-section">
        <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Animation</div>
        <select className="ve-speed-select" style={{ width: '100%' }}
          value={text.animation || 'none'} onChange={e => update({ animation: e.target.value })}>
          {['none', 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'scale', 'typewriter', 'bounce', 'rotate'].map(a => (
            <option key={a} value={a}>{a.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <button style={{
        width: '100%', padding: '6px', marginTop: 8,
        background: 'none', border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 6, color: '#ef4444', fontSize: 11, cursor: 'pointer',
      }} onClick={() => dispatch({ type: 'SET_TEXT_OVERLAY', payload: null })}>
        Remove Text
      </button>
    </div>
  );
}
