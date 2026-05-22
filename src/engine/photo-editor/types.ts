// ─── Tool Types ───────────────────────────────────────────────────────────────

export type ToolType =
  | 'move'
  | 'marquee-rect'
  | 'marquee-ellipse'
  | 'lasso'
  | 'magic-wand'
  | 'crop'
  | 'eyedropper'
  | 'brush'
  | 'eraser'
  | 'gradient'
  | 'clone-stamp'
  | 'text'
  | 'shape-rect'
  | 'shape-ellipse'
  | 'hand'
  | 'zoom';

export interface ToolDefinition {
  type: ToolType;
  name: string;
  shortcut: string;
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
  type: 'rect' | 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
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
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  imageData: ImageData;
  label: string;
  timestamp: number;
  selection: SelectionState | null;
  adjustments: AdjustmentState;
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
  | { type: 'SET_CROP_STATE'; payload: Partial<CropState> }
  | { type: 'SET_SHOW_TRANSFORM_CONTROLS'; payload: boolean }
  | { type: 'SET_AUTO_SELECT'; payload: boolean }
  | { type: 'SET_RIGHT_TAB'; payload: 'adjustments' | 'properties' }
  | { type: 'UPDATE_DOCUMENT_DATA'; payload: { id: string; imageData: ImageData; width?: number; height?: number } }
  | { type: 'SET_DOCUMENT_DIRTY'; payload: { id: string; dirty: boolean } };

// ─── Tool Definitions List ────────────────────────────────────────────────────

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { type: 'move',            name: 'Move',         shortcut: 'V', cursor: 'move' },
  { type: 'marquee-rect',    name: 'Marquee',      shortcut: 'M', cursor: 'crosshair' },
  { type: 'lasso',           name: 'Lasso',        shortcut: 'L', cursor: 'crosshair' },
  { type: 'magic-wand',      name: 'Magic Wand',   shortcut: 'W', cursor: 'crosshair' },
  { type: 'crop',            name: 'Crop',         shortcut: 'C', cursor: 'crosshair' },
  { type: 'eyedropper',      name: 'Eyedropper',   shortcut: 'I', cursor: 'crosshair' },
  { type: 'brush',           name: 'Brush',        shortcut: 'B', cursor: 'crosshair' },
  { type: 'eraser',          name: 'Eraser',       shortcut: 'E', cursor: 'crosshair' },
  { type: 'gradient',        name: 'Gradient',     shortcut: 'G', cursor: 'crosshair' },
  { type: 'clone-stamp',     name: 'Clone Stamp',  shortcut: 'S', cursor: 'crosshair' },
  { type: 'text',            name: 'Text',         shortcut: 'T', cursor: 'text' },
  { type: 'shape-rect',      name: 'Shape',        shortcut: 'U', cursor: 'crosshair' },
  { type: 'hand',            name: 'Hand',         shortcut: 'H', cursor: 'grab' },
  { type: 'zoom',            name: 'Zoom',         shortcut: 'Z', cursor: 'zoom-in' },
];
