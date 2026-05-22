import { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
  type EditorState,
  type EditorAction,
  type HistoryEntry,
  type LayerInfo,
  DEFAULT_ADJUSTMENTS,
} from './types';
import { applyAllAdjustments } from './filters';

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
    sides: 6,
    star: false,
  },
  exportOptions: {
    format: 'png',
    quality: 0.92,
    scale: 1,
  },
  cropState: {
    active: false,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    aspectRatio: null,
    straighten: 0,
  },
  layers: [],
  activeLayerId: null,
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
    layers: cloneLayers(state.layers),
    activeLayerId: state.activeLayerId,
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

function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

function cloneLayers(layers: LayerInfo[]): LayerInfo[] {
  return layers.map((layer) => ({
    ...layer,
    imageData: layer.imageData ? cloneImageData(layer.imageData) : null,
  }));
}

function createBlankImageData(width: number, height: number): ImageData {
  return new ImageData(Math.max(1, width), Math.max(1, height));
}

function makeThumbnail(imageData: ImageData): string {
  const maxW = 96;
  const scale = Math.min(1, maxW / imageData.width);
  const thumbW = Math.max(1, Math.round(imageData.width * scale));
  const thumbH = Math.max(1, Math.round(imageData.height * scale));
  const source = document.createElement('canvas');
  source.width = imageData.width;
  source.height = imageData.height;
  source.getContext('2d')!.putImageData(imageData, 0, 0);

  const thumb = document.createElement('canvas');
  thumb.width = thumbW;
  thumb.height = thumbH;
  const ctx = thumb.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, thumbW, thumbH);
  return thumb.toDataURL('image/png');
}

function fitImageDataToCanvas(imageData: ImageData, width: number, height: number): ImageData {
  const out = document.createElement('canvas');
  out.width = Math.max(1, width);
  out.height = Math.max(1, height);
  const outCtx = out.getContext('2d')!;
  const source = document.createElement('canvas');
  source.width = imageData.width;
  source.height = imageData.height;
  source.getContext('2d')!.putImageData(imageData, 0, 0);

  const scale = Math.min(1, out.width / imageData.width, out.height / imageData.height);
  const drawW = Math.max(1, Math.round(imageData.width * scale));
  const drawH = Math.max(1, Math.round(imageData.height * scale));
  const x = Math.round((out.width - drawW) / 2);
  const y = Math.round((out.height - drawH) / 2);
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(source, x, y, drawW, drawH);
  return outCtx.getImageData(0, 0, out.width, out.height);
}

function compositeLayers(layers: LayerInfo[], width: number, height: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d')!;

  [...layers].reverse().forEach((layer) => {
    if (!layer.visible || !layer.imageData) return;
    const source = document.createElement('canvas');
    source.width = layer.imageData.width;
    source.height = layer.imageData.height;
    source.getContext('2d')!.putImageData(layer.imageData, 0, 0);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity / 100));
    ctx.globalCompositeOperation = layer.blendMode === 'soft-light'
      ? 'soft-light'
      : layer.blendMode === 'color'
        ? 'color'
        : ['multiply', 'screen', 'overlay'].includes(layer.blendMode)
          ? layer.blendMode as GlobalCompositeOperation
          : 'source-over';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  });

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function updateActiveDocumentComposite(state: EditorState, layers: LayerInfo[]): EditorState {
  const doc = state.documents.find((d) => d.id === state.activeDocumentId);
  if (!doc) return { ...state, layers };
  const composite = compositeLayers(layers, doc.width, doc.height);
  return {
    ...state,
    layers,
    documents: state.documents.map((d) =>
      d.id === state.activeDocumentId
        ? { ...d, imageData: composite, isDirty: true, thumbnail: makeThumbnail(composite) }
        : d
    ),
  };
}

