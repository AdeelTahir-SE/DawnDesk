import { useRef } from 'react';
import { Reorder } from 'motion/react';
import { useEditor } from '../../engine/photo-editor/EditorContext';
import { loadImageFile } from '../../engine/photo-editor/importImage';

function LIcon({ name }: { name: 'eye' | 'eye-off' | 'lock' | 'unlock' | 'plus' | 'trash' | 'grip' | 'image' | 'up' | 'down' | 'smart-obj' | 'mask' | 'adj' }) {
  const c = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'eye':       return <svg {...c}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case 'eye-off':   return <svg {...c}><path d="m3 3 18 18" /><path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.8" /><path d="M9.9 4.3A10.5 10.5 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-3 4.3" /><path d="M6.2 6.2C3.5 8 2 12 2 12a18 18 0 0 0 7.8 6.6" /></svg>;
    case 'lock':      return <svg {...c}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
    case 'unlock':    return <svg {...c}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 7.5-2" /></svg>;
    case 'plus':      return <svg {...c}><path d="M12 5v14M5 12h14" /></svg>;
    case 'trash':     return <svg {...c}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>;
    case 'image':     return <svg {...c}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="10" r="1.5" /><path d="m21 16-5-5L5 19" /></svg>;
    case 'up':        return <svg {...c}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
    case 'down':      return <svg {...c}><path d="M12 5v14M19 12l-7 7-7-7" /></svg>;
    case 'smart-obj': return <svg {...c} fill="none"><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.5" /><path d="M8 12h8M12 8v8" strokeWidth="1.5" /></svg>;
    case 'mask':      return <svg {...c}><rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" /></svg>;
    case 'adj':       return <svg {...c}><path d="M4 12h16M4 6h16M4 18h16" /><circle cx="8" cy="6" r="2" fill="currentColor" /><circle cx="16" cy="12" r="2" fill="currentColor" /><circle cx="10" cy="18" r="2" fill="currentColor" /></svg>;
    default:          return <svg {...c}><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" /></svg>;
  }
}

