import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { TOOL_DEFINITIONS } from '../../../engine/video-editor/constants';
import { useFFmpeg } from '../../../engine/video-editor/useFFmpeg';
import {
  MousePointer2, Scissors, MoveHorizontal, Columns2, ArrowLeftRight,
  Hand, ZoomIn, Type, Square, PenTool, Crop,
  Magnet, Undo2, Redo2, Save
} from 'lucide-react';
import type { Mask, TextOverlay, VideoToolType } from '../../../engine/video-editor/types';

const TOOL_ICONS: Record<string, React.ElementType> = {
  select: MousePointer2, razor: Scissors, ripple: MoveHorizontal,
  roll: Columns2, slip: MoveHorizontal, slide: ArrowLeftRight,
  hand: Hand, zoom: ZoomIn, text: Type,
  shape: Square, pen: PenTool, crop: Crop,
};

const VISIBLE_TOOL_TYPES = new Set<VideoToolType>([
  'select',
  'razor',
  'ripple',
  'roll',
  'slip',
  'slide',
  'hand',
  'zoom',
  'text',
  'shape',
  'pen',
  'crop',
]);

const TOOL_SHORTCUTS: Partial<Record<VideoToolType, string>> = {
  select: 'V',
  razor: 'C',
  ripple: 'B',
  roll: 'N',
  slip: 'Y',
  slide: 'U',
  hand: 'H',
  text: 'T',
  pen: 'P',
};

export default function EditorToolbar() {
  const { state, dispatch } = useVideoEditor();
  const { saveProject } = useFFmpeg();

  const openRightPanel = (panel: 'properties' | 'text' | 'mask') => {
    if (!state.rightPanelOpen) dispatch({ type: 'TOGGLE_RIGHT_PANEL' });
    dispatch({ type: 'SET_RIGHT_PANEL', payload: panel });
  };

  const createTextOverlay = (): TextOverlay => ({
    id: `text-${Date.now()}`,
    text: 'New Text',
    fontFamily: 'Sora',
    fontSize: 48,
    fontWeight: 700,
    color: '#ffffff',
    backgroundColor: 'transparent',
    backgroundOpacity: 0,
    alignment: 'center',
    lineHeight: 1.2,
    letterSpacing: 0,
    x: 0.5,
    y: 0.5,
    width: 1,
    rotation: 0,
    opacity: 1,
    shadow: { enabled: true, color: '#000000', offsetX: 2, offsetY: 2, blur: 4 },
    outline: { enabled: false, color: '#000000', width: 2 },
    animation: 'none',
    animationDuration: 0.5,
  });

  const createMask = (type: Mask['type']): Mask => ({
    id: `mask-${Date.now()}`,
    type,
    points: [],
    feather: 10,
    opacity: 100,
    expansion: 0,
    inverted: false,
    keyframes: [],
    chromaKey: { enabled: false, keyColor: '#00ff00', tolerance: 40, edgeSoft: 10, spillSuppression: 50 },
  });

  const handleToolClick = (tool: VideoToolType) => {
    dispatch({ type: 'SET_TOOL', payload: tool });

    if (tool === 'zoom') {
      dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom * 1.25 });
    } else if (tool === 'text') {
      openRightPanel('text');
      if (!state.activeTextOverlay) dispatch({ type: 'SET_TEXT_OVERLAY', payload: createTextOverlay() });
    } else if (tool === 'shape') {
      openRightPanel('mask');
      if (!state.activeMask) dispatch({ type: 'SET_MASK', payload: createMask('rectangle') });
    } else if (tool === 'pen') {
      openRightPanel('mask');
      if (!state.activeMask) dispatch({ type: 'SET_MASK', payload: createMask('pen') });
    } else if (tool === 'crop') {
      openRightPanel('properties');
    }
  };

  return (
    <div className="ve-toolbar-area">
      <div className="ve-toolbar-group">
        {TOOL_DEFINITIONS.filter(tool => VISIBLE_TOOL_TYPES.has(tool.type as VideoToolType)).map((tool) => {
          const Icon = TOOL_ICONS[tool.type] || MousePointer2;
          const shortcut = TOOL_SHORTCUTS[tool.type as VideoToolType];
          const label = `${tool.name}${shortcut ? ` (${shortcut})` : ''}: ${tool.description}`;
          return (
            <button key={tool.type}
              className={`ve-tool-btn ${state.activeTool === tool.type ? 'active' : ''}`}
              onClick={() => handleToolClick(tool.type as VideoToolType)}
              title={label}
              aria-label={label}
              data-tooltip={label}>
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      <div className="ve-tool-separator" />

      <button
        className={`ve-tool-btn ${state.snapEnabled ? 'active' : ''}`}
        onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
        title={`Snapping ${state.snapEnabled ? 'On' : 'Off'} (S)`}
        aria-label={`Snapping ${state.snapEnabled ? 'On' : 'Off'} (S)`}
        data-tooltip={`Snapping ${state.snapEnabled ? 'On' : 'Off'} (S): align clips and edits`}>
        <Magnet size={16} />
      </button>

      <div className="ve-tool-separator" />

      <div className="ve-toolbar-group">
        <button className="ve-tool-btn"
          onClick={() => dispatch({ type: 'UNDO' })}
          title="Undo (Ctrl+Z)"
          aria-label="Undo (Ctrl+Z)"
          data-tooltip="Undo (Ctrl+Z)"
          disabled={state.historyIndex <= 0}
          style={{ opacity: state.historyIndex <= 0 ? 0.3 : 1 }}>
          <Undo2 size={16} />
        </button>
        <button className="ve-tool-btn"
          onClick={() => dispatch({ type: 'REDO' })}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo (Ctrl+Shift+Z)"
          data-tooltip="Redo (Ctrl+Shift+Z)"
          disabled={state.historyIndex >= state.history.length - 1}
          style={{ opacity: state.historyIndex >= state.history.length - 1 ? 0.3 : 1 }}>
          <Redo2 size={16} />
        </button>
      </div>

      <div className="ve-toolbar-spacer" />

      <div className="ve-toolbar-group" style={{ gap: 8 }}>
        <button className="ve-tool-btn" onClick={saveProject} title="Save Project (Ctrl+S)" aria-label="Save Project (Ctrl+S)" data-tooltip="Save Project (Ctrl+S)">
          <Save size={16} color={state.isDirty ? '#FACC15' : 'currentColor'} />
        </button>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono' }}>
          {state.project?.name || 'Untitled'}
        </span>
        {state.isDirty && (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FACC15' }} />
        )}
      </div>
    </div>
  );
}
