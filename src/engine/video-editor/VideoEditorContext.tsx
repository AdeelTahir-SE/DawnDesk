// ═══════════════════════════════════════════════════════════════════════════
// DawnDesk Video Editor — Context & Reducer
// ═══════════════════════════════════════════════════════════════════════════

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
  VideoEditorState,
  VideoEditorAction,
  Track,
  Clip,
  HistoryEntry,
  HistorySnapshot,
} from './types';
import {
  DEFAULT_COLOR_GRADING,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_VIDEO_TRACK_HEIGHT,
  DEFAULT_AUDIO_TRACK_HEIGHT,
  TIMELINE_DEFAULT_ZOOM,
  TRACK_COLORS,
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
    selectedClipIds: [...state.selectedClipIds],
    playheadTime: state.playheadTime,
  };
}

function pushHistory(state: VideoEditorState, label: string): VideoEditorState {
  const snapshot = createSnapshot(state);
  const entry: HistoryEntry = {
    id: generateId(),
    label,
    timestamp: Date.now(),
    snapshot,
  };

  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(entry);
  if (newHistory.length > MAX_HISTORY) newHistory.shift();

  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
    isDirty: true,
  };
}

function applySnapshot(state: VideoEditorState, snapshot: HistorySnapshot): VideoEditorState {
  if (!state.project) return state;
  return {
    ...state,
    project: {
      ...state.project,
      tracks: JSON.parse(JSON.stringify(snapshot.tracks)),
      markers: JSON.parse(JSON.stringify(snapshot.markers)),
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
  }
  return max;
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

  // Audio
  masterVolume: 1,

  // Mask
  activeMask: null,

  // Export
  exportSettings: { ...DEFAULT_EXPORT_SETTINGS },
  renderQueue: [],
  showExportDialog: false,

  // History
  history: [],
  historyIndex: -1,

  // UI
  showKeyframes: false,
  showWaveforms: true,
  showThumbnails: true,
  contextMenu: null,
};

/* ── Reducer ───────────────────────────────────────────────────────────── */

function videoEditorReducer(state: VideoEditorState, action: VideoEditorAction): VideoEditorState {
  switch (action.type) {

    // ── Project ─────────────────────────────────────────────────────────
    case 'NEW_PROJECT': {
      const colorIdx = 0;
      const newProject = {
        id: generateId(),
        name: action.payload.name,
        settings: { ...action.payload },
        tracks: [
          {
            id: generateId(), name: 'Video 1', type: 'video' as const,
            clips: [], muted: false, solo: false, locked: false, visible: true,
            volume: 1, height: DEFAULT_VIDEO_TRACK_HEIGHT, color: TRACK_COLORS[colorIdx],
          },
          {
            id: generateId(), name: 'Video 2', type: 'video' as const,
            clips: [], muted: false, solo: false, locked: false, visible: true,
            volume: 1, height: DEFAULT_VIDEO_TRACK_HEIGHT, color: TRACK_COLORS[colorIdx + 1],
          },
          {
            id: generateId(), name: 'Audio 1', type: 'audio' as const,
            clips: [], muted: false, solo: false, locked: false, visible: true,
            volume: 1, height: DEFAULT_AUDIO_TRACK_HEIGHT, color: TRACK_COLORS[colorIdx + 2],
          },
          {
            id: generateId(), name: 'Audio 2', type: 'audio' as const,
            clips: [], muted: false, solo: false, locked: false, visible: true,
            volume: 1, height: DEFAULT_AUDIO_TRACK_HEIGHT, color: TRACK_COLORS[colorIdx + 3],
          },
        ],
        mediaPool: [],
        mediaFolders: [],
        markers: [],
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        duration: 0,
        notes: '',
      };
      return {
        ...initialState,
        project: newProject,
        isDirty: false,
        history: [],
        historyIndex: -1,
      };
    }

    case 'LOAD_PROJECT':
      return {
        ...initialState,
        project: action.payload,
        isDirty: false,
        history: [],
        historyIndex: -1,
      };

    case 'SET_PROJECT_NAME':
      if (!state.project) return state;
      return { ...state, project: { ...state.project, name: action.payload }, isDirty: true };

    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload };

    // ── Playback ────────────────────────────────────────────────────────
    case 'SET_PLAYHEAD':
      return { ...state, playheadTime: Math.max(0, action.payload) };

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
      const label = action.payload.type === 'video' ? 'Video' : 'Audio';
      const newTrack: Track = {
        id: generateId(),
        name: `${label} ${trackCount + 1}`,
        type: action.payload.type,
        clips: [],
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
      };
    }

    case 'REMOVE_TRACK': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Remove track');
      return {
        ...s,
        project: { ...s.project!, tracks: s.project!.tracks.filter(t => t.id !== action.payload) },
        selectedTrackId: s.selectedTrackId === action.payload ? null : s.selectedTrackId,
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
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map(t => t.id === action.payload ? { ...t, muted: !t.muted } : t),
        },
      };
    }

    case 'TOGGLE_TRACK_SOLO': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map(t => t.id === action.payload ? { ...t, solo: !t.solo } : t),
        },
      };
    }

    case 'TOGGLE_TRACK_LOCK': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map(t => t.id === action.payload ? { ...t, locked: !t.locked } : t),
        },
      };
    }

    case 'TOGGLE_TRACK_VISIBILITY': {
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map(t => t.id === action.payload ? { ...t, visible: !t.visible } : t),
        },
      };
    }

    case 'SET_TRACK_VOLUME': {
      if (!state.project) return state;
      return {
        ...state,
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
      return { ...state, project: { ...state.project, tracks: reordered } };
    }

    // ── Clips ───────────────────────────────────────────────────────────
    case 'ADD_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Add clip');
      const tracks = s.project!.tracks.map(t => {
        if (t.id !== action.payload.trackId) return t;
        return { ...t, clips: [...t.clips, action.payload.clip] };
      });
      const duration = calculateProjectDuration(tracks);
      return { ...s, project: { ...s.project!, tracks, duration } };
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

    case 'MOVE_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Move clip');
      const found = findClipInTracks(s.project!.tracks, action.payload.clipId);
      if (!found) return s;
      const movedClip = { ...found.clip, trackId: action.payload.trackId, startTime: Math.max(0, action.payload.startTime) };
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

    case 'TRIM_CLIP_START': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Trim clip start');
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => {
        const delta = action.payload.newStartTime - clip.startTime;
        return {
          ...clip,
          startTime: action.payload.newStartTime,
          duration: clip.duration - delta,
          inPoint: action.payload.newInPoint,
        };
      });
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'TRIM_CLIP_END': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Trim clip end');
      const tracks = updateClipInTracks(s.project!.tracks, action.payload.clipId, clip => ({
        ...clip,
        duration: action.payload.newDuration,
        outPoint: action.payload.newOutPoint,
      }));
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    case 'SPLIT_CLIP': {
      if (!state.project) return state;
      const s = pushHistory(state, 'Split clip');
      const found = findClipInTracks(s.project!.tracks, action.payload.clipId);
      if (!found) return s;
      const { clip } = found;
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
        speed: action.payload.speed,
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
        volume: action.payload.volume,
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'SET_CLIP_OPACITY': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        opacity: action.payload.opacity,
      }));
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
      const tracks = s.project!.tracks.map(t => {
        if (t.id !== found.track.id) return t;
        return { ...t, clips: [...t.clips, duped] };
      });
      return { ...s, project: { ...s.project!, tracks, duration: calculateProjectDuration(tracks) } };
    }

    // ── Effects ──────────────────────────────────────────────────────────
    case 'ADD_EFFECT': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: [...clip.effects, action.payload.effect],
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'REMOVE_EFFECT': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: clip.effects.filter(e => e.id !== action.payload.effectId),
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
    }

    case 'UPDATE_EFFECT_PARAM': {
      if (!state.project) return state;
      const tracks = updateClipInTracks(state.project.tracks, action.payload.clipId, clip => ({
        ...clip,
        effects: clip.effects.map(e => {
          if (e.id !== action.payload.effectId) return e;
          return {
            ...e,
            params: e.params.map(p => p.key === action.payload.paramKey ? { ...p, value: action.payload.value } : p),
          };
        }),
      }));
      return { ...state, project: { ...state.project, tracks }, isDirty: true };
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
    case 'ADD_MEDIA':
      if (!state.project) return state;
      return {
        ...state,
        project: { ...state.project, mediaPool: [...state.project.mediaPool, action.payload] },
      };

    case 'ADD_MEDIA_BATCH':
      if (!state.project) return state;
      return {
        ...state,
        project: { ...state.project, mediaPool: [...state.project.mediaPool, ...action.payload] },
      };

    case 'REMOVE_MEDIA':
      if (!state.project) return state;
      const removeSet = new Set(action.payload);
      return {
        ...state,
        project: {
          ...state.project,
          mediaPool: state.project.mediaPool.filter(m => !removeSet.has(m.id)),
        },
        selectedMediaIds: state.selectedMediaIds.filter(id => !removeSet.has(id)),
      };

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
      return { ...state, selectedClipIds: action.payload };

    case 'ADD_TO_SELECTION':
      return { ...state, selectedClipIds: [...new Set([...state.selectedClipIds, ...action.payload])] };

    case 'DESELECT_ALL':
      return { ...state, selectedClipIds: [], selectedTrackId: null, selectedMediaIds: [], selectedEffectId: null };

    case 'SELECT_TRACK':
      return { ...state, selectedTrackId: action.payload };

    case 'SELECT_MEDIA':
      return { ...state, selectedMediaIds: action.payload };

    case 'SELECT_EFFECT':
      return { ...state, selectedEffectId: action.payload };

    // ── View ────────────────────────────────────────────────────────────
    case 'SET_TIMELINE_ZOOM':
      return { ...state, timelineZoom: Math.max(10, Math.min(500, action.payload)) };

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

    // ── Audio ───────────────────────────────────────────────────────────
    case 'SET_MASTER_VOLUME':
      return { ...state, masterVolume: action.payload };

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

    // ── History ──────────────────────────────────────────────────────────
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const prevEntry = state.history[state.historyIndex - 1];
      return applySnapshot({ ...state, historyIndex: state.historyIndex - 1 }, prevEntry.snapshot);
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextEntry = state.history[state.historyIndex + 1];
      return applySnapshot({ ...state, historyIndex: state.historyIndex + 1 }, nextEntry.snapshot);
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

    case 'SET_CONTEXT_MENU':
      return { ...state, contextMenu: action.payload };

    case 'CLOSE_CONTEXT_MENU':
      return { ...state, contextMenu: null };

    default:
      return state;
  }
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
