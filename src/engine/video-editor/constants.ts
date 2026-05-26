// ═══════════════════════════════════════════════════════════════════════════
// DawnDesk Video Editor — Constants & Presets
// ═══════════════════════════════════════════════════════════════════════════

import type {
  EffectDefinition,
  TransitionDefinition,
  ExportPreset,
  ProjectSettings,
  ColorGradingState,
  TextPreset,
  VideoToolType,
} from './types';

/* ── Tool Definitions ──────────────────────────────────────────────────── */

export interface ToolDefinition {
  type: VideoToolType;
  name: string;
  shortcut: string;
  description: string;
  icon: string;         // lucide icon name
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { type: 'select',  name: 'Selection',    shortcut: 'V', description: 'Select and move clips',            icon: 'MousePointer2' },
  { type: 'razor',   name: 'Razor',        shortcut: 'C', description: 'Cut clips at any point',           icon: 'Scissors' },
  { type: 'ripple',  name: 'Ripple Edit',  shortcut: 'B', description: 'Trim and close gap',               icon: 'MoveHorizontal' },
  { type: 'roll',    name: 'Roll Edit',    shortcut: 'N', description: 'Adjust cut between clips',         icon: 'Columns2' },
  { type: 'slip',    name: 'Slip',         shortcut: 'Y', description: 'Shift content without moving',     icon: 'MoveHorizontal' },
  { type: 'slide',   name: 'Slide',        shortcut: 'U', description: 'Move clip, trim neighbors',        icon: 'ArrowLeftRight' },
  { type: 'hand',    name: 'Hand',         shortcut: 'H', description: 'Pan the timeline',                 icon: 'Hand' },
  { type: 'zoom',    name: 'Zoom',         shortcut: 'Z', description: 'Zoom in/out on timeline',          icon: 'ZoomIn' },
  { type: 'text',    name: 'Text',         shortcut: 'T', description: 'Add text overlay',                 icon: 'Type' },
  { type: 'shape',   name: 'Shape',        shortcut: 'S', description: 'Draw shapes on canvas',            icon: 'Square' },
  { type: 'pen',     name: 'Pen / Mask',   shortcut: 'P', description: 'Draw mask paths',                  icon: 'PenTool' },
  { type: 'crop',    name: 'Crop',         shortcut: 'K', description: 'Crop the frame',                   icon: 'Crop' },
];

/* ── Default Project Settings ──────────────────────────────────────────── */

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  name: 'Untitled Project',
  width: 1920,
  height: 1080,
  frameRate: 30,
  sampleRate: 48000,
  backgroundColor: '#000000',
};

export const RESOLUTION_PRESETS = [
  { label: '4K UHD',       width: 3840, height: 2160 },
  { label: '2K QHD',       width: 2560, height: 1440 },
  { label: '1080p Full HD', width: 1920, height: 1080 },
  { label: '720p HD',      width: 1280, height: 720 },
  { label: '480p SD',      width: 854,  height: 480 },
  { label: '9:16 Vertical', width: 1080, height: 1920 },
  { label: '1:1 Square',    width: 1080, height: 1080 },
  { label: '4:5 Portrait',  width: 1080, height: 1350 },
];

export const FRAME_RATE_PRESETS = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60];

/* ── Track Defaults ────────────────────────────────────────────────────── */

export const DEFAULT_VIDEO_TRACK_HEIGHT = 64;
export const DEFAULT_AUDIO_TRACK_HEIGHT = 48;
export const MIN_TRACK_HEIGHT = 32;
export const MAX_TRACK_HEIGHT = 200;

export const TRACK_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

/* ── Timeline Defaults ─────────────────────────────────────────────────── */

export const TIMELINE_MIN_ZOOM = 10;      // px per second
export const TIMELINE_MAX_ZOOM = 500;
export const TIMELINE_DEFAULT_ZOOM = 80;
export const TIMELINE_RULER_HEIGHT = 28;
export const TIMELINE_HEADER_WIDTH = 180;
export const SNAP_THRESHOLD_PX = 8;

