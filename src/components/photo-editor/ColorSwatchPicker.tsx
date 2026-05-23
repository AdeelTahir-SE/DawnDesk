import { useState } from 'react';
import { useEditor } from '../../engine/photo-editor/EditorContext';
import ColorPickerDialog from './ColorPickerDialog';

export default function ColorSwatchPicker() {
  const { state, dispatch } = useEditor();
  const [open, setOpen] = useState<'fg' | 'bg' | null>(null);

  return (
    <>
      <div className="pe-toolbar__colors">
        <div className="pe-color-swatch">
          {/* Foreground */}
          <div
            className="pe-color-swatch__fg"
            style={{ backgroundColor: state.foregroundColor }}
            title={`Foreground: ${state.foregroundColor} (click to change)`}
            onClick={() => setOpen('fg')}
          />
          {/* Background */}
          <div
            className="pe-color-swatch__bg"
            style={{ backgroundColor: state.backgroundColor }}
            title={`Background: ${state.backgroundColor} (click to change)`}
            onClick={() => setOpen('bg')}
          />
          <button
            className="pe-color-swap-btn"
            onClick={() => dispatch({ type: 'SWAP_COLORS' })}
            title="Swap Colors (X)"
          >
            ⇄
          </button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--pe-text-muted)', textAlign: 'center', marginTop: 2 }}>
          FG / BG
        </div>
      </div>

      {open === 'fg' && (
        <ColorPickerDialog
          initialColor={state.foregroundColor}
          title="Foreground Color"
          onClose={() => setOpen(null)}
          onConfirm={(color) => {
            dispatch({ type: 'SET_FOREGROUND_COLOR', payload: color });
            setOpen(null);
          }}
        />
      )}

      {open === 'bg' && (
        <ColorPickerDialog
          initialColor={state.backgroundColor}
          title="Background Color"
          onClose={() => setOpen(null)}
          onConfirm={(color) => {
            dispatch({ type: 'SET_BACKGROUND_COLOR', payload: color });
            setOpen(null);
          }}
        />
      )}
    </>
  );
}