export default function LayersPanel() {
  const { state, activeDocument, dispatch } = useEditor();
  const imageLayerInputRef = useRef<HTMLInputElement>(null);
  const smartObjectInputRef = useRef<HTMLInputElement>(null);
  const layers = activeDocument ? state.layers : [];
  const activeLayer = layers.find((l) => l.id === state.activeLayerId);

  const handleAddImageLayer = async (file: File | null | undefined, isSmartObject = false) => {
    if (!file || !activeDocument) return;
    const doc = await loadImageFile(file);
    if (!doc.imageData) return;
    dispatch({
      type: 'ADD_IMAGE_LAYER',
      payload: {
        imageData: doc.imageData,
        name: file.name.replace(/\.[^.]+$/, '') || (isSmartObject ? 'Smart Object' : 'Image Layer'),
        thumbnail: doc.thumbnail,
        isSmartObject,
      },
    });
  };

  const moveLayer = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= layers.length) return;
    dispatch({ type: 'REORDER_LAYER', payload: { fromIndex, toIndex } });
  };

  const activeIdx = layers.findIndex((l) => l.id === state.activeLayerId);
  const firstLockedIdx = layers.findIndex((l) => l.locked);
  const bottomMoveIdx = firstLockedIdx >= 0 ? firstLockedIdx - 1 : layers.length - 1;
  const canMoveActive = Boolean(activeLayer && !activeLayer.locked);

  const handleReorder = (nextIds: string[]) => {
    const currentIds = layers.map((layer) => layer.id);
    if (nextIds.length !== currentIds.length || nextIds.every((id, idx) => id === currentIds[idx])) return;

    const movedId = nextIds.find((id, idx) => id !== currentIds[idx] && currentIds.includes(id));
    if (!movedId) return;
    const fromIndex = currentIds.indexOf(movedId);
    const toIndex = nextIds.indexOf(movedId);
    if (fromIndex >= 0 && toIndex >= 0) {
      dispatch({ type: 'REORDER_LAYER', payload: { fromIndex, toIndex } });
    }
  };

  return (
    <div className="pe-layers-section">
      <div className="pe-layers-header">
        <span className="pe-layers-header__title">Layers</span>
        <div className="pe-layers-header__actions">
          {/* Up/Down reorder */}
          <button
            className="pe-options-bar__icon-btn"
            title="Move layer up"
            disabled={!canMoveActive || activeIdx <= 0}
            onClick={() => moveLayer(activeIdx, activeIdx - 1)}
          >
            <LIcon name="up" />
          </button>
          <button
            className="pe-options-bar__icon-btn"
            title="Move layer down"
            disabled={!canMoveActive || activeIdx < 0 || activeIdx >= bottomMoveIdx}
            onClick={() => moveLayer(activeIdx, activeIdx + 1)}
          >
            <LIcon name="down" />
          </button>
        </div>
      </div>

      {/* Blend mode + Opacity */}
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
            <option value="hard-light">Hard Light</option>
            <option value="color-dodge">Color Dodge</option>
            <option value="color-burn">Color Burn</option>
            <option value="darken">Darken</option>
            <option value="lighten">Lighten</option>
            <option value="difference">Difference</option>
            <option value="exclusion">Exclusion</option>
            <option value="hue">Hue</option>
            <option value="saturation">Saturation</option>
            <option value="color">Color</option>
            <option value="luminosity">Luminosity</option>
          </select>
        </div>
        <div className="pe-layers-controls__opacity">
          <span style={{ color: 'var(--pe-text-muted)', fontSize: 11 }}>Opacity:</span>
          <input
            type="range" min="0" max="100"
            value={activeLayer?.opacity ?? 100}
            disabled={!activeLayer}
            onChange={(e) => activeLayer && dispatch({ type: 'UPDATE_LAYER', payload: { id: activeLayer.id, changes: { opacity: Number(e.target.value) } } })}
            style={{ width: 58, accentColor: 'var(--pe-accent)' }}
          />
          <span style={{ fontSize: 11 }}>{activeLayer?.opacity ?? 100}%</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="pe-layers-quick-actions">
        <span style={{ fontSize: 10, color: 'var(--pe-text-muted)' }}>Layer tools</span>
        <button className="pe-layers-footer__btn" title="Add layer mask">
          <LIcon name="mask" />
        </button>
        <button className="pe-layers-footer__btn" title="New adjustment layer">
          <LIcon name="adj" />
        </button>
        <button
          className="pe-layers-footer__btn"
          title="Convert selected layer to Smart Object"
          disabled={!activeLayer || activeLayer.locked || Boolean(activeLayer.isSmartObject)}
          onClick={() => dispatch({ type: 'CONVERT_ACTIVE_LAYER_TO_SMART_OBJECT' })}
        >
          <LIcon name="smart-obj" />
        </button>
        <button
          className="pe-layers-footer__btn"
          title={activeLayer?.locked ? 'Unlock selected layer' : 'Lock selected layer'}
          disabled={!activeLayer}
          onClick={() => activeLayer && dispatch({ type: 'UPDATE_LAYER', payload: { id: activeLayer.id, changes: { locked: !activeLayer.locked } } })}
        >
          <LIcon name={activeLayer?.locked ? 'lock' : 'unlock'} />
        </button>
      </div>

      {/* Layer list */}
      <Reorder.Group
        as="div"
        axis="y"
        values={layers.map((layer) => layer.id)}
        onReorder={handleReorder}
        className="pe-layers-list"
      >
        {layers.map((layer) => {
          const isActive = state.activeLayerId === layer.id;

          return (
            <Reorder.Item
              as="div"
              key={layer.id}
              value={layer.id}
              drag={!layer.locked ? 'y' : false}
              data-reorderable={!layer.locked}
              className={`pe-layer-item ${isActive ? 'pe-layer-item--active' : ''}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_LAYER', payload: layer.id })}
              whileDrag={{ scale: 1.02, zIndex: 10 }}
            >
              <span className="pe-layer-item__grip" title="Drag to reorder">
                <LIcon name="grip" />
              </span>

              <button
                className="pe-layer-item__visibility"
                title="Toggle visibility"
                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_LAYER', payload: { id: layer.id, changes: { visible: !layer.visible } } }); }}
              >
                <LIcon name={layer.visible ? 'eye' : 'eye-off'} />
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
                {(layer as any).isSmartObject && (
                  <span title="Smart Object" style={{ color: 'var(--pe-accent)', marginLeft: 4 }}>
                    <LIcon name="smart-obj" />
                  </span>
                )}
              </div>

              {layer.locked && (
                <span className="pe-layer-item__lock" title="Locked">
                  <LIcon name="lock" />
                </span>
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      {/* Footer */}
      <div className="pe-layers-footer">
        <button className="pe-layers-footer__btn" title="New layer" onClick={() => dispatch({ type: 'ADD_LAYER' })}>
          <LIcon name="plus" />
        </button>
        <button className="pe-layers-footer__btn" title="Add image as layer" onClick={() => imageLayerInputRef.current?.click()}>
          <LIcon name="image" />
        </button>
        <button className="pe-layers-footer__btn" title="Place image as Smart Object" onClick={() => smartObjectInputRef.current?.click()}>
          <LIcon name="smart-obj" />
        </button>
        <button className="pe-layers-footer__btn" title="Delete layer" onClick={() => dispatch({ type: 'DELETE_ACTIVE_LAYER' })}>
          <LIcon name="trash" />
        </button>
        <input
          ref={imageLayerInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => { handleAddImageLayer(e.target.files?.[0]); e.target.value = ''; }}
        />
        <input
          ref={smartObjectInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => { handleAddImageLayer(e.target.files?.[0], true); e.target.value = ''; }}
        />
      </div>
    </div>
  );
}
