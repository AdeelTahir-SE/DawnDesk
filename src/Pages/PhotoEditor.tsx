import { useCallback, useEffect, useRef } from 'react';
import { EditorProvider, useEditor } from '../engine/photo-editor/EditorContext';
import { openImageFromDisk, calculateFitZoom } from '../engine/photo-editor/importImage';
import { exportImageToFile, copyImageToClipboard } from '../engine/photo-editor/exportImage';
import PhotoEditorMenuBar from '../components/photo-editor/PhotoEditorMenuBar';
import PhotoEditorToolbar from '../components/photo-editor/PhotoEditorToolbar';
import PhotoEditorOptionsBar from '../components/photo-editor/PhotoEditorOptionsBar';
import PhotoEditorCanvas from '../components/photo-editor/PhotoEditorCanvas';
import PhotoEditorRightPanel from '../components/photo-editor/PhotoEditorRightPanel';
import TabBar from '../components/photo-editor/TabBar';
import StatusBar from '../components/photo-editor/StatusBar';
import FilmStrip from '../components/photo-editor/FilmStrip';
import '../components/photo-editor/photo-editor.css';

function PhotoEditorInner() {
  const { state, dispatch, activeDocument } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Open Image Handler ───────────────────────────────────────
  const handleOpenImage = useCallback(async () => {
    const doc = await openImageFromDisk();
    if (!doc) return;

    // Calculate fit-to-screen zoom
    const container = containerRef.current;
    if (container) {
      const canvasArea = container.querySelector('.pe-viewport');
      if (canvasArea) {
        const fitZoom = calculateFitZoom(
          doc.width,
          doc.height,
          canvasArea.clientWidth,
          canvasArea.clientHeight
        );
        doc.zoom = fitZoom;
      }
    }

    dispatch({ type: 'OPEN_DOCUMENT', payload: doc });
  }, [dispatch]);

  // ─── Export Handler ───────────────────────────────────────────
  const handleExport = useCallback(async () => {
    if (!activeDocument?.imageData) return;
    const format = activeDocument.fileName.match(/\.jpe?g$/i) ? 'jpeg' as const : 'png' as const;
    await exportImageToFile(activeDocument.imageData, activeDocument.fileName, format);
    dispatch({ type: 'SET_DOCUMENT_DIRTY', payload: { id: activeDocument.id, dirty: false } });
  }, [activeDocument, dispatch]);

  // ─── Copy to Clipboard ────────────────────────────────────────
  const handleCopyToClipboard = useCallback(async () => {
    if (!activeDocument?.imageData) return;
    try {
      await copyImageToClipboard(activeDocument.imageData);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  }, [activeDocument]);

  // ─── Filter & Transform Handlers ──────────────────────────────
  const applyFilter = useCallback(
    (name: string, fn: (data: ImageData) => ImageData) => {
      if (!activeDocument?.imageData) return;
      const result = fn(activeDocument.imageData);
      dispatch({ type: 'APPLY_TOOL_RESULT', payload: { imageData: result, label: name } });
    },
    [activeDocument, dispatch]
  );

  const handleRotate = useCallback(
    (deg: 90 | -90 | 180) => dispatch({ type: 'ROTATE', payload: deg }),
    [dispatch]
  );

  const handleFlip = useCallback(
    (dir: 'horizontal' | 'vertical') => dispatch({ type: 'FLIP', payload: dir }),
    [dispatch]
  );

  // ─── Keyboard Shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+O: Open
      if (ctrl && e.key === 'o') {
        e.preventDefault();
        handleOpenImage();
        return;
      }

      // Ctrl+S: Save / Export
      if (ctrl && e.key === 's') {
        e.preventDefault();
        handleExport();
        return;
      }

      // Ctrl+C: Copy to clipboard (when no text selection)
      if (ctrl && e.key === 'c' && !window.getSelection()?.toString()) {
        e.preventDefault();
        handleCopyToClipboard();
        return;
      }

      // Ctrl+Z: Undo
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if ((ctrl && e.key === 'y') || (ctrl && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }

      // Zoom shortcuts
      if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        const newZoom = Math.min(32, (activeDocument?.zoom ?? 1) * 1.25);
        dispatch({ type: 'SET_ZOOM', payload: newZoom });
        return;
      }
      if (ctrl && e.key === '-') {
        e.preventDefault();
        const newZoom = Math.max(0.05, (activeDocument?.zoom ?? 1) * 0.8);
        dispatch({ type: 'SET_ZOOM', payload: newZoom });
        return;
      }
      if (ctrl && e.key === '0') {
        e.preventDefault();
        // Fit to screen
        const canvasArea = containerRef.current?.querySelector('.pe-viewport');
        if (canvasArea && activeDocument) {
          const fitZoom = calculateFitZoom(
            activeDocument.width,
            activeDocument.height,
            canvasArea.clientWidth,
            canvasArea.clientHeight
          );
          dispatch({ type: 'SET_ZOOM', payload: fitZoom });
          dispatch({ type: 'SET_PAN', payload: { x: 0, y: 0 } });
        }
        return;
      }

      // Tool shortcuts (only when not holding ctrl)
      if (!ctrl && !e.altKey) {
        const toolMap: Record<string, string> = {
          v: 'move', m: 'marquee-rect', l: 'lasso', w: 'magic-wand',
          c: 'crop', i: 'eyedropper', b: 'brush', e: 'eraser',
          g: 'gradient', s: 'clone-stamp', t: 'text', u: 'shape-rect',
          h: 'hand', z: 'zoom',
        };
        const tool = toolMap[e.key.toLowerCase()];
        if (tool) {
          dispatch({ type: 'SET_TOOL', payload: tool as any });
          return;
        }

        // Brush size shortcuts
        if (e.key === '[') {
          dispatch({ type: 'SET_BRUSH_OPTIONS', payload: { size: Math.max(1, state.brushOptions.size - 5) } });
          return;
        }
        if (e.key === ']') {
          dispatch({ type: 'SET_BRUSH_OPTIONS', payload: { size: Math.min(500, state.brushOptions.size + 5) } });
          return;
        }

        // X: Swap colors
        if (e.key === 'x' || e.key === 'X') {
          dispatch({ type: 'SWAP_COLORS' });
          return;
        }

        // Escape: Deselect
        if (e.key === 'Escape') {
          dispatch({ type: 'SET_SELECTION', payload: null });
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, handleOpenImage, handleExport, handleCopyToClipboard, activeDocument, state.brushOptions.size]);

  // ─── Drag and Drop ────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer?.files[0];
      if (!file || !file.type.startsWith('image/')) return;

      const { loadImageFile } = await import('../engine/photo-editor/importImage');
      const doc = await loadImageFile(file);

      const canvasArea = container.querySelector('.pe-viewport');
      if (canvasArea) {
        doc.zoom = calculateFitZoom(
          doc.width,
          doc.height,
          canvasArea.clientWidth,
          canvasArea.clientHeight
        );
      }

      dispatch({ type: 'OPEN_DOCUMENT', payload: doc });
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [dispatch]);

  return (
    <div ref={containerRef} className="pe-layout" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Top menu bar */}
      <PhotoEditorMenuBar
        onOpenImage={handleOpenImage}
        onExport={handleExport}
        onRotate={handleRotate}
        onFlip={handleFlip}
        onApplyFilter={applyFilter}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
      />

      {/* Left toolbar */}
      <PhotoEditorToolbar />

      {/* Top options bar (context-sensitive) */}
      <PhotoEditorOptionsBar />

      {/* Center: Tab bar + Canvas */}
      <div style={{ gridArea: 'canvas', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TabBar />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PhotoEditorCanvas />
        </div>
      </div>

      {/* Right panel: Adjustments + Layers + Histogram */}
      <PhotoEditorRightPanel />

      {/* Bottom status bar */}
      <StatusBar />

      {/* Bottom filmstrip */}
      <FilmStrip onOpenImage={handleOpenImage} />
    </div>
  );
}

export default function PhotoEditor() {
  return (
    <EditorProvider>
      <PhotoEditorInner />
    </EditorProvider>
  );
}