import { useRef, useCallback, useMemo } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { CLIP_COLORS } from '../../../engine/video-editor/constants';
import type { Clip } from '../../../engine/video-editor/types';

interface Props {
  clip: Clip;
  trackId: string;
  zoom: number;
}

export default function TimelineClip({ clip, trackId, zoom }: Props) {
  const { state, dispatch } = useVideoEditor();
  const clipRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; startTime: number } | null>(null);
  const isSelected = state.selectedClipIds.includes(clip.id);

  const left = clip.startTime * zoom;
  const width = Math.max(clip.duration * zoom, 4);
  const bgColor = CLIP_COLORS[clip.mediaType as keyof typeof CLIP_COLORS] || CLIP_COLORS.video;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      dispatch({ type: 'ADD_TO_SELECTION', payload: [clip.id] });
    } else {
      dispatch({ type: 'SELECT_CLIPS', payload: [clip.id] });
    }
  }, [dispatch, clip.id]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (state.activeTool === 'razor') {
      const rect = clipRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const time = clip.startTime + (x / zoom);
      dispatch({ type: 'SPLIT_CLIP', payload: { clipId: clip.id, time } });
      return;
    }
    if (state.activeTool !== 'select') return;
    dragStartRef.current = { x: e.clientX, startTime: clip.startTime };
    const handleMouseMove = (me: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = me.clientX - dragStartRef.current.x;
      const dt = dx / zoom;
      const newTime = Math.max(0, dragStartRef.current.startTime + dt);
      dispatch({ type: 'MOVE_CLIP', payload: { clipId: clip.id, trackId, startTime: newTime } });
    };
    const handleMouseUp = () => {
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [dispatch, clip.id, clip.startTime, trackId, zoom, state.activeTool]);

  const handleTrimStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const origStart = clip.startTime;
    const origDuration = clip.duration;
    const origInPoint = clip.inPoint;
    const handleMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dt = dx / zoom;
      const newStart = Math.max(0, origStart + dt);
      const newDuration = origDuration - dt;
      if (newDuration < 0.1) return;
      dispatch({ type: 'TRIM_CLIP_START', payload: { clipId: clip.id, newStartTime: newStart, newInPoint: origInPoint + dt * clip.speed } });
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [dispatch, clip, zoom]);

  const handleTrimEnd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const origDuration = clip.duration;
    const origOutPoint = clip.outPoint;
    const handleMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dt = dx / zoom;
      const newDuration = Math.max(0.1, origDuration + dt);
      dispatch({ type: 'TRIM_CLIP_END', payload: { clipId: clip.id, newDuration, newOutPoint: origOutPoint + dt * clip.speed } });
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [dispatch, clip, zoom]);

  const waveformBars = useMemo(() => {
    if (clip.mediaType !== 'audio') return null;
    const count = Math.max(Math.floor(width / 3), 4);
    return Array.from({ length: count }, (_, i) => {
      const h = 20 + Math.sin(i * 0.7 + clip.startTime * 3) * 30 + Math.random() * 20;
      return <div key={i} className="ve-clip-waveform-bar" style={{ height: `${Math.min(90, h)}%` }} />;
    });
  }, [clip.mediaType, width, clip.startTime]);

  return (
    <div ref={clipRef}
      className={`ve-clip ${isSelected ? 'selected' : ''}`}
      style={{
        left, width,
        opacity: clip.mediaType === 'video' ? clip.opacity : 1,
        cursor: state.activeTool === 'razor' ? 'crosshair' : 'pointer',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}>
      <div className="ve-clip-bg" style={{ background: bgColor }} />
      {clip.mediaType === 'audio' && (
        <div className="ve-clip-waveform">{waveformBars}</div>
      )}
      <span className="ve-clip-label">{clip.label || clip.mediaName}</span>
      {clip.speed !== 1 && <span className="ve-clip-speed">{clip.speed.toFixed(1)}×</span>}
      {clip.transition && <div className={`ve-clip-transition ${clip.transition.edge}`} />}
      <div className="ve-clip-handle left" onMouseDown={handleTrimStart} />
      <div className="ve-clip-handle right" onMouseDown={handleTrimEnd} />
    </div>
  );
}
