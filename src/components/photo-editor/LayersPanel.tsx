import { useEditor } from '../../engine/photo-editor/EditorContext';

export default function LayersPanel() {
  const { activeDocument } = useEditor();

  // v0.1: single flat layer — show a static "Background" layer
  // plus a placeholder "Layer 1" for visual completeness
  const layers = activeDocument
    ? [
        { id: 'layer-1', name: 'Layer 1', visible: true, locked: false },
        { id: 'background', name: 'Background', visible: true, locked: true },
      ]
    : [];

  return (
    <div className="pe-layers-section">
      {/* Header row: "Layers" title + menu */}
      <div className="pe-layers-header">
        <span className="pe-layers-header__title">Layers</span>
        <div className="pe-layers-header__actions">
          <button className="pe-options-bar__icon-btn" title="Layer menu">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Blend mode + Opacity row */}
      <div className="pe-layers-controls">
        <div className="pe-layers-controls__mode">
          <select
            className="pe-options-bar__select"
            defaultValue="normal"
            style={{ flex: 1, fontSize: 11 }}
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
          </select>
        </div>
        <div className="pe-layers-controls__opacity">
          <span style={{ color: 'var(--pe-text-muted)', fontSize: 11 }}>Opacity:</span>
          <span style={{ fontSize: 11 }}>100%</span>
        </div>
      </div>

      {/* Lock icons row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderBottom: '1px solid var(--pe-border-subtle)' }}>
        <span style={{ color: 'var(--pe-text-muted)', fontSize: 11, marginRight: 4 }}>Lock:</span>
        {['🔳', '✏️', '🔄', '🔒'].map((icon, i) => (
          <button key={i} className="pe-layers-footer__btn" title="Lock option" style={{ fontSize: 10 }}>
            {icon}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--pe-text-muted)' }}>Fill: 100%</span>
      </div>

      {/* Layer list */}
      <div className="pe-layers-list">
        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            className={`pe-layer-item ${idx === 0 ? 'pe-layer-item--active' : ''}`}
          >
            <button className="pe-layer-item__visibility" title="Toggle visibility">
              {layer.visible ? '👁' : '○'}
            </button>
            <div className="pe-layer-item__thumbnail">
              {/* Placeholder thumbnail — will show actual layer preview */}
              <div style={{
                width: '100%', height: '100%',
                background: idx === 0
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)',
              }} />
            </div>
            <div className="pe-layer-item__info">
              <span className="pe-layer-item__name">{layer.name}</span>
            </div>
            {layer.locked && (
              <span className="pe-layer-item__lock" title="Locked">🔒</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="pe-layers-footer">
        {['🔗', 'fx', '🎭', '⬛', '📁', '➕', '🗑'].map((icon, i) => (
          <button key={i} className="pe-layers-footer__btn" title="Layer action">
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