/* ── Effect Definitions ────────────────────────────────────────────────── */

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  // Blur
  { type: 'gaussian-blur',     name: 'Gaussian Blur',      category: 'blur',    description: 'Smooth, uniform blur',              icon: 'CircleDot',    defaultParams: [{ key: 'radius', label: 'Radius', type: 'number', value: 10, min: 0, max: 100, step: 1 }] },
  { type: 'radial-blur',       name: 'Radial Blur',        category: 'blur',    description: 'Blur radiating from center',         icon: 'Sun',          defaultParams: [{ key: 'amount', label: 'Amount', type: 'number', value: 20, min: 0, max: 100, step: 1 }, { key: 'centerX', label: 'Center X', type: 'number', value: 50, min: 0, max: 100, step: 1 }, { key: 'centerY', label: 'Center Y', type: 'number', value: 50, min: 0, max: 100, step: 1 }] },
  { type: 'directional-blur',  name: 'Directional Blur',   category: 'blur',    description: 'Motion blur in one direction',       icon: 'MoveRight',    defaultParams: [{ key: 'amount', label: 'Amount', type: 'number', value: 15, min: 0, max: 100, step: 1 }, { key: 'angle', label: 'Angle', type: 'number', value: 0, min: 0, max: 360, step: 1 }] },
  // Sharpen
  { type: 'sharpen',           name: 'Sharpen',            category: 'sharpen', description: 'Increase edge contrast',             icon: 'Zap',          defaultParams: [{ key: 'amount', label: 'Amount', type: 'number', value: 50, min: 0, max: 100, step: 1 }] },
  { type: 'unsharp-mask',      name: 'Unsharp Mask',       category: 'sharpen', description: 'Professional sharpening',            icon: 'Focus',        defaultParams: [{ key: 'amount', label: 'Amount', type: 'number', value: 80, min: 0, max: 200, step: 1 }, { key: 'radius', label: 'Radius', type: 'number', value: 2, min: 0.1, max: 20, step: 0.1 }, { key: 'threshold', label: 'Threshold', type: 'number', value: 0, min: 0, max: 255, step: 1 }] },
  // Distort
  { type: 'chromatic-aberration', name: 'Chromatic Aberration', category: 'distort', description: 'RGB channel separation', icon: 'Aperture', defaultParams: [{ key: 'amount', label: 'Amount', type: 'number', value: 5, min: 0, max: 50, step: 1 }, { key: 'angle', label: 'Angle', type: 'number', value: 0, min: 0, max: 360, step: 1 }] },
  { type: 'lens-distortion',   name: 'Lens Distortion',    category: 'distort', description: 'Barrel/pincushion distortion',       icon: 'Circle',       defaultParams: [{ key: 'distortion', label: 'Distortion', type: 'number', value: 0, min: -100, max: 100, step: 1 }] },
  { type: 'mirror',            name: 'Mirror',             category: 'distort', description: 'Mirror the image',                   icon: 'FlipHorizontal', defaultParams: [{ key: 'axis', label: 'Axis', type: 'select', value: 'horizontal', options: ['horizontal', 'vertical', 'both'] }] },
  // Stylize
  { type: 'vignette',          name: 'Vignette',           category: 'stylize', description: 'Darken edges of frame',              icon: 'Eclipse',      defaultParams: [{ key: 'amount', label: 'Amount', type: 'number', value: 50, min: 0, max: 100, step: 1 }, { key: 'softness', label: 'Softness', type: 'number', value: 50, min: 0, max: 100, step: 1 }] },
  { type: 'film-grain',        name: 'Film Grain',         category: 'stylize', description: 'Add organic film noise',             icon: 'Sparkles',     defaultParams: [{ key: 'amount', label: 'Amount', type: 'number', value: 30, min: 0, max: 100, step: 1 }, { key: 'size', label: 'Size', type: 'number', value: 1, min: 0.5, max: 5, step: 0.1 }] },
  { type: 'glow',              name: 'Glow',               category: 'stylize', description: 'Add soft bloom effect',              icon: 'Lightbulb',    defaultParams: [{ key: 'intensity', label: 'Intensity', type: 'number', value: 50, min: 0, max: 100, step: 1 }, { key: 'radius', label: 'Radius', type: 'number', value: 10, min: 0, max: 50, step: 1 }, { key: 'threshold', label: 'Threshold', type: 'number', value: 50, min: 0, max: 100, step: 1 }] },
  { type: 'pixelate',          name: 'Pixelate',           category: 'stylize', description: 'Mosaic pixelation effect',            icon: 'Grid3X3',      defaultParams: [{ key: 'size', label: 'Block Size', type: 'number', value: 10, min: 2, max: 100, step: 1 }] },
  { type: 'emboss',            name: 'Emboss',             category: 'stylize', description: 'Raised edge effect',                 icon: 'Layers',       defaultParams: [{ key: 'strength', label: 'Strength', type: 'number', value: 50, min: 0, max: 100, step: 1 }, { key: 'angle', label: 'Angle', type: 'number', value: 135, min: 0, max: 360, step: 1 }] },
  { type: 'edge-detect',       name: 'Edge Detection',     category: 'stylize', description: 'Highlight edges',                    icon: 'ScanLine',     defaultParams: [{ key: 'threshold', label: 'Threshold', type: 'number', value: 50, min: 0, max: 100, step: 1 }] },
];

