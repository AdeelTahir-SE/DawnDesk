import { useRef } from 'react';
import { useEditor } from '../../engine/photo-editor/EditorContext';
import { loadImageFile } from '../../engine/photo-editor/importImage';

function LayerIcon({ name }: { name: 'eye' | 'eye-off' | 'lock' | 'unlock' | 'plus' | 'trash' | 'grip' | 'image' }) {
  const common = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'eye':
      return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'eye-off':
      return <svg {...common}><path d="m3 3 18 18" /><path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.8" /><path d="M9.9 4.3A10.5 10.5 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-3 4.3" /><path d="M6.2 6.2C3.5 8 2 12 2 12a18 18 0 0 0 7.8 6.6" /></svg>;
    case 'lock':
      return <svg {...common}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
    case 'unlock':
      return <svg {...common}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 7.5-2" /></svg>;
    case 'plus':
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case 'trash':
      return <svg {...common}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>;
    case 'image':
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="10" r="1.5" /><path d="m21 16-5-5L5 19" /></svg>;
    default:
      return <svg {...common}><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" /></svg>;
  }
}

export default function LayersPanel() {
  const { state, activeDocument, dispatch } = useEditor();
  const imageLayerInputRef = useRef<HTMLInputElement>(null);
  const layers = activeDocument ? state.layers : [];
  const activeLayer = layers.find((layer) => layer.id === state.activeLayerId);

  const handleAddImageLayer = async (file: File | null | undefined) => {
    if (!file || !activeDocument) return;
    const doc = await loadImageFile(file);
    if (!doc.imageData) return;
    dispatch({
      type: 'ADD_IMAGE_LAYER',
      payload: {
        imageData: doc.imageData,
        name: file.name.replace(/\.[^.]+$/, '') || 'Image Layer',
        thumbnail: doc.thumbnail,
      },
    });
  };

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

      <div className="pe-layers-quick-actions">
        <span>Layer tools</span>
        <button className="pe-layers-footer__btn" title="Layer mask">Mask</button>
        <button className="pe-layers-footer__btn" title="Adjustment layer">Adj</button>
        <button
          className="pe-layers-footer__btn"
          title={activeLayer?.locked ? 'Unlock selected layer' : 'Lock selected layer'}
          disabled={!activeLayer}
          onClick={() => activeLayer && dispatch({ type: 'UPDATE_LAYER', payload: { id: activeLayer.id, changes: { locked: !activeLayer.locked } } })}
        >
          <LayerIcon name={activeLayer?.locked ? 'lock' : 'unlock'} />
        </button>
      </div>

      <div className="pe-layers-list">
        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            className={`pe-layer-item ${state.activeLayerId === layer.id ? 'pe-layer-item--active' : ''}`}
            draggable={!layer.locked}
            onDragStart={(e) => {
              if (layer.locked) return;
              e.dataTransfer.setData('text/layer-index', String(idx));
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const fromIndex = Number(e.dataTransfer.getData('text/layer-index'));
              if (Number.isFinite(fromIndex)) {
                dispatch({ type: 'REORDER_LAYER', payload: { fromIndex, toIndex: idx } });
              }
            }}
            onClick={() => dispatch({ type: 'SET_ACTIVE_LAYER', payload: layer.id })}
          >
            <span className="pe-layer-item__grip" title="Drag to reorder layers"><LayerIcon name="grip" /></span>
            <button
              className="pe-layer-item__visibility"
              title="Toggle visibility"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'UPDATE_LAYER', payload: { id: layer.id, changes: { visible: !layer.visible } } });
              }}
            >
              <LayerIcon name={layer.visible ? 'eye' : 'eye-off'} />
            </button>
            <div className="pe-layer-item__thumbnail">
              {layer.thumbnail ? (
                <img src={layer.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="pe-layer-item__transparent-thumb" />
              )}
            </div>
            <div className="pe-layer-item__info">
              <span className="pe-layer-item__name">{layer.name}</span>
            </div>
            {layer.locked && <span className="pe-layer-item__lock" title="Locked"><LayerIcon name="lock" /></span>}
          </div>
        ))}
      </div>

      <div className="pe-layers-footer">
        <button className="pe-layers-footer__btn" title="New layer" onClick={() => dispatch({ type: 'ADD_LAYER' })}><LayerIcon name="plus" /></button>
        <button className="pe-layers-footer__btn" title="Add image as layer" onClick={() => imageLayerInputRef.current?.click()}><LayerIcon name="image" /></button>
        <button className="pe-layers-footer__btn" title="Delete layer" onClick={() => dispatch({ type: 'DELETE_ACTIVE_LAYER' })}><LayerIcon name="trash" /></button>
        <input
          ref={imageLayerInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            handleAddImageLayer(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
