import { useEditor } from '../../engine/photo-editor/EditorContext';

const numberInputStyle = {
  width: 56,
  height: 24,
  padding: '0 4px',
  background: 'var(--pe-bg-input)',
  border: '1px solid var(--pe-border-subtle)',
  borderRadius: 4,
  color: 'var(--pe-text-primary)',
  fontSize: 11,
  fontFamily: 'inherit',
};

export default function PhotoEditorOptionsBar() {
  const { state, dispatch, activeDocument } = useEditor();
  const activeLayer = state.layers.find((layer) => layer.id === state.activeLayerId);
  const activeTextLayer = activeLayer?.text ? activeLayer : null;
  const textOptions = activeTextLayer?.text?.style ?? state.textOptions;

  const updateTextOptions = (patch: Partial<typeof state.textOptions>) => {
    dispatch({ type: 'SET_TEXT_OPTIONS', payload: patch });
    if (activeTextLayer?.text) {
      dispatch({
        type: 'UPDATE_TEXT_LAYER',
        payload: {
          id: activeTextLayer.id,
          text: { style: patch },
        },
      });
    }
  };

  const updateTextContent = (content: string) => {
    if (!activeTextLayer?.text) return;
    dispatch({
      type: 'UPDATE_TEXT_LAYER',
      payload: {
        id: activeTextLayer.id,
        text: { content },
      },
    });
  };

  const resizeActiveDocument = () => {
    const width = Number((document.getElementById('pe-resize-width') as HTMLInputElement)?.value);
    const height = Number((document.getElementById('pe-resize-height') as HTMLInputElement)?.value);
    if (width > 0 && height > 0) {
      dispatch({ type: 'RESIZE_ACTIVE_DOCUMENT', payload: { width, height } });
    }
  };

  const renderToolOptions = () => {
    switch (state.activeTool) {
      case 'move':
        return (
          <>
            <label className="pe-options-bar__checkbox">
              <input checked={state.autoSelect} type="checkbox" onChange={(e) => dispatch({ type: 'SET_AUTO_SELECT', payload: e.target.checked })} />
              Auto-Select
            </label>
            <label className="pe-options-bar__checkbox">
              <input checked={state.showTransformControls} type="checkbox" onChange={(e) => dispatch({ type: 'SET_SHOW_TRANSFORM_CONTROLS', payload: e.target.checked })} />
              Transform Controls
            </label>
          </>
        );

      case 'brush':
      case 'pencil':
      case 'eraser':
      case 'clone-stamp':
      case 'healing-brush':
      case 'quick-selection':
        return (
          <>
            <span className="pe-options-bar__label">Size:</span>
            <input type="range" min="1" max="200" value={state.activeTool === 'pencil' ? 1 : state.brushOptions.size} disabled={state.activeTool === 'pencil'} onChange={(e) => dispatch({ type: 'SET_BRUSH_OPTIONS', payload: { size: Number(e.target.value) } })} style={{ width: 90, accentColor: 'var(--pe-accent)' }} />
            <span className="pe-options-bar__label">{state.activeTool === 'pencil' ? 1 : state.brushOptions.size}px</span>
            <div className="pe-options-bar__separator" />
            <span className="pe-options-bar__label">Hardness:</span>
            <input type="range" min="0" max="100" value={state.activeTool === 'pencil' ? 100 : state.brushOptions.hardness} disabled={state.activeTool === 'pencil'} onChange={(e) => dispatch({ type: 'SET_BRUSH_OPTIONS', payload: { hardness: Number(e.target.value) } })} style={{ width: 70, accentColor: 'var(--pe-accent)' }} />
            <span className="pe-options-bar__label">Opacity:</span>
            <input type="range" min="1" max="100" value={state.brushOptions.opacity} onChange={(e) => dispatch({ type: 'SET_BRUSH_OPTIONS', payload: { opacity: Number(e.target.value) } })} style={{ width: 70, accentColor: 'var(--pe-accent)' }} />
          </>
        );

      case 'text':
        return (
          <>
            {activeTextLayer?.text && (
              <>
                <span className="pe-options-bar__label">Text:</span>
                <input
                  className="pe-options-bar__select"
                  value={activeTextLayer.text.content}
                  onChange={(e) => updateTextContent(e.target.value)}
                  style={{ width: 180 }}
                />
                <div className="pe-options-bar__separator" />
              </>
            )}
            <select className="pe-options-bar__select" value={textOptions.fontFamily} onChange={(e) => updateTextOptions({ fontFamily: e.target.value })}>
              {['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Impact'].map((font) => <option key={font} value={font}>{font}</option>)}
            </select>
            <select className="pe-options-bar__select" value={textOptions.fontWeight} onChange={(e) => updateTextOptions({ fontWeight: e.target.value as 'normal' | 'bold' })}>
              <option value="normal">Regular</option>
              <option value="bold">Bold</option>
            </select>
            <button className={`pe-options-bar__icon-btn ${textOptions.fontStyle === 'italic' ? 'pe-options-bar__icon-btn--active' : ''}`} onClick={() => updateTextOptions({ fontStyle: textOptions.fontStyle === 'italic' ? 'normal' : 'italic' })}>I</button>
            {(['left', 'center', 'right'] as const).map((align) => (
              <button key={align} className={`pe-options-bar__icon-btn ${textOptions.textAlign === align ? 'pe-options-bar__icon-btn--active' : ''}`} onClick={() => updateTextOptions({ textAlign: align })}>
                {align[0].toUpperCase()}
              </button>
            ))}
            <span className="pe-options-bar__label">Size:</span>
            <input type="number" min={1} max={500} value={textOptions.fontSize} onChange={(e) => updateTextOptions({ fontSize: Number(e.target.value) })} style={numberInputStyle} />
            <input type="color" value={textOptions.color} onChange={(e) => updateTextOptions({ color: e.target.value })} />
          </>
        );

      case 'crop':
        return (
          <>
            <span className="pe-options-bar__label">Aspect:</span>
            <select className="pe-options-bar__select" value={state.cropState.aspectRatio ?? 'free'} onChange={(e) => dispatch({ type: 'SET_CROP_STATE', payload: { aspectRatio: e.target.value === 'free' ? null : e.target.value } })}>
              <option value="free">Free</option>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
              <option value="3:2">3:2</option>
            </select>
            <span className="pe-options-bar__label">Straighten:</span>
            <input type="range" min="-45" max="45" step="0.5" value={state.cropState.straighten} onChange={(e) => dispatch({ type: 'SET_CROP_STATE', payload: { straighten: Number(e.target.value) } })} style={{ width: 90, accentColor: 'var(--pe-accent)' }} />
            <button className="pe-action-button pe-action-button--primary" disabled={!state.cropState.active} onClick={() => dispatch({ type: 'APPLY_CROP' })}>Apply Crop</button>
          </>
        );

      case 'shape-rect':
      case 'shape-ellipse':
      case 'line':
      case 'pen-path':
      case 'polygon':
      case 'custom-shape':
        return (
          <>
            <span className="pe-options-bar__label">Fill</span>
            <input type="color" value={state.shapeOptions.fillColor} onChange={(e) => dispatch({ type: 'SET_SHAPE_OPTIONS', payload: { fillColor: e.target.value } })} />
            <span className="pe-options-bar__label">Stroke</span>
            <input type="color" value={state.shapeOptions.strokeColor} onChange={(e) => dispatch({ type: 'SET_SHAPE_OPTIONS', payload: { strokeColor: e.target.value } })} />
            <span className="pe-options-bar__label">Width:</span>
            <input type="number" min={0} max={50} value={state.shapeOptions.strokeWidth} onChange={(e) => dispatch({ type: 'SET_SHAPE_OPTIONS', payload: { strokeWidth: Number(e.target.value) } })} style={numberInputStyle} />
            {(state.activeTool === 'polygon' || state.activeTool === 'custom-shape') && (
              <>
                <span className="pe-options-bar__label">Sides:</span>
                <input type="number" min={3} max={12} value={state.shapeOptions.sides} onChange={(e) => dispatch({ type: 'SET_SHAPE_OPTIONS', payload: { sides: Number(e.target.value) } })} style={numberInputStyle} />
              </>
            )}
          </>
        );

      case 'magic-wand':
      case 'lasso':
      case 'polygon-lasso':
        return (
          <>
            <span className="pe-options-bar__label">Selection Mode:</span>
            <select className="pe-options-bar__select" defaultValue="new">
              <option value="new">New</option>
              <option value="add">Add</option>
              <option value="subtract">Subtract</option>
            </select>
            <span className="pe-options-bar__label">Tolerance:</span>
            <input type="range" min="1" max="96" defaultValue="32" style={{ width: 90, accentColor: 'var(--pe-accent)' }} />
          </>
        );

      case 'paint-bucket':
        return (
          <>
            <span className="pe-options-bar__label">Fill:</span>
            <span className="pe-options-bar__label">{state.foregroundColor}</span>
            <span className="pe-options-bar__label">Tolerance:</span>
            <input type="range" min="1" max="96" defaultValue="32" style={{ width: 90, accentColor: 'var(--pe-accent)' }} />
          </>
        );

      default:
        return (
          <>
            <span className="pe-options-bar__label">{state.activeTool.replace(/-/g, ' ')}</span>
            {activeDocument && (
              <>
                <div className="pe-options-bar__separator" />
                <span className="pe-options-bar__label">Resize:</span>
                <input id="pe-resize-width" type="number" defaultValue={activeDocument.width} style={numberInputStyle} />
                <span className="pe-options-bar__label">x</span>
                <input id="pe-resize-height" type="number" defaultValue={activeDocument.height} style={numberInputStyle} />
                <button className="pe-action-button" onClick={resizeActiveDocument}>Resize</button>
              </>
            )}
          </>
        );
    }
  };

  return <div className="pe-options-bar">{renderToolOptions()}</div>;
}
