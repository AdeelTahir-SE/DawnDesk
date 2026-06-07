// ═══════════════════════════════════════════════════════════════════════════
// DawnDesk Video Editor — Core Types
// ═══════════════════════════════════════════════════════════════════════════

/* ── Tool Types ────────────────────────────────────────────────────────── */

export type VideoToolType =
  | 'select'
  | 'razor'
  | 'slip'
  | 'slide'
  | 'ripple'
  | 'roll'
  | 'hand'
  | 'zoom'
  | 'text'
  | 'shape'
  | 'crop'
  | 'pen';

/* ── Media Types ───────────────────────────────────────────────────────── */

export type MediaType = 'video' | 'audio' | 'image';

export type MediaRating = 0 | 1 | 2 | 3 | 4 | 5;

export type FlagColor = 'none' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export interface MediaItem {
  id: string;
  name: string;
  path: string;
  type: MediaType;
  duration: number;        // seconds
  width: number;
  height: number;
  fps: number;
  codec: string;
  fileSize: number;        // bytes
  thumbnail: string;       // base64 or path
  timelineThumbnails?: TimelineThumbnail[];
  waveformData: number[];  // normalized peaks 0-1
  dateAdded: number;       // timestamp
  rating: MediaRating;
  flag: FlagColor;
  tags: string[];
  inPoint: number;
  outPoint: number;
  folderId: string | null;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
}

/* ── Track Types ───────────────────────────────────────────────────────── */

export type TrackType = 'video' | 'audio' | 'effect';

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  effects?: TimelineEffect[];
  muted: boolean;
  solo: boolean;
  locked: boolean;
  visible: boolean;       // for video tracks
  volume: number;         // 0-1 for audio tracks
  height: number;         // px
  color: string;
}

/* ── Clip Types ────────────────────────────────────────────────────────── */

export interface Clip {
  id: string;
  trackId: string;
  mediaId: string;
  mediaName: string;
  mediaType: MediaType;
  waveformData?: number[];
  timelineThumbnails?: TimelineThumbnail[];
  startTime: number;      // position on timeline (seconds)
  duration: number;       // visible duration on timeline
  inPoint: number;        // source in point
  outPoint: number;       // source out point
  speed: number;          // 1.0 = normal
  reversed: boolean;
  volume: number;         // 0-2 (for audio)
  opacity: number;        // 0-1 (for video)
  positionX: number;      // normalized -1 to 1, 0 = center
  positionY: number;      // normalized -1 to 1, 0 = center
  scale: number;          // 0.1-4
  rotation: number;       // degrees
  crop?: {
    left: number;          // 0-0.9, source percentage
    right: number;
    top: number;
    bottom: number;
  };
  effects: Effect[];
  transition: ClipTransition | null;
  color: string;
  locked: boolean;
  label: string;
  blendMode?: BlendMode;
  groupId?: string;
  path?: string;
}

export interface TimelineThumbnail {
  time: number;
  src: string;
}

/* ── Effect Types ──────────────────────────────────────────────────────── */

export type EffectCategory =
  | 'blur'
  | 'sharpen'
  | 'distort'
  | 'stylize'
  | 'color'
  | 'generate'
  | 'keying'
  | 'perspective'
  | 'time'
  | 'audio';

