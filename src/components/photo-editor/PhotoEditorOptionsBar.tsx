import { useEditor } from '../../engine/photo-editor/EditorContext';

export default function PhotoEditorOptionsBar() {
  const { state, dispatch } = useEditor();

  // Render different options based on active tool
  const renderToolOptions = () => {
    switch (state.activeTool) {
      case 'move':
        return (
          <>
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__icon-btn" title="Move Tool">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3" />
                  <line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" />
                </svg>
              </span>
            </div>
            <div className="pe-options-bar__separator" />
            <label className="pe-options-bar__checkbox">
              <input
                type="checkbox"
                checked={state.autoSelect}
                onChange={(e) => dispatch({ type: 'SET_AUTO_SELECT', payload: e.target.checked })}
              />
              Auto-Select:
            </label>
            <select className="pe-options-bar__select" defaultValue="layer">
              <option value="layer">Layer</option>
              <option value="group">Group</option>
            </select>
            <div className="pe-options-bar__separator" />
            <label className="pe-options-bar__checkbox">
              <input
                type="checkbox"
                checked={state.showTransformControls}
                onChange={(e) => dispatch({ type: 'SET_SHOW_TRANSFORM_CONTROLS', payload: e.target.checked })}
              />
              Show Transform Controls
            </label>
            <div className="pe-options-bar__separator" />
            {/* Alignment buttons */}
            {['align-left', 'align-h-center', 'align-right', 'align-top', 'align-v-center', 'align-bottom'].map((align) => (
              <button key={align} className="pe-options-bar__icon-btn" title={align}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" opacity="0.3" />
                </svg>
              </button>
            ))}
            <div className="pe-options-bar__separator" />
            <button className="pe-options-bar__icon-btn" title="More options">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          </>
        );

      case 'brush':
      case 'eraser':
        return (
          <>
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__label">Size:</span>
              <input
                type="range"
                min="1"
                max="200"
                value={state.brushOptions.size}
                onChange={(e) => dispatch({ type: 'SET_BRUSH_OPTIONS', payload: { size: Number(e.target.value) } })}
                style={{ width: 80, accentColor: 'var(--pe-accent)' }}
              />
              <span className="pe-options-bar__label" style={{ width: 28, textAlign: 'right' }}>{state.brushOptions.size}px</span>
            </div>
            <div className="pe-options-bar__separator" />
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__label">Hardness:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={state.brushOptions.hardness}
                onChange={(e) => dispatch({ type: 'SET_BRUSH_OPTIONS', payload: { hardness: Number(e.target.value) } })}
                style={{ width: 60, accentColor: 'var(--pe-accent)' }}
              />
              <span className="pe-options-bar__label" style={{ width: 28, textAlign: 'right' }}>{state.brushOptions.hardness}%</span>
            </div>
            <div className="pe-options-bar__separator" />
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__label">Opacity:</span>
              <input
                type="range"
                min="1"
                max="100"
                value={state.brushOptions.opacity}
                onChange={(e) => dispatch({ type: 'SET_BRUSH_OPTIONS', payload: { opacity: Number(e.target.value) } })}
                style={{ width: 60, accentColor: 'var(--pe-accent)' }}
              />
              <span className="pe-options-bar__label" style={{ width: 28, textAlign: 'right' }}>{state.brushOptions.opacity}%</span>
            </div>
            <div className="pe-options-bar__separator" />
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__label">Flow:</span>
              <input
                type="range"
                min="1"
                max="100"
                value={state.brushOptions.flow}
                onChange={(e) => dispatch({ type: 'SET_BRUSH_OPTIONS', payload: { flow: Number(e.target.value) } })}
                style={{ width: 60, accentColor: 'var(--pe-accent)' }}
              />
              <span className="pe-options-bar__label" style={{ width: 28, textAlign: 'right' }}>{state.brushOptions.flow}%</span>
            </div>
          </>
        );

      case 'text':
        return (
          <>
            <div className="pe-options-bar__group">
              <select
                className="pe-options-bar__select"
                value={state.textOptions.fontFamily}
                onChange={(e) => dispatch({ type: 'SET_TEXT_OPTIONS', payload: { fontFamily: e.target.value } })}
                style={{ width: 130 }}
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Impact">Impact</option>
              </select>
            </div>
            <div className="pe-options-bar__separator" />
            <div className="pe-options-bar__group">
              <select
                className="pe-options-bar__select"
                value={state.textOptions.fontWeight}
                onChange={(e) => dispatch({ type: 'SET_TEXT_OPTIONS', payload: { fontWeight: e.target.value as 'normal' | 'bold' } })}
              >
                <option value="normal">Regular</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <div className="pe-options-bar__separator" />
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__label">Size:</span>
              <input
                type="number"
                value={state.textOptions.fontSize}
                onChange={(e) => dispatch({ type: 'SET_TEXT_OPTIONS', payload: { fontSize: Number(e.target.value) } })}
                style={{
                  width: 50, height: 24, padding: '0 4px',
                  background: 'var(--pe-bg-input)', border: '1px solid var(--pe-border-subtle)',
                  borderRadius: 4, color: 'var(--pe-text-primary)', fontSize: 11, fontFamily: 'inherit',
                }}
                min={1}
                max={500}
              />
              <span className="pe-options-bar__label">pt</span>
            </div>
            <div className="pe-options-bar__separator" />
            <div className="pe-options-bar__group">
              <div
                style={{
                  width: 20, height: 20, borderRadius: 3,
                  backgroundColor: state.textOptions.color,
                  border: '1px solid var(--pe-border)',
                  cursor: 'pointer',
                }}
                title={`Text Color: ${state.textOptions.color}`}
              />
            </div>
          </>
        );

      case 'crop':
        return (
          <>
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__label">Aspect Ratio:</span>
              <select
                className="pe-options-bar__select"
                value={state.cropState.aspectRatio ?? 'free'}
                onChange={(e) =>
                  dispatch({
                    type: 'SET_CROP_STATE',
                    payload: { aspectRatio: e.target.value === 'free' ? null : e.target.value },
                  })
                }
              >
                <option value="free">Free</option>
                <option value="1:1">1:1</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
                <option value="3:2">3:2</option>
              </select>
            </div>
          </>
        );

      case 'shape-rect':
      case 'shape-ellipse':
        return (
          <>
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__label">Shape:</span>
              <select
                className="pe-options-bar__select"
                value={state.shapeOptions.shapeType}
                onChange={(e) =>
                  dispatch({ type: 'SET_SHAPE_OPTIONS', payload: { shapeType: e.target.value as 'rect' | 'ellipse' } })
                }
              >
                <option value="rect">Rectangle</option>
                <option value="ellipse">Ellipse</option>
              </select>
            </div>
            <div className="pe-options-bar__separator" />
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__label">Fill:</span>
              <div
                style={{
                  width: 20, height: 20, borderRadius: 3,
                  backgroundColor: state.shapeOptions.fillColor,
                  border: '1px solid var(--pe-border)', cursor: 'pointer',
                }}
              />
            </div>
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__label">Stroke:</span>
              <div
                style={{
                  width: 20, height: 20, borderRadius: 3,
                  backgroundColor: state.shapeOptions.strokeColor,
                  border: '1px solid var(--pe-border)', cursor: 'pointer',
                }}
              />
            </div>
            <div className="pe-options-bar__group">
              <span className="pe-options-bar__label">Width:</span>
              <input
                type="number"
                value={state.shapeOptions.strokeWidth}
                onChange={(e) => dispatch({ type: 'SET_SHAPE_OPTIONS', payload: { strokeWidth: Number(e.target.value) } })}
                style={{
                  width: 40, height: 24, padding: '0 4px',
                  background: 'var(--pe-bg-input)', border: '1px solid var(--pe-border-subtle)',
                  borderRadius: 4, color: 'var(--pe-text-primary)', fontSize: 11, fontFamily: 'inherit',
                }}
                min={0}
                max={50}
              />
              <span className="pe-options-bar__label">px</span>
            </div>
          </>
        );

      default:
        return (
          <span className="pe-options-bar__label" style={{ opacity: 0.5 }}>
            {state.activeTool.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} — no options
          </span>
        );
    }
  };

  return <div className="pe-options-bar">{renderToolOptions()}</div>;
}
