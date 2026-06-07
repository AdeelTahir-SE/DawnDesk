import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useVideoEditor } from '../../../engine/video-editor/VideoEditorContext';
import type { Clip, MediaItem, Project, Track } from '../../../engine/video-editor/types';
import { useAppLogger } from '../../../utils/LoggerContext';

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function packageMediaLabel(item: any) {
  return String(item.mediaName ?? item.mediaItem?.name ?? item.clip?.mediaName ?? item.media ?? 'Package media');
}

function packageMediaType(item: any) {
  return String(item.type ?? item.mediaItem?.type ?? item.clip?.mediaType ?? 'image');
}

function mediaMatchesPackageType(media: MediaItem, packageType: string) {
  return media.type === packageType;
}

function calculateDuration(tracks: Track[]) {
  return tracks.reduce((max, track) => {
    const clipMax = track.clips.reduce((inner, clip) => Math.max(inner, clip.startTime + clip.duration), 0);
    const effectMax = (track.effects ?? []).reduce((inner, effect) => Math.max(inner, effect.startTime + effect.duration), 0);
    return Math.max(max, clipMax, effectMax);
  }, 0);
}

function chooseDefaultMedia(items: any[], mediaPool: MediaItem[]) {
  const usedMediaIds = new Set<string>();
  return items.map((item, index) => {
    const wantedPath = String(item.media ?? item.mediaItem?.path ?? item.clip?.path ?? '');
    const wantedId = String(item.mediaId ?? item.mediaItem?.id ?? item.clip?.mediaId ?? '');
    const wantedName = String(item.mediaName ?? item.mediaItem?.name ?? item.clip?.mediaName ?? '');
    const wantedType = packageMediaType(item);
    const compatibleMedia = mediaPool.filter(media => mediaMatchesPackageType(media, wantedType));
    const match = compatibleMedia.find(media => media.path === wantedPath)
      ?? compatibleMedia.find(media => media.id === wantedId)
      ?? compatibleMedia.find(media => media.name === wantedName && !usedMediaIds.has(media.id))
      ?? compatibleMedia.filter(media => !usedMediaIds.has(media.id))[index]
      ?? compatibleMedia[0];
    if (match) usedMediaIds.add(match.id);
    return match?.id ?? '';
  });
}

function buildProjectFromPackage(currentProject: Project, items: any[], mediaByItem: string[], mediaPool: MediaItem[]) {
  const mediaById = new Map(mediaPool.map(media => [media.id, media]));
  const trackMap = new Map<string, Track>();
  const importedClips: Clip[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const media = mediaById.get(mediaByItem[index]);
    if (!media) continue;

    const sourceTrack = item.track ?? {};
    const trackType = media.type === 'audio' ? 'audio' : 'video';
    const sourceTrackId = String(sourceTrack.id ?? `${trackType}-${index}`);
    const trackId = `pkg-${sourceTrackId}`;
    if (!trackMap.has(trackId)) {
      trackMap.set(trackId, {
        id: trackId,
        name: sourceTrack.name || `${trackType === 'audio' ? 'Audio' : 'Video'} Package`,
        type: sourceTrack.type === 'effect' ? 'effect' : trackType,
        clips: [],
        effects: cloneJson(sourceTrack.effects ?? []),
        muted: Boolean(sourceTrack.muted ?? false),
        solo: Boolean(sourceTrack.solo ?? false),
        locked: false,
        visible: sourceTrack.visible ?? true,
        volume: Number(sourceTrack.volume ?? 1),
        height: Number(sourceTrack.height ?? (trackType === 'audio' ? 74 : 86)),
        color: sourceTrack.color || '#38bdf8',
      });
    }

    const sourceClip = item.clip ?? {};
    const clip: Clip = {
      ...cloneJson(sourceClip),
      id: makeId('clip'),
      trackId,
      mediaId: media.id,
      mediaName: media.name,
      mediaType: media.type,
      path: media.path,
      waveformData: media.waveformData ?? [],
      timelineThumbnails: media.timelineThumbnails ?? [],
      startTime: Number(sourceClip.startTime ?? item.transform?.startTime ?? 0),
      duration: Math.max(0.1, Number(sourceClip.duration ?? item.transform?.duration ?? media.duration ?? 5)),
      inPoint: Number(sourceClip.inPoint ?? item.transform?.inPoint ?? media.inPoint ?? 0),
      outPoint: Number(sourceClip.outPoint ?? item.transform?.outPoint ?? media.outPoint ?? media.duration ?? 5),
      speed: Number(sourceClip.speed ?? item.transform?.speed ?? 1),
      reversed: Boolean(sourceClip.reversed ?? item.transform?.reversed ?? false),
      volume: Number(sourceClip.volume ?? item.transform?.volume ?? 1),
      opacity: Number(sourceClip.opacity ?? item.transform?.opacity ?? 1),
      positionX: Number(sourceClip.positionX ?? item.transform?.positionX ?? 0),
      positionY: Number(sourceClip.positionY ?? item.transform?.positionY ?? 0),
      scale: Number(sourceClip.scale ?? item.transform?.scale ?? 1),
      rotation: Number(sourceClip.rotation ?? item.transform?.rotation ?? 0),
      crop: cloneJson(sourceClip.crop ?? item.transform?.crop ?? { left: 0, right: 0, top: 0, bottom: 0 }),
      effects: cloneJson(item.effects ?? sourceClip.effects ?? []),
      transition: cloneJson((item.transitions && item.transitions[0]) ?? sourceClip.transition ?? null),
      color: sourceClip.color ?? '',
      locked: false,
      label: sourceClip.label ?? '',
      blendMode: sourceClip.blendMode ?? item.transform?.blendMode,
      groupId: sourceClip.groupId,
    };
    trackMap.get(trackId)!.clips.push(clip);
    importedClips.push(clip);
  }

  const globals = items[0]?.globals ?? {};
  const importedTracks = Array.from(trackMap.values());
  const importedTimelineEffects = cloneJson(items[0]?.timelineEffects ?? []);
  if (importedTimelineEffects.length > 0) {
    const effectTrackId = makeId('track-effect');
    importedTracks.push({
      id: effectTrackId,
      name: 'Imported Effects',
      type: 'effect',
      clips: [],
      effects: importedTimelineEffects.map((effect: any) => ({ ...effect, id: makeId('effect'), trackId: effectTrackId })),
      muted: false,
      solo: false,
      locked: false,
      visible: true,
      volume: 1,
      height: 64,
      color: '#facc15',
    });
  }

  return {
    project: {
      ...currentProject,
      settings: cloneJson(globals.projectSettings ?? currentProject.settings),
      tracks: importedTracks,
      markers: cloneJson(globals.markers ?? currentProject.markers),
      subtitles: cloneJson(items[0]?.subtitles ?? currentProject.subtitles ?? []),
      notes: globals.notes ?? currentProject.notes,
      modifiedAt: Date.now(),
      duration: calculateDuration(importedTracks),
    },
    globals,
    importedClipCount: importedClips.length,
  };
}

