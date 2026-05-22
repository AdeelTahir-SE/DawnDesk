import { useRef, useEffect, useCallback } from 'react';
import { useEditor } from '../../engine/photo-editor/EditorContext';

export default function HistogramPanel() {
  const { activeDocument } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawHistogram = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, w, h);

    if (!activeDocument?.imageData) {
      // Draw empty placeholder histogram shape
      drawPlaceholderHistogram(ctx, w, h);
      return;
    }

    // Compute actual histogram from imageData
    const data = activeDocument.imageData.data;
    const rHist = new Uint32Array(256);
    const gHist = new Uint32Array(256);
    const bHist = new Uint32Array(256);

    for (let i = 0; i < data.length; i += 4) {
      rHist[data[i]]++;
      gHist[data[i + 1]]++;
      bHist[data[i + 2]]++;
    }

    const maxVal = Math.max(
      ...Array.from(rHist),
      ...Array.from(gHist),
      ...Array.from(bHist)
    );

    if (maxVal === 0) return;

    // Draw each channel
    const drawChannel = (hist: Uint32Array, color: string) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * w;
        const y = h - (hist[i] / maxVal) * h;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    ctx.globalCompositeOperation = 'screen';
    drawChannel(rHist, 'rgba(255, 60, 60, 0.6)');
    drawChannel(gHist, 'rgba(60, 255, 60, 0.5)');
    drawChannel(bHist, 'rgba(60, 100, 255, 0.6)');
    ctx.globalCompositeOperation = 'source-over';
  }, [activeDocument?.imageData]);

  useEffect(() => {
    drawHistogram();
  }, [drawHistogram]);

  return (
    <div className="pe-histogram">
      <div className="pe-histogram__header">
        <span className="pe-histogram__title">Histogram</span>
        <button
          className="pe-adj-section__more"
          title="Histogram options"
        >
          ···
        </button>
      </div>
      <div className="pe-histogram__canvas-wrap">
        <canvas
          ref={canvasRef}
          className="pe-histogram__canvas"
          width={276}
          height={100}
        />
      </div>
      <div className="pe-histogram__meta">
        <span>ISO 100</span>
        <span>24mm</span>
        <span>f/8.0</span>
        <span>1/125s</span>
      </div>
    </div>
  );
}

// ─── Placeholder histogram for when no image is loaded ───────────
function drawPlaceholderHistogram(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.globalCompositeOperation = 'screen';

  const drawFakeChannel = (color: string, offsetSeed: number) => {
    ctx.beginPath();
    ctx.moveTo(0, h);

    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * w;
      // Gaussian-ish shape with some variation
      const center1 = 80 + offsetSeed * 30;
      const center2 = 180 + offsetSeed * 10;
      const g1 = Math.exp(-((i - center1) ** 2) / (2 * 40 ** 2));
      const g2 = Math.exp(-((i - center2) ** 2) / (2 * 30 ** 2)) * 0.6;
      const val = (g1 + g2) * h * 0.7;
      ctx.lineTo(x, h - val);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  drawFakeChannel('rgba(255, 60, 60, 0.4)', 0);
  drawFakeChannel('rgba(60, 255, 60, 0.3)', 1);
  drawFakeChannel('rgba(60, 100, 255, 0.4)', 2);
  ctx.globalCompositeOperation = 'source-over';
}
