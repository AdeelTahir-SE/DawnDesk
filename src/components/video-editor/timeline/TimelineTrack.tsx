import { useState } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { Film, Music, Volume2, VolumeX, Headphones, Lock, Unlock, Eye, EyeOff, Trash2 } from 'lucide-react';
import TimelineClip from './TimelineClip';
import type { MediaItem, Track } from '../../../engine/video-editor/types';
import { getDroppedMedia } from '../dragDrop';

interface Props {
  track: Track;
  index: number;
  headerOnly?: boolean;
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
        style={{ minHeight: track.height, height: track.height }}
        onClick={() => dispatch({ type: 'SELECT_TRACK', payload: track.id })}
      >
        <div className="ve-track-color" style={{ background: track.color }} />
        <div className="ve-track-type-icon">
          {track.type === 'video' ? <Film size={13} /> : <Music size={13} />}
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
      const mediaItem = getDroppedMedia(e.dataTransfer, state.project?.mediaPool ?? []);
      if (!mediaItem) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const dropTime = Math.max(0, x / state.timelineZoom);
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
    <div className="ve-track-clips" style={{ height: track.height }}
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
