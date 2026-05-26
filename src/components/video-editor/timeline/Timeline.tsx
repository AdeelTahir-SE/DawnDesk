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
        </div>

        {/* Scrollable clips area */}
        <div className="ve-timeline-scroll" ref={scrollRef} onWheel={handleWheel} onScroll={handleScroll}>
          <TimelineRuler width={totalWidth} duration={duration} onClick={handleRulerClick} />
          <div style={{ position: 'relative', width: totalWidth, minHeight: '100%' }}>
            {tracks.map((track, i) => (
              <TimelineTrack key={track.id} track={track} index={i} />
            ))}
            <Playhead height={tracks.reduce((sum, t) => sum + t.height, 0)} />
          </div>
        </div>
      </div>
    </div>
  );
}