export interface EffectParam {
  key: string;
  label: string;
  type: 'number' | 'color' | 'boolean' | 'select' | 'point' | 'text';
  value: number | string | boolean | { x: number; y: number };
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface Effect {
  id: string;
  type: string;
  name: string;
  category: EffectCategory;
  enabled: boolean;
  params: EffectParam[];
  keyframes: Keyframe[];
  expanded: boolean;
  startOffset?: number;
  duration?: number;
}

export interface TimelineEffect extends Effect {
  trackId: string;
  startTime: number;
  duration: number;
  targetMode: 'all-visible' | 'track-below' | 'selected-clip';
  targetClipId?: string | null;
}

export interface EffectDefinition {
  type: string;
  name: string;
  category: EffectCategory;
  description: string;
  icon: string;
  defaultParams: EffectParam[];
}

/* ── Transition Types ──────────────────────────────────────────────────── */

export type TransitionType =
  | 'cross-dissolve'
  | 'dip-to-black'
  | 'dip-to-white'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'
  | 'wipe-diagonal'
  | 'zoom-in'
  | 'zoom-out'
  | 'spin'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'push-left'
  | 'push-right'
  | 'glitch'
  | 'light-leak'
  | 'film-burn'
  | 'morph-cut';

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface ClipTransition {
  id: string;
  type: TransitionType;
  duration: number;
  easing: EasingType;
  edge: 'start' | 'end';
}

export interface TransitionDefinition {
  type: TransitionType;
  name: string;
  category: string;
  icon: string;
  description: string;
  defaultDuration: number;
}

/* ── Keyframe Types ────────────────────────────────────────────────────── */

export type KeyframeInterpolation = 'linear' | 'bezier' | 'hold' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface Keyframe {
  id: string;
  time: number;
  value: number | string | boolean | { x: number; y: number };
  property: string;
  interpolation: KeyframeInterpolation;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

/* ── Marker Types ──────────────────────────────────────────────────────── */

export type MarkerColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'white';

export interface Marker {
  id: string;
  time: number;
  label: string;
  color: MarkerColor;
  duration: number;
  comment: string;
}

/* ── Color Grading Types ───────────────────────────────────────────────── */

export interface ColorWheelValues {
  r: number;  // -1 to 1
  g: number;
  b: number;
  master: number;  // luminance offset
}

export interface ColorGradingState {
  // Basic corrections
  exposure: number;       // -5 to 5
  contrast: number;       // -100 to 100
  highlights: number;     // -100 to 100
  shadows: number;        // -100 to 100
  whites: number;         // -100 to 100
  blacks: number;         // -100 to 100
  // Color
  temperature: number;    // -100 to 100 (cool to warm)
  tint: number;           // -100 to 100 (green to magenta)
  saturation: number;     // -100 to 100
  vibrance: number;       // -100 to 100
  hue: number;            // -180 to 180
  // Wheels
  lift: ColorWheelValues;
  gamma: ColorWheelValues;
  gain: ColorWheelValues;
  // Curves
  curves: CurvesState;
  // HSL
  hsl: HSLState;
  // LUT
  lutPath: string | null;
  lutIntensity: number;   // 0 to 1
  // Vignette
  vignette: {
    amount: number;
    midpoint: number;
    roundness: number;
    feather: number;
  };
}

export interface CurvesState {
  master: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface CurvePoint {
  x: number;  // 0-1
  y: number;  // 0-1
}

export interface HSLState {
  // Per hue range adjustments
  targetHue: number;        // 0-360
  hueRange: number;         // degrees
  hueShift: number;         // -180 to 180
  saturationShift: number;  // -100 to 100
  luminanceShift: number;   // -100 to 100
}

/* ── Text Types ────────────────────────────────────────────────────────── */

export type TextAlignment = 'left' | 'center' | 'right';
export type TextAnimation = 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'typewriter' | 'bounce' | 'scale' | 'blur';

export interface TextOverlay {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  alignment: TextAlignment;
  lineHeight: number;
  letterSpacing: number;
  x: number;            // normalized 0-1
  y: number;
  width: number;
  rotation: number;
  opacity: number;
  shadow: {
    enabled: boolean;
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
  };
  outline: {
    enabled: boolean;
    color: string;
    width: number;
  };
  animation: TextAnimation;
  animationDuration: number;
}

export interface TextPreset {
  id: string;
  name: string;
  category: 'lower-third' | 'full-screen' | 'credits' | 'subtitle' | 'custom';
  thumbnail: string;
  config: Partial<TextOverlay>;
}

export interface SubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  x: number;
  y: number;
}

/* ── Audio Types ───────────────────────────────────────────────────────── */

export interface AudioEQ {
  enabled: boolean;
  bands: EQBand[];
}

export interface EQBand {
  frequency: number;  // Hz
  gain: number;       // dB (-12 to 12)
  q: number;          // bandwidth
}

export interface AudioEffects {
  eq: AudioEQ;
  compressor: {
    enabled: boolean;
    threshold: number;   // dB
    ratio: number;
    attack: number;      // ms
    release: number;     // ms
    makeupGain: number;  // dB
  };
  reverb: {
    enabled: boolean;
    mix: number;         // 0-1
    decay: number;       // seconds
    preDelay: number;    // ms
  };
  noise: {
    enabled: boolean;
    reduction: number;   // dB
    threshold: number;
  };
}

/* ── Mask Types ────────────────────────────────────────────────────────── */

export type MaskType = 'rectangle' | 'ellipse' | 'freehand' | 'pen';

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion'
  | 'hue' | 'saturation' | 'color' | 'luminosity' | 'add';

export interface Mask {
  id: string;
  type: MaskType;
  points: { x: number; y: number }[];
  feather: number;
  opacity: number;
  inverted: boolean;
  expansion: number;
  keyframes: Keyframe[];
  chromaKey?: {
    enabled: boolean;
    keyColor: string;
    tolerance: number;
    edgeSoft: number;
    spillSuppression: number;
  };
}

/* ── Export Types ───────────────────────────────────────────────────────── */

export type VideoCodec = 'h264' | 'h265' | 'prores' | 'av1' | 'dnxhd' | 'vp9';
export type AudioCodec = 'aac' | 'mp3' | 'wav' | 'flac' | 'opus';
export type BitrateMode = 'cbr' | 'vbr-1' | 'vbr-2';

export interface ExportSettings {
  name: string;
  outputPath: string;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  width: number;
  height: number;
  frameRate: number;
  bitrateMode: BitrateMode;
  videoBitrate: number;       // kbps
  audioBitrate: number;       // kbps
  audioSampleRate: number;    // Hz
  quality: number;            // 1-100 (for VBR)
  burnSubtitles: boolean;
  includeChapters: boolean;
  preset: string | null;      // platform preset name
}

export interface ExportPreset {
  id: string;
  name: string;
  platform: string;
  icon: string;
  settings: Partial<ExportSettings>;
}

export interface RenderJob {
  id: string;
  name: string;
  settings: ExportSettings;
  status: 'queued' | 'rendering' | 'complete' | 'error' | 'cancelled';
  progress: number;      // 0-1
  startTime: number | null;
  endTime: number | null;
  error: string | null;
  outputPath: string;
}

/* ── Project Types ─────────────────────────────────────────────────────── */

export interface ProjectSettings {
  name: string;
  width: number;
  height: number;
  frameRate: number;
  sampleRate: number;
  backgroundColor: string;
}

export interface Project {
  id: string;
  name: string;
  settings: ProjectSettings;
  tracks: Track[];
  mediaPool: MediaItem[];
  mediaFolders: MediaFolder[];
  markers: Marker[];
  subtitles?: SubtitleCue[];
  createdAt: number;
  modifiedAt: number;
  duration: number;
  notes: string;
}

/* ── History Types ─────────────────────────────────────────────────────── */

export interface HistoryEntry {
  id: string;
  label: string;
  timestamp: number;
  snapshot: HistorySnapshot;
  group?: string;
}

export interface HistorySnapshot {
  tracks: Track[];
  markers: Marker[];
  subtitles: SubtitleCue[];
  mediaPool: MediaItem[];
  selectedClipIds: string[];
  playheadTime: number;
}

/* ── Editor State ──────────────────────────────────────────────────────── */

export type RightPanelTab = 'properties' | 'effects' | 'color' | 'text' | 'audio' | 'mask';
export type LeftPanelTab = 'media' | 'effects' | 'transitions';
export type ScopeType = 'waveform' | 'vectorscope' | 'histogram' | 'parade';
export type AutoEditPreset = 'quick-cleanup' | 'smart-trim' | 'smooth-transitions' | 'visual-polish' | 'audio-balance' | 'product-finish';

export interface FFmpegStatus {
  available: boolean;
  error: string | null;
}

export interface MediaProbeResult {
  duration: number;
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
  file_size?: number;
  has_audio: boolean;
  has_video: boolean;
}

export interface VideoEditorState {
  // Project
  project: Project | null;
  projectPath: string | null;
  isDirty: boolean;

  // Playback
  playheadTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  isLooping: boolean;
  inPoint: number | null;
  outPoint: number | null;

  // Tools
  activeTool: VideoToolType;
  snapEnabled: boolean;
  magneticTimeline: boolean;

  // Selection
  selectedClipIds: string[];
  selectedTrackId: string | null;
  selectedMediaIds: string[];
  selectedEffectId: string | null;
  selectedTimelineEffectId: string | null;

  // View
  timelineZoom: number;           // pixels per second
  timelineScrollX: number;
  timelineScrollY: number;
  previewZoom: number;
  showSafeZones: boolean;

  // Panels
  activeRightPanel: RightPanelTab;
  leftPanelTab: LeftPanelTab;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  scopeType: ScopeType;

  // Color grading
  colorGrading: ColorGradingState;

  // Text
  activeTextOverlay: TextOverlay | null;

  // Audio
  masterVolume: number;
  audioEffects: AudioEffects;

  // Mask
  activeMask: Mask | null;

  // Export
  exportSettings: ExportSettings;
  renderQueue: RenderJob[];
  showExportDialog: boolean;
  isExporting: boolean;
  exportProgress: number;
  exportError: string | null;

  // FFmpeg
  ffmpegStatus: FFmpegStatus;

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // UI
  showKeyframes: boolean;
  showWaveforms: boolean;
  showThumbnails: boolean;
  isImporting: boolean;
  contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null;
  clipboard: Clip[];
  showProjectSettings: boolean;
  showNewProjectModal: boolean;
  _historyLabel?: string;
  _historyGroup?: string;
}

export interface ContextMenuItem {
  label: string;
  action: string;
  shortcut?: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
  children?: ContextMenuItem[];
}

/* ── Editor Actions ────────────────────────────────────────────────────── */

export type VideoEditorAction =
  // Project
  | { type: 'NEW_PROJECT'; payload: { project: Project; projectPath?: string | null } }
  | { type: 'LOAD_PROJECT'; payload: Project }
  | { type: 'CLOSE_PROJECT' }
  | { type: 'SET_PROJECT_NAME'; payload: string }
  | { type: 'SET_PROJECT_PATH'; payload: string | null }
  | { type: 'SET_DIRTY'; payload: boolean }

  // Playback
  | { type: 'SET_PLAYHEAD'; payload: number }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'STOP' }
  | { type: 'STEP_FORWARD' }
  | { type: 'STEP_BACKWARD' }
  | { type: 'SET_PLAYBACK_SPEED'; payload: number }
  | { type: 'TOGGLE_LOOP' }
  | { type: 'SET_IN_POINT'; payload: number | null }
  | { type: 'SET_OUT_POINT'; payload: number | null }

