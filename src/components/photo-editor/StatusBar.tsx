import { useEditor } from '../../engine/photo-editor/EditorContext';

export default function StatusBar() {
  const { activeDocument } = useEditor();

  const zoomPct = activeDocument ? Math.round(activeDocument.zoom * 100) : 100;
  const dims = activeDocument
    ? `${activeDocument.width} × ${activeDocument.height} px (${activeDocument.dpi} ppi)`
    : '—';
  const colorInfo = activeDocument
    ? `${activeDocument.colorMode}/${activeDocument.bitDepth}`
    : '—';

  return (
    <div className="pe-status-bar">
      <div className="pe-status-bar__item">
        <span>{zoomPct}%</span>
      </div>
      <div className="pe-status-bar__separator" />
      <div className="pe-status-bar__item">
        <span>{dims}</span>
      </div>
      <div className="pe-status-bar__separator" />
      <div className="pe-status-bar__item">
        <span>{colorInfo}</span>
      </div>
    </div>
  );
}
