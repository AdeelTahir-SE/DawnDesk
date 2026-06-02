// ─── DawnDesk Photo Editor — Project File System ──────────────────────────────
// Projects are saved as .dawndesk JSON files containing all layer data,
// document metadata, and editor settings. Each layer's ImageData is stored
// as a base64-encoded PNG data URL for portability.

import type { EditorState, LayerInfo, ImageDocument, TextOptions, AdjustmentState } from './types';
import { applyAllAdjustments } from './filters';

// ─── Project File Format ──────────────────────────────────────────────────────

export interface ProjectLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  imageDataUrl: string | null; // base64 PNG
  maskDataUrl?: string | null;
  thumbnail: string | null;
  isSmartObject?: boolean;
  adjustment?: AdjustmentState;
  text?: {
    content: string;
    x: number;
    y: number;
    style: TextOptions;
  };
}

export interface ProjectDocument {
  id: string;
  fileName: string;
  width: number;
  height: number;
  dpi: number;
  colorMode: 'RGB';
  bitDepth: 8;
  zoom: number;
  panOffset: { x: number; y: number };
}

export interface DawnDeskProject {
  version: '1.0';
  name: string;
  createdAt: string;
  updatedAt: string;
  document: ProjectDocument;
  layers: ProjectLayer[];
  activeLayerId: string | null;
  foregroundColor: string;
  backgroundColor: string;
}

// ─── Project Registry (localStorage) ─────────────────────────────────────────

export interface ProjectEntry {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  width: number;
  height: number;
  thumbnail: string | null; // data URL for preview
}

const REGISTRY_KEY = 'dawndesk.photoEditor.projects';
const PROJECT_KEY_PREFIX = 'dawndesk.photoEditor.project.';
const DB_NAME = 'dawndesk.photoEditor';
const DB_VERSION = 1;
const PROJECT_STORE = 'projects';

const supportedBlendModes = new Set([
  'multiply',
  'screen',
  'overlay',
  'soft-light',
  'hard-light',
  'color-dodge',
  'color-burn',
  'darken',
  'lighten',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
]);

function toCompositeOperation(blendMode: string): GlobalCompositeOperation {
  return supportedBlendModes.has(blendMode)
    ? blendMode as GlobalCompositeOperation
    : 'source-over';
}

function applyProjectAdjustments(imageData: ImageData, adjustments: AdjustmentState): ImageData {
  return applyAllAdjustments(imageData, adjustments);
}

function applyMaskToImageData(imageData: ImageData, mask: ImageData): ImageData {
  const out = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i + 3] = Math.round(out.data[i + 3] * (mask.data[i] / 255));
  }
  return out;
}