  // Tools
  | { type: 'SET_TOOL'; payload: VideoToolType }
  | { type: 'TOGGLE_SNAP' }
  | { type: 'TOGGLE_MAGNETIC' }

  // Tracks
  | { type: 'ADD_TRACK'; payload: { type: TrackType; index?: number } }
  | { type: 'REMOVE_TRACK'; payload: string }
  | { type: 'RENAME_TRACK'; payload: { trackId: string; name: string } }
  | { type: 'TOGGLE_TRACK_MUTE'; payload: string }
  | { type: 'TOGGLE_TRACK_SOLO'; payload: string }
  | { type: 'TOGGLE_TRACK_LOCK'; payload: string }
  | { type: 'TOGGLE_TRACK_VISIBILITY'; payload: string }
  | { type: 'SET_TRACK_VOLUME'; payload: { trackId: string; volume: number } }
  | { type: 'SET_TRACK_HEIGHT'; payload: { trackId: string; height: number } }
  | { type: 'REORDER_TRACKS'; payload: string[] }

  // Clips
  | { type: 'ADD_CLIP'; payload: { trackId: string; clip: Clip } }
  | { type: 'ADD_MEDIA_TO_NEW_TRACK'; payload: { media: MediaItem; startTime: number } }
  | { type: 'REMOVE_CLIPS'; payload: string[] }
  | { type: 'RIPPLE_DELETE_CLIPS'; payload: string[] }
  | { type: 'DELETE_TIMELINE_GAPS'; payload?: { trackId?: string } }
  | { type: 'INSERT_TIMELINE_GAP'; payload: { time: number; duration: number; trackId?: string } }
  | { type: 'GROUP_SELECTED_CLIPS' }
  | { type: 'UNGROUP_SELECTED_CLIPS' }
  | { type: 'MOVE_CLIP'; payload: { clipId: string; trackId: string; startTime: number } }
  | { type: 'MOVE_SELECTED_CLIPS'; payload: { anchorClipId: string; delta: number } }
  | { type: 'TRIM_SELECTED_CLIPS'; payload: { anchorClipId: string; edge: 'start' | 'end'; delta: number } }
  | { type: 'RIPPLE_MOVE_CLIP'; payload: { clipId: string; trackId: string; startTime: number } }
  | { type: 'ROLL_EDIT_CLIP'; payload: { clipId: string; edge: 'start' | 'end'; delta: number } }
  | { type: 'SLIP_CLIP'; payload: { clipId: string; delta: number } }
  | { type: 'SLIDE_CLIP'; payload: { clipId: string; trackId: string; startTime: number } }
  | { type: 'TRIM_CLIP_START'; payload: { clipId: string; newStartTime: number; newInPoint: number } }
  | { type: 'TRIM_CLIP_END'; payload: { clipId: string; newDuration: number; newOutPoint: number } }
  | { type: 'SPLIT_CLIP'; payload: { clipId: string; time: number } }
  | { type: 'SET_CLIP_SPEED'; payload: { clipId: string; speed: number } }
  | { type: 'TOGGLE_CLIP_REVERSE'; payload: string }
  | { type: 'SET_CLIP_VOLUME'; payload: { clipId: string; volume: number } }
  | { type: 'SET_CLIP_OPACITY'; payload: { clipId: string; opacity: number } }
  | { type: 'SET_CLIP_TRANSFORM'; payload: { clipId: string; positionX?: number; positionY?: number; scale?: number; rotation?: number } }
  | { type: 'SET_CLIP_CROP'; payload: { clipId: string; crop: Partial<NonNullable<Clip['crop']>> } }
  | { type: 'SET_CLIP_LABEL'; payload: { clipId: string; label: string } }
  | { type: 'SET_CLIP_COLOR'; payload: { clipId: string; color: string } }
  | { type: 'SET_CLIP_BLEND_MODE'; payload: { clipId: string; blendMode: BlendMode } }
  | { type: 'DUPLICATE_CLIP'; payload: string }

