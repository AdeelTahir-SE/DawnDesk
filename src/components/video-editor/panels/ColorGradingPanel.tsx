import { useState } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { RotateCw, ChevronDown, ChevronRight } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="ve-slider-row">
      <span className="ve-slider-label">{label}</span>
      <input type="range" className="ve-slider" min={min} max={max} step={step ?? 1} value={value}
        onChange={e => onChange(Number(e.target.value))} onDoubleClick={() => onChange(0)} />
      <span className="ve-slider-value">{typeof value === 'number' ? value.toFixed(step && step < 1 ? 2 : 0) : value}</span>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ve-panel-section">
      <div className="ve-panel-section-header" onClick={() => setOpen(!open)}>
        <span className="ve-panel-section-title">{title}</span>
        {open ? <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />}
      </div>
      {open && children}
    </div>
  );
}

export default function ColorGradingPanel() {
  const { state, dispatch } = useVideoEditor();
  const cg = state.colorGrading;

  const update = (key: string, value: number) => {
    dispatch({ type: 'SET_COLOR_GRADING', payload: { [key]: value } });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="ve-panel-section-title">Color Grading</span>
        <button className="ve-tool-btn" style={{ width: 24, height: 24 }} title="Reset All"
          onClick={() => dispatch({ type: 'RESET_COLOR_GRADING' })}>
          <RotateCw size={12} />
        </button>
      </div>

      <CollapsibleSection title="Basic">
        <Slider label="Exposure" value={cg.exposure} min={-100} max={100} onChange={v => update('exposure', v)} />
        <Slider label="Contrast" value={cg.contrast} min={-100} max={100} onChange={v => update('contrast', v)} />
        <Slider label="Highlights" value={cg.highlights} min={-100} max={100} onChange={v => update('highlights', v)} />
        <Slider label="Shadows" value={cg.shadows} min={-100} max={100} onChange={v => update('shadows', v)} />
        <Slider label="Whites" value={cg.whites} min={-100} max={100} onChange={v => update('whites', v)} />
        <Slider label="Blacks" value={cg.blacks} min={-100} max={100} onChange={v => update('blacks', v)} />
      </CollapsibleSection>

      <CollapsibleSection title="White Balance">
        <Slider label="Temperature" value={cg.temperature} min={-100} max={100} onChange={v => update('temperature', v)} />
        <Slider label="Tint" value={cg.tint} min={-100} max={100} onChange={v => update('tint', v)} />
      </CollapsibleSection>

      <CollapsibleSection title="Color">
        <Slider label="Saturation" value={cg.saturation} min={-100} max={100} onChange={v => update('saturation', v)} />
        <Slider label="Vibrance" value={cg.vibrance} min={-100} max={100} onChange={v => update('vibrance', v)} />
        <Slider label="Hue" value={cg.hue} min={-180} max={180} onChange={v => update('hue', v)} />
      </CollapsibleSection>

      <CollapsibleSection title="Color Wheels" defaultOpen={false}>
        <div className="ve-color-wheels">
          {(['lift', 'gamma', 'gain'] as const).map(wheel => (
            <div key={wheel} className="ve-color-wheel-item">
              <canvas className="ve-color-wheel-canvas" width={80} height={80}
                ref={canvas => {
                  if (!canvas) return;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  const cx = 40, cy = 40, r = 38;
                  for (let angle = 0; angle < 360; angle++) {
                    const rad = (angle * Math.PI) / 180;
                    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
                    gradient.addColorStop(0, 'rgba(128,128,128,1)');
                    gradient.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, r, rad, rad + Math.PI / 180 * 1.5);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                  }
                  // Center dot
                  const wv = cg[wheel];
                  ctx.beginPath();
                  ctx.arc(cx + (wv.r - 0.5) * r * 2, cy + (wv.g - 0.5) * r * 2, 4, 0, Math.PI * 2);
                  ctx.fillStyle = '#fff';
                  ctx.strokeStyle = '#000';
                  ctx.lineWidth = 1;
                    ctx.fill();
                    ctx.stroke();
                  }} 
                  onMouseDown={(e) => {
                    const canvas = e.currentTarget;
                    const rect = canvas.getBoundingClientRect();
                    const cx = 40, cy = 40, r = 38;
                    const updateWheel = (me: MouseEvent) => {
                      const x = me.clientX - rect.left;
                      const y = me.clientY - rect.top;
                      const dx = x - cx;
                      const dy = y - cy;
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      const clampedDist = Math.min(dist, r);
                      const angle = Math.atan2(dy, dx);
                      const vr = (Math.cos(angle) * clampedDist) / (r * 2) + 0.5;
                      const vg = (Math.sin(angle) * clampedDist) / (r * 2) + 0.5;
                      dispatch({ type: 'SET_COLOR_WHEEL', payload: { wheel, values: { r: vr, g: vg } } });
                    };
                    updateWheel(e as unknown as MouseEvent);
                    const handleUp = () => window.removeEventListener('mousemove', updateWheel);
                    window.addEventListener('mousemove', updateWheel);
                    window.addEventListener('mouseup', handleUp, { once: true });
                  }} />
                <span className="ve-color-wheel-label">{wheel}</span>
              <Slider label="Master" value={cg[wheel].master} min={-100} max={100}
                onChange={v => dispatch({ type: 'SET_COLOR_WHEEL', payload: { wheel, values: { master: v } } })} />
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="HSL" defaultOpen={false}>
        <Slider label="Target Hue" value={cg.hsl.targetHue} min={0} max={360} onChange={v => dispatch({ type: 'SET_COLOR_GRADING', payload: { hsl: { ...cg.hsl, targetHue: v } } })} />
        <Slider label="Range" value={cg.hsl.hueRange} min={0} max={180} onChange={v => dispatch({ type: 'SET_COLOR_GRADING', payload: { hsl: { ...cg.hsl, hueRange: v } } })} />
        <Slider label="Hue Shift" value={cg.hsl.hueShift} min={-180} max={180} onChange={v => dispatch({ type: 'SET_COLOR_GRADING', payload: { hsl: { ...cg.hsl, hueShift: v } } })} />
        <Slider label="Sat Shift" value={cg.hsl.saturationShift} min={-100} max={100} onChange={v => dispatch({ type: 'SET_COLOR_GRADING', payload: { hsl: { ...cg.hsl, saturationShift: v } } })} />
        <Slider label="Lum Shift" value={cg.hsl.luminanceShift} min={-100} max={100} onChange={v => dispatch({ type: 'SET_COLOR_GRADING', payload: { hsl: { ...cg.hsl, luminanceShift: v } } })} />
      </CollapsibleSection>

      <CollapsibleSection title="Vignette" defaultOpen={false}>
        <Slider label="Amount" value={cg.vignette.amount} min={0} max={100} onChange={v => dispatch({ type: 'SET_COLOR_GRADING', payload: { vignette: { ...cg.vignette, amount: v } } })} />
        <Slider label="Midpoint" value={cg.vignette.midpoint} min={0} max={100} onChange={v => dispatch({ type: 'SET_COLOR_GRADING', payload: { vignette: { ...cg.vignette, midpoint: v } } })} />
        <Slider label="Roundness" value={cg.vignette.roundness} min={0} max={100} onChange={v => dispatch({ type: 'SET_COLOR_GRADING', payload: { vignette: { ...cg.vignette, roundness: v } } })} />
        <Slider label="Feather" value={cg.vignette.feather} min={0} max={100} onChange={v => dispatch({ type: 'SET_COLOR_GRADING', payload: { vignette: { ...cg.vignette, feather: v } } })} />
      </CollapsibleSection>

      <CollapsibleSection title="LUT" defaultOpen={false}>
        <button 
          onClick={async () => {
            try {
              const path = await open({ filters: [{ name: 'LUT Files', extensions: ['cube', '3dl'] }] });
              if (path && typeof path === 'string') {
                dispatch({ type: 'SET_COLOR_GRADING', payload: { lutPath: path } });
              }
            } catch (e) { console.error('Failed to open LUT', e); }
          }}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 6,
            border: '1px dashed rgba(255,255,255,0.15)', background: 'none',
            color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer',
          }}>
          {cg.lutPath ? cg.lutPath.split(/[/\\]/).pop() : 'Load LUT File...'}
        </button>
        <div style={{ marginTop: 8 }}>
          <Slider label="Intensity" value={Math.round(cg.lutIntensity * 100)} min={0} max={100} onChange={v => update('lutIntensity', v / 100)} />
        </div>
      </CollapsibleSection>
    </div>
  );
}
