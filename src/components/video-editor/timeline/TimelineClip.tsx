import { useRef, useCallback, useMemo, useState } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { CLIP_COLORS, EFFECT_DEFINITIONS, TRANSITION_DEFINITIONS } from '../../../engine/video-editor/constants';
import type { Clip } from '../../../engine/video-editor/types';
import { useAppLogger } from '../../../utils/LoggerContext';
import { getDroppedEffect, getDroppedMedia, getDroppedTransition } from '../dragDrop';

interface Props {
  clip: Clip;
  trackId: string;
  zoom: number;
}

function clearDragTargets() {
  document.querySelectorAll('.ve-track-clips.drag-target, .ve-track-clips.drag-invalid').forEach(el => {
    el.classList.remove('drag-target', 'drag-invalid');
  });
}

function trackAcceptsClip(trackType: string | null, mediaType: Clip['mediaType']) {
  return trackType === mediaType || (trackType === 'video' && mediaType === 'image');
}

const DRAG_TOOLS = new Set(['select', 'ripple', 'roll', 'slip', 'slide']);

export default function TimelineClip({ clip, trackId, zoom }: Props) {
  const { state, dispatch } = useVideoEditor();
  const { logSuccess } = useAppLogger();
  const clipRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; startTime: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ dx: number; dy: number; valid: boolean; time: number } | null>(null);
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
    if (!DRAG_TOOLS.has(state.activeTool)) return;
    e.preventDefault();
    if (!isSelected) {
      dispatch({ type: 'SELECT_CLIPS', payload: [clip.id] });
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY, startTime: clip.startTime };
    const handleMouseMove = (me: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = me.clientX - dragStartRef.current.x;
      const dy = me.clientY - dragStartRef.current.y;
      const newTime = Math.max(0, dragStartRef.current.startTime + dx / zoom);
      const elements = document.elementsFromPoint(me.clientX, me.clientY);
      const trackEl = elements.find(el => el.classList.contains('ve-track-clips')) as HTMLElement | undefined;
      const valid = trackAcceptsClip(trackEl?.dataset.trackType || null, clip.mediaType);
      clearDragTargets();
      if (trackEl) trackEl.classList.add(valid ? 'drag-target' : 'drag-invalid');
      setDragPreview({ dx, dy, valid, time: newTime });
    };
    const handleMouseUp = (me: MouseEvent) => {
      if (dragStartRef.current) {
        const dx = me.clientX - dragStartRef.current.x;
        const dy = me.clientY - dragStartRef.current.y;
        if (Math.abs(dx) + Math.abs(dy) < 4) {
          dragStartRef.current = null;
          setDragPreview(null);
          clearDragTargets();
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          return;
        }
        const dt = dx / zoom;
        const newTime = Math.max(0, dragStartRef.current.startTime + dt);
        const elements = document.elementsFromPoint(me.clientX, me.clientY);
        const trackEl = elements.find(el => el.classList.contains('ve-track-clips')) as HTMLElement | undefined;
        const newTrackId = trackEl?.getAttribute('data-track-id') || trackId;
        if (trackAcceptsClip(trackEl?.dataset.trackType || null, clip.mediaType)) {
          dispatch({ type: 'MOVE_CLIP', payload: { clipId: clip.id, trackId: newTrackId, startTime: newTime } });
        }
      }
      dragStartRef.current = null;
      setDragPreview(null);
      clearDragTargets();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [dispatch, clip.id, clip.mediaType, clip.startTime, isSelected, trackId, zoom, state.activeTool]);

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
    if (clip.mediaType !== 'audio' || !state.showWaveforms) return null;
    const count = Math.max(Math.floor(width / 3), 4);
    return Array.from({ length: count }, (_, i) => {
      const h = 20 + Math.sin(i * 0.7 + clip.startTime * 3) * 30 + Math.random() * 20;
      return <div key={i} className="ve-clip-waveform-bar" style={{ height: `${Math.min(90, h)}%` }} />;
    });
  }, [clip.mediaType, width, clip.startTime, state.showWaveforms]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    try {
      const effectPayload = getDroppedEffect(e.dataTransfer);
      const transitionPayload = getDroppedTransition(e.dataTransfer);
      const mediaPayload = getDroppedMedia(e.dataTransfer, state.project?.mediaPool ?? []);

      if (effectPayload || transitionPayload) {
        e.stopPropagation();
        if (effectPayload) {
          const effectDef = EFFECT_DEFINITIONS.find((def: any) => def.type === effectPayload.effectType);
          if (!effectDef) return;
          dispatch({
            type: 'ADD_EFFECT',
            payload: {
              clipId: clip.id,
              effect: {
                id: `fx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                type: effectDef.type,
                name: effectDef.name,
                category: effectDef.category,
                enabled: true,
                params: JSON.parse(JSON.stringify(effectDef.defaultParams)),
                keyframes: [],
                expanded: true,
              }
            }
          });
          logSuccess('Effect applied', `${effectDef.name} added to "${clip.label || clip.mediaName}"`);
        } else if (transitionPayload) {
          const transitionDef = TRANSITION_DEFINITIONS.find(def => def.type === transitionPayload.transitionType);
          if (!transitionDef) return;
          dispatch({
            type: 'ADD_TRANSITION',
            payload: {
              clipId: clip.id,
              transition: {
                id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                type: transitionDef.type,
                duration: transitionPayload.duration,
                easing: 'ease-in-out',
                edge: 'start'
              }
            }
          });
          logSuccess('Transition applied', `Transition added to "${clip.label || clip.mediaName}"`);
        }
      } else if (mediaPayload) {
        e.stopPropagation();
        const rect = clipRef.current?.getBoundingClientRect();
        const relativeX = rect ? e.clientX - rect.left : 0;
        const startTime = Math.max(0, clip.startTime + relativeX / zoom);
        dispatch({ type: 'ADD_MEDIA_TO_NEW_TRACK', payload: { media: mediaPayload, startTime } });
      }
    } catch (err) {
      console.error('Failed to drop onto clip', err);
    }
  }, [dispatch, logSuccess, state.project?.mediaPool, clip.id, clip.label, clip.mediaName, clip.startTime, zoom]);

  return (
    <div ref={clipRef}
      className={`ve-clip ${isSelected ? 'selected' : ''} ${dragPreview ? 'dragging' : ''} ${dragPreview && !dragPreview.valid ? 'invalid-drop' : ''}`}
      style={{
        left, width,
        opacity: clip.mediaType === 'video' ? clip.opacity : 1,
        cursor: state.activeTool === 'razor' ? 'crosshair' : dragPreview ? 'grabbing' : DRAG_TOOLS.has(state.activeTool) ? 'grab' : 'default',
        transform: dragPreview ? `translate(${dragPreview.dx}px, ${dragPreview.dy}px)` : undefined,
        zIndex: dragPreview ? 80 : undefined,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
      onDrop={handleDrop}>
      <div className="ve-clip-bg" style={{ background: bgColor }} />
      {clip.mediaType === 'audio' && (
        <div className="ve-clip-waveform">{waveformBars}</div>
      )}
      <span className="ve-clip-label">{clip.label || clip.mediaName}</span>
      {dragPreview && (
        <span className="ve-clip-drag-badge">
          {dragPreview.valid ? `${dragPreview.time.toFixed(2)}s` : 'Wrong track'}
        </span>
      )}
      {clip.speed !== 1 && <span className="ve-clip-speed">{clip.speed.toFixed(1)}×</span>}
      {clip.transition && <div className={`ve-clip-transition ${clip.transition.edge}`} />}
      <div className="ve-clip-handle left" onMouseDown={handleTrimStart} />
      <div className="ve-clip-handle right" onMouseDown={handleTrimEnd} />
    </div>
  );
}