export default function EditPackageImportDialog() {
  const { state, dispatch } = useVideoEditor();
  const { logSuccess, logError } = useAppLogger();
  const pending = state.pendingEditPackage;
  const mediaPool = state.project?.mediaPool ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [mediaByItem, setMediaByItem] = useState<string[]>(() => []);

  const defaultMediaByItem = useMemo(
    () => pending ? chooseDefaultMedia(pending.items, mediaPool) : [],
    [pending, mediaPool]
  );
  const selectedMediaByItem = mediaByItem.length === defaultMediaByItem.length ? mediaByItem : defaultMediaByItem;

  if (!pending || !state.project) return null;

  const setMediaForItem = (index: number, mediaId: string) => {
    const next = [...selectedMediaByItem];
    next[index] = mediaId;
    setMediaByItem(next);
  };

  const close = () => dispatch({ type: 'SET_PENDING_EDIT_PACKAGE', payload: null });

  const apply = () => {
    const missing = pending.items.some((_item, index) => !selectedMediaByItem[index]);
    if (missing) {
      logError('Package import blocked', 'Choose a Media Bin asset for every package row.');
      return;
    }

    const result = buildProjectFromPackage(state.project!, pending.items, selectedMediaByItem, mediaPool);
    if (result.importedClipCount === 0) {
      logError('Package import failed', 'No package rows could be applied to the selected media.');
      return;
    }

    dispatch({
      type: 'APPLY_EDIT_PACKAGE',
      payload: {
        project: result.project,
        colorGrading: result.globals.colorGrading,
        activeTextOverlay: result.globals.activeTextOverlay ?? null,
        masterVolume: result.globals.masterVolume,
        audioEffects: result.globals.audioEffects,
        activeMask: result.globals.activeMask ?? (pending.items[0]?.masks?.[0] ?? null),
      },
    });
    dispatch({ type: 'SET_PENDING_EDIT_PACKAGE', payload: null });
    logSuccess('Edit package imported', `${result.importedClipCount} configured item${result.importedClipCount === 1 ? '' : 's'} applied to selected media.`);
  };

  return createPortal(
    <div className="dd-modal-overlay ve-export-overlay" onClick={close}>
      <div className="dd-modal ve-edit-package-modal" onClick={event => event.stopPropagation()}>
        <div className="dd-modal-header">
          <h3 className="ve-export-title">Map Edit Package Media</h3>
          <button className="dd-icon-btn" onClick={close}><X size={16} /></button>
        </div>
        <div className="dd-modal-body ve-edit-package-body">
          <div className="ve-edit-package-list">
            {pending.items.map((item, index) => {
              const selectedMedia = mediaPool.find(media => media.id === selectedMediaByItem[index]);
              const isActive = activeIndex === index;
              return (
                <button
                  key={`${packageMediaLabel(item)}-${index}`}
                  type="button"
                  className={`ve-edit-package-row ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveIndex(index)}
                >
                  <span className="ve-edit-package-row-index">{index + 1}</span>
                  <span className="ve-edit-package-row-main">
                    <strong>{packageMediaLabel(item)}</strong>
                    <small>{packageMediaType(item)} · {item.effects?.length ?? item.clip?.effects?.length ?? 0} effects · {item.keyframes?.length ?? 0} keyframes</small>
                  </span>
                  <span className="ve-edit-package-row-media">{selectedMedia?.name ?? 'Choose media'}</span>
                </button>
              );
            })}
          </div>
          <div className="ve-edit-package-mapper">
            <div className="ve-panel-section-title">Media Bin asset</div>
            <select
              className="dd-select"
              value={selectedMediaByItem[activeIndex] ?? ''}
              onChange={event => setMediaForItem(activeIndex, event.target.value)}
            >
              <option value="">Choose media...</option>
              {mediaPool
                .filter(media => mediaMatchesPackageType(media, packageMediaType(pending.items[activeIndex])))
                .map(media => (
                <option key={media.id} value={media.id}>
                  {media.name} ({media.type})
                </option>
              ))}
            </select>
            <div className="ve-edit-package-readonly">
              Only the media target is editable here. Effects, transitions, keyframes, masks, text, and timing will be applied exactly from the package.
            </div>
          </div>
        </div>
        <div className="dd-modal-footer">
          <button className="dd-btn-secondary" onClick={close}>Cancel</button>
          <button className="dd-btn-primary" onClick={apply} disabled={mediaPool.length === 0}>Apply Package</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
