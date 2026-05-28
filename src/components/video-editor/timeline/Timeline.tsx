import { useRef, useCallback } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import TimelineControls from './TimelineControls';
import TimelineRuler from './TimelineRuler';
import TimelineTrack from './TimelineTrack';
import Playhead from './Playhead';

export default function Timeline() {
  const { state, dispatch } = useVideoEditor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const headersRef = useRef<HTMLDivElement>(null);

  const tracks = state.project?.tracks ?? [];
  const duration = Math.max(state.project?.duration ?? 0, 60);
  const totalWidth = duration * state.timelineZoom;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom * factor });
    }
  }, [dispatch, state.timelineZoom]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current && headersRef.current) {
      headersRef.current.scrollTop = scrollRef.current.scrollTop;
    }
  }, []);

  const handleRulerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / state.timelineZoom;
    dispatch({ type: 'SET_PLAYHEAD', payload: Math.max(0, time) });
  }, [dispatch, state.timelineZoom]);

  const handleEmptyDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      const mediaItem = JSON.parse(data);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      const trackType = mediaItem.type === 'video' || mediaItem.type === 'image' ? 'video' : 'audio';
      // First add a track
      dispatch({ type: 'ADD_TRACK', payload: { type: trackType } });
      
      // We need to wait for state to update to get the new track ID, or we can use a combined action.
      // Since we don't have a combined action, we can simulate a small delay, but React state is async.
      // Instead, we can add a simple "Add Video Track" and "Add Audio Track" button below the headers.
    } catch (err) {
      console.error('Drop failed', err);
    }
  };

  return (
    <div className="ve-timeline-area">
      <TimelineControls />
      <div className="ve-timeline-body">
        {/* Track Headers */}
        <div className="ve-timeline-headers" ref={headersRef}>
          <div className="ve-ruler-spacer" />
          {tracks.map((track, i) => (
            <TimelineTrack key={track.id} track={track} index={i} headerOnly />
          ))}
          <div style={{ padding: '10px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
            <button className="dd-btn-secondary" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => dispatch({ type: 'ADD_TRACK', payload: { type: 'video' } })}>+ Video</button>
            <button className="dd-btn-secondary" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => dispatch({ type: 'ADD_TRACK', payload: { type: 'audio' } })}>+ Audio</button>
          </div>
        </div>

        {/* Scrollable clips area */}
        <div className="ve-timeline-scroll" ref={scrollRef} onWheel={handleWheel} onScroll={handleScroll}
          onDragOver={e => e.preventDefault()}
          onDrop={handleEmptyDrop}>
          <TimelineRuler width={totalWidth} duration={duration} onClick={handleRulerClick} />
          <div style={{ position: 'relative', width: totalWidth, minHeight: '100%' }}>
            {tracks.map((track, i) => (
              <TimelineTrack key={track.id} track={track} index={i} />
            ))}
            {tracks.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }}>
                Click + Video or + Audio to add a track, then drag media here
              </div>
            )}
            <Playhead height={tracks.reduce((sum, t) => sum + t.height, 0)} />
          </div>
        </div>
      </div>
    </div>
  );
}
