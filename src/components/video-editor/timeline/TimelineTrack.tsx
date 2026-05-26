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

export default function TimelineTrack({ track, index, headerOnly }: Props) {
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

  return (
    <div className="ve-track-clips" style={{ height: track.height }}
      onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drop-target'); }}
      onDragLeave={e => e.currentTarget.classList.remove('drop-target')}
      onDrop={e => { e.currentTarget.classList.remove('drop-target'); }}>
      {track.clips.map(clip => (
        <TimelineClip key={clip.id} clip={clip} trackId={track.id} zoom={state.timelineZoom} />
      ))}
    </div>
  );
}
