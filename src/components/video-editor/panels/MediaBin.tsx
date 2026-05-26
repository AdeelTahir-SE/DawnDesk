import { useState, useMemo } from 'react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import { Search, Plus, Grid3X3, List, Film, Music, Image, X } from 'lucide-react';
import type { MediaItem } from '../../../engine/video-editor/types';

const DEMO_MEDIA: MediaItem[] = [
  { id: 'demo-1', name: 'Intro_Sequence.mp4', path: '', type: 'video', duration: 12.5, width: 1920, height: 1080, fps: 30, codec: 'H.264', fileSize: 45000000, thumbnail: '', waveformData: [], dateAdded: Date.now(), rating: 4, flag: 'none', tags: [], inPoint: 0, outPoint: 12.5, folderId: null },
  { id: 'demo-2', name: 'Interview_B-Roll.mp4', path: '', type: 'video', duration: 45.2, width: 3840, height: 2160, fps: 24, codec: 'H.265', fileSize: 120000000, thumbnail: '', waveformData: [], dateAdded: Date.now(), rating: 3, flag: 'green', tags: [], inPoint: 0, outPoint: 45.2, folderId: null },
  { id: 'demo-3', name: 'Background_Music.mp3', path: '', type: 'audio', duration: 180, width: 0, height: 0, fps: 0, codec: 'MP3', fileSize: 5000000, thumbnail: '', waveformData: [], dateAdded: Date.now(), rating: 5, flag: 'none', tags: [], inPoint: 0, outPoint: 180, folderId: null },
  { id: 'demo-4', name: 'Logo_Reveal.mp4', path: '', type: 'video', duration: 5.0, width: 1920, height: 1080, fps: 60, codec: 'ProRes', fileSize: 80000000, thumbnail: '', waveformData: [], dateAdded: Date.now(), rating: 0, flag: 'blue', tags: [], inPoint: 0, outPoint: 5.0, folderId: null },
  { id: 'demo-5', name: 'SFX_Whoosh.wav', path: '', type: 'audio', duration: 1.2, width: 0, height: 0, fps: 0, codec: 'WAV', fileSize: 200000, thumbnail: '', waveformData: [], dateAdded: Date.now(), rating: 0, flag: 'none', tags: [], inPoint: 0, outPoint: 1.2, folderId: null },
  { id: 'demo-6', name: 'Sunset_Timelapse.mp4', path: '', type: 'video', duration: 30.0, width: 3840, height: 2160, fps: 30, codec: 'H.264', fileSize: 95000000, thumbnail: '', waveformData: [], dateAdded: Date.now(), rating: 5, flag: 'yellow', tags: [], inPoint: 0, outPoint: 30.0, folderId: null },
  { id: 'demo-7', name: 'Title_Card.png', path: '', type: 'image', duration: 0, width: 1920, height: 1080, fps: 0, codec: 'PNG', fileSize: 2000000, thumbnail: '', waveformData: [], dateAdded: Date.now(), rating: 0, flag: 'none', tags: [], inPoint: 0, outPoint: 5, folderId: null },
  { id: 'demo-8', name: 'Voiceover_Take3.wav', path: '', type: 'audio', duration: 62.5, width: 0, height: 0, fps: 0, codec: 'WAV', fileSize: 12000000, thumbnail: '', waveformData: [], dateAdded: Date.now(), rating: 4, flag: 'purple', tags: [], inPoint: 0, outPoint: 62.5, folderId: null },
];

const typeIcons: Record<string, React.ElementType> = { video: Film, audio: Music, image: Image };

function formatDuration(sec: number): string {
  if (sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

function formatSize(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

const flagColors: Record<string, string> = {
  red: '#ef4444', orange: '#f97316', yellow: '#FACC15',
  green: '#22c55e', blue: '#3b82f6', purple: '#a855f7',
};

export default function MediaBin() {
  const { state, dispatch } = useVideoEditor();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const media = state.project?.mediaPool.length ? state.project.mediaPool : DEMO_MEDIA;

  const filtered = useMemo(() => {
    if (!search) return media;
    const q = search.toLowerCase();
    return media.filter(m => m.name.toLowerCase().includes(q) || m.type.includes(q) || m.codec.toLowerCase().includes(q));
  }, [media, search]);

  const handleDragStart = (e: React.DragEvent, item: MediaItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddToTimeline = (item: MediaItem) => {
    if (!state.project) return;
    const targetTrack = state.project.tracks.find(t =>
      (item.type === 'audio' && t.type === 'audio') || (item.type !== 'audio' && t.type === 'video')
    );
    if (!targetTrack) return;
    const lastEnd = targetTrack.clips.reduce((max, c) => Math.max(max, c.startTime + c.duration), 0);
    dispatch({
      type: 'ADD_CLIP',
      payload: {
        trackId: targetTrack.id,
        clip: {
          id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          trackId: targetTrack.id, mediaId: item.id, mediaName: item.name, mediaType: item.type,
          startTime: lastEnd, duration: item.duration || 5, inPoint: item.inPoint, outPoint: item.outPoint,
          speed: 1, reversed: false, volume: 1, opacity: 1,
          effects: [], transition: null, color: '', locked: false, label: '',
        },
      },
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search media..."
            className="ve-number-input" style={{ width: '100%', paddingLeft: 26, textAlign: 'left', borderRadius: 6 }} />
          {search && <button style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} onClick={() => setSearch('')}><X size={10} /></button>}
        </div>
        <button className={`ve-tool-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid3X3 size={13} /></button>
        <button className={`ve-tool-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={13} /></button>
      </div>

      <button className="ve-tool-btn" style={{ width: '100%', height: 32, borderRadius: 6, border: '1px dashed rgba(255,255,255,0.15)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
        <Plus size={14} /> Import Media
      </button>

      {viewMode === 'grid' ? (
        <div className="ve-media-grid">
          {filtered.map(item => {
            const Icon = typeIcons[item.type] || Film;
            return (
              <div key={item.id} className={`ve-media-item ${state.selectedMediaIds.includes(item.id) ? 'selected' : ''}`}
                onClick={() => dispatch({ type: 'SELECT_MEDIA', payload: [item.id] })}
                onDoubleClick={() => handleAddToTimeline(item)}
                draggable onDragStart={e => handleDragStart(e, item)}>
                <div className="ve-media-thumb">
                  <Icon size={20} />
                  {item.duration > 0 && <span className="ve-media-duration">{formatDuration(item.duration)}</span>}
                  {item.flag !== 'none' && (
                    <span style={{ position: 'absolute', top: 3, left: 3, width: 6, height: 6, borderRadius: '50%', background: flagColors[item.flag] || 'transparent' }} />
                  )}
                </div>
                <div className="ve-media-name">{item.name}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(item => {
            const Icon = typeIcons[item.type] || Film;
            return (
              <div key={item.id} className={`ve-media-list-item ${state.selectedMediaIds.includes(item.id) ? 'selected' : ''}`}
                onClick={() => dispatch({ type: 'SELECT_MEDIA', payload: [item.id] })}
                onDoubleClick={() => handleAddToTimeline(item)}
                draggable onDragStart={e => handleDragStart(e, item)}>
                <Icon size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'JetBrains Mono' }}>{formatDuration(item.duration)}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{formatSize(item.fileSize)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
