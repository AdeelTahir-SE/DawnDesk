import { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
  type EditorState,
  type EditorAction,
  type HistoryEntry,
  DEFAULT_ADJUSTMENTS,
} from './types';

const MAX_HISTORY = 30;

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: EditorState = {
  documents: [],
  activeDocumentId: null,
  activeTool: 'move',
  foregroundColor: '#F7C948',
  backgroundColor: '#000000',
  brushOptions: {
    size: 12,
    hardness: 100,
    opacity: 100,
    flow: 100,
  },
  textOptions: {
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    color: '#FFFFFF',
  },
  shapeOptions: {
    shapeType: 'rect',
    fillColor: '#F7C948',
    strokeColor: '#FFFFFF',
    strokeWidth: 2,
    cornerRadius: 0,
  },
  cropState: {
    active: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    aspectRatio: null,
  },
  selection: null,
  history: [],
  historyIndex: -1,
  showTransformControls: false,
  autoSelect: false,
  activeRightTab: 'adjustments',
};

// ─── History Helpers ──────────────────────────────────────────────────────────

function pushHistory(state: EditorState, label: string): EditorState {
  const doc = state.documents.find((d) => d.id === state.activeDocumentId);
  if (!doc?.imageData) return state;

  const entry: HistoryEntry = {
    imageData: new ImageData(
      new Uint8ClampedArray(doc.imageData.data),
      doc.imageData.width,
      doc.imageData.height
    ),
    label,
    timestamp: Date.now(),
    selection: state.selection ? { ...state.selection } : null,
    adjustments: { ...doc.pendingAdjustments },
  };

  // Truncate any redo history beyond current index
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(entry);

  // Limit to MAX_HISTORY
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }

  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

// ─── Canvas Transform Helpers ─────────────────────────────────────────────────

function rotateImageData(imageData: ImageData, degrees: 90 | -90 | 180): { data: ImageData; w: number; h: number } {
  const { width: srcW, height: srcH, data: srcData } = imageData;

  if (degrees === 180) {
    const dst = new Uint8ClampedArray(srcData.length);
    for (let y = 0; y < srcH; y++) {
      for (let x = 0; x < srcW; x++) {
        const srcIdx = (y * srcW + x) * 4;
        const dstIdx = ((srcH - 1 - y) * srcW + (srcW - 1 - x)) * 4;
        dst[dstIdx] = srcData[srcIdx];
        dst[dstIdx + 1] = srcData[srcIdx + 1];
        dst[dstIdx + 2] = srcData[srcIdx + 2];
        dst[dstIdx + 3] = srcData[srcIdx + 3];
      }
    }
    return { data: new ImageData(dst, srcW, srcH), w: srcW, h: srcH };
  }

  // 90 or -90: width and height swap
  const dstW = srcH;
  const dstH = srcW;
  const dst = new Uint8ClampedArray(dstW * dstH * 4);

  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const srcIdx = (y * srcW + x) * 4;
      let dstX: number, dstY: number;

      if (degrees === 90) {
        dstX = srcH - 1 - y;
        dstY = x;
      } else {
        dstX = y;
        dstY = srcW - 1 - x;
      }

      const dstIdx = (dstY * dstW + dstX) * 4;
      dst[dstIdx] = srcData[srcIdx];
      dst[dstIdx + 1] = srcData[srcIdx + 1];
      dst[dstIdx + 2] = srcData[srcIdx + 2];
      dst[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }

  return { data: new ImageData(dst, dstW, dstH), w: dstW, h: dstH };
}

