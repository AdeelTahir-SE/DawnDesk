import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppLogger } from '../utils/LoggerContext';
import { EditorProvider, useEditor } from '../engine/photo-editor/EditorContext';
import { openImageFromDisk, calculateFitZoom, loadImageFile } from '../engine/photo-editor/importImage';
import { exportBatchToFiles, exportImageToFile, copyImageToClipboard } from '../engine/photo-editor/exportImage';
import { applyAllAdjustments } from '../engine/photo-editor/filters';
import { saveProject, updateProject, loadProject, exportProjectAsFile, type LoadedProject } from '../engine/photo-editor/projectFile';
import PhotoEditorMenuBar from '../components/photo-editor/PhotoEditorMenuBar';
import PhotoEditorToolbar from '../components/photo-editor/PhotoEditorToolbar';
import PhotoEditorOptionsBar from '../components/photo-editor/PhotoEditorOptionsBar';
import PhotoEditorCanvas from '../components/photo-editor/PhotoEditorCanvas';
import PhotoEditorRightPanel from '../components/photo-editor/PhotoEditorRightPanel';
import TabBar from '../components/photo-editor/TabBar';
import StatusBar from '../components/photo-editor/StatusBar';
import FilmStrip from '../components/photo-editor/FilmStrip';
import '../components/photo-editor/photo-editor.css';
import PhotoEditorOnboarding from '../components/photo-editor/PhotoEditorOnboarding';
import { X } from 'lucide-react';

// ─── Helper: create blank ImageData ──────────────────────────────────────────
function makeBlankDocument(name: string, width: number, height: number, dpi: number, bg: 'white' | 'black' | 'transparent') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  if (bg === 'white') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); }
  else if (bg === 'black') { ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, width, height); }
  const imageData = ctx.getImageData(0, 0, width, height);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 96;
  thumbCanvas.height = Math.max(1, Math.round(96 * height / width));
  thumbCanvas.getContext('2d')!.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumbnail = thumbCanvas.toDataURL('image/png');
  const id = `doc-${Date.now()}`;
  return {
    id, fileName: name, filePath: null,
    width, height, dpi, colorMode: 'RGB' as const, bitDepth: 8 as const,
    imageData, originalImageData: imageData, thumbnail, isDirty: false,
    zoom: 1, panOffset: { x: 0, y: 0 },
    pendingAdjustments: {
      exposure: 0, contrast: 0, highlights: 0, shadows: 0,
      whites: 0, blacks: 0, brightness: 0, hue: 0, saturation: 0,
      lightness: 0, levelsBlack: 0, levelsMid: 1, levelsWhite: 255,
      curveAmount: 0, colorBalanceCyanRed: 0, colorBalanceMagentaGreen: 0,
      colorBalanceYellowBlue: 0, vibrance: 0, selectiveRed: 0,
      selectiveGreen: 0, selectiveBlue: 0, channelRedFromGreen: 0,
      channelRedFromBlue: 0, channelGreenFromRed: 0, channelGreenFromBlue: 0,
      channelBlueFromRed: 0, channelBlueFromGreen: 0, lutPreset: 0,
    },
  };
}