/* ── Transition Definitions ────────────────────────────────────────────── */

export const TRANSITION_DEFINITIONS: TransitionDefinition[] = [
  // Dissolves
  { type: 'cross-dissolve', name: 'Cross Dissolve',   category: 'Dissolve', icon: 'Blend',         description: 'Smooth blend between clips',     defaultDuration: 1.0 },
  { type: 'dip-to-black',  name: 'Dip to Black',      category: 'Dissolve', icon: 'Moon',          description: 'Fade through black',              defaultDuration: 1.0 },
  { type: 'dip-to-white',  name: 'Dip to White',      category: 'Dissolve', icon: 'Sun',           description: 'Fade through white',              defaultDuration: 1.0 },
  // Wipes
  { type: 'wipe-left',     name: 'Wipe Left',         category: 'Wipe',     icon: 'ArrowLeft',     description: 'Wipe from right to left',         defaultDuration: 0.8 },
  { type: 'wipe-right',    name: 'Wipe Right',        category: 'Wipe',     icon: 'ArrowRight',    description: 'Wipe from left to right',         defaultDuration: 0.8 },
  { type: 'wipe-up',       name: 'Wipe Up',           category: 'Wipe',     icon: 'ArrowUp',       description: 'Wipe from bottom to top',         defaultDuration: 0.8 },
  { type: 'wipe-down',     name: 'Wipe Down',         category: 'Wipe',     icon: 'ArrowDown',     description: 'Wipe from top to bottom',         defaultDuration: 0.8 },
  { type: 'wipe-diagonal', name: 'Diagonal Wipe',     category: 'Wipe',     icon: 'ArrowUpRight',  description: 'Diagonal wipe',                   defaultDuration: 0.8 },
  // Zoom
  { type: 'zoom-in',       name: 'Zoom In',           category: 'Zoom',     icon: 'ZoomIn',        description: 'Zoom into next clip',              defaultDuration: 0.6 },
  { type: 'zoom-out',      name: 'Zoom Out',          category: 'Zoom',     icon: 'ZoomOut',       description: 'Zoom out to next clip',            defaultDuration: 0.6 },
  // Motion
  { type: 'spin',          name: 'Spin',              category: 'Motion',   icon: 'RotateCw',      description: 'Spinning rotation',                defaultDuration: 0.8 },
  { type: 'slide-left',    name: 'Slide Left',        category: 'Slide',    icon: 'PanelLeft',     description: 'Slide in from left',               defaultDuration: 0.6 },
  { type: 'slide-right',   name: 'Slide Right',       category: 'Slide',    icon: 'PanelRight',    description: 'Slide in from right',              defaultDuration: 0.6 },
  { type: 'slide-up',      name: 'Slide Up',          category: 'Slide',    icon: 'PanelTop',      description: 'Slide in from top',                defaultDuration: 0.6 },
  { type: 'slide-down',    name: 'Slide Down',        category: 'Slide',    icon: 'PanelBottom',   description: 'Slide in from bottom',             defaultDuration: 0.6 },
  { type: 'push-left',     name: 'Push Left',         category: 'Push',     icon: 'ArrowLeftToLine',  description: 'Push old clip left',            defaultDuration: 0.6 },
  { type: 'push-right',    name: 'Push Right',        category: 'Push',     icon: 'ArrowRightToLine', description: 'Push old clip right',           defaultDuration: 0.6 },
  // Stylized
  { type: 'glitch',        name: 'Glitch',            category: 'Stylized', icon: 'Zap',           description: 'Digital glitch distortion',         defaultDuration: 0.5 },
  { type: 'light-leak',    name: 'Light Leak',        category: 'Stylized', icon: 'Sparkles',      description: 'Organic light leak',                defaultDuration: 1.0 },
  { type: 'film-burn',     name: 'Film Burn',         category: 'Stylized', icon: 'Flame',         description: 'Film burn edge effect',             defaultDuration: 1.0 },
  { type: 'morph-cut',     name: 'Morph Cut',         category: 'Stylized', icon: 'Wand2',         description: 'Smooth jump-cut morph',             defaultDuration: 1.0 },
];

