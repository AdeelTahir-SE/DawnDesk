import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import {
  Plus, Film, Music, SkipBack, ChevronLeft, Play, Pause,
  ChevronRight, SkipForward, Repeat, Waves, Image,
  KeySquare, ZoomOut, ZoomIn, Magnet,
} from 'lucide-react';

export default function TimelineControls() {
  const { state, dispatch } = useVideoEditor();

  return (
    <div className="ve-timeline-controls">
      <div className="ve-timeline-controls-group">
        <button className="ve-tool-btn" title="Add Video Track"
          onClick={() => dispatch({ type: 'ADD_TRACK', payload: { type: 'video' } })}>
          <Film size={13} />
          <Plus size={9} style={{ position: 'absolute', bottom: 4, right: 4 }} />
        </button>
        <button className="ve-tool-btn" title="Add Audio Track"
          onClick={() => dispatch({ type: 'ADD_TRACK', payload: { type: 'audio' } })}>
          <Music size={13} />
          <Plus size={9} style={{ position: 'absolute', bottom: 4, right: 4 }} />
        </button>
      </div>

      <div className="ve-tool-separator" />

      <div className="ve-timeline-controls-spacer" />

      {/* Transport Controls */}
      <div className="ve-timeline-controls-group">
        <button className="ve-transport-btn" title="Go to Start"
          onClick={() => dispatch({ type: 'SET_PLAYHEAD', payload: 0 })}>
          <SkipBack size={14} />
        </button>
        <button className="ve-transport-btn" title="Step Back (J)"
          onClick={() => dispatch({ type: 'STEP_BACKWARD' })}>
          <ChevronLeft size={16} />
        </button>
        <button className="ve-transport-btn play-btn" title="Play/Pause (Space)"
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}>
          {state.isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
        </button>
        <button className="ve-transport-btn" title="Step Forward (L)"
          onClick={() => dispatch({ type: 'STEP_FORWARD' })}>
          <ChevronRight size={16} />
        </button>
        <button className="ve-transport-btn" title="Go to End"
          onClick={() => dispatch({ type: 'SET_PLAYHEAD', payload: state.project?.duration ?? 0 })}>
          <SkipForward size={14} />
        </button>
        <button className={`ve-transport-btn ${state.isLooping ? 'active' : ''}`}
          title="Loop" onClick={() => dispatch({ type: 'TOGGLE_LOOP' })}>
          <Repeat size={14} />
        </button>
      </div>

      <div className="ve-timeline-controls-spacer" />

      <div className="ve-tool-separator" />

      {/* View toggles */}
      <div className="ve-timeline-controls-group">
        <button className={`ve-tool-btn ${state.showWaveforms ? 'active' : ''}`}
          title="Waveforms" onClick={() => dispatch({ type: 'TOGGLE_WAVEFORMS' })}>
          <Waves size={14} />
        </button>
        <button className={`ve-tool-btn ${state.showThumbnails ? 'active' : ''}`}
          title="Thumbnails" onClick={() => dispatch({ type: 'TOGGLE_THUMBNAILS' })}>
          <Image size={14} />
        </button>
        <button className={`ve-tool-btn ${state.showKeyframes ? 'active' : ''}`}
          title="Keyframes" onClick={() => dispatch({ type: 'TOGGLE_KEYFRAMES' })}>
          <KeySquare size={14} />
        </button>
      </div>

      <div className="ve-tool-separator" />

      {/* Zoom */}
      <div className="ve-zoom-slider">
        <button className="ve-tool-btn" title="Zoom Out"
          onClick={() => dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom / 1.3 })}>
          <ZoomOut size={13} />
        </button>
        <input type="range" min={10} max={500} value={state.timelineZoom}
          onChange={e => dispatch({ type: 'SET_TIMELINE_ZOOM', payload: Number(e.target.value) })} />
        <button className="ve-tool-btn" title="Zoom In"
          onClick={() => dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom * 1.3 })}>
          <ZoomIn size={13} />
        </button>
      </div>
    </div>
  );
}