export function getProjectRegistry(): ProjectEntry[] {
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function setProjectRegistry(entries: ProjectEntry[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(entries));
}

function createProjectId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `project-${crypto.randomUUID()}`;
  }
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function openProjectDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECT_STORE)) {
        db.createObjectStore(PROJECT_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putStoredProject(projectId: string, project: DawnDeskProject): Promise<void> {
  const db = await openProjectDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PROJECT_STORE, 'readwrite');
    tx.objectStore(PROJECT_STORE).put(project, projectId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function getStoredProject(projectId: string): Promise<DawnDeskProject | null> {
  const db = await openProjectDb();
  const project = await new Promise<DawnDeskProject | null>((resolve, reject) => {
    const tx = db.transaction(PROJECT_STORE, 'readonly');
    const request = tx.objectStore(PROJECT_STORE).get(projectId);
    request.onsuccess = () => resolve((request.result as DawnDeskProject | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (project) return project;

  const legacy = localStorage.getItem(PROJECT_KEY_PREFIX + projectId);
  return legacy ? JSON.parse(legacy) : null;
}

async function deleteStoredProject(projectId: string): Promise<void> {
  localStorage.removeItem(PROJECT_KEY_PREFIX + projectId);
  const db = await openProjectDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PROJECT_STORE, 'readwrite');
    tx.objectStore(PROJECT_STORE).delete(projectId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

// ─── Image Data ↔ Base64 ──────────────────────────────────────────────────────

async function imageDataToDataUrl(imageData: ImageData): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext('2d')!.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

async function dataUrlToImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// ─── Save Project ─────────────────────────────────────────────────────────────

export async function saveProject(
  state: EditorState,
  projectName: string
): Promise<string> {
  const doc = state.documents.find((d) => d.id === state.activeDocumentId);
  if (!doc) throw new Error('No active document to save');

  const projectId = createProjectId();
  const now = new Date().toISOString();

  // Serialize layers
  const serializedLayers: ProjectLayer[] = await Promise.all(
    state.layers.map(async (layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      locked: layer.locked,
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      imageDataUrl: layer.imageData ? await imageDataToDataUrl(layer.imageData) : null,
      maskDataUrl: layer.mask?.imageData ? await imageDataToDataUrl(layer.mask.imageData) : null,
      thumbnail: layer.thumbnail,
      isSmartObject: layer.isSmartObject,
      adjustment: layer.adjustment,
      text: layer.text,
    }))
  );

  const project: DawnDeskProject = {
    version: '1.0',
    name: projectName,
    createdAt: now,
    updatedAt: now,
    document: {
      id: doc.id,
      fileName: doc.fileName || projectName,
      width: doc.width,
      height: doc.height,
      dpi: doc.dpi,
      colorMode: 'RGB',
      bitDepth: 8,
      zoom: doc.zoom,
      panOffset: doc.panOffset,
    },
    layers: serializedLayers,
    activeLayerId: state.activeLayerId,
    foregroundColor: state.foregroundColor,
    backgroundColor: state.backgroundColor,
  };

  await putStoredProject(projectId, project);

  // Update registry
  const registry = getProjectRegistry();
  const topLayerThumb = state.layers.find((l) => l.thumbnail)?.thumbnail ?? null;
  const entry: ProjectEntry = {
    id: projectId,
    name: projectName,
    createdAt: now,
    updatedAt: now,
    width: doc.width,
    height: doc.height,
    thumbnail: topLayerThumb,
  };
  // Remove existing entry with same ID if any (allows saving multiple projects with same/different names)
  const filtered = registry.filter((e) => e.id !== projectId);
  setProjectRegistry([entry, ...filtered]);

  return projectId;
}

// ─── Update Existing Project ──────────────────────────────────────────────────

export async function updateProject(
  projectId: string,
  state: EditorState,
  newName?: string
): Promise<void> {
  const project = await getStoredProject(projectId);
  if (!project) throw new Error('Project not found: ' + projectId);
  const doc = state.documents.find((d) => d.id === state.activeDocumentId);
  if (!doc) return;

  const now = new Date().toISOString();

  const serializedLayers: ProjectLayer[] = await Promise.all(
    state.layers.map(async (layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      locked: layer.locked,
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      imageDataUrl: layer.imageData ? await imageDataToDataUrl(layer.imageData) : null,
      maskDataUrl: layer.mask?.imageData ? await imageDataToDataUrl(layer.mask.imageData) : null,
      thumbnail: layer.thumbnail,
      isSmartObject: layer.isSmartObject,
      adjustment: layer.adjustment,
      text: layer.text,
    }))
  );

  const finalName = newName ?? project.name;

  const updated: DawnDeskProject = {
    ...project,
    name: finalName,
    updatedAt: now,
    document: {
      ...project.document,
      width: doc.width,
      height: doc.height,
      zoom: doc.zoom,
      panOffset: doc.panOffset,
      fileName: doc.fileName || finalName,
    },
    layers: serializedLayers,
    activeLayerId: state.activeLayerId,
    foregroundColor: state.foregroundColor,
    backgroundColor: state.backgroundColor,
  };

  await putStoredProject(projectId, updated);

  // Update registry
  const registry = getProjectRegistry();
  const topLayerThumb = state.layers.find((l) => l.thumbnail)?.thumbnail ?? null;
  setProjectRegistry(
    registry.map((e) =>
      e.id === projectId ? { ...e, name: finalName, updatedAt: now, thumbnail: topLayerThumb ?? e.thumbnail } : e
    )
  );
}

// ─── Load Project ─────────────────────────────────────────────────────────────

export interface LoadedProject {
  document: ImageDocument;
  layers: LayerInfo[];
  activeLayerId: string | null;
  foregroundColor: string;
  backgroundColor: string;
  projectId: string;
  projectName: string;
}

export async function loadProject(projectId: string): Promise<LoadedProject> {
  const project = await getStoredProject(projectId);
  if (!project) throw new Error('Project not found: ' + projectId);

  // Deserialize layers
  const layers: LayerInfo[] = await Promise.all(
    project.layers.map(async (pl) => {
      const imageData = pl.imageDataUrl ? await dataUrlToImageData(pl.imageDataUrl) : null;
      const maskImageData = pl.maskDataUrl ? await dataUrlToImageData(pl.maskDataUrl) : null;
      return {
        id: pl.id,
        name: pl.name,
        visible: pl.visible,
        locked: pl.locked,
        opacity: pl.opacity,
        blendMode: pl.blendMode,
        thumbnail: pl.thumbnail,
        imageData,
        isSmartObject: pl.isSmartObject,
        mask: maskImageData ? { imageData: maskImageData, thumbnail: pl.maskDataUrl ?? null } : undefined,
        adjustment: pl.adjustment,
        text: pl.text,
      };
    })
  );

  // Composite all visible layers into document imageData
  const doc = project.document;
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = doc.width;
  compositeCanvas.height = doc.height;
  const compositeCtx = compositeCanvas.getContext('2d')!;

  [...layers].reverse().forEach((layer) => {
    if (!layer.visible) return;
    if (layer.adjustment) {
      const adjusted = applyProjectAdjustments(compositeCtx.getImageData(0, 0, doc.width, doc.height), layer.adjustment);
      compositeCtx.putImageData(adjusted, 0, 0);
      return;
    }
    if (!layer.imageData) return;
    const sourceImageData = layer.mask ? applyMaskToImageData(layer.imageData, layer.mask.imageData) : layer.imageData;
    const src = document.createElement('canvas');
    src.width = sourceImageData.width;
    src.height = sourceImageData.height;
    src.getContext('2d')!.putImageData(sourceImageData, 0, 0);
    compositeCtx.save();
    compositeCtx.globalAlpha = layer.opacity / 100;
    compositeCtx.globalCompositeOperation = toCompositeOperation(layer.blendMode);
    compositeCtx.drawImage(src, 0, 0, doc.width, doc.height);
    compositeCtx.restore();
  });

  const compositeImageData = compositeCtx.getImageData(0, 0, doc.width, doc.height);

  // Make thumbnail
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 96;
  thumbCanvas.height = Math.round(96 * (doc.height / doc.width));
  const thumbCtx = thumbCanvas.getContext('2d')!;
  thumbCtx.drawImage(compositeCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
  const thumbnail = thumbCanvas.toDataURL('image/png');

  const document_: ImageDocument = {
    id: `doc-${Date.now()}`,
    fileName: doc.fileName || project.name,
    filePath: null,
    width: doc.width,
    height: doc.height,
    dpi: doc.dpi || 72,
    colorMode: 'RGB',
    bitDepth: 8,
    imageData: compositeImageData,
    originalImageData: compositeImageData,
    thumbnail,
    isDirty: false,
    zoom: doc.zoom || 1,
    panOffset: doc.panOffset || { x: 0, y: 0 },
    pendingAdjustments: {
      exposure: 0, contrast: 0, highlights: 0, shadows: 0,
      whites: 0, blacks: 0, brightness: 0, hue: 0, saturation: 0,
      lightness: 0, levelsBlack: 0, levelsMid: 1, levelsWhite: 255,
      curveAmount: 0, colorBalanceCyanRed: 0, colorBalanceMagentaGreen: 0,
      colorBalanceYellowBlue: 0, vibrance: 0, selectiveRed: 0,
      selectiveGreen: 0, selectiveBlue: 0, channelRedFromGreen: 0,
      channelRedFromBlue: 0, channelGreenFromRed: 0, channelGreenFromBlue: 0,
      channelBlueFromRed: 0, channelBlueFromGreen: 0, lutPreset: 0,
    },
  };

  return {
    document: document_,
    layers,
    activeLayerId: project.activeLayerId,
    foregroundColor: project.foregroundColor || '#F7C948',
    backgroundColor: project.backgroundColor || '#000000',
    projectId,
    projectName: project.name,
  };
}

// ─── Delete Project ───────────────────────────────────────────────────────────

export function deleteProject(projectId: string): void {
  void deleteStoredProject(projectId);
  const registry = getProjectRegistry();
  setProjectRegistry(registry.filter((e) => e.id !== projectId));
}

// ─── Export Project as File ───────────────────────────────────────────────────

export async function exportProjectAsFile(
  state: EditorState,
  projectName: string
): Promise<void> {
  const doc = state.documents.find((d) => d.id === state.activeDocumentId);
  if (!doc) return;

  const now = new Date().toISOString();
  const serializedLayers: ProjectLayer[] = await Promise.all(
    state.layers.map(async (layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      locked: layer.locked,
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      imageDataUrl: layer.imageData ? await imageDataToDataUrl(layer.imageData) : null,
      maskDataUrl: layer.mask?.imageData ? await imageDataToDataUrl(layer.mask.imageData) : null,
      thumbnail: layer.thumbnail,
      isSmartObject: layer.isSmartObject,
      adjustment: layer.adjustment,
      text: layer.text,
    }))
  );

  const project: DawnDeskProject = {
    version: '1.0',
    name: projectName,
    createdAt: now,
    updatedAt: now,
    document: {
      id: doc.id,
      fileName: doc.fileName || projectName,
      width: doc.width,
      height: doc.height,
      dpi: doc.dpi,
      colorMode: 'RGB',
      bitDepth: 8,
      zoom: doc.zoom,
      panOffset: doc.panOffset,
    },
    layers: serializedLayers,
    activeLayerId: state.activeLayerId,
    foregroundColor: state.foregroundColor,
    backgroundColor: state.backgroundColor,
  };

  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}.dawndesk`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import Project from File ─────────────────────────────────────────────────

export async function importProjectFromFile(file: File): Promise<LoadedProject> {
  const text = await file.text();
  const project: DawnDeskProject = JSON.parse(text);

  const layers: LayerInfo[] = await Promise.all(
    project.layers.map(async (pl) => {
      const imageData = pl.imageDataUrl ? await dataUrlToImageData(pl.imageDataUrl) : null;
      const maskImageData = pl.maskDataUrl ? await dataUrlToImageData(pl.maskDataUrl) : null;
      return {
        id: pl.id,
        name: pl.name,
        visible: pl.visible,
        locked: pl.locked,
        opacity: pl.opacity,
        blendMode: pl.blendMode,
        thumbnail: pl.thumbnail,
        imageData,
        isSmartObject: pl.isSmartObject,
        mask: maskImageData ? { imageData: maskImageData, thumbnail: pl.maskDataUrl ?? null } : undefined,
        adjustment: pl.adjustment,
        text: pl.text,
      };
    })
  );

  const doc = project.document;
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = doc.width;
  compositeCanvas.height = doc.height;
  const compositeCtx = compositeCanvas.getContext('2d')!;

  [...layers].reverse().forEach((layer) => {
    if (!layer.visible) return;
    if (layer.adjustment) {
      const adjusted = applyProjectAdjustments(compositeCtx.getImageData(0, 0, doc.width, doc.height), layer.adjustment);
      compositeCtx.putImageData(adjusted, 0, 0);
      return;
    }
    if (!layer.imageData) return;
    const sourceImageData = layer.mask ? applyMaskToImageData(layer.imageData, layer.mask.imageData) : layer.imageData;
    const src = document.createElement('canvas');
    src.width = sourceImageData.width;
    src.height = sourceImageData.height;
    src.getContext('2d')!.putImageData(sourceImageData, 0, 0);
    compositeCtx.save();
    compositeCtx.globalAlpha = layer.opacity / 100;
    compositeCtx.globalCompositeOperation = toCompositeOperation(layer.blendMode);
    compositeCtx.drawImage(src, 0, 0, doc.width, doc.height);
    compositeCtx.restore();
  });

  const compositeImageData = compositeCtx.getImageData(0, 0, doc.width, doc.height);

  const document_: ImageDocument = {
    id: `doc-${Date.now()}`,
    fileName: doc.fileName || project.name,
    filePath: null,
    width: doc.width,
    height: doc.height,
    dpi: doc.dpi || 72,
    colorMode: 'RGB',
    bitDepth: 8,
    imageData: compositeImageData,
    originalImageData: compositeImageData,
    thumbnail: null,
    isDirty: false,
    zoom: doc.zoom || 1,
    panOffset: doc.panOffset || { x: 0, y: 0 },
    pendingAdjustments: {
      exposure: 0, contrast: 0, highlights: 0, shadows: 0,
      whites: 0, blacks: 0, brightness: 0, hue: 0, saturation: 0,
      lightness: 0, levelsBlack: 0, levelsMid: 1, levelsWhite: 255,
      curveAmount: 0, colorBalanceCyanRed: 0, colorBalanceMagentaGreen: 0,
      colorBalanceYellowBlue: 0, vibrance: 0, selectiveRed: 0,
      selectiveGreen: 0, selectiveBlue: 0, channelRedFromGreen: 0,
      channelRedFromBlue: 0, channelGreenFromRed: 0, channelGreenFromBlue: 0,
      channelBlueFromRed: 0, channelBlueFromGreen: 0, lutPreset: 0,
    },
  };

  // Also save to local registry
  const now = new Date().toISOString();
  const projectId = createProjectId();
  await putStoredProject(projectId, project);
  const registry = getProjectRegistry();
  registry.unshift({
    id: projectId,
    name: project.name,
    createdAt: project.createdAt || now,
    updatedAt: now,
    width: doc.width,
    height: doc.height,
    thumbnail: layers.find((l) => l.thumbnail)?.thumbnail ?? null,
  });
  setProjectRegistry(registry);

  return {
    document: document_,
    layers,
    activeLayerId: project.activeLayerId,
    foregroundColor: project.foregroundColor || '#F7C948',
    backgroundColor: project.backgroundColor || '#000000',
    projectId,
    projectName: project.name,
  };
}
