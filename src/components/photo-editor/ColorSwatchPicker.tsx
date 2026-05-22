import { useEditor } from '../../engine/photo-editor/EditorContext';

export default function ColorSwatchPicker() {
  const { state, dispatch } = useEditor();

  return (
    <div className="pe-toolbar__colors">
      <div className="pe-color-swatch">
        <div
          className="pe-color-swatch__fg"
          style={{ backgroundColor: state.foregroundColor }}
          title={`Foreground: ${state.foregroundColor}`}
          onClick={() => {
            // TODO: open color picker dialog
          }}
        />
        <div
          className="pe-color-swatch__bg"
          style={{ backgroundColor: state.backgroundColor }}
          title={`Background: ${state.backgroundColor}`}
          onClick={() => {
            // TODO: open color picker dialog
          }}
        />
        <button
          className="pe-color-swap-btn"
          onClick={() => dispatch({ type: 'SWAP_COLORS' })}
          title="Swap Colors (X)"
        >
          ⇄
        </button>
      </div>
    </div>
  );
}