/* ── Export Presets ─────────────────────────────────────────────────────── */

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'youtube-4k',  name: 'YouTube 4K',         platform: 'YouTube',   icon: 'Youtube',   settings: { videoCodec: 'h264', width: 3840, height: 2160, frameRate: 30, videoBitrate: 45000, audioBitrate: 320, audioCodec: 'aac' } },
  { id: 'youtube-1080', name: 'YouTube 1080p',      platform: 'YouTube',   icon: 'Youtube',   settings: { videoCodec: 'h264', width: 1920, height: 1080, frameRate: 30, videoBitrate: 16000, audioBitrate: 256, audioCodec: 'aac' } },
  { id: 'instagram',    name: 'Instagram Reel',     platform: 'Instagram', icon: 'Instagram', settings: { videoCodec: 'h264', width: 1080, height: 1920, frameRate: 30, videoBitrate: 10000, audioBitrate: 128, audioCodec: 'aac' } },
  { id: 'tiktok',       name: 'TikTok',             platform: 'TikTok',    icon: 'Music',     settings: { videoCodec: 'h264', width: 1080, height: 1920, frameRate: 30, videoBitrate: 8000,  audioBitrate: 128, audioCodec: 'aac' } },
  { id: 'twitter',      name: 'Twitter / X',        platform: 'Twitter',   icon: 'Twitter',   settings: { videoCodec: 'h264', width: 1920, height: 1080, frameRate: 30, videoBitrate: 10000, audioBitrate: 128, audioCodec: 'aac' } },
  { id: 'vimeo-4k',     name: 'Vimeo 4K',           platform: 'Vimeo',     icon: 'Film',      settings: { videoCodec: 'h264', width: 3840, height: 2160, frameRate: 24, videoBitrate: 50000, audioBitrate: 320, audioCodec: 'aac' } },
  { id: 'prores-master', name: 'ProRes Master',     platform: 'Archive',   icon: 'HardDrive', settings: { videoCodec: 'prores', width: 1920, height: 1080, frameRate: 24, videoBitrate: 150000, audioBitrate: 1411, audioCodec: 'wav' } },
  { id: 'web-general',  name: 'Web (General)',       platform: 'Web',       icon: 'Globe',     settings: { videoCodec: 'h264', width: 1920, height: 1080, frameRate: 30, videoBitrate: 8000, audioBitrate: 192, audioCodec: 'aac' } },
];

/* ── Default Color Grading ─────────────────────────────────────────────── */

