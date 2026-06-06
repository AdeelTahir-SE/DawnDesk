import { useRef, useCallback } from 'react';
import { Reorder } from 'motion/react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import TimelineControls from './TimelineControls';
import TimelineRuler from './TimelineRuler';
import TimelineTrack, { getTimelineTrackDisplayHeight } from './TimelineTrack';
import Playhead from './Playhead';
import { getDroppedMedia } from '../dragDrop';

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

  const handleScrollMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (state.activeTool === 'zoom') {
      const factor = e.altKey ? 1 / 1.25 : 1.25;
      dispatch({ type: 'SET_TIMELINE_ZOOM', payload: state.timelineZoom * factor });
      return;
    }

    if (state.activeTool !== 'hand' || !scrollRef.current) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = scrollRef.current.scrollLeft;
    const startTop = scrollRef.current.scrollTop;
    const handleMove = (moveEvent: MouseEvent) => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollLeft = startLeft - (moveEvent.clientX - startX);
      scrollRef.current.scrollTop = startTop - (moveEvent.clientY - startY);
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [dispatch, state.activeTool, state.timelineZoom]);

  const handleEmptyDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const mediaItem = getDroppedMedia(e.dataTransfer, state.project?.mediaPool ?? []);
      if (!mediaItem) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const startTime = Math.max(0, x / state.timelineZoom);
      dispatch({ type: 'ADD_MEDIA_TO_NEW_TRACK', payload: { media: mediaItem, startTime } });
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
          <Reorder.Group as="div" axis="y" values={tracks.map(t => t.id)} onReorder={(nextIds) => dispatch({ type: 'REORDER_TRACKS', payload: nextIds })}>
            {tracks.map((track, i) => (
              <Reorder.Item as="div" key={track.id} value={track.id} drag="y" style={{ position: 'relative', zIndex: 1, backgroundColor: '#1a1a1a' }}>
                <TimelineTrack track={track} index={i} headerOnly />
              </Reorder.Item>
            ))}
          </Reorder.Group>
          <div style={{ padding: '10px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
            <button className="dd-btn-secondary" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => dispatch({ type: 'ADD_TRACK', payload: { type: 'video' } })}>+ Video</button>
            <button className="dd-btn-secondary" style={{ fontSize: 10, padding: '4px 8px' }} onClick={() => dispatch({ type: 'ADD_TRACK', payload: { type: 'audio' } })}>+ Audio</button>
          </div>
        </div>

        {/* Scrollable clips area */}
        <div className="ve-timeline-scroll" ref={scrollRef} onWheel={handleWheel} onScroll={handleScroll} onMouseDown={handleScrollMouseDown}
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
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
            <Playhead height={tracks.reduce((sum, t) => sum + getTimelineTrackDisplayHeight(t), 0)} />
          </div>
        </div>
      </div>
    </div>
  );
}
