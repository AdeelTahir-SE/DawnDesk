import { useEditor } from '../../engine/photo-editor/EditorContext';

export default function LayersPanel() {
  const { state, activeDocument, dispatch } = useEditor();
  const layers = activeDocument ? state.layers : [];
  const activeLayer = layers.find((layer) => layer.id === state.activeLayerId);

  return (
    <div className="pe-layers-section">
      <div className="pe-layers-header">
        <span className="pe-layers-header__title">Layers</span>
        <div className="pe-layers-header__actions">
          <button className="pe-options-bar__icon-btn" title="Layer menu">...</button>
        </div>
      </div>

      <div className="pe-layers-controls">
        <div className="pe-layers-controls__mode">
          <select
            className="pe-options-bar__select"
            value={activeLayer?.blendMode ?? 'normal'}
            disabled={!activeLayer}
            onChange={(e) => activeLayer && dispatch({ type: 'UPDATE_LAYER', payload: { id: activeLayer.id, changes: { blendMode: e.target.value } } })}
            style={{ flex: 1, fontSize: 11 }}
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="soft-light">Soft Light</option>
            <option value="color">Color</option>
          </select>
        </div>
        <div className="pe-layers-controls__opacity">
          <span style={{ color: 'var(--pe-text-muted)', fontSize: 11 }}>Opacity:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={activeLayer?.opacity ?? 100}
            disabled={!activeLayer}
            onChange={(e) => activeLayer && dispatch({ type: 'UPDATE_LAYER', payload: { id: activeLayer.id, changes: { opacity: Number(e.target.value) } } })}
            style={{ width: 58, accentColor: 'var(--pe-accent)' }}
          />
          <span style={{ fontSize: 11 }}>{activeLayer?.opacity ?? 100}%</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderBottom: '1px solid var(--pe-border-subtle)' }}>
        <span style={{ color: 'var(--pe-text-muted)', fontSize: 11, marginRight: 4 }}>Layer tools:</span>
        <button className="pe-layers-footer__btn" title="Layer mask">Mask</button>
        <button className="pe-layers-footer__btn" title="Adjustment layer">Adj</button>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--pe-text-muted)' }}>Flat preview</span>
      </div>

      <div className="pe-layers-list">
        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            className={`pe-layer-item ${state.activeLayerId === layer.id ? 'pe-layer-item--active' : ''}`}
            onClick={() => dispatch({ type: 'SET_ACTIVE_LAYER', payload: layer.id })}
          >
            <button
              className="pe-layer-item__visibility"
              title="Toggle visibility"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'UPDATE_LAYER', payload: { id: layer.id, changes: { visible: !layer.visible } } });
              }}
            >
              {layer.visible ? 'V' : '-'}
            </button>
            <div className="pe-layer-item__thumbnail">
              {layer.thumbnail ? (
                <img src={layer.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: idx === 0
                    ? 'linear-gradient(135deg, #6d7f91 0%, #2d3440 100%)'
                    : 'linear-gradient(135deg, #f7c948 0%, #2a2a2a 100%)',
                }} />
              )}
            </div>
            <div className="pe-layer-item__info">
              <span className="pe-layer-item__name">{layer.name}</span>
            </div>
            {layer.locked && <span className="pe-layer-item__lock" title="Locked">Lock</span>}
          </div>
        ))}
      </div>

      <div className="pe-layers-footer">
        <button className="pe-layers-footer__btn" title="Link layers">Link</button>
        <button className="pe-layers-footer__btn" title="Layer effects">fx</button>
        <button className="pe-layers-footer__btn" title="New group">Grp</button>
        <button className="pe-layers-footer__btn" title="New layer" onClick={() => dispatch({ type: 'ADD_LAYER' })}>+</button>
        <button className="pe-layers-footer__btn" title="Delete layer" onClick={() => dispatch({ type: 'DELETE_ACTIVE_LAYER' })}>Del</button>
      </div>
    </div>
  );
}
