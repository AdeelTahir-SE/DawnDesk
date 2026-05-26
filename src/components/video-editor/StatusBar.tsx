import { useVideoEditor } from '../../engine/video-editor/VideoEditorContext';
import { Magnet, Film } from 'lucide-react';

function formatTimecode(seconds: number, fps: number = 30): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * fps);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

export default function StatusBar() {
  const { state } = useVideoEditor();
  const fps = state.project?.settings.frameRate ?? 30;
  const w = state.project?.settings.width ?? 1920;
  const h = state.project?.settings.height ?? 1080;

  return (
    <div className="ve-statusbar">
      <div className="ve-status-item">
        <Film size={10} />
        <span>{state.project?.name || 'No Project'}</span>
      </div>
      <div className="ve-status-item">
        <span style={{ textTransform: 'capitalize' }}>{state.activeTool}</span>
      </div>
      <div className="ve-status-spacer" />
      <div className="ve-status-item accent" style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600 }}>
        {formatTimecode(state.playheadTime, fps)}
      </div>
      <div className="ve-status-spacer" />
      <div className="ve-status-item">
        <Magnet size={10} />
        <span>{state.snapEnabled ? 'Snap On' : 'Snap Off'}</span>
      </div>
      <div className="ve-status-item">
        <span>{Math.round(state.timelineZoom)}px/s</span>
      </div>
      <div className="ve-status-item">
        <span>{w}×{h}</span>
      </div>
      <div className="ve-status-item">
        <span>{fps}fps</span>
      </div>
      <div className="ve-status-item" style={{ color: state.ffmpegStatus.available ? '#22c55e' : '#ef4444' }}>
        <Film size={10} />
        <span>{state.ffmpegStatus.available ? 'FFmpeg Ready' : 'FFmpeg Missing'}</span>
      </div>
    </div>
  );
}
