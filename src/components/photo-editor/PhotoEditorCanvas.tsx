import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditor } from '../../engine/photo-editor/EditorContext';
import { drawStrokeBetween, floodFill, sampleColor, hexToRGBA } from '../../engine/photo-editor/drawingTools';
import { applyAllAdjustments } from '../../engine/photo-editor/filters';
import type { StrokePoint } from '../../engine/photo-editor/drawingTools';

export default function PhotoEditorCanvas() {
  const { state, dispatch, activeDocument } = useEditor();
  const viewportRef = useRef<HTMLDivElement>(null);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const rulerHRef = useRef<HTMLCanvasElement>(null);
  const rulerVRef = useRef<HTMLCanvasElement>(null);

  // Drawing state
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPoint = useRef<StrokePoint | null>(null);
  const lastPan = useRef({ x: 0, y: 0 });
  const drawCanvas = useRef<HTMLCanvasElement | null>(null);

  // Selection state
  const [selStart, setSelStart] = useState<{ x: number; y: number } | null>(null);
  const isSelecting = useRef(false);

  // Text input state
  const [textInput, setTextInput] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const textInputRef = useRef<HTMLInputElement>(null);

  const zoom = activeDocument?.zoom ?? 1;
  const panOffset = activeDocument?.panOffset ?? { x: 0, y: 0 };
  const imgWidth = activeDocument?.width ?? 0;
  const imgHeight = activeDocument?.height ?? 0;

  // ─── Get image coordinates from mouse event ─────────────────────
  const getImageCoords = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const viewport = viewportRef.current;
      if (!viewport || !activeDocument) return { x: 0, y: 0 };

      const rect = viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Center of viewport
      const cx = rect.width / 2 + panOffset.x;
      const cy = rect.height / 2 + panOffset.y;

      // Image top-left in viewport coords
      const imgLeft = cx - (imgWidth * zoom) / 2;
      const imgTop = cy - (imgHeight * zoom) / 2;

      return {
        x: (mouseX - imgLeft) / zoom,
        y: (mouseY - imgTop) / zoom,
      };
    },
    [activeDocument, zoom, panOffset, imgWidth, imgHeight]
  );

  // ─── Draw Image on Canvas (with adjustments preview) ────────────
  const drawImage = useCallback(() => {
    const canvas = renderCanvasRef.current;
    if (!canvas || !activeDocument?.imageData) return;

    canvas.width = activeDocument.width;
    canvas.height = activeDocument.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply pending adjustments for live preview
    const adj = activeDocument.pendingAdjustments;
    const hasAdj = adj.exposure !== 0 || adj.contrast !== 0 || adj.brightness !== 0 ||
      adj.highlights !== 0 || adj.shadows !== 0 || adj.whites !== 0 || adj.blacks !== 0 ||
      adj.hue !== 0 || adj.saturation !== 0 || adj.lightness !== 0;

    if (hasAdj) {
      const adjusted = applyAllAdjustments(activeDocument.imageData, adj);
      ctx.putImageData(adjusted, 0, 0);
    } else {
      ctx.putImageData(activeDocument.imageData, 0, 0);
    }
  }, [activeDocument]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  // ─── Draw overlay (selection, marching ants) ────────────────────
  const drawOverlay = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    const viewport = viewportRef.current;
    if (!overlay || !viewport) return;

    overlay.width = viewport.clientWidth;
    overlay.height = viewport.clientHeight;
    const ctx = overlay.getContext('2d');
    if (!ctx || !activeDocument) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw selection
    if (state.selection?.active) {
      const cx = overlay.width / 2 + panOffset.x;
      const cy = overlay.height / 2 + panOffset.y;
      const imgLeft = cx - (imgWidth * zoom) / 2;
      const imgTop = cy - (imgHeight * zoom) / 2;

      const sx = imgLeft + state.selection.x * zoom;
      const sy = imgTop + state.selection.y * zoom;
      const sw = state.selection.width * zoom;
      const sh = state.selection.height * zoom;

      // Marching ants
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = -(Date.now() / 50) % 8;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;

      if (state.selection.type === 'rect') {
        ctx.strokeRect(sx, sy, sw, sh);
      } else {
        ctx.beginPath();
        ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Inner dashed line (black for contrast)
      ctx.strokeStyle = '#000';
      ctx.lineDashOffset = -(Date.now() / 50 + 4) % 8;
      if (state.selection.type === 'rect') {
        ctx.strokeRect(sx, sy, sw, sh);
      } else {
        ctx.beginPath();
        ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }
  }, [activeDocument, state.selection, zoom, panOffset, imgWidth, imgHeight]);

  // Animate marching ants
  useEffect(() => {
    if (!state.selection?.active) return;
    let frame: number;
    const animate = () => {
      drawOverlay();
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [state.selection, drawOverlay]);

  // ─── Resize overlay canvas to match viewport ────────────────────
  useEffect(() => {
    const viewport = viewportRef.current;
    const overlay = overlayCanvasRef.current;
    if (!viewport || !overlay) return;
    const ro = new ResizeObserver(() => {
      overlay.width = viewport.clientWidth;
      overlay.height = viewport.clientHeight;
      drawOverlay();
      drawRulers();
    });
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [drawOverlay]);

  // ─── Draw Rulers ─────────────────────────────────────────────────
  const drawRulers = useCallback(() => {
    const hCanvas = rulerHRef.current;
    if (hCanvas) {
      const parent = hCanvas.parentElement;
      if (parent) { hCanvas.width = parent.clientWidth; hCanvas.height = 24; }
      const ctx = hCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#252525';
        ctx.fillRect(0, 0, hCanvas.width, hCanvas.height);
        ctx.strokeStyle = '#555';
        ctx.fillStyle = '#888';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        const step = Math.max(50, Math.round(100 / zoom));
        for (let px = 0; px <= imgWidth; px += step) {
          const screenX = (px * zoom) + panOffset.x + (hCanvas.width / 2) - (imgWidth * zoom / 2);
          ctx.beginPath(); ctx.moveTo(screenX, 18); ctx.lineTo(screenX, 24); ctx.stroke();
          ctx.fillText(String(Math.round(px)), screenX, 14);
        }
      }
    }
    const vCanvas = rulerVRef.current;
    if (vCanvas) {
      const parent = vCanvas.parentElement;
      if (parent) { vCanvas.width = 24; vCanvas.height = parent.clientHeight; }
      const ctx = vCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#252525';
        ctx.fillRect(0, 0, vCanvas.width, vCanvas.height);
        ctx.strokeStyle = '#555';
        ctx.fillStyle = '#888';
        ctx.font = '9px monospace';
        const step = Math.max(50, Math.round(100 / zoom));
        for (let py = 0; py <= imgHeight; py += step) {
          const screenY = (py * zoom) + panOffset.y + (vCanvas.height / 2) - (imgHeight * zoom / 2);
          ctx.beginPath(); ctx.moveTo(18, screenY); ctx.lineTo(24, screenY); ctx.stroke();
          ctx.save(); ctx.translate(10, screenY); ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center'; ctx.fillText(String(Math.round(py)), 0, 0);
          ctx.restore();
        }
      }
    }
  }, [zoom, panOffset, imgWidth, imgHeight]);

  useEffect(() => { drawRulers(); }, [drawRulers]);

  // ─── Mouse Wheel Zoom ───────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!activeDocument) return;
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        dispatch({ type: 'SET_ZOOM', payload: Math.max(0.05, Math.min(32, zoom * delta)) });
      } else {
        dispatch({ type: 'SET_PAN', payload: { x: panOffset.x - e.deltaX, y: panOffset.y - e.deltaY } });
      }
    },
    [activeDocument, zoom, panOffset, dispatch]
  );

  // ─── Pointer Down ───────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!activeDocument?.imageData) return;
      const coords = getImageCoords(e);

      // Pan (middle click or hand tool)
      if (e.button === 1 || state.activeTool === 'hand') {
        isPanning.current = true;
        lastPan.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        return;
      }

      if (e.button !== 0) return;

      switch (state.activeTool) {
        case 'brush':
        case 'eraser': {
          isDrawing.current = true;
          lastPoint.current = coords;

          // Create a temp canvas for the stroke
          const tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = activeDocument.width;
          tmpCanvas.height = activeDocument.height;
          const tmpCtx = tmpCanvas.getContext('2d')!;
          tmpCtx.putImageData(activeDocument.imageData, 0, 0);
          drawCanvas.current = tmpCanvas;

          // Draw initial stamp
          const { size, hardness, opacity } = state.brushOptions;
          const color = state.activeTool === 'eraser' ? '#000' : state.foregroundColor;
          drawStrokeBetween(tmpCtx, coords, coords, size, hardness, color, opacity, state.activeTool === 'eraser');
          
          // Update render canvas
          const renderCtx = renderCanvasRef.current?.getContext('2d');
          if (renderCtx) {
            renderCtx.putImageData(tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height), 0, 0);
          }
          break;
        }

        case 'eyedropper': {
          const color = sampleColor(activeDocument.imageData, coords.x, coords.y);
          dispatch({ type: 'SET_FOREGROUND_COLOR', payload: color });
          break;
        }

        case 'fill': {
          const rgba = hexToRGBA(state.foregroundColor);
          const filled = floodFill(activeDocument.imageData, coords.x, coords.y, rgba);
          dispatch({ type: 'APPLY_TOOL_RESULT', payload: { imageData: filled, label: 'Fill' } });
          break;
        }

        case 'marquee-rect':
        case 'marquee-ellipse': {
          isSelecting.current = true;
          setSelStart(coords);
          dispatch({ type: 'SET_SELECTION', payload: null });
          break;
        }

        case 'text': {
          setTextInput({ x: coords.x, y: coords.y, visible: true });
          setTimeout(() => textInputRef.current?.focus(), 50);
          break;
        }

        case 'shape-rect':
        case 'shape-ellipse': {
          isSelecting.current = true;
          setSelStart(coords);
          break;
        }

        case 'zoom': {
          const newZoom = e.altKey
            ? Math.max(0.05, zoom * 0.8)
            : Math.min(32, zoom * 1.25);
          dispatch({ type: 'SET_ZOOM', payload: newZoom });
          break;
        }
      }
    },
    [activeDocument, state.activeTool, state.brushOptions, state.foregroundColor, getImageCoords, dispatch, zoom]
  );

  // ─── Pointer Move ───────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - lastPan.current.x;
        const dy = e.clientY - lastPan.current.y;
        lastPan.current = { x: e.clientX, y: e.clientY };
        dispatch({ type: 'SET_PAN', payload: { x: panOffset.x + dx, y: panOffset.y + dy } });
        return;
      }

      if (!activeDocument?.imageData) return;
      const coords = getImageCoords(e);

      // Brush / Eraser drawing
      if (isDrawing.current && lastPoint.current && drawCanvas.current) {
        const tmpCtx = drawCanvas.current.getContext('2d')!;
        const { size, hardness, opacity } = state.brushOptions;
        const color = state.activeTool === 'eraser' ? '#000' : state.foregroundColor;
        drawStrokeBetween(tmpCtx, lastPoint.current, coords, size, hardness, color, opacity, state.activeTool === 'eraser');
        lastPoint.current = coords;

        // Update render canvas live
        const renderCtx = renderCanvasRef.current?.getContext('2d');
        if (renderCtx) {
          renderCtx.putImageData(
            tmpCtx.getImageData(0, 0, drawCanvas.current.width, drawCanvas.current.height), 0, 0
          );
        }
      }

      // Selection dragging
      if (isSelecting.current && selStart) {
        const x = Math.min(selStart.x, coords.x);
        const y = Math.min(selStart.y, coords.y);
        const w = Math.abs(coords.x - selStart.x);
        const h = Math.abs(coords.y - selStart.y);

        if (state.activeTool === 'marquee-rect' || state.activeTool === 'marquee-ellipse') {
          dispatch({
            type: 'SET_SELECTION',
            payload: {
              type: state.activeTool === 'marquee-rect' ? 'rect' : 'ellipse',
              x, y, width: w, height: h, active: true,
            },
          });
        }
      }
    },
    [activeDocument, panOffset, state.activeTool, state.brushOptions, state.foregroundColor, getImageCoords, dispatch, selStart]
  );

  // ─── Pointer Up ─────────────────────────────────────────────────
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      isPanning.current = false;

      // Commit brush/eraser stroke
      if (isDrawing.current && drawCanvas.current && activeDocument) {
        const tmpCtx = drawCanvas.current.getContext('2d')!;
        const newImageData = tmpCtx.getImageData(0, 0, drawCanvas.current.width, drawCanvas.current.height);
        dispatch({
          type: 'APPLY_TOOL_RESULT',
          payload: {
            imageData: newImageData,
            label: state.activeTool === 'eraser' ? 'Eraser' : 'Brush Stroke',
          },
        });
        isDrawing.current = false;
        drawCanvas.current = null;
        lastPoint.current = null;
      }

      // Commit selection
      if (isSelecting.current) {
        isSelecting.current = false;

        // If it was a shape tool, draw the shape
        if ((state.activeTool === 'shape-rect' || state.activeTool === 'shape-ellipse') && selStart && activeDocument?.imageData) {
          const coords = getImageCoords(e);
          const x = Math.min(selStart.x, coords.x);
          const y = Math.min(selStart.y, coords.y);
          const w = Math.abs(coords.x - selStart.x);
          const h = Math.abs(coords.y - selStart.y);

          if (w > 2 && h > 2) {
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = activeDocument.width;
            tmpCanvas.height = activeDocument.height;
            const ctx = tmpCanvas.getContext('2d')!;
            ctx.putImageData(activeDocument.imageData, 0, 0);

            ctx.fillStyle = state.shapeOptions.fillColor;
            ctx.strokeStyle = state.shapeOptions.strokeColor;
            ctx.lineWidth = state.shapeOptions.strokeWidth;

            if (state.shapeOptions.shapeType === 'rect' || state.activeTool === 'shape-rect') {
              if (state.shapeOptions.cornerRadius > 0) {
                roundRect(ctx, x, y, w, h, state.shapeOptions.cornerRadius);
                ctx.fill();
                if (state.shapeOptions.strokeWidth > 0) ctx.stroke();
              } else {
                ctx.fillRect(x, y, w, h);
                if (state.shapeOptions.strokeWidth > 0) ctx.strokeRect(x, y, w, h);
              }
            } else {
              ctx.beginPath();
              ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
              ctx.fill();
              if (state.shapeOptions.strokeWidth > 0) ctx.stroke();
            }

            dispatch({
              type: 'APPLY_TOOL_RESULT',
              payload: {
                imageData: ctx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height),
                label: state.activeTool === 'shape-rect' ? 'Rectangle' : 'Ellipse',
              },
            });
          }
        }

        setSelStart(null);
      }
    },
    [activeDocument, state.activeTool, state.shapeOptions, dispatch, getImageCoords, selStart]
  );

  // ─── Text commit handler ────────────────────────────────────────
  const commitText = useCallback(
    (text: string) => {
      if (!activeDocument?.imageData || !text.trim()) {
        setTextInput({ x: 0, y: 0, visible: false });
        return;
      }

      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = activeDocument.width;
      tmpCanvas.height = activeDocument.height;
      const ctx = tmpCanvas.getContext('2d')!;
      ctx.putImageData(activeDocument.imageData, 0, 0);

      const { fontFamily, fontSize, fontWeight, fontStyle, color } = state.textOptions;
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';
      ctx.fillText(text, textInput.x, textInput.y);

      dispatch({
        type: 'APPLY_TOOL_RESULT',
        payload: {
          imageData: ctx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height),
          label: 'Text',
        },
      });

      setTextInput({ x: 0, y: 0, visible: false });
    },
    [activeDocument, state.textOptions, dispatch, textInput]
  );

  // ─── Canvas Style ───────────────────────────────────────────────
  const canvasStyle: React.CSSProperties = activeDocument
    ? {
        width: imgWidth,
        height: imgHeight,
        transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
      }
    : {};

  const getCursor = () => {
    if (isPanning.current) return 'grabbing';
    if (state.activeTool === 'hand') return 'grab';
    if (state.activeTool === 'zoom') return 'zoom-in';
    if (state.activeTool === 'text') return 'text';
    if (state.activeTool === 'move') return 'move';
    if (state.activeTool === 'eyedropper') return 'crosshair';
    return 'crosshair';
  };

  return (
    <div className="pe-canvas-area">
      <div className="pe-canvas-area__corner" />
      <div className="pe-ruler-h"><canvas ref={rulerHRef} /></div>
      <div className="pe-ruler-v"><canvas ref={rulerVRef} /></div>

      <div
        ref={viewportRef}
        className="pe-viewport"
        style={{ cursor: getCursor() }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isPanning.current = false; }}
      >
        {activeDocument ? (
          <>
            <div className="pe-viewport__canvas-container" style={canvasStyle}>
              <canvas
                ref={renderCanvasRef}
                className="pe-render-canvas"
                width={imgWidth}
                height={imgHeight}
              />
              <canvas ref={overlayCanvasRef} className="pe-overlay-canvas" />
            </div>

            {/* Floating text input */}
            {textInput.visible && (
              <input
                ref={textInputRef}
                type="text"
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${panOffset.x + (textInput.x - imgWidth / 2) * zoom}px)`,
                  top: `calc(50% + ${panOffset.y + (textInput.y - imgHeight / 2) * zoom}px)`,
                  fontSize: state.textOptions.fontSize * zoom,
                  fontFamily: state.textOptions.fontFamily,
                  fontWeight: state.textOptions.fontWeight,
                  fontStyle: state.textOptions.fontStyle,
                  color: state.textOptions.color,
                  background: 'transparent',
                  border: '1px dashed var(--pe-accent)',
                  outline: 'none',
                  padding: '2px 4px',
                  minWidth: 60,
                  zIndex: 10,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitText((e.target as HTMLInputElement).value);
                  }
                  if (e.key === 'Escape') {
                    setTextInput({ x: 0, y: 0, visible: false });
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    commitText(e.target.value);
                  } else {
                    setTextInput({ x: 0, y: 0, visible: false });
                  }
                }}
                placeholder="Type text..."
              />
            )}
          </>
        ) : (
          <div className="pe-empty-canvas">
            <div className="pe-empty-canvas__icon">🖼</div>
            <div className="pe-empty-canvas__text">No image open</div>
            <div className="pe-empty-canvas__hint">Press Ctrl+O to open an image or drag & drop a file</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
