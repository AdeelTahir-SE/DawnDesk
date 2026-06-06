import { useRef, useCallback, useMemo, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { CLIP_COLORS, EFFECT_DEFINITIONS, TRANSITION_DEFINITIONS } from '../../../engine/video-editor/constants';
import type { Clip, Effect, VideoEditorState } from '../../../engine/video-editor/types';
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

function resolveTimelineThumbnail(src: string) {
  if (!src) return '';
  return /^(data:|https?:|asset:|blob:)/i.test(src) ? src : convertFileSrc(src);
}

function snapTimelineTime(state: VideoEditorState, time: number, ignoreClipId?: string): number {
  if (!state.snapEnabled && !state.magneticTimeline) return Math.max(0, time);
  const snapDistance = 0.15;
  const candidates: number[] = [state.playheadTime];

  if (state.project) {
    for (const marker of state.project.markers) candidates.push(marker.time);
    for (const track of state.project.tracks) {
      for (const candidateClip of track.clips) {
        if (candidateClip.id === ignoreClipId) continue;
        candidates.push(candidateClip.startTime, candidateClip.startTime + candidateClip.duration);
      }
    }
  }

  const nearest = candidates.reduce(
    (best, candidate) => Math.abs(candidate - time) < Math.abs(best - time) ? candidate : best,
    time
  );

  return Math.abs(nearest - time) <= snapDistance ? Math.max(0, nearest) : Math.max(0, time);
}

const DRAG_TOOLS = new Set(['select', 'ripple', 'roll', 'slip', 'slide']);
const EFFECT_LANE_HEIGHT = 18;
const EFFECT_TYPE_COLORS: Record<string, string> = {
  'zoom-effect': '#22d3ee',
  'text-overlay': '#f97316',
  'gaussian-blur': '#a78bfa',
  'radial-blur': '#8b5cf6',
  'directional-blur': '#6366f1',
  sharpen: '#84cc16',
  'unsharp-mask': '#65a30d',
  'brightness-contrast': '#facc15',
  grayscale: '#94a3b8',
  sepia: '#d97706',
  invert: '#f43f5e',
  'hue-saturation': '#ec4899',
  'chromatic-aberration': '#06b6d4',
  'lens-distortion': '#14b8a6',
  mirror: '#38bdf8',
  vignette: '#64748b',
  'film-grain': '#c084fc',
  glow: '#f59e0b',
  pixelate: '#10b981',
  emboss: '#fb7185',
  'edge-detect': '#e879f9',
};
const EFFECT_COLORS = [
  '#38bdf8',
  '#fb7185',
  '#a3e635',
  '#f59e0b',
  '#818cf8',
  '#2dd4bf',
  '#f472b6',
];
const KEYFRAME_COLORS = [
  '#facc15',
  '#38bdf8',
  '#fb7185',
  '#a3e635',
  '#f97316',
  '#c084fc',
  '#2dd4bf',
  '#f472b6',
];

function effectColor(effect: Effect) {
  if (EFFECT_TYPE_COLORS[effect.type]) return EFFECT_TYPE_COLORS[effect.type];
  let hash = 0;
  for (const char of effect.type) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return EFFECT_COLORS[hash % EFFECT_COLORS.length];
}

function keyframeColor(index: number) {
  return KEYFRAME_COLORS[index % KEYFRAME_COLORS.length];
}

function layoutEffectLanes(clip: Clip) {
  const lanes: number[] = [];
  return clip.effects
    .map(effect => {
      const startOffset = Math.max(0, Math.min(effect.startOffset ?? 0, clip.duration - 0.1));
      const duration = Math.max(0.1, Math.min(effect.duration ?? clip.duration, clip.duration - startOffset));
      return { effect, startOffset, duration, endOffset: startOffset + duration };
    })
    .sort((a, b) => a.startOffset - b.startOffset || a.endOffset - b.endOffset)
    .map(item => {
      const lane = lanes.findIndex(endOffset => item.startOffset >= endOffset);
      const laneIndex = lane >= 0 ? lane : lanes.length;
      lanes[laneIndex] = item.endOffset;
      return { ...item, lane: laneIndex, color: effectColor(item.effect) };
    });
}

export default function TimelineClip({ clip, trackId, zoom }: Props) {
  const { state, dispatch } = useVideoEditor();
  const { logSuccess } = useAppLogger();
  const clipRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; startTime: number; rollEdge?: 'start' | 'end' } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ dx: number; dy: number; valid: boolean; time: number } | null>(null);
  const [trimPreview, setTrimPreview] = useState<{
    edge: 'start' | 'end';
    left: number;
    width: number;
    label: string;
  } | null>(null);
  const isSelected = state.selectedClipIds.includes(clip.id);

  const left = clip.startTime * zoom;
  const width = Math.max(clip.duration * zoom, 4);
  const displayLeft = trimPreview?.left ?? left;
  const displayWidth = trimPreview?.width ?? width;
  const bgColor = CLIP_COLORS[clip.mediaType as keyof typeof CLIP_COLORS] || CLIP_COLORS.video;
  const trackLocked = state.project?.tracks.find(track => track.id === trackId)?.locked ?? false;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const groupIds = clip.groupId
      ? state.project?.tracks.flatMap(track => track.clips.filter(item => item.groupId === clip.groupId).map(item => item.id)) ?? [clip.id]
      : [clip.id];
    if (e.ctrlKey || e.metaKey) {
      dispatch({ type: 'ADD_TO_SELECTION', payload: groupIds });
    } else {
      dispatch({ type: 'SELECT_CLIPS', payload: groupIds });
    }
  }, [dispatch, clip.id, clip.groupId, state.project?.tracks]);

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
    if (clip.locked || trackLocked) return;
    e.preventDefault();
    if (!isSelected) {
      dispatch({ type: 'SELECT_CLIPS', payload: [clip.id] });
    }
    const rect = clipRef.current?.getBoundingClientRect();
    const rollEdge = state.activeTool === 'roll' && rect
      ? (e.clientX - rect.left < rect.width / 2 ? 'start' : 'end')
      : undefined;
    dragStartRef.current = { x: e.clientX, y: e.clientY, startTime: clip.startTime, rollEdge };
    const handleMouseMove = (me: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = me.clientX - dragStartRef.current.x;
      const dy = me.clientY - dragStartRef.current.y;
      const rawTime = Math.max(0, dragStartRef.current.startTime + dx / zoom);
      const newTime = snapTimelineTime(state, rawTime, clip.id);
      const snappedDx = (newTime - dragStartRef.current.startTime) * zoom;
      const elements = document.elementsFromPoint(me.clientX, me.clientY);
      const trackEl = elements.find(el => el.classList.contains('ve-track-clips')) as HTMLElement | undefined;
      const valid = trackAcceptsClip(trackEl?.dataset.trackType || null, clip.mediaType);
      clearDragTargets();
      if (trackEl) trackEl.classList.add(valid ? 'drag-target' : 'drag-invalid');
      setDragPreview({ dx: snappedDx, dy, valid, time: newTime });
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
        const rawTime = Math.max(0, dragStartRef.current.startTime + dt);
        const newTime = snapTimelineTime(state, rawTime, clip.id);
        const elements = document.elementsFromPoint(me.clientX, me.clientY);
        const trackEl = elements.find(el => el.classList.contains('ve-track-clips')) as HTMLElement | undefined;
        const newTrackId = trackEl?.getAttribute('data-track-id') || trackId;
        if (state.activeTool === 'slip') {
          dispatch({ type: 'SLIP_CLIP', payload: { clipId: clip.id, delta: dt } });
        } else if (state.activeTool === 'roll') {
          dispatch({ type: 'ROLL_EDIT_CLIP', payload: { clipId: clip.id, edge: dragStartRef.current.rollEdge ?? 'end', delta: dt } });
        } else if (trackAcceptsClip(trackEl?.dataset.trackType || null, clip.mediaType)) {
          const payload = { clipId: clip.id, trackId: newTrackId, startTime: newTime };
          if (state.selectedClipIds.length > 1 && state.selectedClipIds.includes(clip.id) && newTrackId === trackId && state.activeTool === 'select') {
            dispatch({ type: 'MOVE_SELECTED_CLIPS', payload: { anchorClipId: clip.id, delta: newTime - clip.startTime } });
          } else if (state.activeTool === 'ripple') dispatch({ type: 'RIPPLE_MOVE_CLIP', payload });
          else if (state.activeTool === 'slide') dispatch({ type: 'SLIDE_CLIP', payload });
          else dispatch({ type: 'MOVE_CLIP', payload });
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
  }, [dispatch, clip.id, clip.locked, clip.mediaType, clip.startTime, isSelected, trackId, trackLocked, zoom, state]);

  const handleTrimStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (clip.locked || trackLocked) return;
    const startX = e.clientX;
    const origStart = clip.startTime;
    const origDuration = clip.duration;
    const origInPoint = clip.inPoint;
    let finalStart = origStart;
    let finalInPoint = origInPoint;
    const handleMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dt = dx / zoom;
      const newStart = Math.max(0, origStart + dt);
      const appliedDelta = newStart - origStart;
      const newDuration = origDuration - appliedDelta;
      if (newDuration < 0.1) return;
      finalStart = newStart;
      finalInPoint = Math.max(0, origInPoint + appliedDelta * clip.speed);
      setTrimPreview({
        edge: 'start',
        left: newStart * zoom,
        width: Math.max(newDuration * zoom, 4),
        label: `${newStart.toFixed(2)}s / ${newDuration.toFixed(2)}s`,
      });
    };
    const handleUp = () => {
      if (Math.abs(finalStart - origStart) > 0.001) {
        if (state.selectedClipIds.length > 1 && state.selectedClipIds.includes(clip.id)) {
          dispatch({ type: 'TRIM_SELECTED_CLIPS', payload: { anchorClipId: clip.id, edge: 'start', delta: finalStart - origStart } });
        } else {
          dispatch({ type: 'TRIM_CLIP_START', payload: { clipId: clip.id, newStartTime: finalStart, newInPoint: finalInPoint } });
        }
      }
      setTrimPreview(null);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [dispatch, clip, trackLocked, zoom, state.selectedClipIds]);

  const handleTrimEnd = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (clip.locked || trackLocked) return;
    const startX = e.clientX;
    const origDuration = clip.duration;
    const origOutPoint = clip.outPoint;
    let finalDuration = origDuration;
    let finalOutPoint = origOutPoint;
    const handleMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dt = dx / zoom;
      const newDuration = Math.max(0.1, origDuration + dt);
      finalDuration = newDuration;
      finalOutPoint = Math.max(clip.inPoint + 0.1, origOutPoint + dt * clip.speed);
      setTrimPreview({
        edge: 'end',
        left,
        width: Math.max(newDuration * zoom, 4),
        label: `${newDuration.toFixed(2)}s`,
      });
    };
    const handleUp = () => {
      if (Math.abs(finalDuration - origDuration) > 0.001) {
        if (state.selectedClipIds.length > 1 && state.selectedClipIds.includes(clip.id)) {
          dispatch({ type: 'TRIM_SELECTED_CLIPS', payload: { anchorClipId: clip.id, edge: 'end', delta: finalDuration - origDuration } });
        } else {
          dispatch({ type: 'TRIM_CLIP_END', payload: { clipId: clip.id, newDuration: finalDuration, newOutPoint: finalOutPoint } });
        }
      }
      setTrimPreview(null);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [dispatch, clip, left, trackLocked, zoom, state.selectedClipIds]);

  const waveformBars = useMemo(() => {
    if (clip.mediaType !== 'audio' || !state.showWaveforms) return null;
    const count = Math.max(Math.floor(width / 3), 4);
    const peaks = clip.waveformData ?? [];
    return Array.from({ length: count }, (_, i) => {
      const peak = peaks.length
        ? peaks[Math.min(peaks.length - 1, Math.floor((i / count) * peaks.length))]
        : 0.35 + 0.35 * Math.abs(Math.sin((i + 1) * 0.73 + clip.startTime * 0.37));
      const height = 18 + Math.max(0, Math.min(1, peak)) * 72;
      return <div key={i} className="ve-clip-waveform-bar" style={{ height: `${height}%` }} />;
    });
  }, [clip.mediaType, clip.waveformData, width, clip.startTime, state.showWaveforms]);

  const thumbnailStrip = useMemo(() => {
    if (!state.showThumbnails || clip.mediaType === 'audio') return null;
    const thumbnails = (clip.timelineThumbnails ?? []).filter(item => item.src);
    if (!thumbnails.length) return null;
    const tileCount = Math.max(1, Math.min(8, Math.floor(width / 58) || 1));
    return Array.from({ length: tileCount }, (_, index) => {
      const sourceIndex = thumbnails.length === 1
        ? 0
        : Math.min(thumbnails.length - 1, Math.round((index / Math.max(1, tileCount - 1)) * (thumbnails.length - 1)));
      const thumbnail = thumbnails[sourceIndex];
      return (
        <img
          key={`${thumbnail.time}-${index}`}
          className="ve-clip-thumbnail-frame"
          src={resolveTimelineThumbnail(thumbnail.src)}
          draggable={false}
          alt=""
        />
      );
    });
  }, [clip.mediaType, clip.timelineThumbnails, state.showThumbnails, width]);

  const effectLanes = useMemo(() => layoutEffectLanes(clip), [clip]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    try {
      const effectPayload = getDroppedEffect(e.dataTransfer);
      const transitionPayload = getDroppedTransition(e.dataTransfer);
      const mediaPayload = getDroppedMedia(e.dataTransfer, state.project?.mediaPool ?? []);

      if (effectPayload || transitionPayload) {
        e.stopPropagation();
        if (effectPayload) {
          if (clip.mediaType === 'audio') return;
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
                startOffset: Math.max(0, Math.min(clip.duration - 0.1, (e.clientX - (clipRef.current?.getBoundingClientRect().left ?? e.clientX)) / zoom)),
                duration: Math.min(3, Math.max(0.1, clip.duration - Math.max(0, (e.clientX - (clipRef.current?.getBoundingClientRect().left ?? e.clientX)) / zoom))),
              }
            }
          });
          logSuccess('Effect applied', `${effectDef.name} added to "${clip.label || clip.mediaName}"`);
        } else if (transitionPayload) {
          const transitionDef = TRANSITION_DEFINITIONS.find(def => def.type === transitionPayload.transitionType);
          if (!transitionDef) return;
          const rect = clipRef.current?.getBoundingClientRect();
          const dropX = rect ? e.clientX - rect.left : 0;
          const edge = rect && dropX > rect.width / 2 ? 'end' : 'start';
          dispatch({
            type: 'ADD_TRANSITION',
            payload: {
              clipId: clip.id,
              transition: {
                id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                type: transitionDef.type,
                duration: transitionPayload.duration,
                easing: 'ease-in-out',
                edge
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
      className={`ve-clip ${isSelected ? 'selected' : ''} ${clip.groupId ? 'grouped' : ''} ${dragPreview ? 'dragging' : ''} ${trimPreview ? 'trimming' : ''} ${dragPreview && !dragPreview.valid ? 'invalid-drop' : ''}`}
      data-clip-id={clip.id}
      style={{
        left: displayLeft,
        width: displayWidth,
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
      {thumbnailStrip && <div className="ve-clip-thumbnail-strip">{thumbnailStrip}</div>}
      {clip.mediaType === 'audio' && (
        <div className="ve-clip-waveform">{waveformBars}</div>
      )}
      <span className="ve-clip-label">{clip.label || clip.mediaName}</span>
      {dragPreview && (
        <span className="ve-clip-drag-badge">
          {dragPreview.valid ? `${dragPreview.time.toFixed(2)}s` : 'Wrong track'}
        </span>
      )}
      {trimPreview && (
        <span className={`ve-clip-drag-badge trim ${trimPreview.edge}`}>
          {trimPreview.label}
        </span>
      )}
      {clip.speed !== 1 && <span className="ve-clip-speed">{clip.speed.toFixed(1)}×</span>}
      {clip.transition && <div className={`ve-clip-transition ${clip.transition.edge}`} />}
      <div className="ve-clip-effect-layer" style={{ height: effectLanes.length ? Math.max(EFFECT_LANE_HEIGHT, (Math.max(...effectLanes.map(item => item.lane)) + 1) * EFFECT_LANE_HEIGHT) : 0 }}>
        {effectLanes.map(item => (
          <ClipEffectBar
            key={item.effect.id}
            clip={clip}
            effect={item.effect}
            zoom={zoom}
            lane={item.lane}
            color={item.color}
            startOffset={item.startOffset}
            duration={item.duration}
          />
        ))}
      </div>
      <div className="ve-clip-handle left" onMouseDown={handleTrimStart} />
      <div className="ve-clip-handle right" onMouseDown={handleTrimEnd} />
    </div>
  );
}

function ClipEffectBar({
  clip,
  effect,
  zoom,
  lane,
  color,
  startOffset,
  duration,
}: {
  clip: Clip;
  effect: Effect;
  zoom: number;
  lane: number;
  color: string;
  startOffset: number;
  duration: number;
}) {
  const { state, dispatch } = useVideoEditor();
  const left = startOffset * zoom;
  const width = Math.max(duration * zoom, 10);
  const [effectPreview, setEffectPreview] = useState<{ left: number; width: number; label: string } | null>(null);
  const displayLeft = effectPreview?.left ?? left;
  const displayWidth = effectPreview?.width ?? width;
  const selected = state.selectedEffectId === effect.id && state.selectedClipIds.includes(clip.id);

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch({ type: 'SELECT_CLIPS', payload: [clip.id] });
    dispatch({ type: 'SELECT_EFFECT', payload: effect.id });
    dispatch({ type: 'SET_RIGHT_PANEL', payload: 'effects' });
  };

  const handleMove = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    dispatch({ type: 'SELECT_CLIPS', payload: [clip.id] });
    dispatch({ type: 'SELECT_EFFECT', payload: effect.id });
    dispatch({ type: 'SET_RIGHT_PANEL', payload: 'effects' });
    const startX = event.clientX;
    const originalStart = startOffset;
    let nextStart = originalStart;
    const onMove = (moveEvent: MouseEvent) => {
      const dt = (moveEvent.clientX - startX) / zoom;
      const rawStart = Math.max(0, Math.min(clip.duration - 0.1, originalStart + dt));
      nextStart = Math.max(0, Math.min(clip.duration - 0.1, snapTimelineTime(state, clip.startTime + rawStart, clip.id) - clip.startTime));
      setEffectPreview({
        left: nextStart * zoom,
        width,
        label: `${nextStart.toFixed(2)}s`,
      });
    };
    const onUp = () => {
      if (Math.abs(nextStart - originalStart) > 0.001) {
        dispatch({
          type: 'UPDATE_EFFECT_TIMING',
          payload: { clipId: clip.id, effectId: effect.id, startOffset: nextStart },
        });
      }
      setEffectPreview(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTrimStart = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const startX = event.clientX;
    const originalStart = startOffset;
    const originalDuration = duration;
    let nextStart = originalStart;
    let nextDuration = originalDuration;
    const onMove = (moveEvent: MouseEvent) => {
      const dt = (moveEvent.clientX - startX) / zoom;
      const rawStart = Math.max(0, Math.min(originalStart + originalDuration - 0.1, originalStart + dt));
      nextStart = Math.max(0, Math.min(originalStart + originalDuration - 0.1, snapTimelineTime(state, clip.startTime + rawStart, clip.id) - clip.startTime));
      nextDuration = Math.max(0.1, originalDuration - (nextStart - originalStart));
      setEffectPreview({
        left: nextStart * zoom,
        width: Math.max(nextDuration * zoom, 10),
        label: `${nextStart.toFixed(2)}s / ${nextDuration.toFixed(2)}s`,
      });
    };
    const onUp = () => {
      if (Math.abs(nextStart - originalStart) > 0.001 || Math.abs(nextDuration - originalDuration) > 0.001) {
        dispatch({
          type: 'UPDATE_EFFECT_TIMING',
          payload: { clipId: clip.id, effectId: effect.id, startOffset: nextStart, duration: nextDuration },
        });
      }
      setEffectPreview(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTrimEnd = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const startX = event.clientX;
    const originalDuration = duration;
    let nextDuration = originalDuration;
    const onMove = (moveEvent: MouseEvent) => {
      const dt = (moveEvent.clientX - startX) / zoom;
      const rawDuration = Math.max(0.1, Math.min(clip.duration - startOffset, originalDuration + dt));
      const snappedEnd = snapTimelineTime(state, clip.startTime + startOffset + rawDuration, clip.id) - clip.startTime;
      nextDuration = Math.max(0.1, Math.min(clip.duration - startOffset, snappedEnd - startOffset));
      setEffectPreview({
        left,
        width: Math.max(nextDuration * zoom, 10),
        label: `${nextDuration.toFixed(2)}s`,
      });
    };
    const onUp = () => {
      if (Math.abs(nextDuration - originalDuration) > 0.001) {
        dispatch({
          type: 'UPDATE_EFFECT_TIMING',
          payload: { clipId: clip.id, effectId: effect.id, duration: nextDuration },
        });
      }
      setEffectPreview(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleKeyframeDrag = (event: React.MouseEvent, keyframeId: string) => {
    event.stopPropagation();
    event.preventDefault();
    const startX = event.clientX;
    const original = effect.keyframes.find(keyframe => keyframe.id === keyframeId);
    if (!original) return;
    let nextTime = original.time;
    const onMove = (moveEvent: MouseEvent) => {
      const dt = (moveEvent.clientX - startX) / zoom;
      nextTime = Math.max(0, Math.min(duration, original.time + dt));
      setEffectPreview({
        left: displayLeft,
        width: displayWidth,
        label: `KF ${nextTime.toFixed(2)}s`,
      });
    };
    const onUp = () => {
      if (Math.abs(nextTime - original.time) > 0.001) {
        dispatch({
          type: 'UPDATE_EFFECT_KEYFRAME',
          payload: { clipId: clip.id, effectId: effect.id, keyframeId, updates: { time: nextTime } },
        });
      }
      setEffectPreview(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      className={`ve-clip-effect-bar ${selected ? 'selected' : ''} ${effectPreview ? 'dragging' : ''} ${!effect.enabled ? 'disabled' : ''}`}
      style={{ left: displayLeft, width: displayWidth, top: lane * EFFECT_LANE_HEIGHT, backgroundColor: color }}
      onClick={handleClick}
      onMouseDown={handleMove}
      title={`${effect.name}: ${startOffset.toFixed(2)}s - ${(startOffset + duration).toFixed(2)}s`}
    >
      <span>{effect.name}</span>
      {effectPreview && <b className="ve-clip-effect-badge">{effectPreview.label}</b>}
      {state.showKeyframes && effect.keyframes.map((keyframe, index) => (
        <i
          key={keyframe.id}
          className="ve-clip-effect-keyframe"
          style={{
            left: `${Math.max(0, Math.min(100, (keyframe.time / Math.max(0.1, duration)) * 100))}%`,
            backgroundColor: keyframeColor(index),
            boxShadow: `0 0 0 1px rgba(0,0,0,0.28), 0 0 5px ${keyframeColor(index)}66`,
          }}
          onMouseDown={event => handleKeyframeDrag(event, keyframe.id)}
          title={`${keyframe.property} at ${keyframe.time.toFixed(2)}s`}
        />
      ))}
      <div className="ve-clip-effect-handle left" onMouseDown={handleTrimStart} />
      <div className="ve-clip-effect-handle right" onMouseDown={handleTrimEnd} />
    </div>
  );
}
