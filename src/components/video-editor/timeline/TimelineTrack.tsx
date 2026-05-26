import { useState } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { Film, Music, Volume2, VolumeX, Headphones, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import TimelineClip from './TimelineClip';
import type { Track } from '../../../engine/video-editor/types';

interface Props {
  track: Track;
  index: number;
  headerOnly?: boolean;
}

export default function TimelineTrack({ track, index: _index, headerOnly }: Props) {
  const { state, dispatch } = useVideoEditor();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(track.name);

  if (headerOnly) {
    return (
      <div className="ve-track-header" style={{ minHeight: track.height, height: track.height }}>
        <div className="ve-track-color" style={{ background: track.color }} />
        <div className="ve-track-type-icon">
          {track.type === 'video' ? <Film size={13} /> : <Music size={13} />}
        </div>
        <div className="ve-track-name" onDoubleClick={() => { setEditing(true); setEditName(track.name); }}>
          {editing ? (
            <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
              onBlur={() => { dispatch({ type: 'RENAME_TRACK', payload: { trackId: track.id, name: editName } }); setEditing(false); }}
              onKeyDown={e => { if (e.key === 'Enter') { dispatch({ type: 'RENAME_TRACK', payload: { trackId: track.id, name: editName } }); setEditing(false); } }} />
          ) : track.name}
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
        </div>
      </div>
    );
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drop-target');
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      
      const mediaItem = JSON.parse(data);

      if ((track.type === 'video' && mediaItem.type === 'audio') ||
          (track.type === 'audio' && mediaItem.type !== 'audio')) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const dropTime = Math.max(0, x / state.timelineZoom);

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
            effects: [],
            transition: null,
            color: '',
            locked: false,
            label: '',
          },
        },
      });
    } catch (err) {
      console.error('Drop failed', err);
    }
  };

  return (
    <div className="ve-track-clips" style={{ height: track.height }}
      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drop-target'); }}
      onDragLeave={e => e.currentTarget.classList.remove('drop-target')}
      onDrop={handleDrop}>
      {track.clips.map(clip => (
        <TimelineClip key={clip.id} clip={clip} trackId={track.id} zoom={state.timelineZoom} />
      ))}
    </div>
  );
}
