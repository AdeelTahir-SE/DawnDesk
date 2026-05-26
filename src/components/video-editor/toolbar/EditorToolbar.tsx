import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { TOOL_DEFINITIONS } from '../../../engine/video-editor/constants';
import {
  MousePointer2, Scissors, MoveHorizontal, Columns2, ArrowLeftRight,
  Hand, ZoomIn, Type, Square, PenTool, Crop,
  Magnet, Undo2, Redo2,
} from 'lucide-react';
import type { VideoToolType } from '../../../engine/video-editor/types';

const TOOL_ICONS: Record<string, React.ElementType> = {
  select: MousePointer2, razor: Scissors, ripple: MoveHorizontal,
  roll: Columns2, slip: MoveHorizontal, slide: ArrowLeftRight,
  hand: Hand, zoom: ZoomIn, text: Type,
  shape: Square, pen: PenTool, crop: Crop,
};

export default function EditorToolbar() {
  const { state, dispatch } = useVideoEditor();

  return (
    <div className="ve-toolbar-area">
      <div className="ve-toolbar-group">
        {TOOL_DEFINITIONS.map((tool) => {
          const Icon = TOOL_ICONS[tool.type] || MousePointer2;
          return (
            <button key={tool.type}
              className={`ve-tool-btn ${state.activeTool === tool.type ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_TOOL', payload: tool.type as VideoToolType })}
              title={`${tool.name} (${tool.shortcut})`}>
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      <div className="ve-tool-separator" />

      <button
        className={`ve-tool-btn ${state.snapEnabled ? 'active' : ''}`}
        onClick={() => dispatch({ type: 'TOGGLE_SNAP' })}
        title={`Snap ${state.snapEnabled ? 'On' : 'Off'} (S)`}>
        <Magnet size={16} />
      </button>

      <div className="ve-tool-separator" />

      <div className="ve-toolbar-group">
        <button className="ve-tool-btn"
          onClick={() => dispatch({ type: 'UNDO' })}
          title="Undo (Ctrl+Z)"
          style={{ opacity: state.historyIndex <= 0 ? 0.3 : 1 }}>
          <Undo2 size={16} />
        </button>
        <button className="ve-tool-btn"
          onClick={() => dispatch({ type: 'REDO' })}
          title="Redo (Ctrl+Shift+Z)"
          style={{ opacity: state.historyIndex >= state.history.length - 1 ? 0.3 : 1 }}>
          <Redo2 size={16} />
        </button>
      </div>

      <div className="ve-toolbar-spacer" />

      <div className="ve-toolbar-group" style={{ gap: 8 }}>
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
