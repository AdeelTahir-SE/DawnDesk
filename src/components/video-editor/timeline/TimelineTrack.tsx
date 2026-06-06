import { useState } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { Film, Music, Sparkles, Volume2, VolumeX, Headphones, Lock, Unlock, Eye, EyeOff, Trash2 } from 'lucide-react';
import TimelineClip from './TimelineClip';
import type { MediaItem, Track } from '../../../engine/video-editor/types';
import { getDroppedEffect, getDroppedMedia } from '../dragDrop';
import { EFFECT_DEFINITIONS } from '../../../engine/video-editor/constants';

interface Props {
  track: Track;
  index: number;
  headerOnly?: boolean;
}

const EFFECT_LANE_HEIGHT = 18;
const EFFECT_LANE_TOP = 24;
const TRACK_VERTICAL_PADDING = 10;

function effectLaneCountForClip(clip: Track['clips'][number]) {
  const lanes: number[] = [];
  for (const effect of [...clip.effects].sort((a, b) => (a.startOffset ?? 0) - (b.startOffset ?? 0))) {
    const start = Math.max(0, Math.min(effect.startOffset ?? 0, clip.duration - 0.1));
    const duration = Math.max(0.1, Math.min(effect.duration ?? clip.duration, clip.duration - start));
    const end = start + duration;
    const lane = lanes.findIndex(laneEnd => start >= laneEnd);
    const laneIndex = lane >= 0 ? lane : lanes.length;
    lanes[laneIndex] = end;
  }
  return Math.max(0, lanes.length);
}

export function getTimelineTrackDisplayHeight(track: Track) {
  if (track.type === 'audio') return track.height;
  const maxEffectLanes = Math.max(0, ...track.clips.map(effectLaneCountForClip));
  if (maxEffectLanes === 0) return track.height;
  return Math.max(track.height, EFFECT_LANE_TOP + maxEffectLanes * EFFECT_LANE_HEIGHT + TRACK_VERTICAL_PADDING);
}

function trackAcceptsMedia(track: Track, mediaType: MediaItem['type']) {
  return track.type === mediaType || (track.type === 'video' && mediaType === 'image');
}

function clipOverlaps(track: Track, startTime: number, duration: number) {
  const endTime = startTime + duration;
  return track.clips.some(clip =>
    startTime < clip.startTime + clip.duration &&
    endTime > clip.startTime
  );
}

