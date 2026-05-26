import { useState, useRef, useEffect } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { Volume2, ChevronDown, ChevronRight } from 'lucide-react';

function Slider({ label, value, min, max, step, onChange, suffix }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; suffix?: string;
}) {
  return (
    <div className="ve-slider-row">
      <span className="ve-slider-label">{label}</span>
      <input type="range" className="ve-slider" min={min} max={max} step={step ?? 1} value={value}
        onChange={e => onChange(Number(e.target.value))} />
      <span className="ve-slider-value">{value.toFixed(step && step < 1 ? 1 : 0)}{suffix || ''}</span>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
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

function AudioMeter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let leftLevel = 0;
    let rightLevel = 0;

    const render = () => {
      leftLevel = 0.3 + Math.sin(Date.now() * 0.003) * 0.2 + Math.random() * 0.15;
      rightLevel = 0.3 + Math.cos(Date.now() * 0.0025) * 0.2 + Math.random() * 0.15;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = 16;
      const gap = 6;
      const startX = (canvas.width - barWidth * 2 - gap) / 2;
      const h = canvas.height - 12;

      [leftLevel, rightLevel].forEach((level, i) => {
        const x = startX + i * (barWidth + gap);
        const barH = h * Math.min(1, level);
        const gradient = ctx.createLinearGradient(0, h + 6, 0, 6);
        gradient.addColorStop(0, '#22c55e');
        gradient.addColorStop(0.6, '#FACC15');
        gradient.addColorStop(0.85, '#ef4444');
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(x, 6, barWidth, h);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, h + 6 - barH, barWidth, barH);
      });

      // Scale markings
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '8px JetBrains Mono';
      const labels = [' 0', '-6', '-12', '-24', '-48'];
      const positions = [0, 0.12, 0.25, 0.5, 1];
      labels.forEach((label, i) => {
        const y = 6 + positions[i] * h;
        ctx.fillText(label, canvas.width - 22, y + 3);
        ctx.fillRect(startX - 2, y, startX + barWidth * 2 + gap + 4, 0.5);
      });

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return <canvas ref={canvasRef} width={100} height={100}
    style={{ width: '100%', height: 100, borderRadius: 6, border: '1px solid var(--ve-border)' }} />;
}

export default function AudioPanel() {
  const { state, dispatch } = useVideoEditor();

  return (
    <div>
      <div className="ve-panel-section">
        <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Master Volume</div>
        <div className="ve-slider-row">
          <Volume2 size={14} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
          <input type="range" className="ve-slider" min={0} max={1.5} step={0.01} value={state.masterVolume}
            onChange={e => dispatch({ type: 'SET_MASTER_VOLUME', payload: Number(e.target.value) })} />
          <span className="ve-slider-value">{Math.round(state.masterVolume * 100)}%</span>
        </div>
      </div>

      <div className="ve-panel-section">
        <div className="ve-panel-section-title" style={{ marginBottom: 8 }}>Level Meter</div>
        <AudioMeter />
      </div>

      <CollapsibleSection title="Equalizer">
        {[
          { label: '60 Hz', freq: 60 },
          { label: '250 Hz', freq: 250 },
          { label: '1 kHz', freq: 1000 },
          { label: '4 kHz', freq: 4000 },
          { label: '16 kHz', freq: 16000 },
        ].map(band => (
          <Slider key={band.freq} label={band.label} value={0} min={-12} max={12} step={0.5}
            onChange={() => {}} suffix="dB" />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="Compressor">
        <Slider label="Threshold" value={-20} min={-60} max={0} onChange={() => {}} suffix="dB" />
        <Slider label="Ratio" value={4} min={1} max={20} onChange={() => {}} suffix=":1" />
        <Slider label="Attack" value={10} min={0.1} max={100} step={0.1} onChange={() => {}} suffix="ms" />
        <Slider label="Release" value={100} min={10} max={1000} onChange={() => {}} suffix="ms" />
      </CollapsibleSection>

      <CollapsibleSection title="Reverb">
        <Slider label="Mix" value={0} min={0} max={100} onChange={() => {}} suffix="%" />
        <Slider label="Decay" value={1.5} min={0.1} max={10} step={0.1} onChange={() => {}} suffix="s" />
        <Slider label="Pre-delay" value={20} min={0} max={100} onChange={() => {}} suffix="ms" />
      </CollapsibleSection>

      <CollapsibleSection title="Noise Reduction">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <button className="ve-toggle" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Enable</span>
        </div>
        <Slider label="Threshold" value={-40} min={-60} max={0} onChange={() => {}} suffix="dB" />
      </CollapsibleSection>
    </div>
  );
}