function PhotoEditorInner() {
  const { state, dispatch, activeDocument } = useEditor();
  const { logSuccess, logError } = useAppLogger();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showResizeDialog, setShowResizeDialog] = useState(false);
  const [showSaveProjectDialog, setShowSaveProjectDialog] = useState(false);
  const [saveProjectName, setSaveProjectName] = useState('');
  const [isSaveAs, setIsSaveAs] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(null);
  const [resizeValues, setResizeValues] = useState({ width: 0, height: 0, lockRatio: true });
  const [panelWidths, setPanelWidths] = useState({ left: 140, right: 300 });
  const [integrationMessage, setIntegrationMessage] = useState<string | null>(null);
  const [exportPresets, setExportPresets] = useState<Array<{ name: string; format: 'png' | 'jpeg' | 'webp'; quality: number; scale: number }>>(() => {
    try {
      return JSON.parse(localStorage.getItem('dawndesk.photoEditor.exportPresets') ?? '[]');
    } catch {
      return [];
    }
  });
  const locationHandled = useRef(false);

  // ─── Handle navigation state (new project / load project) ────────
  useEffect(() => {
    if (locationHandled.current) return;
    const nav = location.state as any;
    if (!nav) return;
    locationHandled.current = true;

    if (nav.newProject) {
      const doc = makeBlankDocument(nav.name, nav.width, nav.height, nav.dpi || 72, nav.background || 'transparent');
      const container = containerRef.current;
      if (container) {
        const fitZoom = Math.min(1, Math.min((container.clientWidth - 80) / nav.width, (container.clientHeight - 100) / nav.height));
        doc.zoom = Math.max(0.05, fitZoom);
      }
      setCurrentProjectId(null);
      setCurrentProjectName(nav.name);
      setSaveProjectName(nav.name);
      dispatch({ type: 'OPEN_DOCUMENT', payload: doc });
      logSuccess('Photo project created', nav.name, { source: 'photo-editor' });
    } else if (nav.loadProjectId) {
      loadProject(nav.loadProjectId).then((loaded: LoadedProject) => {
        dispatch({ type: 'OPEN_DOCUMENT', payload: loaded.document });
        dispatch({ type: 'RESTORE_PROJECT_LAYERS', payload: { layers: loaded.layers, activeLayerId: loaded.activeLayerId } });
        if (loaded.foregroundColor) dispatch({ type: 'SET_FOREGROUND_COLOR', payload: loaded.foregroundColor });
        if (loaded.backgroundColor) dispatch({ type: 'SET_BACKGROUND_COLOR', payload: loaded.backgroundColor });
        setCurrentProjectId(nav.loadProjectId);
        setCurrentProjectName(loaded.projectName);
        setSaveProjectName(loaded.projectName);
        logSuccess('Photo project opened', loaded.projectName, { source: 'photo-editor' });
      }).catch((err: unknown) => {
        console.error('Failed to load project:', err);
        logError('Photo project open failed', String(err), { source: 'photo-editor' });
      });
    }
  }, [location.state, dispatch, logSuccess, logError]);

  // ─── Open Image Handler ───────────────────────────────────────
  const handleOpenImage = useCallback(async () => {
    try {
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
      logSuccess('Photo opened', doc.fileName, { source: 'photo-editor' });
    } catch (err) {
      console.error('Image open failed:', err);
      logError('Photo open failed', String(err), { source: 'photo-editor' });
    }
  }, [dispatch, logSuccess, logError]);

  const openResizeDialog = useCallback(() => {
    if (!activeDocument) return;
    setResizeValues({ width: activeDocument.width, height: activeDocument.height, lockRatio: true });
    setShowResizeDialog(true);
  }, [activeDocument]);

  // ─── Project Save Handler ─────────────────────────────────────
  const handleSaveProject = useCallback(async (name?: string, forceNew = false) => {
    if (!activeDocument) return;

    // If no project ID exists and no name has been provided, open the Save dialog first
    if (!currentProjectId && !name) {
      setIsSaveAs(false);
      setShowSaveProjectDialog(true);
      return;
    }

    const projectName = name ?? currentProjectName ?? activeDocument.fileName ?? 'Untitled Project';
    try {
      if (currentProjectId && !forceNew) {
        await updateProject(currentProjectId, state, projectName);
        setCurrentProjectName(projectName);
        setIntegrationMessage(`Project "${projectName}" saved.`);
        logSuccess('Photo project saved', projectName, { source: 'photo-editor' });
      } else {
        const id = await saveProject(state, projectName);
        setCurrentProjectId(id);
        setCurrentProjectName(projectName);
        setIntegrationMessage(`Project "${projectName}" saved.`);
        logSuccess('Photo project saved', projectName, { source: 'photo-editor' });
      }
    } catch (err) {
      setIntegrationMessage(`Save failed: ${err}`);
      logError('Photo project save failed', String(err), { source: 'photo-editor' });
    }
  }, [activeDocument, currentProjectId, currentProjectName, state, logSuccess, logError]);

  const handleSaveProjectAs = useCallback(async () => {
    if (!activeDocument) return;
    setIsSaveAs(true);
    setShowSaveProjectDialog(true);
  }, [activeDocument]);

  const handleExportProjectFile = useCallback(async () => {
    if (!activeDocument) return;
    const name = currentProjectName ?? activeDocument.fileName ?? 'Untitled Project';
    try {
      await exportProjectAsFile(state, name);
      logSuccess('Photo project exported', name, { source: 'photo-editor' });
    } catch (err) {
      console.error('Project export failed:', err);
      logError('Photo project export failed', String(err), { source: 'photo-editor' });
    }
  }, [activeDocument, currentProjectName, state, logSuccess, logError]);

  // ─── Export Handler ───────────────────────────────────────────
  const handleExport = useCallback(async () => {
    if (!activeDocument?.imageData) return;
    const { format, quality, scale } = state.exportOptions;
    const renderedImageData = applyAllAdjustments(activeDocument.imageData, activeDocument.pendingAdjustments);
    try {
      await exportImageToFile(renderedImageData, activeDocument.fileName, format, quality, scale);
      dispatch({ type: 'SET_DOCUMENT_DIRTY', payload: { id: activeDocument.id, dirty: false } });
      logSuccess('Photo exported', `Exported ${activeDocument.fileName} as ${format.toUpperCase()}.`, { source: 'photo-editor' });
    } catch (err) {
      console.error('Image export failed:', err);
      logError('Photo export failed', String(err), { source: 'photo-editor' });
    }
  }, [activeDocument, dispatch, state.exportOptions, logSuccess, logError]);

  const handleBatchExport = useCallback(async () => {
    const { format, quality, scale } = state.exportOptions;
    const renderedDocuments = state.documents.map((doc) => ({
      ...doc,
      imageData: doc.imageData ? applyAllAdjustments(doc.imageData, doc.pendingAdjustments) : null,
    }));
    try {
      await exportBatchToFiles(renderedDocuments, format, quality, scale);
      state.documents.forEach((doc) => {
        dispatch({ type: 'SET_DOCUMENT_DIRTY', payload: { id: doc.id, dirty: false } });
      });
      logSuccess('Photo batch export complete', `${renderedDocuments.length} image${renderedDocuments.length === 1 ? '' : 's'} exported.`, { source: 'photo-editor' });
    } catch (err) {
      console.error('Batch export failed:', err);
      logError('Photo batch export failed', String(err), { source: 'photo-editor' });
    }
  }, [dispatch, state.documents, state.exportOptions, logSuccess, logError]);

  const saveExportPreset = useCallback(() => {
    const name = window.prompt('Preset name');
    if (!name?.trim()) return;
    const next = [
      ...exportPresets.filter((preset) => preset.name !== name.trim()),
      { name: name.trim(), ...state.exportOptions },
    ];
    setExportPresets(next);
    localStorage.setItem('dawndesk.photoEditor.exportPresets', JSON.stringify(next));
    logSuccess('Photo export preset saved', name.trim(), { source: 'photo-editor' });
  }, [exportPresets, state.exportOptions, logSuccess]);

  // ─── Copy to Clipboard ────────────────────────────────────────
  const handleCopyToClipboard = useCallback(async () => {
    if (!activeDocument?.imageData) return;
    try {
      await copyImageToClipboard(activeDocument.imageData);
      logSuccess('Photo copied', activeDocument.fileName, { source: 'photo-editor' });
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      logError('Photo copy failed', String(err), { source: 'photo-editor' });
    }
  }, [activeDocument, logSuccess, logError]);

  // ─── Filter & Transform Handlers ──────────────────────────────
  const applyFilter = useCallback(
    (name: string, fn: (data: ImageData) => ImageData) => {
      if (!activeDocument?.imageData) return;
      const activeLayer = state.layers.find((layer) => layer.id === state.activeLayerId);
      if (!activeLayer?.imageData || activeLayer.locked) return;
      const result = fn(activeLayer.imageData);
      dispatch({ type: 'APPLY_TOOL_RESULT', payload: { imageData: result, label: name } });
      logSuccess('Photo filter applied', name, { source: 'photo-editor' });
    },
    [activeDocument, dispatch, state.activeLayerId, state.layers, logSuccess]
  );

  const handleRotate = useCallback(
    (deg: 90 | -90 | 180) => dispatch({ type: 'ROTATE', payload: deg }),
    [dispatch]
  );

  const handleFlip = useCallback(
    (dir: 'horizontal' | 'vertical') => dispatch({ type: 'FLIP', payload: dir }),
    [dispatch]
  );

  const startPanelResize = useCallback((side: 'left' | 'right', startX: number) => {
    const start = panelWidths[side];
    const onMove = (event: PointerEvent) => {
      const delta = event.clientX - startX;
      setPanelWidths((prev) => ({
        ...prev,
        [side]: Math.max(
          side === 'left' ? 56 : 240,
          Math.min(side === 'left' ? 220 : 420, start + (side === 'left' ? delta : -delta))
        ),
      }));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [panelWidths]);

  // ─── Keyboard Shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        Boolean(target?.isContentEditable);

      if (isTyping && !(ctrl && ['s', 'o', 'z', 'y', 'c'].includes(e.key.toLowerCase()))) {
        return;
      }

      // Ctrl+O: Open
      if (ctrl && e.key === 'o') {
        e.preventDefault();
        handleOpenImage();
        return;
      }

      // Ctrl+S: Quick Export, Ctrl+Shift+S: Save Project
      if (ctrl && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveProject();
        } else {
          handleExport();
        }
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
          q: 'quick-selection', c: 'crop', i: 'eyedropper', b: 'brush',
          n: 'pencil', e: 'eraser', g: 'paint-bucket', s: 'clone-stamp',
          j: 'healing-brush', k: 'spot-heal', t: 'text', u: 'shape-rect',
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
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDrop = async (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer?.files[0];
        if (!file || !file.type.startsWith('image/')) return;

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

        if (activeDocument?.imageData && doc.imageData) {
          dispatch({
            type: 'ADD_IMAGE_LAYER',
            payload: {
              imageData: doc.imageData,
              name: file.name.replace(/\.[^.]+$/, '') || 'Image Layer',
              thumbnail: doc.thumbnail,
            },
          });
        } else {
          dispatch({ type: 'OPEN_DOCUMENT', payload: doc });
        }
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [activeDocument, dispatch]);

  return (
    <div
      ref={containerRef}
      className="pe-layout animate-fadeIn duration-500"
      style={{
        height: 'calc(100vh - 64px)',
        '--pe-toolbar-width': `${panelWidths.left}px`,
        '--pe-right-panel-width': `${panelWidths.right}px`,
      } as React.CSSProperties}
    >
      {/* Top menu bar */}
      <PhotoEditorMenuBar
        onOpenImage={handleOpenImage}
        onResizeImage={openResizeDialog}
        onExport={handleExport}
        onExportDialog={() => setShowExportDialog(true)}
        onBatchExport={handleBatchExport}
        onCopyToClipboard={handleCopyToClipboard}
        onSendToNotes={() => setIntegrationMessage('The current image is ready to insert into DawnDesk Notes once the Notes handoff API is connected.')}
        onSendToEmail={() => setIntegrationMessage('The current image is ready to attach to DawnDesk Mail once the Mail compose handoff API is connected.')}
        onOpenHelp={() => navigate('/photo-editor/help')}
        onRotate={handleRotate}
        onFlip={handleFlip}
        onApplyFilter={applyFilter}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onSaveProject={handleSaveProject}
        onSaveProjectAs={handleSaveProjectAs}
        onExportProjectFile={handleExportProjectFile}
        onOpenProjects={() => navigate('/projects')}
        currentProjectName={currentProjectName}
      />

      {/* Left toolbar */}
      <PhotoEditorToolbar />
      <div
        className="pe-panel-resizer pe-panel-resizer--left"
        onPointerDown={(e) => {
          e.preventDefault();
          startPanelResize('left', e.clientX);
        }}
      />

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
      <div
        className="pe-panel-resizer pe-panel-resizer--right"
        onPointerDown={(e) => {
          e.preventDefault();
          startPanelResize('right', e.clientX);
        }}
      />
      <PhotoEditorRightPanel />

      {/* Bottom status bar */}
      <StatusBar />

      {/* Bottom filmstrip */}
      <FilmStrip onOpenImage={handleOpenImage} />

      {showExportDialog && activeDocument && (
        <div className="pe-modal-backdrop" onMouseDown={() => setShowExportDialog(false)}>
          <div className="pe-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pe-modal__header">
              <strong>Export Image</strong>
              <button className="pe-modal__close" onClick={() => setShowExportDialog(false)} data-tooltip="Close the export dialog without saving."><X className="w-4 h-4" strokeWidth={2} /></button>
            </div>
            <label className="pe-field">
              <span>Preset</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="pe-options-bar__select"
                  defaultValue=""
                  onChange={(e) => {
                    const preset = exportPresets.find((item) => item.name === e.target.value);
                    if (preset) {
                      const { format, quality, scale } = preset;
                      dispatch({ type: 'SET_EXPORT_OPTIONS', payload: { format, quality, scale } });
                    }
                  }}
                  data-tooltip="Load a saved export configuration."
                >
                  <option value="">Custom</option>
                  {exportPresets.map((preset) => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
                <button className="pe-action-button" onClick={saveExportPreset} data-tooltip="Save the current format, quality, and scale as a reusable v3 export preset.">Save Preset</button>
              </div>
            </label>
            <label className="pe-field">
              <span>Format</span>
              <select
                className="pe-options-bar__select"
                value={state.exportOptions.format}
                onChange={(e) => dispatch({ type: 'SET_EXPORT_OPTIONS', payload: { format: e.target.value as any } })}
                data-tooltip="Choose the exported file format. PNG preserves transparency, JPG is widely compatible, WebP is smaller for web use."
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WebP</option>
              </select>
            </label>
            <label className="pe-field">
              <span>Quality {Math.round(state.exportOptions.quality * 100)}%</span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={state.exportOptions.quality}
                disabled={state.exportOptions.format === 'png'}
                onChange={(e) => dispatch({ type: 'SET_EXPORT_OPTIONS', payload: { quality: Number(e.target.value) } })}
                data-tooltip="Control JPG/WebP compression quality. Higher quality makes a larger file."
              />
            </label>
            <label className="pe-field">
              <span>Scale {Math.round(state.exportOptions.scale * 100)}%</span>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.05"
                value={state.exportOptions.scale}
                onChange={(e) => dispatch({ type: 'SET_EXPORT_OPTIONS', payload: { scale: Number(e.target.value) } })}
                data-tooltip="Resize the exported copy without changing the open document."
              />
            </label>
            <div className="pe-modal__actions">
              <button className="pe-action-button" onClick={handleBatchExport} data-tooltip="Export every open image tab with these settings.">Batch Export Tabs</button>
              <button
                className="pe-action-button pe-action-button--primary"
                data-tooltip="Export the active image with pending adjustments included."
                onClick={async () => {
                  await handleExport();
                  setShowExportDialog(false);
                }}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {showResizeDialog && activeDocument && (
        <div className="pe-modal-backdrop" onMouseDown={() => setShowResizeDialog(false)}>
          <div className="pe-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pe-modal__header">
              <strong>Resize Image</strong>
              <button className="pe-modal__close" onClick={() => setShowResizeDialog(false)} data-tooltip="Close the resize dialog."><X className="w-4 h-4" strokeWidth={2} /></button>
            </div>
            <label className="pe-field">
              <span>Width</span>
              <input
                className="pe-number-input pe-number-input--wide"
                type="number"
                min="1"
                max="20000"
                value={resizeValues.width}
                onChange={(e) => {
                  const width = Math.max(1, Number(e.target.value));
                  const height = resizeValues.lockRatio
                    ? Math.max(1, Math.round(width * activeDocument.height / activeDocument.width))
                    : resizeValues.height;
                  setResizeValues((prev) => ({ ...prev, width, height }));
                }}
              />
            </label>
            <label className="pe-field">
              <span>Height</span>
              <input
                className="pe-number-input pe-number-input--wide"
                type="number"
                min="1"
                max="20000"
                value={resizeValues.height}
                onChange={(e) => {
                  const height = Math.max(1, Number(e.target.value));
                  const width = resizeValues.lockRatio
                    ? Math.max(1, Math.round(height * activeDocument.width / activeDocument.height))
                    : resizeValues.width;
                  setResizeValues((prev) => ({ ...prev, width, height }));
                }}
              />
            </label>
            <label className="pe-options-bar__checkbox">
              <input
                type="checkbox"
                checked={resizeValues.lockRatio}
                onChange={(e) => setResizeValues((prev) => ({ ...prev, lockRatio: e.target.checked }))}
              />
              Keep aspect ratio
            </label>
            <div className="pe-modal__actions">
              <button className="pe-action-button" onClick={() => setShowResizeDialog(false)}>Cancel</button>
              <button
                className="pe-action-button pe-action-button--primary"
                onClick={() => {
                  dispatch({ type: 'RESIZE_ACTIVE_DOCUMENT', payload: { width: resizeValues.width, height: resizeValues.height } });
                  setShowResizeDialog(false);
                  logSuccess('Photo resized', `${resizeValues.width} x ${resizeValues.height}`, { source: 'photo-editor' });
                }}
              >
                Resize
              </button>
            </div>
          </div>
        </div>
      )}

      {integrationMessage && (
        <div className="pe-toast" onClick={() => setIntegrationMessage(null)}>
          {integrationMessage}
        </div>
      )}

      {/* Save Project As dialog */}
      {showSaveProjectDialog && (
        <div className="pe-modal-backdrop" onMouseDown={() => setShowSaveProjectDialog(false)}>
          <div className="pe-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="pe-modal__header">
              <strong>{isSaveAs ? 'Save Project As' : 'Save Project'}</strong>
              <button className="pe-modal__close" onClick={() => setShowSaveProjectDialog(false)}><X className="w-4 h-4" strokeWidth={2} /></button>
            </div>
            <label className="pe-field">
              <span>Project Name</span>
              <input
                className="pe-number-input pe-number-input--wide"
                type="text"
                value={saveProjectName}
                onChange={(e) => setSaveProjectName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && saveProjectName.trim()) {
                    handleSaveProject(saveProjectName.trim(), isSaveAs);
                    setShowSaveProjectDialog(false);
                  }
                }}
                style={{ fontFamily: 'inherit' }}
              />
            </label>
            <div className="pe-modal__actions">
              <button className="pe-action-button" onClick={() => setShowSaveProjectDialog(false)}>Cancel</button>
              <button
                className="pe-action-button pe-action-button--primary"
                onClick={() => {
                  if (saveProjectName.trim()) {
                    handleSaveProject(saveProjectName.trim(), isSaveAs);
                    setShowSaveProjectDialog(false);
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PhotoEditor() {
  return (
    <PhotoEditorOnboarding>
      <EditorProvider>
        <PhotoEditorInner />
      </EditorProvider>
    </PhotoEditorOnboarding>
  );
}