export default function TimelineTrack({ track, index: _index, headerOnly }: Props) {
  const { state, dispatch } = useVideoEditor();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(track.name);
  const displayHeight = getTimelineTrackDisplayHeight(track);

  const handleDeleteTrack = () => {
    if (track.clips.length > 0) {
      const confirmed = window.confirm(`Delete "${track.name}" and its ${track.clips.length} clip${track.clips.length === 1 ? '' : 's'}?`);
      if (!confirmed) return;
    }
    dispatch({ type: 'REMOVE_TRACK', payload: track.id });
  };

  if (headerOnly) {
    return (
      <div
        className={`ve-track-header ${state.selectedTrackId === track.id ? 'selected' : ''}`}
        style={{ minHeight: displayHeight, height: displayHeight }}
        onClick={() => dispatch({ type: 'SELECT_TRACK', payload: track.id })}
      >
        <div className="ve-track-color" style={{ background: track.color }} />
        <div className="ve-track-type-icon">
          {track.type === 'video' ? <Film size={13} /> : track.type === 'audio' ? <Music size={13} /> : <Sparkles size={13} />}
        </div>
        <div className="ve-track-name" onDoubleClick={() => { setEditing(true); setEditName(track.name); }}>
          {editing ? (
            <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
              onBlur={() => { dispatch({ type: 'RENAME_TRACK', payload: { trackId: track.id, name: editName } }); setEditing(false); }}
              onKeyDown={e => { if (e.key === 'Enter') { dispatch({ type: 'RENAME_TRACK', payload: { trackId: track.id, name: editName } }); setEditing(false); } }} />
          ) : (
            <>
              <span>{track.name}</span>
              {state.selectedTrackId === track.id && <span className="ve-track-selected-pill">Target</span>}
            </>
          )}
        </div>
        <div className="ve-track-controls">
          <button className={`ve-track-control-btn ${track.muted ? 'muted' : ''}`}
            onClick={() => dispatch({ type: 'TOGGLE_TRACK_MUTE', payload: track.id })}
            title={track.muted ? 'Unmute' : 'Mute'}>
            {track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
          <button className={`ve-track-control-btn ${track.solo ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'TOGGLE_TRACK_SOLO', payload: track.id })}
            title={track.solo ? 'Unsolo' : 'Solo'}>
            <Headphones size={12} />
          </button>
          <button className={`ve-track-control-btn ${track.locked ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'TOGGLE_TRACK_LOCK', payload: track.id })}
            title={track.locked ? 'Unlock' : 'Lock'}>
            {track.locked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
          {track.type === 'video' && (
            <button className={`ve-track-control-btn ${!track.visible ? 'muted' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_TRACK_VISIBILITY', payload: track.id })}
              title={track.visible ? 'Hide' : 'Show'}>
              {track.visible ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
          )}
          <button className="ve-track-control-btn danger"
            onClick={handleDeleteTrack}
            title={track.clips.length > 0 ? 'Delete track and clips' : 'Delete track'}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drop-target');
    
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const dropTime = Math.max(0, x / state.timelineZoom);

      const effectPayload = getDroppedEffect(e.dataTransfer);
      if (effectPayload && track.type !== 'effect' && !track.locked) {
        const effectDef = EFFECT_DEFINITIONS.find(def => def.type === effectPayload.effectType);
        if (!effectDef) return;
        const targetClip = track.clips.find(clip => dropTime >= clip.startTime && dropTime < clip.startTime + clip.duration);
        if (!targetClip || targetClip.mediaType === 'audio') return;
        const startOffset = Math.max(0, dropTime - targetClip.startTime);
        dispatch({
          type: 'ADD_EFFECT',
          payload: {
            clipId: targetClip.id,
            effect: {
              id: `fx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: effectDef.type,
              name: effectDef.name,
              category: effectDef.category,
              enabled: true,
              params: JSON.parse(JSON.stringify(effectDef.defaultParams)),
              keyframes: [],
              expanded: true,
              startOffset,
              duration: Math.min(3, Math.max(0.1, targetClip.duration - startOffset)),
            },
          },
        });
        return;
      }

      const mediaItem = getDroppedMedia(e.dataTransfer, state.project?.mediaPool ?? []);
      if (!mediaItem) return;
      const duration = mediaItem.duration || mediaItem.outPoint || 5;

      if (!trackAcceptsMedia(track, mediaItem.type) || track.locked || clipOverlaps(track, dropTime, duration)) {
        dispatch({ type: 'ADD_MEDIA_TO_NEW_TRACK', payload: { media: mediaItem, startTime: dropTime } });
        return;
      }

      dispatch({
        type: 'ADD_CLIP',
        payload: {
          trackId: track.id,
          clip: {
            id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            trackId: track.id,
            mediaId: mediaItem.id,
            mediaName: mediaItem.name,
            mediaType: mediaItem.type,
            startTime: dropTime,
            duration: mediaItem.duration || 5,
            inPoint: mediaItem.inPoint || 0,
            outPoint: mediaItem.outPoint || mediaItem.duration || 5,
            speed: 1,
            reversed: false,
            volume: 1,
            opacity: 1,
            positionX: 0,
            positionY: 0,
            scale: 1,
            rotation: 0,
            effects: [],
            transition: null,
            color: '',
            locked: false,
            label: '',
            path: mediaItem.path,
          },
        },
      });
    } catch (err) {
      console.error('Drop failed', err);
    }
  };

  return (
    <div className="ve-track-clips" style={{ height: displayHeight }}
      data-track-id={track.id}
      data-track-type={track.type}
      onClick={() => dispatch({ type: 'SELECT_TRACK', payload: track.id })}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; e.currentTarget.classList.add('drop-target'); }}
      onDragLeave={e => e.currentTarget.classList.remove('drop-target')}
      onDrop={handleDrop}>
      {track.clips.map(clip => (
        <TimelineClip key={clip.id} clip={clip} trackId={track.id} zoom={state.timelineZoom} />
      ))}
    </div>
  );
}