  // Effects
  | { type: 'ADD_EFFECT'; payload: { clipId: string; effect: Effect } }
  | { type: 'REMOVE_EFFECT'; payload: { clipId: string; effectId: string } }
  | { type: 'UPDATE_EFFECT_PARAM'; payload: { clipId: string; effectId: string; paramKey: string; value: any } }
  | { type: 'UPDATE_EFFECT_TIMING'; payload: { clipId: string; effectId: string; startOffset?: number; duration?: number } }
  | { type: 'ADD_EFFECT_KEYFRAME'; payload: { clipId: string; effectId: string; keyframe: Keyframe } }
  | { type: 'UPDATE_EFFECT_KEYFRAME'; payload: { clipId: string; effectId: string; keyframeId: string; updates: Partial<Keyframe> } }
  | { type: 'REMOVE_EFFECT_KEYFRAME'; payload: { clipId: string; effectId: string; keyframeId: string } }
  | { type: 'REORDER_EFFECT_KEYFRAMES'; payload: { clipId: string; effectId: string; keyframeIds: string[] } }
  | { type: 'TOGGLE_EFFECT'; payload: { clipId: string; effectId: string } }
  | { type: 'REORDER_EFFECTS'; payload: { clipId: string; effectIds: string[] } }
  | { type: 'ADD_TIMELINE_EFFECT'; payload: { trackId: string; effect: TimelineEffect } }
  | { type: 'REMOVE_TIMELINE_EFFECT'; payload: string }
  | { type: 'MOVE_TIMELINE_EFFECT'; payload: { effectId: string; trackId: string; startTime: number } }
  | { type: 'TRIM_TIMELINE_EFFECT_START'; payload: { effectId: string; newStartTime: number } }
  | { type: 'TRIM_TIMELINE_EFFECT_END'; payload: { effectId: string; newDuration: number } }
  | { type: 'UPDATE_TIMELINE_EFFECT_PARAM'; payload: { effectId: string; paramKey: string; value: any } }
  | { type: 'TOGGLE_TIMELINE_EFFECT'; payload: string }

