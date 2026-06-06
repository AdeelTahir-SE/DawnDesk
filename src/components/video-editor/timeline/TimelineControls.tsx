import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import {
  Plus, Film, Music, SkipBack, ChevronLeft, Play, Pause,
  ChevronRight, SkipForward, Repeat, Waves, Image,
  KeySquare, ZoomOut, ZoomIn,
} from 'lucide-react';

export default function TimelineControls() {
  const { state, dispatch } = useVideoEditor();

  return (
    <div className="ve-timeline-controls">
      <div className="ve-timeline-controls-group">
        <button className="ve-tool-btn" title="Add Video Track" aria-label="Add Video Track" data-tooltip="Add Video Track"
          onClick={() => dispatch({ type: 'ADD_TRACK', payload: { type: 'video' } })}>
          <Film size={13} />
          <Plus size={9} style={{ position: 'absolute', bottom: 4, right: 4 }} />
        </button>
        <button className="ve-tool-btn" title="Add Audio Track" aria-label="Add Audio Track" data-tooltip="Add Audio Track"
          onClick={() => dispatch({ type: 'ADD_TRACK', payload: { type: 'audio' } })}>
          <Music size={13} />
          <Plus size={9} style={{ position: 'absolute', bottom: 4, right: 4 }} />
        </button>
      </div>

      <div className="ve-tool-separator" />

      <div className="ve-timeline-controls-spacer" />

      {/* Transport Controls */}
      <div className="ve-timeline-controls-group">
        <button className="ve-transport-btn" title="Go to Start" aria-label="Go to Start" data-tooltip="Go to Start"
          onClick={() => dispatch({ type: 'SET_PLAYHEAD', payload: 0 })}>
          <SkipBack size={14} />
        </button>
        <button className="ve-transport-btn" title="Step Back (J)" aria-label="Step Back (J)" data-tooltip="Step Back (J)"
          onClick={() => dispatch({ type: 'STEP_BACKWARD' })}>
          <ChevronLeft size={16} />
        </button>
        <button className="ve-transport-btn play-btn" title="Play/Pause (Space)" aria-label="Play/Pause (Space)" data-tooltip="Play/Pause (Space)"
          onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}>
          {state.isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
        </button>
        <button className="ve-transport-btn" title="Step Forward (L)" aria-label="Step Forward (L)" data-tooltip="Step Forward (L)"
          onClick={() => dispatch({ type: 'STEP_FORWARD' })}>
          <ChevronRight size={16} />
        </button>
        <button className="ve-transport-btn" title="Go to End" aria-label="Go to End" data-tooltip="Go to End"
          onClick={() => dispatch({ type: 'SET_PLAYHEAD', payload: state.project?.duration ?? 0 })}>
          <SkipForward size={14} />
        </button>
        <button className={`ve-transport-btn ${state.isLooping ? 'active' : ''}`}
          title="Loop" aria-label="Loop playback" data-tooltip="Loop Playback" onClick={() => dispatch({ type: 'TOGGLE_LOOP' })}>
          <Repeat size={14} />
        </button>
      </div>

      <div className="ve-timeline-controls-spacer" />

      <div className="ve-tool-separator" />

      {/* View toggles */}
      <div className="ve-timeline-controls-group">
        <button className={`ve-tool-btn ${state.showWaveforms ? 'active' : ''}`}
          title="Show/Hide Audio Waveforms" aria-label="Show/Hide Audio Waveforms" data-tooltip="Waveforms: show audio shapes" onClick={() => dispatch({ type: 'TOGGLE_WAVEFORMS' })}>
          <Waves size={14} />
        </button>
        <button className={`ve-tool-btn ${state.showThumbnails ? 'active' : ''}`}
          title="Show/Hide Clip Thumbnails" aria-label="Show/Hide Clip Thumbnails" data-tooltip="Thumbnails: show clip images" onClick={() => dispatch({ type: 'TOGGLE_THUMBNAILS' })}>
          <Image size={14} />
        </button>
        <button className={`ve-tool-btn ${state.showKeyframes ? 'active' : ''}`}
          title="Show/Hide Keyframes" aria-label="Show/Hide Keyframes" data-tooltip="Keyframes: show animation instants" onClick={() => dispatch({ type: 'TOGGLE_KEYFRAMES' })}>
          <KeySquare size={14} />
        </button>
      </div>

      <div className="ve-tool-separator" />

      {/* Zoom */}
      <div className="ve-zoom-slider">
        <button className="ve-tool-btn" title="Zoom Out" aria-label="Zoom Out" data-tooltip="Zoom Out"
          onClick={() => dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom / 1.3 })}>
          <ZoomOut size={13} />
        </button>
        <input type="range" min={10} max={500} value={state.timelineZoom}
          onChange={e => dispatch({ type: 'SET_TIMELINE_ZOOM', payload: Number(e.target.value) })} />
        <button className="ve-tool-btn" title="Zoom In" aria-label="Zoom In" data-tooltip="Zoom In"
          onClick={() => dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom * 1.3 })}>
          <ZoomIn size={13} />
        </button>
      </div>
    </div>
  );
}
