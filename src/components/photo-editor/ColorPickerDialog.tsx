import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Color conversion helpers ─────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue = (v: number) => {
      if (v < 0) v += 1;
      if (v > 1) v -= 1;
      if (v < 1 / 6) return p + (q - p) * 6 * v;
      if (v < 1 / 2) return q;
      if (v < 2 / 3) return p + (q - p) * (2 / 3 - v) * 6;
      return p;
    };
    r = hue(h + 1 / 3);
    g = hue(h);
    b = hue(h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// ─── Recent Colors Storage ────────────────────────────────────────────────────

const RECENT_KEY = 'dawndesk.photoEditor.recentColors';

function getRecentColors(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function addRecentColor(color: string) {
  const recent = getRecentColors().filter((c) => c !== color).slice(0, 13);
  recent.unshift(color);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 14)));
}

// ─── SV Square (Saturation / Lightness picker) ────────────────────────────────

interface SLSquareProps {
  hue: number;
  saturation: number;
  lightness: number;
  onChange: (s: number, l: number) => void;
}

function SLSquare({ hue, saturation, lightness, onChange }: SLSquareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const SIZE = 200;

  // Convert HSL to SL-square position (s=x, l=y inverted)
  // We use HSV internally for the square: s=x, v=y
  // Convert from HSL to HSV for positioning
  const hslToHsv = (_h: number, s: number, l: number) => {
    s /= 100; l /= 100;
    const v = l + s * Math.min(l, 1 - l);
    const sv = v === 0 ? 0 : 2 * (1 - l / v);
    return { sv: sv * 100, v: v * 100 };
  };

  const hsvToHsl = (_h: number, sv: number, v: number) => {
    sv /= 100; v /= 100;
    const l = v * (1 - sv / 2);
    const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
    return { s: sl * 100, l: l * 100 };
  };

  const { sv, v } = hslToHsv(hue, saturation, lightness);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, SIZE, SIZE);

    const hueColor = `hsl(${hue}, 100%, 50%)`;
    const gradientH = ctx.createLinearGradient(0, 0, SIZE, 0);
    gradientH.addColorStop(0, '#fff');
    gradientH.addColorStop(1, hueColor);
    ctx.fillStyle = gradientH;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const gradientV = ctx.createLinearGradient(0, 0, 0, SIZE);
    gradientV.addColorStop(0, 'rgba(0,0,0,0)');
    gradientV.addColorStop(1, '#000');
    ctx.fillStyle = gradientV;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }, [hue]);

  const pick = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(SIZE, e.clientX - rect.left));
      const y = Math.max(0, Math.min(SIZE, e.clientY - rect.top));
      const svNew = (x / SIZE) * 100;
      const vNew = (1 - y / SIZE) * 100;
      const { s, l } = hsvToHsl(hue, svNew, vNew);
      onChange(s, l);
    },
    [hue, onChange]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) pick(e); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [pick]);

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, borderRadius: 6, overflow: 'hidden', cursor: 'crosshair', flexShrink: 0 }}>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{ display: 'block' }}
        onMouseDown={(e) => { dragging.current = true; pick(e); }}
      />
      {/* Indicator dot */}
      <div style={{
        position: 'absolute',
        left: (sv / 100) * SIZE,
        top: (1 - v / 100) * SIZE,
        transform: 'translate(-50%, -50%)',
        width: 12,
        height: 12,
        borderRadius: '50%',
        border: '2px solid #fff',
        boxShadow: '0 0 0 1px #000',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── Hue Strip ────────────────────────────────────────────────────────────────

function HueStrip({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const dragging = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  const pick = useCallback((e: React.MouseEvent | MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    onChange((x / rect.width) * 360);
  }, [onChange]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) pick(e); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [pick]);

  return (
    <div
      ref={ref}
      style={{
        width: '100%', height: 14, borderRadius: 7, cursor: 'crosshair', position: 'relative',
        background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
      }}
      onMouseDown={(e) => { dragging.current = true; pick(e); }}
    >
      <div style={{
        position: 'absolute',
        left: `${(hue / 360) * 100}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 14, height: 14,
        borderRadius: '50%',
        border: '2px solid #fff',
        boxShadow: '0 0 0 1px #000',
        background: `hsl(${hue}, 100%, 50%)`,
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── Color Picker Dialog ──────────────────────────────────────────────────────

export interface ColorPickerDialogProps {
  initialColor: string;
  title?: string;
  onClose: () => void;
  onConfirm: (color: string) => void;
}

export default function ColorPickerDialog({
  initialColor,
  title = 'Color Picker',
  onClose,
  onConfirm,
}: ColorPickerDialogProps) {
  const init = hexToRgb(initialColor);
  const initHsl = rgbToHsl(init.r, init.g, init.b);

  const [hue, setHue] = useState(initHsl.h);
  const [sat, setSat] = useState(initHsl.s);
  const [lit, setLit] = useState(initHsl.l);
  const [hexInput, setHexInput] = useState(initialColor.replace('#', ''));
  const [recentColors] = useState(getRecentColors);

  const rgb = hslToRgb(hue, sat, lit);
  const currentHex = rgbToHex(rgb.r, rgb.g, rgb.b);

  const syncFromHsl = useCallback((h: number, s: number, l: number) => {
    setHue(h); setSat(s); setLit(l);
    const r = hslToRgb(h, s, l);
    setHexInput(rgbToHex(r.r, r.g, r.b).replace('#', ''));
  }, []);

  const syncFromHex = useCallback((hex: string) => {
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return;
    const { r, g, b } = hexToRgb('#' + hex);
    const { h, s, l } = rgbToHsl(r, g, b);
    setHue(h); setSat(s); setLit(l);
  }, []);

  const handleConfirm = () => {
    addRecentColor(currentHex);
    onConfirm(currentHex);
  };

  return (
    <div className="pe-modal-backdrop" onMouseDown={onClose}>
      <div
        className="pe-modal"
        style={{ width: 'min(350px, 95vw)', padding: 16 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="pe-modal__header">
          <strong style={{ fontSize: 13 }}>{title}</strong>
          <button className="pe-modal__close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* SL square */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <SLSquare
              hue={hue}
              saturation={sat}
              lightness={lit}
              onChange={(s, l) => syncFromHsl(hue, s, l)}
            />
            {/* Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <div style={{
                width: '100%', height: 52, borderRadius: 6,
                background: currentHex,
                border: '1px solid var(--pe-border)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
              }} />
              <div style={{
                width: '100%', height: 28, borderRadius: 6,
                background: initialColor,
                border: '1px solid var(--pe-border)',
                opacity: 0.7,
              }} title="Original color" />
              <span style={{ fontSize: 10, color: 'var(--pe-text-muted)', textAlign: 'center' }}>
                Old → New
              </span>
            </div>
          </div>

          {/* Hue strip */}
          <HueStrip hue={hue} onChange={(h) => syncFromHsl(h, sat, lit)} />

          {/* RGB + HSL sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'R', value: rgb.r, max: 255, onChange: (v: number) => { const { g, b } = rgb; const { h: rh, s: rs, l: rl } = rgbToHsl(v, g, b); syncFromHsl(rh, rs, rl); } },
              { label: 'G', value: rgb.g, max: 255, onChange: (v: number) => { const { r, b } = rgb; const { h: gh, s: gs, l: gl } = rgbToHsl(r, v, b); syncFromHsl(gh, gs, gl); } },
              { label: 'B', value: rgb.b, max: 255, onChange: (v: number) => { const { r, g } = rgb; const { h: bh, s: bs, l: bl } = rgbToHsl(r, g, v); syncFromHsl(bh, bs, bl); } },
            ].map(({ label, value, max, onChange }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--pe-text-muted)', width: 12, textAlign: 'center' }}>{label}</span>
                <input
                  type="range" min={0} max={max} value={value}
                  onChange={(e) => onChange(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--pe-accent)', height: 4 }}
                />
                <input
                  type="number" min={0} max={max} value={value}
                  onChange={(e) => onChange(Number(e.target.value))}
                  className="pe-number-input"
                  style={{ width: 44, textAlign: 'center', fontSize: 11 }}
                />
              </div>
            ))}
          </div>

          {/* Hex */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--pe-text-muted)' }}>#</span>
            <input
              className="pe-number-input"
              style={{ flex: 1, fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase' }}
              value={hexInput}
              maxLength={6}
              onChange={(e) => {
                const v = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '');
                setHexInput(v);
                if (v.length === 6) syncFromHex(v);
              }}
            />
            <div style={{
              width: 28, height: 28, borderRadius: 4,
              background: currentHex,
              border: '1px solid var(--pe-border)',
              flexShrink: 0,
            }} />
          </div>

          {/* Swatches - common colors */}
          <div>
            <div style={{ fontSize: 10, color: 'var(--pe-text-muted)', marginBottom: 5 }}>Swatches</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[
                '#000000', '#FFFFFF', '#808080', '#C0C0C0',
                '#FF0000', '#FF8800', '#FFFF00', '#00FF00',
                '#00FFFF', '#0000FF', '#8800FF', '#FF00FF',
                '#F7C948', '#FFD86A', '#B8942F', '#7C5C1A',
              ].map((c) => (
                <button
                  key={c}
                  style={{
                    width: 18, height: 18, borderRadius: 3,
                    background: c, border: c === currentHex ? '2px solid var(--pe-accent)' : '1px solid var(--pe-border)',
                    cursor: 'pointer', padding: 0,
                  }}
                  title={c}
                  onClick={() => {
                    const { r, g, b } = hexToRgb(c);
                    const { h, s, l } = rgbToHsl(r, g, b);
                    syncFromHsl(h, s, l);
                    setHexInput(c.replace('#', ''));
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recent colors */}
          {recentColors.length > 0 && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--pe-text-muted)', marginBottom: 5 }}>Recent</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {recentColors.map((c, i) => (
                  <button
                    key={i}
                    style={{
                      width: 18, height: 18, borderRadius: 3,
                      background: c, border: '1px solid var(--pe-border)',
                      cursor: 'pointer', padding: 0,
                    }}
                    title={c}
                    onClick={() => {
                      const { r, g, b } = hexToRgb(c);
                      const { h, s, l } = rgbToHsl(r, g, b);
                      syncFromHsl(h, s, l);
                      setHexInput(c.replace('#', ''));
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pe-modal__actions">
          <button className="pe-action-button" onClick={onClose}>Cancel</button>
          <button className="pe-action-button pe-action-button--primary" onClick={handleConfirm}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
