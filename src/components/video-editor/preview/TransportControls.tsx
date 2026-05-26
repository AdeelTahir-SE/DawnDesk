import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { SkipBack, ChevronLeft, Play, Pause, ChevronRight, SkipForward, Repeat } from 'lucide-react';

function formatTimecode(seconds: number, fps: number = 30): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * fps);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

export default function TransportControls() {
  const { state, dispatch } = useVideoEditor();
  const fps = state.project?.settings.frameRate ?? 30;
  const duration = state.project?.duration ?? 0;

  return (
    <div className="ve-transport">
      <button className="ve-transport-btn" onClick={() => dispatch({ type: 'SET_PLAYHEAD', payload: 0 })} title="Go to Start">
        <SkipBack size={14} />
      </button>
      <button className="ve-transport-btn" onClick={() => dispatch({ type: 'STEP_BACKWARD' })} title="Step Back">
        <ChevronLeft size={16} />
      </button>
      <button className="ve-transport-btn play-btn" onClick={() => dispatch({ type: 'TOGGLE_PLAY' })} title="Play/Pause">
        {state.isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
      </button>
      <button className="ve-transport-btn" onClick={() => dispatch({ type: 'STEP_FORWARD' })} title="Step Forward">
        <ChevronRight size={16} />
      </button>
      <button className="ve-transport-btn" onClick={() => dispatch({ type: 'SET_PLAYHEAD', payload: duration })} title="Go to End">
        <SkipForward size={14} />
      </button>
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
      <button className={`ve-transport-btn ${state.isLooping ? 'active' : ''}`}
        onClick={() => dispatch({ type: 'TOGGLE_LOOP' })} title="Loop">
        <Repeat size={14} />
      </button>
      <div className="ve-timecode">{formatTimecode(state.playheadTime, fps)}</div>
      <span className="ve-timecode-muted">/ {formatTimecode(duration, fps)}</span>
      <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
      <select className="ve-speed-select" value={state.playbackSpeed}
        onChange={e => dispatch({ type: 'SET_PLAYBACK_SPEED', payload: Number(e.target.value) })}>
        <option value={0.25}>0.25×</option>
        <option value={0.5}>0.5×</option>
        <option value={1}>1×</option>
        <option value={1.5}>1.5×</option>
        <option value={2}>2×</option>
        <option value={4}>4×</option>
      </select>
    </div>
  );
}
