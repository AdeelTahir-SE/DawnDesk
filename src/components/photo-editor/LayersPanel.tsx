import { useRef } from 'react';
import { Reorder } from 'motion/react';
import { useEditor } from '../../engine/photo-editor/EditorContext';
import { loadImageFile } from '../../engine/photo-editor/importImage';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, GripVertical, Image as ImageIcon, ArrowUp, ArrowDown, Box, Circle, SlidersHorizontal } from 'lucide-react';

function LIcon({ name }: { name: 'eye' | 'eye-off' | 'lock' | 'unlock' | 'plus' | 'trash' | 'grip' | 'image' | 'up' | 'down' | 'smart-obj' | 'mask' | 'adj' }) {
  const size = 14;
  switch (name) {
    case 'eye':       return <Eye size={size} />;
    case 'eye-off':   return <EyeOff size={size} />;
    case 'lock':      return <Lock size={size} />;
    case 'unlock':    return <Unlock size={size} />;
    case 'plus':      return <Plus size={size} />;
    case 'trash':     return <Trash2 size={size} />;
    case 'grip':      return <GripVertical size={size} />;
    case 'image':     return <ImageIcon size={size} />;
    case 'up':        return <ArrowUp size={size} />;
    case 'down':      return <ArrowDown size={size} />;
    case 'smart-obj': return <Box size={size} />;
    case 'mask':      return <Circle size={size} />;
    case 'adj':       return <SlidersHorizontal size={size} />;
    default:          return null;
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
