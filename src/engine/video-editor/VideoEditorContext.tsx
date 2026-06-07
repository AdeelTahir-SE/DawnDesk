// ═══════════════════════════════════════════════════════════════════════════
// DawnDesk Video Editor — Context & Reducer
// ═══════════════════════════════════════════════════════════════════════════

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  VideoEditorState,
  VideoEditorAction,
  Track,
  Clip,
  Keyframe,
  TimelineEffect,
  MediaItem,
  HistorySnapshot,
  Project,
  ProjectSettings,
} from './types';
import {
  DEFAULT_COLOR_GRADING,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_VIDEO_TRACK_HEIGHT,
  DEFAULT_AUDIO_TRACK_HEIGHT,
  EFFECT_DEFINITIONS,
  TIMELINE_DEFAULT_ZOOM,
  TRACK_COLORS,
  TRANSITION_DEFINITIONS,
} from './constants';

/* ── Constants ─────────────────────────────────────────────────────────── */

const MAX_HISTORY = 50;
/* ── Helpers ───────────────────────────────────────────────────────────── */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createSnapshot(state: VideoEditorState): HistorySnapshot {
  return {
    tracks: JSON.parse(JSON.stringify(state.project?.tracks ?? [])),
    markers: JSON.parse(JSON.stringify(state.project?.markers ?? [])),
    subtitles: JSON.parse(JSON.stringify(state.project?.subtitles ?? [])),
    mediaPool: JSON.parse(JSON.stringify(state.project?.mediaPool ?? [])),
    selectedClipIds: [...state.selectedClipIds],
    playheadTime: state.playheadTime,
  };
}

function pushHistory(state: VideoEditorState, label: string, group?: string): VideoEditorState {
  return { ...state, _historyLabel: label, _historyGroup: group };
}

function applySnapshot(state: VideoEditorState, snapshot: HistorySnapshot): VideoEditorState {
  if (!state.project) return state;
  return {
    ...state,
    project: {
      ...state.project,
      tracks: JSON.parse(JSON.stringify(snapshot.tracks)),
      markers: JSON.parse(JSON.stringify(snapshot.markers)),
      subtitles: JSON.parse(JSON.stringify(snapshot.subtitles ?? [])),
      mediaPool: JSON.parse(JSON.stringify(snapshot.mediaPool ?? [])),
    },
    selectedClipIds: [...snapshot.selectedClipIds],
    playheadTime: snapshot.playheadTime,
  };
}

function findClipInTracks(tracks: Track[], clipId: string): { track: Track; clip: Clip; clipIndex: number; trackIndex: number } | null {
  for (let ti = 0; ti < tracks.length; ti++) {
    const track = tracks[ti];
    for (let ci = 0; ci < track.clips.length; ci++) {
      if (track.clips[ci].id === clipId) {
        return { track, clip: track.clips[ci], clipIndex: ci, trackIndex: ti };
      }
    }
  }
  return null;
}

function updateClipInTracks(tracks: Track[], clipId: string, updater: (clip: Clip) => Clip): Track[] {
  return tracks.map(track => ({
    ...track,
    clips: track.clips.map(clip => clip.id === clipId ? updater(clip) : clip),
  }));
}