function insertLayerAboveActive(layers: LayerInfo[], activeLayerId: string | null, layer: LayerInfo): LayerInfo[] {
  const activeIndex = layers.findIndex((item) => item.id === activeLayerId);
  if (activeIndex < 0) return [layer, ...layers];
  const next = [...layers];
  next.splice(activeIndex, 0, layer);
  return next;
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

function cropImageData(imageData: ImageData, crop: { x: number; y: number; width: number; height: number }): ImageData {
  const x = Math.max(0, Math.floor(crop.x));
  const y = Math.max(0, Math.floor(crop.y));
  const width = Math.max(1, Math.min(imageData.width - x, Math.round(crop.width)));
  const height = Math.max(1, Math.min(imageData.height - y, Math.round(crop.height)));
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  out.getContext('2d')!.drawImage(canvas, x, y, width, height, 0, 0, width, height);
  return out.getContext('2d')!.getImageData(0, 0, width, height);
}

function resizeImageData(imageData: ImageData, width: number, height: number): ImageData {
  const nextW = Math.max(1, Math.round(width));
  const nextH = Math.max(1, Math.round(height));
  const source = document.createElement('canvas');
  source.width = imageData.width;
  source.height = imageData.height;
  source.getContext('2d')!.putImageData(imageData, 0, 0);

  const out = document.createElement('canvas');
  out.width = nextW;
  out.height = nextH;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, nextW, nextH);
  return ctx.getImageData(0, 0, nextW, nextH);
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'OPEN_DOCUMENT': {
      const baseLayer = {
        id: `background-${action.payload.id}`,
        name: 'Background',
        visible: true,
        locked: true,
        opacity: 100,
        blendMode: 'normal',
        thumbnail: action.payload.thumbnail,
        imageData: action.payload.imageData ? cloneImageData(action.payload.imageData) : null,
      };
      // Push initial history entry for the new document
      const newState = {
        ...state,
        documents: [...state.documents, action.payload],
        activeDocumentId: action.payload.id,
        layers: [baseLayer],
        activeLayerId: baseLayer.id,
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
      const doc = state.documents.find((d) => d.id === state.activeDocumentId);
      if (!doc?.imageData) return state;
      const selectedLayer = state.layers.find((layer) => layer.id === state.activeLayerId);
      if (!selectedLayer || selectedLayer.locked) return state;
      const stateWithHistory = pushHistory(state, 'Adjustment');
      const activeLayerId = stateWithHistory.activeLayerId;
      const layers = stateWithHistory.layers.map((layer) => {
        if (layer.id !== activeLayerId || !layer.imageData) return layer;
        const imageData = applyAllAdjustments(layer.imageData, doc.pendingAdjustments);
        return { ...layer, imageData, thumbnail: makeThumbnail(imageData) };
      });
      const nextState = updateActiveDocumentComposite(stateWithHistory, layers);
      return {
        ...nextState,
        documents: nextState.documents.map((d) =>
          d.id === nextState.activeDocumentId
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

    case 'SET_EXPORT_OPTIONS':
      return {
        ...state,
        exportOptions: { ...state.exportOptions, ...action.payload },
      };

    case 'SET_CROP_STATE':
      return {
        ...state,
        cropState: { ...state.cropState, ...action.payload },
      };

    case 'APPLY_CROP': {
      const doc = state.documents.find((d) => d.id === state.activeDocumentId);
      const crop = state.cropState;
      if (!doc?.imageData || crop.width < 2 || crop.height < 2) return state;

      const stateWithHistory = pushHistory(state, 'Crop');
      const layers = stateWithHistory.layers.map((layer) => {
        if (!layer.imageData) return layer;
        const imageData = cropImageData(layer.imageData, crop);
        return { ...layer, imageData, thumbnail: makeThumbnail(imageData) };
      });
      const cropped = compositeLayers(layers, Math.round(crop.width), Math.round(crop.height));
      return {
        ...stateWithHistory,
        layers,
        cropState: { ...stateWithHistory.cropState, active: false, x: 0, y: 0, width: 0, height: 0 },
        selection: null,
        documents: stateWithHistory.documents.map((d) =>
          d.id === stateWithHistory.activeDocumentId
            ? { ...d, imageData: cropped, width: cropped.width, height: cropped.height, isDirty: true }
            : d
        ),
      };
    }

    case 'RESIZE_ACTIVE_DOCUMENT': {
      const doc = state.documents.find((d) => d.id === state.activeDocumentId);
      if (!doc?.imageData) return state;
      const stateWithHistory = pushHistory(state, 'Resize Image');
      const nextW = Math.max(1, Math.round(action.payload.width));
      const nextH = Math.max(1, Math.round(action.payload.height));
      const layers = stateWithHistory.layers.map((layer) => {
        if (!layer.imageData) return layer;
        const imageData = resizeImageData(layer.imageData, nextW, nextH);
        return { ...layer, imageData, thumbnail: makeThumbnail(imageData) };
      });
      const resized = compositeLayers(layers, nextW, nextH);
      return {
        ...stateWithHistory,
        layers,
        documents: stateWithHistory.documents.map((d) =>
          d.id === stateWithHistory.activeDocumentId
            ? { ...d, imageData: resized, width: resized.width, height: resized.height, isDirty: true }
            : d
        ),
      };
    }

    case 'ADD_LAYER': {
      const doc = state.documents.find((d) => d.id === state.activeDocumentId);
      if (!doc) return state;
      const layer = {
        id: `layer-${Date.now()}`,
        name: `Layer ${state.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        imageData: createBlankImageData(doc.width, doc.height),
        thumbnail: null,
      };
      const stateWithHistory = pushHistory(state, 'Add Layer');
      const layers = insertLayerAboveActive(stateWithHistory.layers, stateWithHistory.activeLayerId, layer);
      return updateActiveDocumentComposite({ ...stateWithHistory, activeLayerId: layer.id }, layers);
    }

    case 'ADD_IMAGE_LAYER': {
      const doc = state.documents.find((d) => d.id === state.activeDocumentId);
      if (!doc) return state;
      const layerImageData = fitImageDataToCanvas(action.payload.imageData, doc.width, doc.height);
      const layer = {
        id: `layer-${Date.now()}`,
        name: action.payload.name || `Image Layer ${state.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        thumbnail: action.payload.thumbnail ?? makeThumbnail(layerImageData),
        imageData: layerImageData,
      };
      const stateWithHistory = pushHistory(state, 'Add Image Layer');
      const layers = insertLayerAboveActive(stateWithHistory.layers, stateWithHistory.activeLayerId, layer);
      return updateActiveDocumentComposite({ ...stateWithHistory, activeLayerId: layer.id }, layers);
    }

    case 'DELETE_ACTIVE_LAYER': {
      const layer = state.layers.find((l) => l.id === state.activeLayerId);
      if (!layer || layer.locked) return state;
      const layers = state.layers.filter((l) => l.id !== layer.id);
      return updateActiveDocumentComposite({ ...state, activeLayerId: layers[0]?.id ?? null }, layers);
    }

    case 'SET_ACTIVE_LAYER':
      return { ...state, activeLayerId: action.payload };

    case 'UPDATE_LAYER':
      return updateActiveDocumentComposite({
        ...state,
      }, state.layers.map((layer) =>
          layer.id === action.payload.id ? { ...layer, ...action.payload.changes } : layer
        ));

    case 'REORDER_LAYER': {
      const { fromIndex } = action.payload;
      let { toIndex } = action.payload;
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= state.layers.length || toIndex >= state.layers.length) {
        return state;
      }
      const layers = [...state.layers];
      const [moved] = layers.splice(fromIndex, 1);
      if (!moved || moved.locked) return state;
      const firstLockedIndex = layers.findIndex((layer) => layer.locked);
      if (firstLockedIndex >= 0 && toIndex > firstLockedIndex) {
        toIndex = firstLockedIndex;
      }
      layers.splice(toIndex, 0, moved);
      return updateActiveDocumentComposite(state, layers);
    }

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
      const layers = stateWithHistory.layers.map((layer) => {
        if (!layer.imageData) return layer;
        const rotated = rotateImageData(layer.imageData, action.payload).data;
        return { ...layer, imageData: rotated, thumbnail: makeThumbnail(rotated) };
      });
      const composite = compositeLayers(layers, w, h);

      return {
        ...stateWithHistory,
        layers,
        documents: stateWithHistory.documents.map((d) =>
          d.id === stateWithHistory.activeDocumentId
            ? { ...d, imageData: composite ?? data, width: w, height: h, isDirty: true }
            : d
        ),
      };
    }

    case 'FLIP': {
      const doc = state.documents.find((d) => d.id === state.activeDocumentId);
      if (!doc?.imageData) return state;

      const stateWithHistory = pushHistory(state, `Flip ${action.payload}`);
      const flipped = flipImageData(doc.imageData, action.payload);
      const layers = stateWithHistory.layers.map((layer) => {
        if (!layer.imageData) return layer;
        const imageData = flipImageData(layer.imageData, action.payload);
        return { ...layer, imageData, thumbnail: makeThumbnail(imageData) };
      });
      const composite = compositeLayers(layers, doc.width, doc.height);

      return {
        ...stateWithHistory,
        layers,
        documents: stateWithHistory.documents.map((d) =>
          d.id === stateWithHistory.activeDocumentId
            ? { ...d, imageData: composite ?? flipped, isDirty: true }
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
        layers: cloneLayers(prevEntry.layers),
        activeLayerId: prevEntry.activeLayerId,
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
        layers: cloneLayers(nextEntry.layers),
        activeLayerId: nextEntry.activeLayerId,
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
      const activeLayer = stateWithHistory.layers.find((layer) => layer.id === stateWithHistory.activeLayerId);
      if (!activeLayer || activeLayer.locked) return state;
      const layers = activeLayer
        ? stateWithHistory.layers.map((layer) =>
            layer.id === activeLayer.id
              ? { ...layer, imageData: action.payload.imageData, thumbnail: makeThumbnail(action.payload.imageData) }
              : layer
          )
        : stateWithHistory.layers;
      const composite = activeLayer
        ? compositeLayers(layers, action.payload.imageData.width, action.payload.imageData.height)
        : action.payload.imageData;
      return {
        ...stateWithHistory,
        layers,
        documents: stateWithHistory.documents.map((d) =>
          d.id === stateWithHistory.activeDocumentId
            ? {
                ...d,
                imageData: composite,
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
