import { useEditor } from '../../engine/photo-editor/EditorContext';
import { TOOL_DEFINITIONS } from '../../engine/photo-editor/types';
import ToolButton from './ToolButton';
import ColorSwatchPicker from './ColorSwatchPicker';

export default function PhotoEditorToolbar() {
  const { state, dispatch } = useEditor();

  return (
    <div className="pe-toolbar">
      <div className="pe-toolbar__title">Tools</div>
      <div className="pe-toolbar__tools">
        {TOOL_DEFINITIONS.map((tool) => (
          <ToolButton
            key={tool.type}
            type={tool.type}
            name={tool.name}
            shortcut={tool.shortcut}
            isActive={state.activeTool === tool.type}
            onClick={() => dispatch({ type: 'SET_TOOL', payload: tool.type })}
          />
        ))}
      </div>
      <ColorSwatchPicker />
    </div>
  );
}
