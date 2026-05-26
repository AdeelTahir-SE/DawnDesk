import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import TransportControls from './TransportControls';
import { Monitor, Maximize } from 'lucide-react';

export default function PreviewCanvas() {
  const { state, dispatch } = useVideoEditor();
  const w = state.project?.settings.width ?? 1920;
  const h = state.project?.settings.height ?? 1080;
  const aspect = w / h;

  return (
    <div className="ve-canvas-area">
      <div className="ve-preview">
        <div className="ve-preview-viewport" style={{ width: '80%', maxWidth: 720, aspectRatio: `${aspect}` }}>
          <div style={{
            width: '100%', height: '100%',
            background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <Monitor size={48} style={{ color: 'rgba(255,255,255,0.08)' }} />
            <span style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              fontFamily: 'JetBrains Mono', fontSize: 11, color: 'rgba(255,255,255,0.2)',
            }}>
              {w} × {h}
            </span>
            {state.showSafeZones && (
              <>
                <div className="ve-safe-zone title" />
                <div className="ve-safe-zone action" />
              </>
            )}
          </div>
        </div>
        <div className="ve-preview-overlay">
          <span style={{ fontFamily: 'JetBrains Mono' }}>
            {state.previewZoom === 1 ? 'Fit' : `${Math.round(state.previewZoom * 100)}%`}
          </span>
          <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            onClick={() => dispatch({ type: 'SET_PREVIEW_ZOOM', payload: state.previewZoom === 1 ? 0.5 : state.previewZoom === 0.5 ? 2 : 1 })}
            title="Cycle zoom">
            <Maximize size={12} />
          </button>
        </div>
      </div>
      <TransportControls />
    </div>
  );
}