function flipImageData(imageData: ImageData, direction: 'horizontal' | 'vertical'): ImageData {
  const { width, height, data: srcData } = imageData;
  const dst = new Uint8ClampedArray(srcData.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      let dstX = x, dstY = y;

      if (direction === 'horizontal') {
        dstX = width - 1 - x;
      } else {
        dstY = height - 1 - y;
      }

      const dstIdx = (dstY * width + dstX) * 4;
      dst[dstIdx] = srcData[srcIdx];
      dst[dstIdx + 1] = srcData[srcIdx + 1];
      dst[dstIdx + 2] = srcData[srcIdx + 2];
      dst[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }

  return new ImageData(dst, width, height);
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'OPEN_DOCUMENT': {
      // Push initial history entry for the new document
      const newState = {
        ...state,
        documents: [...state.documents, action.payload],
        activeDocumentId: action.payload.id,
      };
      if (action.payload.imageData) {
        return pushHistory(newState, 'Open Image');
      }
      return newState;
    }

    case 'CLOSE_DOCUMENT': {
      const remaining = state.documents.filter((d) => d.id !== action.payload);
      return {
        ...state,
        documents: remaining,
        activeDocumentId:
          state.activeDocumentId === action.payload
            ? remaining[remaining.length - 1]?.id ?? null
            : state.activeDocumentId,
        // Clear history if no documents remain
        history: remaining.length === 0 ? [] : state.history,
        historyIndex: remaining.length === 0 ? -1 : state.historyIndex,
      };
    }

    case 'SET_ACTIVE_DOCUMENT':
      return { ...state, activeDocumentId: action.payload };

    case 'SET_TOOL':
      return { ...state, activeTool: action.payload };

    case 'SET_FOREGROUND_COLOR':
      return { ...state, foregroundColor: action.payload };

    case 'SET_BACKGROUND_COLOR':
      return { ...state, backgroundColor: action.payload };

    case 'SWAP_COLORS':
      return {
        ...state,
        foregroundColor: state.backgroundColor,
        backgroundColor: state.foregroundColor,
      };

    case 'UPDATE_ADJUSTMENT': {
      const doc = state.documents.find((d) => d.id === state.activeDocumentId);
      if (!doc) return state;
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === state.activeDocumentId
            ? {
                ...d,
                pendingAdjustments: {
                  ...d.pendingAdjustments,
                  [action.payload.key]: action.payload.value,
                },
                isDirty: true,
              }
            : d
        ),
      };
    }

    case 'RESET_ADJUSTMENTS':
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === state.activeDocumentId
            ? { ...d, pendingAdjustments: { ...DEFAULT_ADJUSTMENTS } }
            : d
        ),
      };

    case 'COMMIT_ADJUSTMENT': {
      // Bake pending adjustments into imageData and push history
      const stateWithHistory = pushHistory(state, 'Adjustment');
      return {
        ...stateWithHistory,
        documents: stateWithHistory.documents.map((d) =>
          d.id === stateWithHistory.activeDocumentId
            ? { ...d, pendingAdjustments: { ...DEFAULT_ADJUSTMENTS } }
            : d
        ),
      };
    }

    case 'SET_ZOOM':
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === state.activeDocumentId
            ? { ...d, zoom: Math.max(0.05, Math.min(32, action.payload)) }
            : d
        ),
      };

    case 'SET_PAN':
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === state.activeDocumentId
            ? { ...d, panOffset: action.payload }
            : d
        ),
      };

    case 'SET_SELECTION':
      return { ...state, selection: action.payload };

    case 'SET_BRUSH_OPTIONS':
      return {
        ...state,
        brushOptions: { ...state.brushOptions, ...action.payload },
      };

    case 'SET_TEXT_OPTIONS':
      return {
        ...state,
        textOptions: { ...state.textOptions, ...action.payload },
      };

    case 'SET_SHAPE_OPTIONS':
      return {
        ...state,
        shapeOptions: { ...state.shapeOptions, ...action.payload },
      };

    case 'SET_CROP_STATE':
      return {
        ...state,
        cropState: { ...state.cropState, ...action.payload },
      };

    case 'SET_SHOW_TRANSFORM_CONTROLS':
      return { ...state, showTransformControls: action.payload };

    case 'SET_AUTO_SELECT':
      return { ...state, autoSelect: action.payload };

    case 'SET_RIGHT_TAB':
      return { ...state, activeRightTab: action.payload };

    case 'UPDATE_DOCUMENT_DATA':
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.payload.id
            ? {
                ...d,
                imageData: action.payload.imageData,
                width: action.payload.width ?? d.width,
                height: action.payload.height ?? d.height,
                isDirty: true,
              }
            : d
        ),
      };

    case 'SET_DOCUMENT_DIRTY':
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.payload.id
            ? { ...d, isDirty: action.payload.dirty }
            : d
        ),
      };

    case 'ROTATE': {
      const doc = state.documents.find((d) => d.id === state.activeDocumentId);
      if (!doc?.imageData) return state;

      const stateWithHistory = pushHistory(state, `Rotate ${action.payload}°`);
      const { data, w, h } = rotateImageData(doc.imageData, action.payload);

      return {
        ...stateWithHistory,
        documents: stateWithHistory.documents.map((d) =>
          d.id === stateWithHistory.activeDocumentId
            ? { ...d, imageData: data, width: w, height: h, isDirty: true }
            : d
        ),
      };
    }

    case 'FLIP': {
      const doc = state.documents.find((d) => d.id === state.activeDocumentId);
      if (!doc?.imageData) return state;

      const stateWithHistory = pushHistory(state, `Flip ${action.payload}`);
      const flipped = flipImageData(doc.imageData, action.payload);

      return {
        ...stateWithHistory,
        documents: stateWithHistory.documents.map((d) =>
          d.id === stateWithHistory.activeDocumentId
            ? { ...d, imageData: flipped, isDirty: true }
            : d
        ),
      };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const prevEntry = state.history[state.historyIndex - 1];
      if (!prevEntry) return state;

      return {
        ...state,
        historyIndex: state.historyIndex - 1,
        selection: prevEntry.selection,
        documents: state.documents.map((d) =>
          d.id === state.activeDocumentId
            ? {
                ...d,
                imageData: new ImageData(
                  new Uint8ClampedArray(prevEntry.imageData.data),
                  prevEntry.imageData.width,
                  prevEntry.imageData.height
                ),
                width: prevEntry.imageData.width,
                height: prevEntry.imageData.height,
                pendingAdjustments: { ...prevEntry.adjustments },
                isDirty: true,
              }
            : d
        ),
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextEntry = state.history[state.historyIndex + 1];
      if (!nextEntry) return state;

      return {
        ...state,
        historyIndex: state.historyIndex + 1,
        selection: nextEntry.selection,
        documents: state.documents.map((d) =>
          d.id === state.activeDocumentId
            ? {
                ...d,
                imageData: new ImageData(
                  new Uint8ClampedArray(nextEntry.imageData.data),
                  nextEntry.imageData.width,
                  nextEntry.imageData.height
                ),
                width: nextEntry.imageData.width,
                height: nextEntry.imageData.height,
                pendingAdjustments: { ...nextEntry.adjustments },
                isDirty: true,
              }
            : d
        ),
      };
    }

    case 'APPLY_TOOL_RESULT': {
      const stateWithHistory = pushHistory(state, action.payload.label);
      return {
        ...stateWithHistory,
        documents: stateWithHistory.documents.map((d) =>
          d.id === stateWithHistory.activeDocumentId
            ? {
                ...d,
                imageData: action.payload.imageData,
                isDirty: true,
              }
            : d
        ),
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  activeDocument: ReturnType<typeof getActiveDocument>;
}

function getActiveDocument(state: EditorState) {
  return state.documents.find((d) => d.id === state.activeDocumentId) ?? null;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const activeDocument = getActiveDocument(state);

  return (
    <EditorContext.Provider value={{ state, dispatch, activeDocument }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
