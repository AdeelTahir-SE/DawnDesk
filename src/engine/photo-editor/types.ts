// ─── Tool Types ───────────────────────────────────────────────────────────────

export type ToolType =
  | 'move'
  | 'marquee-rect'
  | 'marquee-ellipse'
  | 'lasso'
  | 'polygon-lasso'
  | 'magic-wand'
  | 'quick-selection'
  | 'crop'
  | 'eyedropper'
  | 'brush'
  | 'pencil'
  | 'eraser'
  | 'gradient'
  | 'clone-stamp'
  | 'healing-brush'
  | 'spot-heal'
  | 'text'
  | 'shape-rect'
  | 'shape-ellipse'
  | 'line'
  | 'pen-path'
  | 'polygon'
  | 'custom-shape'
  | 'hand'
  | 'zoom';

export interface ToolDefinition {
  type: ToolType;
  name: string;
  shortcut: string;
  description: string;
  cursor?: string;
}

// ─── Adjustments ──────────────────────────────────────────────────────────────

export interface AdjustmentState {
  exposure: number;     // -5.0 to +5.0
  contrast: number;     // -100 to +100
  highlights: number;   // -100 to +100
  shadows: number;      // -100 to +100
  whites: number;       // -100 to +100
  blacks: number;       // -100 to +100
  brightness: number;   // -100 to +100
  hue: number;          // -180 to +180
  saturation: number;   // -100 to +100
  lightness: number;    // -100 to +100
  levelsBlack: number;  // 0 to 254
  levelsMid: number;    // 0.1 to 9.99
  levelsWhite: number;  // 1 to 255
  curveAmount: number;  // -100 to +100
  colorBalanceCyanRed: number;      // -100 to +100
  colorBalanceMagentaGreen: number; // -100 to +100
  colorBalanceYellowBlue: number;   // -100 to +100
  vibrance: number;     // -100 to +100
  selectiveRed: number; // -100 to +100
  selectiveGreen: number;
  selectiveBlue: number;
  channelRedFromGreen: number;   // -100 to +100
  channelRedFromBlue: number;
  channelGreenFromRed: number;
  channelGreenFromBlue: number;
  channelBlueFromRed: number;
  channelBlueFromGreen: number;
  lutPreset: number;             // 0 none, 1 cinema, 2 matte, 3 cool
}

export const DEFAULT_ADJUSTMENTS: AdjustmentState = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  brightness: 0,
  hue: 0,
  saturation: 0,
  lightness: 0,
  levelsBlack: 0,
  levelsMid: 1,
  levelsWhite: 255,
  curveAmount: 0,
  colorBalanceCyanRed: 0,
  colorBalanceMagentaGreen: 0,
  colorBalanceYellowBlue: 0,
  vibrance: 0,
  selectiveRed: 0,
  selectiveGreen: 0,
  selectiveBlue: 0,
  channelRedFromGreen: 0,
  channelRedFromBlue: 0,
  channelGreenFromRed: 0,
  channelGreenFromBlue: 0,
  channelBlueFromRed: 0,
  channelBlueFromGreen: 0,
  lutPreset: 0,
};

// ─── Image Document ───────────────────────────────────────────────────────────

export interface ImageDocument {
  id: string;
  fileName: string;
  filePath: string | null;
  width: number;
  height: number;
  dpi: number;
  colorMode: 'RGB';
  bitDepth: 8;
  imageData: ImageData | null;
  originalImageData: ImageData | null; // For undo reference
  thumbnail: string | null;           // data URL for filmstrip
  isDirty: boolean;
  zoom: number;
  panOffset: { x: number; y: number };
  pendingAdjustments: AdjustmentState;
}

// ─── Selection ────────────────────────────────────────────────────────────────

export interface SelectionState {
  type: 'rect' | 'ellipse' | 'lasso' | 'polygon';
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  points?: { x: number; y: number }[];
}

// ─── Layers ───────────────────────────────────────────────────────────────────

export interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  thumbnail: string | null;
  imageData: ImageData | null;
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  imageData: ImageData;
  label: string;
  timestamp: number;
  selection: SelectionState | null;
  adjustments: AdjustmentState;
  layers: LayerInfo[];
  activeLayerId: string | null;
}

// ─── Brush / Tool Options ─────────────────────────────────────────────────────

export interface BrushOptions {
  size: number;       // 1-500 px
  hardness: number;   // 0-100 %
  opacity: number;    // 0-100 %
  flow: number;       // 0-100 %
}

export interface CropState {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: string | null; // "16:9", "4:3", "1:1", null = free
  straighten: number;
}

export interface TextOptions {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string;
}

export interface ShapeOptions {
  shapeType: 'rect' | 'ellipse';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  cornerRadius: number;
  sides: number;
  star: boolean;
}

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  scale: number;
}

export interface LayerState {
  layers: LayerInfo[];
  activeLayerId: string | null;
}

// ─── Editor State ─────────────────────────────────────────────────────────────

export interface EditorState {
  documents: ImageDocument[];
  activeDocumentId: string | null;
  activeTool: ToolType;
  foregroundColor: string;
  backgroundColor: string;
  brushOptions: BrushOptions;
  textOptions: TextOptions;
  shapeOptions: ShapeOptions;
  exportOptions: ExportOptions;
  layers: LayerInfo[];
  activeLayerId: string | null;
  cropState: CropState;
  selection: SelectionState | null;
  history: HistoryEntry[];
  historyIndex: number;
  showTransformControls: boolean;
  autoSelect: boolean;
  activeRightTab: 'adjustments' | 'properties';
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export type EditorAction =
  | { type: 'OPEN_DOCUMENT'; payload: ImageDocument }
  | { type: 'CLOSE_DOCUMENT'; payload: string }
  | { type: 'SET_ACTIVE_DOCUMENT'; payload: string }
  | { type: 'SET_TOOL'; payload: ToolType }
  | { type: 'SET_FOREGROUND_COLOR'; payload: string }
  | { type: 'SET_BACKGROUND_COLOR'; payload: string }
  | { type: 'SWAP_COLORS' }
  | { type: 'UPDATE_ADJUSTMENT'; payload: { key: keyof AdjustmentState; value: number } }
  | { type: 'COMMIT_ADJUSTMENT' }
  | { type: 'RESET_ADJUSTMENTS' }
  | { type: 'APPLY_TOOL_RESULT'; payload: { imageData: ImageData; label: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN'; payload: { x: number; y: number } }
  | { type: 'SET_SELECTION'; payload: SelectionState | null }
  | { type: 'ROTATE'; payload: 90 | -90 | 180 }
  | { type: 'FLIP'; payload: 'horizontal' | 'vertical' }
  | { type: 'SET_BRUSH_OPTIONS'; payload: Partial<BrushOptions> }
  | { type: 'SET_TEXT_OPTIONS'; payload: Partial<TextOptions> }
  | { type: 'SET_SHAPE_OPTIONS'; payload: Partial<ShapeOptions> }
  | { type: 'SET_EXPORT_OPTIONS'; payload: Partial<ExportOptions> }
  | { type: 'SET_CROP_STATE'; payload: Partial<CropState> }
  | { type: 'APPLY_CROP' }
  | { type: 'RESIZE_ACTIVE_DOCUMENT'; payload: { width: number; height: number } }
  | { type: 'ADD_LAYER' }
  | { type: 'ADD_IMAGE_LAYER'; payload: { imageData: ImageData; name: string; thumbnail?: string | null } }
  | { type: 'DELETE_ACTIVE_LAYER' }
  | { type: 'SET_ACTIVE_LAYER'; payload: string }
  | { type: 'UPDATE_LAYER'; payload: { id: string; changes: Partial<LayerInfo> } }
  | { type: 'REORDER_LAYER'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SET_SHOW_TRANSFORM_CONTROLS'; payload: boolean }
  | { type: 'SET_AUTO_SELECT'; payload: boolean }
  | { type: 'SET_RIGHT_TAB'; payload: 'adjustments' | 'properties' }
  | { type: 'UPDATE_DOCUMENT_DATA'; payload: { id: string; imageData: ImageData; width?: number; height?: number } }
  | { type: 'SET_DOCUMENT_DIRTY'; payload: { id: string; dirty: boolean } };

// ─── Tool Definitions List ────────────────────────────────────────────────────

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { type: 'move', name: 'Move', shortcut: 'V', description: 'Move and inspect the current canvas view.', cursor: 'move' },
  { type: 'marquee-rect', name: 'Marquee', shortcut: 'M', description: 'Drag a rectangular selection for isolated edits.', cursor: 'crosshair' },
  { type: 'lasso', name: 'Lasso', shortcut: 'L', description: 'Draw a freehand selection around irregular areas.', cursor: 'crosshair' },
  { type: 'polygon-lasso', name: 'Polygon Lasso', shortcut: 'P', description: 'Build a straight-edge selection with polygon points.', cursor: 'crosshair' },
  { type: 'magic-wand', name: 'Magic Wand', shortcut: 'W', description: 'Select nearby pixels with similar color.', cursor: 'crosshair' },
  { type: 'quick-selection', name: 'Quick Select', shortcut: 'Q', description: 'Paint over an area to quickly create a selection.', cursor: 'crosshair' },
  { type: 'crop', name: 'Crop', shortcut: 'C', description: 'Drag a crop box, then apply to trim the image.', cursor: 'crosshair' },
  { type: 'eyedropper', name: 'Eyedropper', shortcut: 'I', description: 'Sample a pixel color as the foreground color.', cursor: 'crosshair' },
  { type: 'brush', name: 'Brush', shortcut: 'B', description: 'Paint soft or hard strokes with the foreground color.', cursor: 'crosshair' },
  { type: 'pencil', name: 'Pencil', shortcut: 'N', description: 'Draw crisp 1-pixel hard-edged marks.', cursor: 'crosshair' },
  { type: 'eraser', name: 'Eraser', shortcut: 'E', description: 'Erase pixels to transparency with brush settings.', cursor: 'crosshair' },
  { type: 'gradient', name: 'Gradient', shortcut: 'G', description: 'Drag to fill the image with a foreground-to-background gradient.', cursor: 'crosshair' },
  { type: 'clone-stamp', name: 'Clone Stamp', shortcut: 'S', description: 'Alt-click to sample, then paint copied pixels elsewhere.', cursor: 'crosshair' },
  { type: 'healing-brush', name: 'Healing Brush', shortcut: 'J', description: 'Alt-click to sample, then paint blended repair strokes.', cursor: 'crosshair' },
  { type: 'spot-heal', name: 'Spot Heal', shortcut: 'K', description: 'Click small blemishes to blend them with nearby color.', cursor: 'crosshair' },
  { type: 'text', name: 'Text', shortcut: 'T', description: 'Click to add styled text to the image.', cursor: 'text' },
  { type: 'shape-rect', name: 'Shape', shortcut: 'U', description: 'Draw filled and stroked rectangles or ellipses.', cursor: 'crosshair' },
  { type: 'line', name: 'Line', shortcut: '\\', description: 'Drag to draw a straight stroked line.', cursor: 'crosshair' },
  { type: 'pen-path', name: 'Pen Path', shortcut: 'P', description: 'Draw a simple path segment with the current stroke.', cursor: 'crosshair' },
  { type: 'polygon', name: 'Polygon', shortcut: 'Y', description: 'Draw regular polygons with configurable sides.', cursor: 'crosshair' },
  { type: 'custom-shape', name: 'Custom Shape', shortcut: 'A', description: 'Draw reusable preset-style polygon shapes.', cursor: 'crosshair' },
  { type: 'hand', name: 'Hand', shortcut: 'H', description: 'Drag to pan around the canvas.', cursor: 'grab' },
  { type: 'zoom', name: 'Zoom', shortcut: 'Z', description: 'Click to zoom in, or Alt-click to zoom out.', cursor: 'zoom-in' },
];