function calculateProjectDuration(tracks: Track[]): number {
  let max = 0;
  for (const track of tracks) {
    for (const clip of track.clips) {
      const end = clip.startTime + clip.duration;
      if (end > max) max = end;
    }
    for (const effect of track.effects ?? []) {
      const end = effect.startTime + effect.duration;
      if (end > max) max = end;
    }
  }
  return max;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hasOverlap(track: Track, clip: Clip, startTime: number): boolean {
  const endTime = startTime + clip.duration;
  return track.clips.some(other =>
    other.id !== clip.id &&
    startTime < other.startTime + other.duration &&
    endTime > other.startTime
  );
}

function hasOverlapExcluding(track: Track, clip: Clip, ignoredIds: Set<string>): boolean {
  const endTime = clip.startTime + clip.duration;
  return track.clips.some(other =>
    !ignoredIds.has(other.id) &&
    clip.startTime < other.startTime + other.duration &&
    endTime > other.startTime
  );
}

function snapTime(state: VideoEditorState, time: number, ignoreClipId?: string): number {
  if (!state.snapEnabled && !state.magneticTimeline) return Math.max(0, time);
  const snapDistance = 0.15;
  const candidates: number[] = [state.playheadTime];

  if (state.project) {
    for (const marker of state.project.markers) candidates.push(marker.time);
    for (const track of state.project.tracks) {
      for (const clip of track.clips) {
        if (clip.id === ignoreClipId) continue;
        candidates.push(clip.startTime, clip.startTime + clip.duration);
      }
    }
  }

  const nearest = candidates.reduce(
    (best, candidate) => Math.abs(candidate - time) < Math.abs(best - time) ? candidate : best,
    time
  );

  return Math.abs(nearest - time) <= snapDistance ? Math.max(0, nearest) : Math.max(0, time);
}

function trackAcceptsMedia(track: Track, mediaType: MediaItem['type']): boolean {
  return track.type === mediaType || (track.type === 'video' && mediaType === 'image');
}

function findTimelineEffectInTracks(tracks: Track[], effectId: string): { track: Track; effect: TimelineEffect } | null {
  for (const track of tracks) {
    const effect = (track.effects ?? []).find(item => item.id === effectId);
    if (effect) return { track, effect };
  }
  return null;
}

function updateTimelineEffectInTracks(
  tracks: Track[],
  effectId: string,
  updater: (effect: TimelineEffect) => TimelineEffect
): Track[] {
  return tracks.map(track => ({
    ...track,
    effects: (track.effects ?? []).map(effect => effect.id === effectId ? updater(effect) : effect),
  }));
}

function createClipFromMedia(media: MediaItem, trackId: string, startTime: number): Clip {
  const fallbackDuration = media.type === 'image' ? 5 : 0.1;
  const duration = Math.max(0.1, media.duration || media.outPoint || fallbackDuration);
  return {
    id: generateId(),
    trackId,
    mediaId: media.id,
    mediaName: media.name,
    mediaType: media.type,
    startTime: Math.max(0, startTime),
    duration,
    inPoint: media.inPoint || 0,
    outPoint: media.outPoint || duration,
    speed: 1,
    reversed: false,
    volume: 1,
    opacity: 1,
    positionX: 0,
    positionY: 0,
    scale: 1,
    rotation: 0,
    crop: { left: 0, right: 0, top: 0, bottom: 0 },
    effects: [],
    transition: null,
    color: '',
    locked: false,
    label: '',
    path: media.path,
    waveformData: media.waveformData ?? [],
    timelineThumbnails: (media.timelineThumbnails ?? [])
      .filter(thumbnail => thumbnail.time >= (media.inPoint || 0) && thumbnail.time <= (media.outPoint || duration))
      .slice(0, 8),
  };
}

function createEffect(effectType: string): Clip['effects'][number] | null {
  const definition = EFFECT_DEFINITIONS.find(effect => effect.type === effectType);
  if (!definition) return null;
  return {
    id: `fx-${generateId()}`,
    type: definition.type,
    name: definition.name,
    category: definition.category,
    enabled: true,
    params: JSON.parse(JSON.stringify(definition.defaultParams)),
    keyframes: [],
    expanded: false,
  };
}

function applyAutoTrim(tracks: Track[], targetIds: Set<string>): Track[] {
  return tracks.map(track => {
    let cursor = 0;
    const clips = [...track.clips]
      .sort((a, b) => a.startTime - b.startTime)
      .map(clip => {
        if (!targetIds.has(clip.id) || clip.locked || track.locked) {
          cursor = Math.max(cursor, clip.startTime + clip.duration);
          return clip;
        }

        const trimAmount = clip.duration > 3 ? 0.12 : clip.duration > 1.5 ? 0.06 : 0;
        const newDuration = Math.max(0.35, clip.duration - trimAmount);
        const trimmedClip = {
          ...clip,
          startTime: cursor,
          duration: newDuration,
          outPoint: Math.max(clip.inPoint + 0.1, clip.outPoint - trimAmount * clip.speed),
        };
        cursor = trimmedClip.startTime + trimmedClip.duration;
        return trimmedClip;
      });

    return { ...track, clips };
  });
}

function applyAutoTransitions(tracks: Track[], targetIds: Set<string>): Track[] {
  const transitionDef = TRANSITION_DEFINITIONS.find(transition => transition.type === 'cross-dissolve');
  if (!transitionDef) return tracks;

  return tracks.map(track => {
    if (track.type !== 'video') return track;
    const sortedIds = [...track.clips].sort((a, b) => a.startTime - b.startTime).map(clip => clip.id);
    return {
      ...track,
      clips: track.clips.map(clip => {
        if (!targetIds.has(clip.id) || clip.locked || track.locked || clip.mediaType === 'audio') return clip;
        const index = sortedIds.indexOf(clip.id);
        if (index <= 0 && clip.duration < 1) return clip;
        return {
          ...clip,
          transition: {
            id: `tr-${generateId()}`,
            type: transitionDef.type,
            duration: Math.min(0.6, Math.max(0.25, clip.duration * 0.18)),
            easing: 'ease-in-out',
            edge: index === 0 ? 'end' : 'start',
          },
        };
      }),
    };
  });
}

function applyVisualPolish(tracks: Track[], targetIds: Set<string>): Track[] {
  return tracks.map(track => ({
    ...track,
    clips: track.clips.map(clip => {
      if (!targetIds.has(clip.id) || clip.locked || track.locked || clip.mediaType === 'audio') return clip;
      const existingTypes = new Set(clip.effects.map(effect => effect.type));
      const additions = ['brightness-contrast', 'sharpen']
        .filter(type => !existingTypes.has(type))
        .map(type => createEffect(type))
        .filter((effect): effect is Clip['effects'][number] => Boolean(effect));
      return {
        ...clip,
        opacity: Math.max(clip.opacity ?? 1, 1),
        effects: [...clip.effects, ...additions],
      };
    }),
  }));
}

function applyAudioBalance(tracks: Track[], targetIds: Set<string>): Track[] {
  return tracks.map(track => ({
    ...track,
    volume: track.type === 'audio' ? Math.min(1, Math.max(0.75, track.volume)) : track.volume,
    clips: track.clips.map(clip => {
      if (!targetIds.has(clip.id) || clip.locked || track.locked) return clip;
      if (clip.mediaType !== 'audio' && track.type !== 'audio') return clip;
      return { ...clip, volume: 1 };
    }),
  }));
}

export function createVideoProject(settings: ProjectSettings): Project {
  return {
    id: generateId(),
    name: settings.name,
    settings: { ...settings },
    tracks: [],
    mediaPool: [],
    mediaFolders: [],
    markers: [],
    subtitles: [],
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    duration: 0,
    notes: '',
  };
}

/* ── Initial State ─────────────────────────────────────────────────────── */

export const initialState: VideoEditorState = {
  // Project
  project: null,
  projectPath: null,
  isDirty: false,

  // Playback
  playheadTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  isLooping: false,
  inPoint: null,
  outPoint: null,

  // Tools
  activeTool: 'select',
  snapEnabled: true,
  magneticTimeline: true,

  // Selection
  selectedClipIds: [],
  selectedTrackId: null,
  selectedMediaIds: [],
  selectedEffectId: null,
  selectedTimelineEffectId: null,

  // View
  timelineZoom: TIMELINE_DEFAULT_ZOOM,
  timelineScrollX: 0,
  timelineScrollY: 0,
  previewZoom: 1,
  showSafeZones: false,

  // Panels
  activeRightPanel: 'properties',
  leftPanelTab: 'media',
  leftPanelOpen: true,
  rightPanelOpen: true,
  scopeType: 'waveform',

  // Color grading
  colorGrading: { ...DEFAULT_COLOR_GRADING },

  // Text
  activeTextOverlay: null,
  masterVolume: 1.0,
  audioEffects: {
    eq: {
      enabled: false,
      bands: [
        { frequency: 60, gain: 0, q: 1 },
        { frequency: 250, gain: 0, q: 1 },
        { frequency: 1000, gain: 0, q: 1 },
        { frequency: 4000, gain: 0, q: 1 },
        { frequency: 16000, gain: 0, q: 1 },
      ]
    },
    compressor: { enabled: false, threshold: -20, ratio: 4, attack: 10, release: 100, makeupGain: 0 },
    reverb: { enabled: false, mix: 0, decay: 1.5, preDelay: 20 },
    noise: { enabled: false, reduction: -40, threshold: -40 },
  },

  // Mask
  activeMask: null,

  // Export
  exportSettings: { ...DEFAULT_EXPORT_SETTINGS },
  renderQueue: [],
  showExportDialog: false,
  isExporting: false,
  exportProgress: 0,
  exportError: null,

  // FFmpeg
  ffmpegStatus: { available: false, error: null },

  // History
  history: [],
  historyIndex: -1,

  // UI
  showKeyframes: false,
  showWaveforms: true,
  showThumbnails: true,
  isImporting: false,
  contextMenu: null,
  clipboard: [],
  showProjectSettings: false,
  showNewProjectModal: false,
  pendingEditPackage: null,
};

/* ── Reducer ───────────────────────────────────────────────────────────── */

function baseReducer(state: VideoEditorState, action: VideoEditorAction): VideoEditorState {
  switch (action.type) {

    // ── Project ─────────────────────────────────────────────────────────
    case 'NEW_PROJECT': {
      const { project: newProject, projectPath = null } = action.payload;
      return {
        ...initialState,
        ffmpegStatus: state.ffmpegStatus,
        project: newProject,
        projectPath,
        isDirty: false,
        history: [],
        historyIndex: -1,
        showNewProjectModal: false,
      };
    }

    case 'LOAD_PROJECT':
      return {
        ...initialState,
        ffmpegStatus: state.ffmpegStatus,
        project: action.payload,
        isDirty: false,
        history: [],
        historyIndex: -1,
      };

    case 'APPLY_EDIT_PACKAGE':
      return {
        ...state,
        project: action.payload.project,
        colorGrading: action.payload.colorGrading ?? state.colorGrading,
        activeTextOverlay: action.payload.activeTextOverlay ?? state.activeTextOverlay,
        masterVolume: action.payload.masterVolume ?? state.masterVolume,
        audioEffects: action.payload.audioEffects ?? state.audioEffects,
        activeMask: action.payload.activeMask ?? state.activeMask,
        selectedClipIds: [],
        selectedEffectId: null,
        selectedTimelineEffectId: null,
        isDirty: true,
        _historyLabel: 'Import edit package',
      };

    case 'CLOSE_PROJECT':
      return {
        ...initialState,
        ffmpegStatus: state.ffmpegStatus,
      };

    case 'SET_PROJECT_NAME':
      if (!state.project) return state;
      return { ...state, project: { ...state.project, name: action.payload }, isDirty: true };

    case 'SET_PROJECT_PATH':
      return { ...state, projectPath: action.payload };

    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload };

    // ── Playback ────────────────────────────────────────────────────────
    case 'SET_PLAYHEAD':
      return { ...state, playheadTime: Math.max(0, Math.min(action.payload, state.project?.duration ?? action.payload)) };

    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };

    case 'STOP':
      return { ...state, isPlaying: false, playheadTime: 0 };

    case 'STEP_FORWARD':
      if (!state.project) return state;
      return { ...state, playheadTime: state.playheadTime + (1 / state.project.settings.frameRate) };

    case 'STEP_BACKWARD':
      if (!state.project) return state;
      return { ...state, playheadTime: Math.max(0, state.playheadTime - (1 / state.project.settings.frameRate)) };

    case 'SET_PLAYBACK_SPEED':
      return { ...state, playbackSpeed: action.payload };

    case 'TOGGLE_LOOP':
      return { ...state, isLooping: !state.isLooping };

    case 'SET_IN_POINT':
      return { ...state, inPoint: action.payload };

    case 'SET_OUT_POINT':
      return { ...state, outPoint: action.payload };

    // ── Tools ───────────────────────────────────────────────────────────
    case 'SET_TOOL':
      return { ...state, activeTool: action.payload };

    case 'TOGGLE_SNAP':
      return { ...state, snapEnabled: !state.snapEnabled };

    case 'TOGGLE_MAGNETIC':
      return { ...state, magneticTimeline: !state.magneticTimeline };

    // ── Tracks ──────────────────────────────────────────────────────────
    case 'ADD_TRACK': {
      if (!state.project) return state;
      const stateAfterHistory = pushHistory(state, `Add ${action.payload.type} track`);
      const trackCount = stateAfterHistory.project!.tracks.filter(t => t.type === action.payload.type).length;
      const label = action.payload.type === 'video' ? 'Video' : action.payload.type === 'audio' ? 'Audio' : 'Effect';
      const newTrack: Track = {
        id: generateId(),
        name: `${label} ${trackCount + 1}`,
        type: action.payload.type,
        clips: [],
        effects: [],
        muted: false, solo: false, locked: false, visible: true,
        volume: 1,
        height: action.payload.type === 'video' ? DEFAULT_VIDEO_TRACK_HEIGHT : DEFAULT_AUDIO_TRACK_HEIGHT,
        color: TRACK_COLORS[(stateAfterHistory.project!.tracks.length) % TRACK_COLORS.length],
      };
      const tracks = [...stateAfterHistory.project!.tracks];
      const idx = action.payload.index ?? tracks.length;
      tracks.splice(idx, 0, newTrack);
      return {
        ...stateAfterHistory,
        project: { ...stateAfterHistory.project!, tracks },
        selectedTrackId: newTrack.id,
      };
    }

    case 'REMOVE_TRACK': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Remove track');
      const removedTrack = s.project!.tracks.find(t => t.id === action.payload);
      const removedClipIds = new Set(removedTrack?.clips.map(clip => clip.id) ?? []);
      const removedClipEffectIds = new Set((removedTrack?.clips ?? []).flatMap(clip => clip.effects.map(effect => effect.id)));
      const removedEffectIds = new Set((removedTrack?.effects ?? []).map(effect => effect.id));
      const tracks = s.project!.tracks.filter(t => t.id !== action.payload);
      return {
        ...s,
        project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) },
        selectedTrackId: s.selectedTrackId === action.payload ? null : s.selectedTrackId,
        selectedClipIds: s.selectedClipIds.filter(id => !removedClipIds.has(id)),
        selectedEffectId: s.selectedEffectId && removedClipEffectIds.has(s.selectedEffectId) ? null : s.selectedEffectId,
        selectedTimelineEffectId: s.selectedTimelineEffectId && removedEffectIds.has(s.selectedTimelineEffectId) ? null : s.selectedTimelineEffectId,
      };
    }

    case 'RENAME_TRACK': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map(t => t.id === action.payload.trackId ? { ...t, name: action.payload.name } : t),
        },
      };
    }

    case 'TOGGLE_TRACK_MUTE': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Toggle track mute');
      return {
        ...s,
        project: {
          ...s.project!,
          tracks: s.project!.tracks.map(t => t.id === action.payload ? { ...t, muted: !t.muted } : t),
        },
      };
    }

    case 'TOGGLE_TRACK_SOLO': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Toggle track solo');
      return {
        ...s,
        project: {
          ...s.project!,
          tracks: s.project!.tracks.map(t => t.id === action.payload ? { ...t, solo: !t.solo } : t),
        },
      };
    }

    case 'TOGGLE_TRACK_LOCK': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Toggle track lock');
      return {
        ...s,
        project: {
          ...s.project!,
          tracks: s.project!.tracks.map(t => t.id === action.payload ? { ...t, locked: !t.locked } : t),
        },
      };
    }

    case 'TOGGLE_TRACK_VISIBILITY': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Toggle track visibility');
      return {
        ...s,
        project: {
          ...s.project!,
          tracks: s.project!.tracks.map(t => t.id === action.payload ? { ...t, visible: !t.visible } : t),
        },
      };
    }

    case 'SET_TRACK_VOLUME': {
      if (!state.project) return state;
      return {
        ...state,
        isDirty: true,
        project: {
          ...state.project,
          tracks: state.project.tracks.map(t => t.id === action.payload.trackId ? { ...t, volume: action.payload.volume } : t),
        },
      };
    }

    case 'SET_TRACK_HEIGHT': {
      if (!state.project) return state;
      return {
        ...state,
        isDirty: true,
        project: {
          ...state.project,
          tracks: state.project.tracks.map(t => t.id === action.payload.trackId ? { ...t, height: action.payload.height } : t),
        },
      };
    }

    case 'REORDER_TRACKS': {
      if (!state.project) return state;
      const trackMap = new Map(state.project.tracks.map(t => [t.id, t]));
      const reordered = action.payload.map(id => trackMap.get(id)!).filter(Boolean);
      return { ...state, isDirty: true, project: { ...state.project, tracks: reordered } };
    }

    // ── Clips ───────────────────────────────────────────────────────────
    case 'ADD_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Add clip');
      const targetTrack = s.project!.tracks.find(t => t.id === action.payload.trackId);
      if (!targetTrack || targetTrack.locked || !trackAcceptsMedia(targetTrack, action.payload.clip.mediaType) || hasOverlap(targetTrack, action.payload.clip, action.payload.clip.startTime)) return s;
      const tracks = s.project!.tracks.map(t => {
        if (t.id !== action.payload.trackId) return t;
        return { ...t, clips: [...t.clips, action.payload.clip] };
      });
      const duration = calculateProjectDuration(tracks);
      return {
        ...s,
        project: { ...s.project!, tracks, duration },
        selectedClipIds: [action.payload.clip.id],
        selectedTrackId: action.payload.trackId,
      };
    }

    case 'ADD_MEDIA_TO_NEW_TRACK': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Add media to timeline');
      const trackType = action.payload.media.type === 'audio' ? 'audio' : 'video';
      const trackCount = s.project!.tracks.filter(t => t.type === trackType).length;
      const label = trackType === 'video' ? 'Video' : 'Audio';
      const newTrack: Track = {
        id: generateId(),
        name: `${label} ${trackCount + 1}`,
        type: trackType,
        clips: [],
        effects: [],
        muted: false,
        solo: false,
        locked: false,
        visible: true,
        volume: 1,
        height: trackType === 'video' ? DEFAULT_VIDEO_TRACK_HEIGHT : DEFAULT_AUDIO_TRACK_HEIGHT,
        color: TRACK_COLORS[(s.project!.tracks.length) % TRACK_COLORS.length],
      };
      const clip = createClipFromMedia(action.payload.media, newTrack.id, action.payload.startTime);
      newTrack.clips = [clip];
      const tracks = [...s.project!.tracks, newTrack];
      return {
        ...s,
        project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) },
        selectedClipIds: [clip.id],
        selectedTrackId: newTrack.id,
      };
    }

    case 'REMOVE_CLIPS': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Delete clips');
      const idsToRemove = new Set(action.payload);
      const tracks = s.project!.tracks.map(t => ({
        ...t,
        clips: t.clips.filter(c => !idsToRemove.has(c.id)),
      }));
      const duration = calculateProjectDuration(tracks);
      return {
        ...s,
        project: { ...s.project!, tracks, duration },
        selectedClipIds: s.selectedClipIds.filter(id => !idsToRemove.has(id)),
      };
    }

    case 'RIPPLE_DELETE_CLIPS': {
      if (!state.project || action.payload.length === 0) return state;
      const s = pushHistory(state, 'Ripple delete clips');
      const idsToRemove = new Set(action.payload);
      const tracks = s.project!.tracks.map(track => {
        const removed = track.clips.filter(clip => idsToRemove.has(clip.id));
        if (removed.length === 0 || track.locked) return track;
        const remaining = track.clips
          .filter(clip => !idsToRemove.has(clip.id))
          .map(clip => {
            const shift = removed
              .filter(deleted => deleted.startTime < clip.startTime)
              .reduce((sum, deleted) => sum + deleted.duration, 0);
            return shift > 0 ? { ...clip, startTime: Math.max(0, clip.startTime - shift) } : clip;
          });
        return { ...track, clips: remaining };
      });
      return {
        ...s,
        project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) },
        selectedClipIds: [],
      };
    }

    case 'DELETE_TIMELINE_GAPS': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Close timeline gaps');
      const tracks = s.project!.tracks.map(track => {
        if (track.locked || (action.payload?.trackId && track.id !== action.payload.trackId)) return track;
        let cursor = 0;
        const clips = [...track.clips]
          .sort((a, b) => a.startTime - b.startTime)
          .map(clip => {
            const next = { ...clip, startTime: cursor };
            cursor += clip.duration;
            return next;
          });
        return { ...track, clips };
      });
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'INSERT_TIMELINE_GAP': {
      if (!state.project || action.payload.duration <= 0) return state;
      const s = pushHistory(state, 'Insert timeline gap');
      const tracks = s.project!.tracks.map(track => {
        if (track.locked || (action.payload.trackId && track.id !== action.payload.trackId)) return track;
        return {
          ...track,
          clips: track.clips.map(clip => (
            clip.startTime >= action.payload.time
              ? { ...clip, startTime: clip.startTime + action.payload.duration }
              : clip
          )),
        };
      });
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'GROUP_SELECTED_CLIPS': {
      if (!state.project || state.selectedClipIds.length < 2) return state;
      const s = pushHistory(state, 'Group clips');
      const groupId = generateId();
      const selectedIds = new Set(s.selectedClipIds);
      const tracks = s.project!.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => selectedIds.has(clip.id) ? { ...clip, groupId } : clip),
      }));
      return { ...s, project: { ...s.project!, tracks } };
    }

    case 'UNGROUP_SELECTED_CLIPS': {
      if (!state.project || state.selectedClipIds.length === 0) return state;
      const s = pushHistory(state, 'Ungroup clips');
      const selectedIds = new Set(s.selectedClipIds);
      const groupIds = new Set(
        s.project!.tracks.flatMap(track => track.clips)
          .filter(clip => selectedIds.has(clip.id) && clip.groupId)
          .map(clip => clip.groupId!)
      );
      if (groupIds.size === 0) return s;
      const tracks = s.project!.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => clip.groupId && groupIds.has(clip.groupId) ? { ...clip, groupId: undefined } : clip),
      }));
      return { ...s, project: { ...s.project!, tracks } };
    }

    case 'MOVE_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Move clip');
      const found = findClipInTracks(s.project!.tracks, action.payload.clipId);
      if (!found) return s;
      const targetTrack = s.project!.tracks.find(t => t.id === action.payload.trackId);
      if (!targetTrack || found.clip.locked || found.track.locked || targetTrack.locked || !trackAcceptsMedia(targetTrack, found.clip.mediaType)) return s;
      const snappedStart = snapTime(s, action.payload.startTime, action.payload.clipId);
      const movedClip = { ...found.clip, trackId: action.payload.trackId, startTime: snappedStart };
      if (hasOverlap(targetTrack, movedClip, snappedStart)) return s;
      let tracks = s.project!.tracks.map(t => ({
        ...t,
        clips: t.clips.filter(c => c.id !== action.payload.clipId),
      }));
      tracks = tracks.map(t => {
        if (t.id !== action.payload.trackId) return t;
        return { ...t, clips: [...t.clips, movedClip] };
      });
      const duration = calculateProjectDuration(tracks);
      return { ...s, project: { ...s.project!, tracks, duration } };
    }

    case 'MOVE_SELECTED_CLIPS': {
      if (!state.project || state.selectedClipIds.length <= 1) return state;
      const s = pushHistory(state, 'Move selected clips');
      const selectedIds = new Set(s.selectedClipIds);
      const selectedClips = s.project!.tracks
        .flatMap(track => track.clips.map(clip => ({ track, clip })))
        .filter(item => selectedIds.has(item.clip.id));
      const anchor = selectedClips.find(item => item.clip.id === action.payload.anchorClipId);
      if (!anchor || selectedClips.length <= 1) return s;

      const snappedAnchorStart = snapTime(s, anchor.clip.startTime + action.payload.delta, action.payload.anchorClipId);
      const delta = snappedAnchorStart - anchor.clip.startTime;
      if (selectedClips.some(({ track, clip }) => track.locked || clip.locked || clip.startTime + delta < 0)) return s;

      const candidateById = new Map<string, Clip>();
      for (const { clip } of selectedClips) {
        candidateById.set(clip.id, { ...clip, startTime: clip.startTime + delta });
      }

      for (const track of s.project!.tracks) {
        const candidates = track.clips
          .filter(clip => selectedIds.has(clip.id))
          .map(clip => candidateById.get(clip.id))
          .filter((clip): clip is Clip => Boolean(clip));
        if (candidates.some(candidate => hasOverlapExcluding(track, candidate, selectedIds))) return s;
      }

      const tracks = s.project!.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => candidateById.get(clip.id) ?? clip),
      }));

      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'TRIM_SELECTED_CLIPS': {
      if (!state.project || state.selectedClipIds.length <= 1) return state;
      const s = pushHistory(state, 'Trim selected clips');
      const selectedIds = new Set(s.selectedClipIds);
      const candidateById = new Map<string, Clip>();

      for (const track of s.project!.tracks) {
        if (track.locked && track.clips.some(clip => selectedIds.has(clip.id))) return s;
        for (const clip of track.clips) {
          if (!selectedIds.has(clip.id)) continue;
          if (clip.locked) return s;
          if (action.payload.edge === 'start') {
            const nextStart = Math.max(0, Math.min(clip.startTime + clip.duration - 0.1, clip.startTime + action.payload.delta));
            const trimDelta = nextStart - clip.startTime;
            candidateById.set(clip.id, {
              ...clip,
              startTime: nextStart,
              duration: Math.max(0.1, clip.duration - trimDelta),
              inPoint: Math.max(0, clip.inPoint + trimDelta * clip.speed),
            });
          } else {
            const nextDuration = Math.max(0.1, clip.duration + action.payload.delta);
            candidateById.set(clip.id, {
              ...clip,
              duration: nextDuration,
              outPoint: Math.max(clip.inPoint + 0.1, clip.inPoint + nextDuration * clip.speed),
            });
          }
        }
      }

      for (const track of s.project!.tracks) {
        const candidates = track.clips
          .filter(clip => selectedIds.has(clip.id))
          .map(clip => candidateById.get(clip.id))
          .filter((clip): clip is Clip => Boolean(clip));
        if (candidates.some(candidate => hasOverlapExcluding(track, candidate, selectedIds))) return s;
      }

      const tracks = s.project!.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => candidateById.get(clip.id) ?? clip),
      }));

      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'RIPPLE_MOVE_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Ripple move clip');
      const found = findClipInTracks(s.project!.tracks, action.payload.clipId);
      if (!found) return s;
      const targetTrack = s.project!.tracks.find(t => t.id === action.payload.trackId);
      if (!targetTrack || found.clip.locked || found.track.locked || targetTrack.locked || !trackAcceptsMedia(targetTrack, found.clip.mediaType)) return s;
      const snappedStart = snapTime(s, action.payload.startTime, action.payload.clipId);
      const delta = snappedStart - found.clip.startTime;
      const oldEnd = found.clip.startTime + found.clip.duration;
      const movedClip = { ...found.clip, trackId: action.payload.trackId, startTime: snappedStart };
      let tracks = s.project!.tracks.map(track => ({
        ...track,
        clips: track.clips
          .filter(clip => clip.id !== action.payload.clipId)
          .map(clip => (
            track.id === found.track.id && clip.startTime >= oldEnd
              ? { ...clip, startTime: Math.max(0, clip.startTime + delta) }
              : clip
          )),
      }));
      tracks = tracks.map(track => track.id === action.payload.trackId ? { ...track, clips: [...track.clips, movedClip] } : track);
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'SLIDE_CLIP':
      return baseReducer(state, { type: 'MOVE_CLIP', payload: action.payload });

    case 'SLIP_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Slip clip');
      const found = findClipInTracks(s.project!.tracks, action.payload.clipId);
      if (!found || found.clip.locked || found.track.locked) return s;
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => {
        const sourceSpan = Math.max(0.1, clip.outPoint - clip.inPoint);
        const newInPoint = Math.max(0, clip.inPoint + action.payload.delta * clip.speed);
        return { ...clip, inPoint: newInPoint, outPoint: newInPoint + sourceSpan };
      });
      return { ...s, project: { ...s.project!, tracks } };
    }

    case 'ROLL_EDIT_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Roll edit');
      const found = findClipInTracks(s.project!.tracks, action.payload.clipId);
      if (!found || found.clip.locked || found.track.locked) return s;
      const sorted = [...found.track.clips].sort((a, b) => a.startTime - b.startTime);
      const index = sorted.findIndex(clip => clip.id === action.payload.clipId);
      const neighbor = action.payload.edge === 'start' ? sorted[index - 1] : sorted[index + 1];
      if (!neighbor || neighbor.locked) return s;
      const delta = action.payload.delta;
      const tracks = s.project!.tracks.map(track => {
        if (track.id !== found.track.id) return track;
        return {
          ...track,
          clips: track.clips.map(clip => {
            if (action.payload.edge === 'start') {
              const appliedDelta = clamp(delta, -Math.max(0, neighbor.duration - 0.1), Math.max(0, found.clip.duration - 0.1));
              if (clip.id === found.clip.id) {
                return {
                  ...clip,
                  startTime: clip.startTime + appliedDelta,
                  duration: clip.duration - appliedDelta,
                  inPoint: Math.max(0, clip.inPoint + appliedDelta * clip.speed),
                };
              }
              if (clip.id === neighbor.id) {
                return { ...clip, duration: clip.duration + appliedDelta, outPoint: clip.outPoint + appliedDelta * clip.speed };
              }
            } else {
              const appliedDelta = clamp(delta, -Math.max(0, found.clip.duration - 0.1), Math.max(0, neighbor.duration - 0.1));
              if (clip.id === found.clip.id) {
                return { ...clip, duration: clip.duration + appliedDelta, outPoint: clip.outPoint + appliedDelta * clip.speed };
              }
              if (clip.id === neighbor.id) {
                return {
                  ...clip,
                  startTime: clip.startTime + appliedDelta,
                  duration: clip.duration - appliedDelta,
                  inPoint: Math.max(0, clip.inPoint + appliedDelta * clip.speed),
                };
              }
            }
            return clip;
          }),
        };
      });
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'TRIM_CLIP_START': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Trim clip start');
      const found = findClipInTracks(s.project!.tracks, action.payload.clipId);
      if (!found || found.clip.locked || found.track.locked) return s;
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => {
        const maxStart = clip.startTime + clip.duration - 0.1;
        const newStartTime = clamp(action.payload.newStartTime, 0, maxStart);
        const delta = newStartTime - clip.startTime;
        const newInPoint = clamp(action.payload.newInPoint, 0, clip.outPoint - 0.1);
        return {
          ...clip,
          startTime: newStartTime,
          duration: Math.max(0.1, clip.duration - delta),
          inPoint: newInPoint,
        };
      });
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'TRIM_CLIP_END': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Trim clip end');
      const found = findClipInTracks(s.project!.tracks, action.payload.clipId);
      if (!found || found.clip.locked || found.track.locked) return s;
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => ({
        ...clip,
        duration: Math.max(0.1, action.payload.newDuration),
        outPoint: Math.max(clip.inPoint + 0.1, action.payload.newOutPoint),
      }));
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'SPLIT_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Split clip');
      const found = findClipInTracks(s.project!.tracks, action.payload.clipId);
      if (!found) return s;
      const { clip } = found;
      if (clip.locked || found.track.locked) return s;
      const splitOffset = action.payload.time - clip.startTime;
      if (splitOffset <= 0 || splitOffset >= clip.duration) return s;

      const clipA: Clip = { ...clip, duration: splitOffset, outPoint: clip.inPoint + splitOffset * clip.speed };
      const clipB: Clip = {
        ...clip,
        id: generateId(),
        startTime: action.payload.time,
        duration: clip.duration - splitOffset,
        inPoint: clip.inPoint + splitOffset * clip.speed,
      };

      const tracks = s.project!.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c => c.id === clip.id ? clipA : c).concat(t.id === found.track.id && t.clips.some(c => c.id === clip.id) ? [clipB] : []),
      }));
      return { ...s, project: { ...s.project!, tracks } };
    }

    case 'SET_CLIP_SPEED': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        speed: clamp(action.payload.speed, 0.1, 8),
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'TOGGLE_CLIP_REVERSE': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload, clip => ({
        ...clip,
        reversed: !clip.reversed,
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'SET_CLIP_VOLUME': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        volume: clamp(action.payload.volume, 0, 2),
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'SET_CLIP_OPACITY': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        opacity: clamp(action.payload.opacity, 0, 1),
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'SET_CLIP_TRANSFORM': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        positionX: action.payload.positionX ?? clip.positionX ?? 0,
        positionY: action.payload.positionY ?? clip.positionY ?? 0,
        scale: action.payload.scale != null ? clamp(action.payload.scale, 0.1, 4) : (clip.scale ?? 1),
        rotation: action.payload.rotation ?? clip.rotation ?? 0,
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'SET_CLIP_CROP': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => {
        const current = clip.crop ?? { left: 0, right: 0, top: 0, bottom: 0 };
        const next = {
          left: clamp(action.payload.crop.left ?? current.left, 0, 0.9),
          right: clamp(action.payload.crop.right ?? current.right, 0, 0.9),
          top: clamp(action.payload.crop.top ?? current.top, 0, 0.9),
          bottom: clamp(action.payload.crop.bottom ?? current.bottom, 0, 0.9),
        };
        if (next.left + next.right > 0.95) {
          const overflow = next.left + next.right - 0.95;
          if (action.payload.crop.left != null) next.left -= overflow;
          else next.right -= overflow;
        }
        if (next.top + next.bottom > 0.95) {
          const overflow = next.top + next.bottom - 0.95;
          if (action.payload.crop.top != null) next.top -= overflow;
          else next.bottom -= overflow;
        }
        return { ...clip, crop: next };
      });
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'SET_CLIP_LABEL': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        label: action.payload.label,
      }));
      return { ...state, project: { ...state.project, tracks } };
    }

    case 'SET_CLIP_BLEND_MODE':
      return {
        ...state,
        project: state.project ? {
          ...state.project,
          tracks: state.project.tracks.map(t => ({
            ...t,
            clips: t.clips.map(c => c.id === action.payload.clipId ? { ...c, blendMode: action.payload.blendMode } : c)
          }))
        } : null
      };

    case 'SET_CLIP_COLOR': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        color: action.payload.color,
      }));
      return { ...state, project: { ...state.project, tracks } };
    }

    case 'DUPLICATE_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Duplicate clip');
      const found = findClipInTracks(s.project!.tracks, action.payload);
      if (!found) return s;
      const duped: Clip = {
        ...found.clip,
        id: generateId(),
        startTime: found.clip.startTime + found.clip.duration,
      };
      if (hasOverlap(found.track, duped, duped.startTime)) return s;
      const tracks = s.project!.tracks.map(t => {
        if (t.id !== found.track.id) return t;
        return { ...t, clips: [...t.clips, duped] };
      });
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'COPY': {
      if (!state.project || state.selectedClipIds.length === 0) return state;
      const copiedClips: Clip[] = [];
      for (const track of state.project.tracks) {
        for (const clip of track.clips) {
          if (state.selectedClipIds.includes(clip.id)) {
            copiedClips.push({ ...clip });
          }
        }
      }
      return { ...state, clipboard: copiedClips };
    }

    case 'PASTE': {
      if (!state.project || state.clipboard.length === 0) return state;
      const s = pushHistory(state, 'Paste clips');
      
      const minStartTime = Math.min(...state.clipboard.map(c => c.startTime));
      const offset = s.playheadTime - minStartTime;
      
      const newClips = state.clipboard.map(c => ({
        ...c,
        id: generateId(),
        startTime: c.startTime + offset,
      }));
      
      const newSelectedIds = newClips.map(c => c.id);
      
      const tracks = s.project!.tracks.map(t => {
        const clipsForTrack = newClips.filter(c => c.trackId === t.id && !t.locked && !hasOverlap(t, c, c.startTime));
        if (clipsForTrack.length > 0) {
          return { ...t, clips: [...t.clips, ...clipsForTrack] };
        }
        return t;
      });
      
      return { 
        ...s, 
        project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) },
        selectedClipIds: newSelectedIds
      };
    }

    // ── Effects ──────────────────────────────────────────────────────────
    case 'ADD_EFFECT': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Add effect');
      const target = findClipInTracks(s.project!.tracks, action.payload.clipId);
      if (!target || target.clip.mediaType === 'audio' || target.clip.locked || target.track.locked) return s;
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: [...clip.effects, action.payload.effect],
      }));
      return {
        ...s,
        project: { ...s.project!, tracks },
        selectedClipIds: [action.payload.clipId],
        selectedEffectId: action.payload.effect.id,
        activeRightPanel: 'effects',
        isDirty: true,
      };
    }

    case 'REMOVE_EFFECT': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Remove effect');
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: clip.effects.filter(e => e.id !== action.payload.effectId),
      }));
      return {
        ...s,
        project: { ...s.project!, tracks },
        selectedEffectId: state.selectedEffectId === action.payload.effectId ? null : state.selectedEffectId,
        isDirty: true,
      };
    }

    case 'UPDATE_EFFECT_PARAM': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Adjust effect parameter', `effect-param:${action.payload.clipId}:${action.payload.effectId}:${action.payload.paramKey}`);
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: clip.effects.map(e => {
          if (e.id !== action.payload.effectId) return e;
          return {
            ...e,
            params: e.params.map(p => p.key === action.payload.paramKey ? { ...p, value: action.payload.value } : p),
          };
        }),
      }));
      return { ...s, project: { ...s.project!, tracks }, isDirty: true };
    }

    case 'UPDATE_EFFECT_TIMING': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Update effect timing');
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: clip.effects.map(effect => {
          if (effect.id !== action.payload.effectId) return effect;
          const currentStart = effect.startOffset ?? 0;
          const currentDuration = effect.duration ?? clip.duration;
          const startOffset = clamp(action.payload.startOffset ?? currentStart, 0, Math.max(0, clip.duration - 0.1));
          const maxDuration = Math.max(0.1, clip.duration - startOffset);
          const duration = clamp(action.payload.duration ?? currentDuration, 0.1, maxDuration);
          return { ...effect, startOffset, duration };
        }),
      }));
      return { ...s, project: { ...s.project!, tracks }, isDirty: true };
    }

    case 'ADD_EFFECT_KEYFRAME': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Add keyframe');
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: clip.effects.map(effect => (
          effect.id === action.payload.effectId
            ? {
                ...effect,
                keyframes: [
                  ...effect.keyframes.filter(keyframe => (
                    keyframe.property !== action.payload.keyframe.property
                    || Math.abs(keyframe.time - action.payload.keyframe.time) > 0.001
                  )),
                  action.payload.keyframe,
                ],
              }
            : effect
        )),
      }));
      return { ...s, project: { ...s.project!, tracks }, isDirty: true };
    }

    case 'UPDATE_EFFECT_KEYFRAME': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Adjust keyframe', `keyframe:${action.payload.clipId}:${action.payload.effectId}:${action.payload.keyframeId}`);
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: clip.effects.map(effect => (
          effect.id === action.payload.effectId
            ? {
                ...effect,
                keyframes: effect.keyframes
                  .map(keyframe => keyframe.id === action.payload.keyframeId ? { ...keyframe, ...action.payload.updates } : keyframe),
              }
            : effect
        )),
      }));
      return { ...s, project: { ...s.project!, tracks }, isDirty: true };
    }

    case 'REMOVE_EFFECT_KEYFRAME': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Remove keyframe');
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: clip.effects.map(effect => (
          effect.id === action.payload.effectId
            ? { ...effect, keyframes: effect.keyframes.filter(keyframe => keyframe.id !== action.payload.keyframeId) }
            : effect
        )),
      }));
      return { ...s, project: { ...s.project!, tracks }, isDirty: true };
    }

    case 'REORDER_EFFECT_KEYFRAMES': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Reorder keyframes');
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: clip.effects.map(effect => {
          if (effect.id !== action.payload.effectId) return effect;
          const keyframesById = new Map(effect.keyframes.map(keyframe => [keyframe.id, keyframe]));
          const reordered = action.payload.keyframeIds
            .map(id => keyframesById.get(id))
            .filter((keyframe): keyframe is Keyframe => Boolean(keyframe));
          const missing = effect.keyframes.filter(keyframe => !action.payload.keyframeIds.includes(keyframe.id));
          return { ...effect, keyframes: [...reordered, ...missing] };
        }),
      }));
      return { ...s, project: { ...s.project!, tracks }, isDirty: true };
    }

    case 'TOGGLE_EFFECT': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: clip.effects.map(e => e.id === action.payload.effectId ? { ...e, enabled: !e.enabled } : e),
      }));
      return { ...state, project: { ...state.project, tracks } };
    }

    case 'REORDER_EFFECTS': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => {
        const effectMap = new Map(clip.effects.map(e => [e.id, e]));
        const reordered = action.payload.effectIds.map(id => effectMap.get(id)!).filter(Boolean);
        return { ...clip, effects: reordered };
      });
      return { ...state, project: { ...state.project, tracks } };
    }

    case 'ADD_TIMELINE_EFFECT': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Add timeline effect');
      const targetTrack = s.project!.tracks.find(t => t.id === action.payload.trackId);
      if (!targetTrack || targetTrack.type !== 'effect' || targetTrack.locked) return s;
      const effect = {
        ...action.payload.effect,
        trackId: action.payload.trackId,
        startTime: Math.max(0, action.payload.effect.startTime),
        duration: Math.max(0.1, action.payload.effect.duration),
      };
      const tracks = s.project!.tracks.map(track => (
        track.id === action.payload.trackId
          ? { ...track, effects: [...(track.effects ?? []), effect] }
          : track
      ));
      return {
        ...s,
        project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) },
        selectedClipIds: [],
        selectedEffectId: null,
        selectedTimelineEffectId: effect.id,
        selectedTrackId: action.payload.trackId,
        activeRightPanel: 'effects',
        isDirty: true,
      };
    }

    case 'REMOVE_TIMELINE_EFFECT': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Remove timeline effect');
      const tracks = s.project!.tracks.map(track => ({
        ...track,
        effects: (track.effects ?? []).filter(effect => effect.id !== action.payload),
      }));
      return {
        ...s,
        project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) },
        selectedTimelineEffectId: s.selectedTimelineEffectId === action.payload ? null : s.selectedTimelineEffectId,
        isDirty: true,
      };
    }

    case 'MOVE_TIMELINE_EFFECT': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Move timeline effect');
      const found = findTimelineEffectInTracks(s.project!.tracks, action.payload.effectId);
      const targetTrack = s.project!.tracks.find(t => t.id === action.payload.trackId);
      if (!found || found.track.locked || !targetTrack || targetTrack.type !== 'effect' || targetTrack.locked) return s;
      const movedEffect = {
        ...found.effect,
        trackId: action.payload.trackId,
        startTime: snapTime(s, action.payload.startTime, action.payload.effectId),
      };
      let tracks = s.project!.tracks.map(track => ({
        ...track,
        effects: (track.effects ?? []).filter(effect => effect.id !== action.payload.effectId),
      }));
      tracks = tracks.map(track => (
        track.id === action.payload.trackId
          ? { ...track, effects: [...(track.effects ?? []), movedEffect] }
          : track
      ));
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) }, isDirty: true };
    }

    case 'TRIM_TIMELINE_EFFECT_START': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Trim timeline effect start');
      const found = findTimelineEffectInTracks(s.project!.tracks, action.payload.effectId);
      if (!found || found.track.locked) return s;
      const tracks = updateTimelineEffectInTracks(s.project!.tracks, action.payload.effectId, effect => {
        const maxStart = effect.startTime + effect.duration - 0.1;
        const newStartTime = clamp(action.payload.newStartTime, 0, maxStart);
        const delta = newStartTime - effect.startTime;
        return { ...effect, startTime: newStartTime, duration: Math.max(0.1, effect.duration - delta) };
      });
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) }, isDirty: true };
    }

    case 'TRIM_TIMELINE_EFFECT_END': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Trim timeline effect end');
      const found = findTimelineEffectInTracks(s.project!.tracks, action.payload.effectId);
      if (!found || found.track.locked) return s;
      const tracks = updateTimelineEffectInTracks(s.project!.tracks, action.payload.effectId, effect => ({
        ...effect,
        duration: Math.max(0.1, action.payload.newDuration),
      }));
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) }, isDirty: true };
    }

    case 'UPDATE_TIMELINE_EFFECT_PARAM': {
      if (!state.project) return state;
      const tracks = updateTimelineEffectInTracks(state.project.tracks, action.payload.effectId, effect => ({
        ...effect,
        params: effect.params.map(param => param.key === action.payload.paramKey ? { ...param, value: action.payload.value } : param),
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'TOGGLE_TIMELINE_EFFECT': {
      if (!state.project) return state;
      const tracks = updateTimelineEffectInTracks(state.project.tracks, action.payload, effect => ({
        ...effect,
        enabled: !effect.enabled,
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    // ── Transitions ─────────────────────────────────────────────────────
    case 'ADD_TRANSITION': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        transition: action.payload.transition,
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'REMOVE_TRANSITION': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload, clip => ({
        ...clip,
        transition: null,
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'UPDATE_TRANSITION': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        transition: clip.transition ? { ...clip.transition, ...action.payload.transition } : null,
      }));
      return { ...state, project: { ...state.project, tracks } };
    }

    // ── Media ───────────────────────────────────────────────────────────
    case 'ADD_MEDIA': {
      if (!state.project) return state;
      if (state.project.mediaPool.some(media => media.path === action.payload.path)) return state;
      const addMediaState = pushHistory(state, 'Import media');
      return {
        ...addMediaState,
        project: { ...addMediaState.project!, mediaPool: [...addMediaState.project!.mediaPool, action.payload] },
        selectedMediaIds: [action.payload.id],
        isDirty: true,
      };
    }

    case 'ADD_MEDIA_BATCH': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Import media');
      const existingPaths = new Set(s.project!.mediaPool.map(media => media.path));
      const newMedia = action.payload.filter(media => {
        if (existingPaths.has(media.path)) return false;
        existingPaths.add(media.path);
        return true;
      });
      if (newMedia.length === 0) return state;
      return {
        ...s,
        project: { ...s.project!, mediaPool: [...s.project!.mediaPool, ...newMedia] },
        selectedMediaIds: newMedia.map(media => media.id),
        isDirty: true,
      };
    }

    case 'REMOVE_MEDIA': {
      if (!state.project) return state;
      const removeMediaState = pushHistory(state, 'Remove media');
      const removeSet = new Set(action.payload);
      return {
        ...removeMediaState,
        project: {
          ...removeMediaState.project!,
          mediaPool: removeMediaState.project!.mediaPool.filter(m => !removeSet.has(m.id)),
        },
        selectedMediaIds: removeMediaState.selectedMediaIds.filter(id => !removeSet.has(id)),
        isDirty: true,
      };
    }

    case 'UPDATE_MEDIA':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          mediaPool: state.project.mediaPool.map(m =>
            m.id === action.payload.mediaId ? { ...m, ...action.payload.updates } : m
          ),
        },
      };

    case 'ADD_MEDIA_FOLDER':
      if (!state.project) return state;
      return {
        ...state,
        project: { ...state.project, mediaFolders: [...state.project.mediaFolders, action.payload] },
      };

    case 'REMOVE_MEDIA_FOLDER':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          mediaFolders: state.project.mediaFolders.filter(f => f.id !== action.payload),
          mediaPool: state.project.mediaPool.map(m => m.folderId === action.payload ? { ...m, folderId: null } : m),
        },
      };

    case 'MOVE_MEDIA_TO_FOLDER':
      if (!state.project) return state;
      const moveSet = new Set(action.payload.mediaIds);
      return {
        ...state,
        project: {
          ...state.project,
          mediaPool: state.project.mediaPool.map(m =>
            moveSet.has(m.id) ? { ...m, folderId: action.payload.folderId } : m
          ),
        },
      };

    // ── Selection ────────────────────────────────────────────────────────
    case 'SELECT_CLIPS':
      return { ...state, selectedClipIds: action.payload, selectedTimelineEffectId: null };

    case 'ADD_TO_SELECTION':
      return { ...state, selectedClipIds: [...new Set([...state.selectedClipIds, ...action.payload])] };

    case 'DESELECT_ALL':
      return { ...state, selectedClipIds: [], selectedTrackId: null, selectedMediaIds: [], selectedEffectId: null, selectedTimelineEffectId: null };

    case 'SELECT_TRACK':
      return { ...state, selectedTrackId: action.payload };

    case 'SELECT_MEDIA':
      return { ...state, selectedMediaIds: action.payload };

    case 'SELECT_EFFECT':
      return { ...state, selectedEffectId: action.payload, selectedTimelineEffectId: null };

    case 'SELECT_TIMELINE_EFFECT':
      return { ...state, selectedTimelineEffectId: action.payload, selectedEffectId: null, selectedClipIds: [] };

    // ── View ────────────────────────────────────────────────────────────
    case 'SET_TIMELINE_ZOOM':
      return { ...state, timelineZoom: Math.max(10, Math.min(500, action.payload)) };

    case 'ZOOM_TO_FIT': {
      if (!state.project) return state;
      const duration = Math.max(state.project.duration, 10);
      const newZoom = Math.max(10, Math.min(500, 800 / duration));
      return { ...state, timelineZoom: newZoom };
    }

    case 'SET_TIMELINE_SCROLL':
      return {
        ...state,
        timelineScrollX: action.payload.x ?? state.timelineScrollX,
        timelineScrollY: action.payload.y ?? state.timelineScrollY,
      };

    case 'SET_PREVIEW_ZOOM':
      return { ...state, previewZoom: action.payload };

    case 'TOGGLE_SAFE_ZONES':
      return { ...state, showSafeZones: !state.showSafeZones };

    // ── Panels ──────────────────────────────────────────────────────────
    case 'SET_RIGHT_PANEL':
      return { ...state, activeRightPanel: action.payload };

    case 'SET_LEFT_PANEL_TAB':
      return { ...state, leftPanelTab: action.payload };

    case 'TOGGLE_LEFT_PANEL':
      return { ...state, leftPanelOpen: !state.leftPanelOpen };

    case 'TOGGLE_RIGHT_PANEL':
      return { ...state, rightPanelOpen: !state.rightPanelOpen };

    case 'SET_SCOPE_TYPE':
      return { ...state, scopeType: action.payload };

    // ── Color Grading ───────────────────────────────────────────────────
    case 'SET_COLOR_GRADING':
      return { ...state, colorGrading: { ...state.colorGrading, ...action.payload } };

    case 'RESET_COLOR_GRADING':
      return { ...state, colorGrading: { ...DEFAULT_COLOR_GRADING } };

    case 'SET_COLOR_WHEEL':
      return {
        ...state,
        colorGrading: {
          ...state.colorGrading,
          [action.payload.wheel]: { ...state.colorGrading[action.payload.wheel], ...action.payload.values },
        },
      };

    case 'SET_CURVE_POINTS':
      return {
        ...state,
        colorGrading: {
          ...state.colorGrading,
          curves: { ...state.colorGrading.curves, [action.payload.channel]: action.payload.points },
        },
      };

    // ── Text ────────────────────────────────────────────────────────────
    case 'SET_TEXT_OVERLAY':
      return { ...state, activeTextOverlay: action.payload };

    case 'UPDATE_TEXT_OVERLAY':
      if (!state.activeTextOverlay) return state;
      return { ...state, activeTextOverlay: { ...state.activeTextOverlay, ...action.payload } };

    case 'ADD_SUBTITLE_CUE': {
      if (!state.project) return state;
      const nextState = pushHistory(state, 'Add subtitle');
      return {
        ...nextState,
        project: {
          ...nextState.project!,
          subtitles: [...(nextState.project!.subtitles ?? []), action.payload],
        },
        isDirty: true,
      };
    }

    case 'UPDATE_SUBTITLE_CUE': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          subtitles: (state.project.subtitles ?? []).map(cue =>
            cue.id === action.payload.cueId ? { ...cue, ...action.payload.updates } : cue
          ),
        },
        isDirty: true,
      };
    }

    case 'REMOVE_SUBTITLE_CUE': {
      if (!state.project) return state;
      const nextState = pushHistory(state, 'Remove subtitle');
      return {
        ...nextState,
        project: {
          ...nextState.project!,
          subtitles: (nextState.project!.subtitles ?? []).filter(cue => cue.id !== action.payload),
        },
        isDirty: true,
      };
    }

    // ── Audio ───────────────────────────────────────────────────────────
    case 'SET_MASTER_VOLUME':
      return { ...state, masterVolume: Math.max(0, action.payload) };

    case 'SET_AUDIO_EFFECTS':
      return { ...state, audioEffects: { ...state.audioEffects, ...action.payload } };

    // ── Mask ────────────────────────────────────────────────────────────
    case 'SET_MASK':
      return { ...state, activeMask: action.payload };

    case 'UPDATE_MASK':
      if (!state.activeMask) return state;
      return { ...state, activeMask: { ...state.activeMask, ...action.payload } };

    // ── Markers ─────────────────────────────────────────────────────────
    case 'ADD_MARKER':
      if (!state.project) return state;
      return { ...state, project: { ...state.project, markers: [...state.project.markers, action.payload] } };

    case 'REMOVE_MARKER':
      if (!state.project) return state;
      return { ...state, project: { ...state.project, markers: state.project.markers.filter(m => m.id !== action.payload) } };

    case 'UPDATE_MARKER':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          markers: state.project.markers.map(m => m.id === action.payload.markerId ? { ...m, ...action.payload.updates } : m),
        },
      };

    // ── Export ───────────────────────────────────────────────────────────
    case 'SET_EXPORT_SETTINGS':
      return { ...state, exportSettings: { ...state.exportSettings, ...action.payload } };

    case 'TOGGLE_EXPORT_DIALOG':
      if (state.isExporting) return state;
      return { ...state, showExportDialog: !state.showExportDialog };

    case 'ADD_RENDER_JOB':
      return { ...state, renderQueue: [...state.renderQueue, action.payload] };

    case 'UPDATE_RENDER_JOB':
      return {
        ...state,
        renderQueue: state.renderQueue.map(j => j.id === action.payload.jobId ? { ...j, ...action.payload.updates } : j),
      };

    case 'REMOVE_RENDER_JOB':
      return { ...state, renderQueue: state.renderQueue.filter(j => j.id !== action.payload) };

    case 'EXPORT_START':
      return { ...state, isExporting: true, exportProgress: 0, exportError: null };

    case 'EXPORT_PROGRESS':
      return { ...state, exportProgress: action.payload };

    case 'EXPORT_COMPLETE':
      return { ...state, isExporting: false, exportProgress: 100 };

    case 'EXPORT_ERROR':
      return { ...state, isExporting: false, exportError: action.payload };

    case 'SET_FFMPEG_STATUS':
      return { ...state, ffmpegStatus: action.payload };

    // ── History ──────────────────────────────────────────────────────────
    // UNDO and REDO are handled by the wrapper videoEditorReducer

    case 'APPLY_AUTO_EDIT': {
      if (!state.project) return state;
      const selectedIds = action.payload.clipIds?.length
        ? action.payload.clipIds
        : state.selectedClipIds.length > 0
          ? state.selectedClipIds
          : state.project.tracks.flatMap(track => track.clips.map(clip => clip.id));
      if (selectedIds.length === 0) return state;

      const targetIds = new Set(selectedIds);
      const s = pushHistory(state, 'Apply auto edit');
      let tracks = s.project!.tracks;

      if (action.payload.preset === 'smart-trim' || action.payload.preset === 'quick-cleanup' || action.payload.preset === 'product-finish') {
        tracks = applyAutoTrim(tracks, targetIds);
      }

      if (action.payload.preset === 'smooth-transitions' || action.payload.preset === 'quick-cleanup' || action.payload.preset === 'product-finish') {
        tracks = applyAutoTransitions(tracks, targetIds);
      }

      if (action.payload.preset === 'visual-polish' || action.payload.preset === 'quick-cleanup' || action.payload.preset === 'product-finish') {
        tracks = applyVisualPolish(tracks, targetIds);
      }

      if (action.payload.preset === 'audio-balance' || action.payload.preset === 'quick-cleanup' || action.payload.preset === 'product-finish') {
        tracks = applyAudioBalance(tracks, targetIds);
      }

      const nextState: VideoEditorState = {
        ...s,
        project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) },
        selectedClipIds: selectedIds,
        activeRightPanel: action.payload.preset === 'audio-balance' ? 'audio' : 'effects',
      };

      if (action.payload.preset === 'product-finish') {
        return {
          ...nextState,
          colorGrading: {
            ...nextState.colorGrading,
            contrast: Math.max(nextState.colorGrading.contrast, 8),
            saturation: Math.max(nextState.colorGrading.saturation, 8),
            vibrance: Math.max(nextState.colorGrading.vibrance, 12),
            vignette: { ...nextState.colorGrading.vignette, amount: Math.max(nextState.colorGrading.vignette.amount, 12) },
          },
          activeTextOverlay: nextState.activeTextOverlay ?? {
            id: `text-${generateId()}`,
            text: nextState.project?.name || 'Project Title',
            fontFamily: 'Sora',
            fontSize: 42,
            fontWeight: 800,
            color: '#ffffff',
            backgroundColor: '#000000',
            backgroundOpacity: 0.35,
            alignment: 'center',
            lineHeight: 1.2,
            letterSpacing: 0,
            x: 0.5,
            y: 0.85,
            width: 0.8,
            rotation: 0,
            opacity: 1,
            shadow: { enabled: true, color: '#000000', offsetX: 2, offsetY: 2, blur: 8 },
            outline: { enabled: false, color: '#000000', width: 2 },
            animation: 'fade',
            animationDuration: 0.5,
          },
        };
      }

      return nextState;
    }

    case 'PUSH_HISTORY':
      return pushHistory(state, action.payload.label);

    // ── UI ───────────────────────────────────────────────────────────────
    case 'TOGGLE_KEYFRAMES':
      return { ...state, showKeyframes: !state.showKeyframes };

    case 'TOGGLE_WAVEFORMS':
      return { ...state, showWaveforms: !state.showWaveforms };

    case 'TOGGLE_THUMBNAILS':
      return { ...state, showThumbnails: !state.showThumbnails };

    case 'SET_IMPORTING':
      return { ...state, isImporting: action.payload };

    case 'TOGGLE_PROJECT_SETTINGS':
      return { ...state, showProjectSettings: !state.showProjectSettings };

    case 'TOGGLE_NEW_PROJECT_MODAL':
      return { ...state, showNewProjectModal: !state.showNewProjectModal };

    case 'SET_PENDING_EDIT_PACKAGE':
      return { ...state, pendingEditPackage: action.payload };

    case 'SET_CONTEXT_MENU':
      return { ...state, contextMenu: action.payload };

    case 'CLOSE_CONTEXT_MENU':
      return { ...state, contextMenu: null };

    default:
      return state;
  }
}