  // Transitions
  | { type: 'ADD_TRANSITION'; payload: { clipId: string; transition: ClipTransition } }
  | { type: 'REMOVE_TRANSITION'; payload: string }
  | { type: 'UPDATE_TRANSITION'; payload: { clipId: string; transition: Partial<ClipTransition> } }

  // Media
  | { type: 'ADD_MEDIA'; payload: MediaItem }
  | { type: 'ADD_MEDIA_BATCH'; payload: MediaItem[] }
  | { type: 'REMOVE_MEDIA'; payload: string[] }
  | { type: 'UPDATE_MEDIA'; payload: { mediaId: string; updates: Partial<MediaItem> } }
  | { type: 'ADD_MEDIA_FOLDER'; payload: MediaFolder }
  | { type: 'REMOVE_MEDIA_FOLDER'; payload: string }
  | { type: 'MOVE_MEDIA_TO_FOLDER'; payload: { mediaIds: string[]; folderId: string | null } }

  // Selection
  | { type: 'SELECT_CLIPS'; payload: string[] }
  | { type: 'ADD_TO_SELECTION'; payload: string[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'SELECT_TRACK'; payload: string | null }
  | { type: 'SELECT_MEDIA'; payload: string[] }
  | { type: 'SELECT_EFFECT'; payload: string | null }
  | { type: 'SELECT_TIMELINE_EFFECT'; payload: string | null }

  // View
  | { type: 'SET_TIMELINE_ZOOM'; payload: number }
  | { type: 'ZOOM_TO_FIT' }
  | { type: 'SET_TIMELINE_SCROLL'; payload: { x?: number; y?: number } }
  | { type: 'SET_PREVIEW_ZOOM'; payload: number }
  | { type: 'TOGGLE_SAFE_ZONES' }

  // Panels
  | { type: 'SET_RIGHT_PANEL'; payload: RightPanelTab }
  | { type: 'SET_LEFT_PANEL_TAB'; payload: LeftPanelTab }
  | { type: 'TOGGLE_LEFT_PANEL' }
  | { type: 'TOGGLE_RIGHT_PANEL' }
  | { type: 'SET_SCOPE_TYPE'; payload: ScopeType }

  // Color grading
  | { type: 'SET_COLOR_GRADING'; payload: Partial<ColorGradingState> }
  | { type: 'RESET_COLOR_GRADING' }
  | { type: 'SET_COLOR_WHEEL'; payload: { wheel: 'lift' | 'gamma' | 'gain'; values: Partial<ColorWheelValues> } }
  | { type: 'SET_CURVE_POINTS'; payload: { channel: keyof CurvesState; points: CurvePoint[] } }

  // Text
  | { type: 'SET_TEXT_OVERLAY'; payload: TextOverlay | null }
  | { type: 'UPDATE_TEXT_OVERLAY'; payload: Partial<TextOverlay> }
  | { type: 'ADD_SUBTITLE_CUE'; payload: SubtitleCue }
  | { type: 'UPDATE_SUBTITLE_CUE'; payload: { cueId: string; updates: Partial<SubtitleCue> } }
  | { type: 'REMOVE_SUBTITLE_CUE'; payload: string }

  // Audio
  | { type: 'SET_MASTER_VOLUME'; payload: number }
  | { type: 'SET_AUDIO_EFFECTS'; payload: Partial<AudioEffects> }

  // Mask
  | { type: 'SET_MASK'; payload: Mask | null }
  | { type: 'UPDATE_MASK'; payload: Partial<Mask> }

  // Markers
  | { type: 'ADD_MARKER'; payload: Marker }
  | { type: 'REMOVE_MARKER'; payload: string }
  | { type: 'UPDATE_MARKER'; payload: { markerId: string; updates: Partial<Marker> } }

  // Export
  | { type: 'SET_EXPORT_SETTINGS'; payload: Partial<ExportSettings> }
  | { type: 'TOGGLE_EXPORT_DIALOG' }
  | { type: 'ADD_RENDER_JOB'; payload: RenderJob }
  | { type: 'UPDATE_RENDER_JOB'; payload: { jobId: string; updates: Partial<RenderJob> } }
  | { type: 'REMOVE_RENDER_JOB'; payload: string }
  | { type: 'EXPORT_START' }
  | { type: 'EXPORT_PROGRESS'; payload: number }
  | { type: 'EXPORT_COMPLETE' }
  | { type: 'EXPORT_ERROR'; payload: string }
  | { type: 'SET_FFMPEG_STATUS'; payload: FFmpegStatus }

  // History
  | { type: 'APPLY_AUTO_EDIT'; payload: { preset: AutoEditPreset; clipIds?: string[] } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'PUSH_HISTORY'; payload: { label: string } }

  // Clipboard
  | { type: 'COPY' }
  | { type: 'PASTE' }

  // UI
  | { type: 'TOGGLE_KEYFRAMES' }
  | { type: 'TOGGLE_WAVEFORMS' }
  | { type: 'TOGGLE_THUMBNAILS' }
  | { type: 'SET_IMPORTING'; payload: boolean }
  | { type: 'TOGGLE_PROJECT_SETTINGS' }
  | { type: 'TOGGLE_NEW_PROJECT_MODAL' }
  | { type: 'SET_CONTEXT_MENU'; payload: VideoEditorState['contextMenu'] }
  | { type: 'CLOSE_CONTEXT_MENU' };