export const DEFAULT_COLOR_GRADING: ColorGradingState = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temperature: 0,
  tint: 0,
  saturation: 0,
  vibrance: 0,
  hue: 0,
  lift:  { r: 0, g: 0, b: 0, master: 0 },
  gamma: { r: 0, g: 0, b: 0, master: 0 },
  gain:  { r: 0, g: 0, b: 0, master: 0 },
  curves: {
    master: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    red:    [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    green:  [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    blue:   [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  },
  hsl: {
    targetHue: 0,
    hueRange: 30,
    hueShift: 0,
    saturationShift: 0,
    luminanceShift: 0,
  },
  lutPath: null,
  lutIntensity: 1,
  vignette: {
    amount: 0,
    midpoint: 50,
    roundness: 50,
    feather: 50,
  },
};

/* ── Default Export Settings ───────────────────────────────────────────── */

export const DEFAULT_EXPORT_SETTINGS = {
  name: 'export',
  outputPath: '',
  videoCodec: 'h264' as const,
  audioCodec: 'aac' as const,
  width: 1920,
  height: 1080,
  frameRate: 30,
  bitrateMode: 'vbr-1' as const,
  videoBitrate: 16000,
  audioBitrate: 256,
  audioSampleRate: 48000,
  quality: 80,
  burnSubtitles: false,
  includeChapters: true,
  preset: null,
};

/* ── Text Presets ──────────────────────────────────────────────────────── */

export const TEXT_PRESETS: TextPreset[] = [
  { id: 'lower-third-modern', name: 'Modern Lower Third', category: 'lower-third', thumbnail: '', config: { fontFamily: 'Sora', fontSize: 24, fontWeight: 700, color: '#ffffff', backgroundColor: '#000000', backgroundOpacity: 0.6, y: 0.8, x: 0.05, alignment: 'left', animation: 'slide-up', animationDuration: 0.5 } },
  { id: 'lower-third-minimal', name: 'Minimal Lower Third', category: 'lower-third', thumbnail: '', config: { fontFamily: 'Manrope', fontSize: 20, fontWeight: 500, color: '#ffffff', backgroundColor: 'transparent', backgroundOpacity: 0, y: 0.85, x: 0.05, alignment: 'left', animation: 'fade', animationDuration: 0.4 } },
  { id: 'title-bold', name: 'Bold Title', category: 'full-screen', thumbnail: '', config: { fontFamily: 'Sora', fontSize: 64, fontWeight: 800, color: '#ffffff', backgroundColor: 'transparent', backgroundOpacity: 0, y: 0.45, x: 0.5, alignment: 'center', animation: 'scale', animationDuration: 0.6 } },
  { id: 'title-cinematic', name: 'Cinematic Title', category: 'full-screen', thumbnail: '', config: { fontFamily: 'Sora', fontSize: 48, fontWeight: 300, color: '#ffffff', letterSpacing: 8, backgroundColor: 'transparent', backgroundOpacity: 0, y: 0.45, x: 0.5, alignment: 'center', animation: 'fade', animationDuration: 1.0 } },
  { id: 'subtitle-default', name: 'Default Subtitle', category: 'subtitle', thumbnail: '', config: { fontFamily: 'Manrope', fontSize: 22, fontWeight: 500, color: '#ffffff', backgroundColor: '#000000', backgroundOpacity: 0.7, y: 0.9, x: 0.5, alignment: 'center', animation: 'fade', animationDuration: 0.2 } },
  { id: 'credits-scroll', name: 'Scrolling Credits', category: 'credits', thumbnail: '', config: { fontFamily: 'Manrope', fontSize: 18, fontWeight: 400, color: '#ffffff', backgroundColor: 'transparent', backgroundOpacity: 0, y: 0.5, x: 0.5, alignment: 'center', animation: 'slide-up', animationDuration: 0.3 } },
];

/* ── Blend Mode Labels ─────────────────────────────────────────────────── */

export const BLEND_MODE_GROUPS = [
  { label: 'Normal', modes: ['normal'] },
  { label: 'Darken', modes: ['darken', 'multiply', 'color-burn'] },
  { label: 'Lighten', modes: ['lighten', 'screen', 'color-dodge', 'add'] },
  { label: 'Contrast', modes: ['overlay', 'soft-light', 'hard-light'] },
  { label: 'Comparative', modes: ['difference', 'exclusion'] },
  { label: 'Component', modes: ['hue', 'saturation', 'color', 'luminosity'] },
];

/* ── Keyboard Shortcuts ────────────────────────────────────────────────── */

export const KEYBOARD_SHORTCUTS = {
  // Playback
  'Space':         'TOGGLE_PLAY',
  'KeyJ':          'STEP_BACKWARD',
  'KeyK':          'TOGGLE_PLAY',
  'KeyL':          'STEP_FORWARD',
  'Home':          'GO_TO_START',
  'End':           'GO_TO_END',
  // Tools
  'KeyV':          'TOOL_SELECT',
  'KeyC':          'TOOL_RAZOR',
  'KeyB':          'TOOL_RIPPLE',
  'KeyN':          'TOOL_ROLL',
  'KeyH':          'TOOL_HAND',
  'KeyZ':          'TOOL_ZOOM',
  'KeyT':          'TOOL_TEXT',
  'KeyP':          'TOOL_PEN',
  // Editing
  'Delete':        'DELETE_SELECTED',
  'Backspace':     'DELETE_SELECTED',
  'ctrl+KeyZ':     'UNDO',
  'ctrl+shift+KeyZ': 'REDO',
  'ctrl+KeyX':     'CUT',
  'ctrl+KeyC':     'COPY',
  'ctrl+KeyV':     'PASTE',
  'ctrl+KeyA':     'SELECT_ALL',
  'ctrl+KeyD':     'DESELECT_ALL',
  'ctrl+KeyS':     'SAVE',
  'ctrl+shift+KeyS': 'SAVE_AS',
  'ctrl+shift+KeyE': 'EXPORT',
  // Timeline
  'KeyS':          'TOGGLE_SNAP',
  'Equal':         'ZOOM_IN',
  'Minus':         'ZOOM_OUT',
  'ctrl+Equal':    'ZOOM_FIT',
  'KeyI':          'SET_IN_POINT',
  'KeyO':          'SET_OUT_POINT',
  'KeyM':          'ADD_MARKER',
} as const;

/* ── Clip Colors ───────────────────────────────────────────────────────── */

export const CLIP_COLORS = {
  video:  '#6366f1',    // indigo
  audio:  '#22c55e',    // green
  image:  '#f59e0b',    // amber
  text:   '#ec4899',    // pink
  shape:  '#06b6d4',    // cyan
};

/* ── Waveform Config ───────────────────────────────────────────────────── */

export const WAVEFORM_SAMPLES_PER_SECOND = 100;
export const WAVEFORM_COLOR = '#22c55e';
export const WAVEFORM_BG_COLOR = 'rgba(34, 197, 94, 0.1)';