function videoEditorReducer(state: VideoEditorState, action: VideoEditorAction): VideoEditorState {
  if (action.type === 'UNDO') {
    if (state.historyIndex <= 0) return state;
    const prevEntry = state.history[state.historyIndex - 1];
    return applySnapshot({ ...state, historyIndex: state.historyIndex - 1 }, prevEntry.snapshot);
  }
  
  if (action.type === 'REDO') {
    if (state.historyIndex >= state.history.length - 1) return state;
    const nextEntry = state.history[state.historyIndex + 1];
    return applySnapshot({ ...state, historyIndex: state.historyIndex + 1 }, nextEntry.snapshot);
  }

  let nextState = baseReducer(state, action);

  if (action.type === 'NEW_PROJECT' || action.type === 'LOAD_PROJECT' || action.type === 'APPLY_EDIT_PACKAGE') {
    const label = action.type === 'NEW_PROJECT' ? 'New Project' : action.type === 'LOAD_PROJECT' ? 'Load Project' : 'Import edit package';
    nextState.history = [{
      id: generateId(),
      label,
      timestamp: Date.now(),
      snapshot: createSnapshot(nextState),
    }];
    nextState.historyIndex = 0;
  } else if (nextState._historyLabel) {
    const label = nextState._historyLabel;
    const group = nextState._historyGroup;
    delete nextState._historyLabel;
    delete nextState._historyGroup;
    
    const snapshot = createSnapshot(nextState);
    const newHistory = nextState.history.slice(0, nextState.historyIndex + 1);
    const previous = newHistory[newHistory.length - 1];
    if (group && previous?.group === group) {
      newHistory[newHistory.length - 1] = { ...previous, label, timestamp: Date.now(), snapshot, group };
    } else {
      newHistory.push({
        id: generateId(),
        label,
        timestamp: Date.now(),
        snapshot,
        group,
      });
    }
    
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    
    nextState.history = newHistory;
    nextState.historyIndex = newHistory.length - 1;
    nextState.isDirty = true;
  }

  return nextState;
}

/* ── Context ───────────────────────────────────────────────────────────── */

const VideoEditorContext = createContext<{
  state: VideoEditorState;
  dispatch: React.Dispatch<VideoEditorAction>;
} | null>(null);

export function VideoEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(videoEditorReducer, initialState);

  return (
    <VideoEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </VideoEditorContext.Provider>
  );
}

export function useVideoEditor() {
  const ctx = useContext(VideoEditorContext);
  if (!ctx) throw new Error('useVideoEditor must be used within a VideoEditorProvider');
  return ctx;
}
