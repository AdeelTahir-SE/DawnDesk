import type { MediaItem } from '../../engine/video-editor/types';

export const MEDIA_DRAG_TYPE = 'application/x-dawndesk-media';
export const EFFECT_DRAG_TYPE = 'application/x-dawndesk-effect';
export const TRANSITION_DRAG_TYPE = 'application/x-dawndesk-transition';
export const JSON_DRAG_TYPE = 'application/json';

export type EffectDragPayload = {
  dragKind: 'effect';
  effectType: string;
};

export type TransitionDragPayload = {
  dragKind: 'transition';
  transitionType: string;
  duration: number;
};

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function isMediaItem(value: unknown): value is MediaItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<MediaItem>;
  return Boolean(item.id && item.name && item.path && (item.type === 'video' || item.type === 'audio' || item.type === 'image'));
}

export function getDragMediaPayload(item: MediaItem): MediaItem {
  return {
    ...item,
    // Keep drag data small and reliable. Huge data-url thumbnails can break
    // HTML5 drag/drop payloads in embedded WebViews.
    thumbnail: '',
    waveformData: [],
  };
}

export function setMediaDragData(dataTransfer: DataTransfer, item: MediaItem) {
  const media = getDragMediaPayload(item);
  const payload = JSON.stringify(media);
  dataTransfer.clearData();
  dataTransfer.setData(MEDIA_DRAG_TYPE, payload);
  dataTransfer.setData(JSON_DRAG_TYPE, payload);
  dataTransfer.setData('text/plain', `media:${item.id}`);
  dataTransfer.effectAllowed = 'copy';
}

export function setEffectDragData(dataTransfer: DataTransfer, payload: EffectDragPayload) {
  const data = JSON.stringify(payload);
  dataTransfer.clearData();
  dataTransfer.setData(EFFECT_DRAG_TYPE, data);
  dataTransfer.setData(JSON_DRAG_TYPE, data);
  dataTransfer.setData('text/plain', `effect:${payload.effectType}`);
  dataTransfer.effectAllowed = 'copy';
}

export function setTransitionDragData(dataTransfer: DataTransfer, payload: TransitionDragPayload) {
  const data = JSON.stringify(payload);
  dataTransfer.clearData();
  dataTransfer.setData(TRANSITION_DRAG_TYPE, data);
  dataTransfer.setData(JSON_DRAG_TYPE, data);
  dataTransfer.setData('text/plain', `transition:${payload.transitionType}`);
  dataTransfer.effectAllowed = 'copy';
}

export function getDroppedMedia(dataTransfer: DataTransfer, mediaPool: MediaItem[]): MediaItem | null {
  const mediaData = dataTransfer.getData(MEDIA_DRAG_TYPE);
  if (mediaData) {
    const mediaItem = safeJsonParse(mediaData);
    if (isMediaItem(mediaItem)) return mediaItem;
  }

  const jsonData = dataTransfer.getData(JSON_DRAG_TYPE);
  if (jsonData) {
    const mediaItem = safeJsonParse(jsonData);
    if (isMediaItem(mediaItem)) return mediaItem;
  }

  const textData = dataTransfer.getData('text/plain');
  const mediaId = textData.startsWith('media:') ? textData.slice('media:'.length) : textData;
  return mediaPool.find(item => item.id === mediaId) ?? null;
}

export function getDroppedEffect(dataTransfer: DataTransfer): EffectDragPayload | null {
  const data = dataTransfer.getData(EFFECT_DRAG_TYPE) || dataTransfer.getData(JSON_DRAG_TYPE);
  const payload = data ? safeJsonParse(data) : null;
  if (payload && typeof payload === 'object') {
    const candidate = payload as Partial<EffectDragPayload> & { type?: string };
    if ((candidate.dragKind === 'effect' || candidate.type === 'effect') && typeof candidate.effectType === 'string') {
      return { dragKind: 'effect', effectType: candidate.effectType };
    }
  }

  const textData = dataTransfer.getData('text/plain');
  if (textData.startsWith('effect:')) {
    return { dragKind: 'effect', effectType: textData.slice('effect:'.length) };
  }
  return null;
}

export function getDroppedTransition(dataTransfer: DataTransfer): TransitionDragPayload | null {
  const data = dataTransfer.getData(TRANSITION_DRAG_TYPE) || dataTransfer.getData(JSON_DRAG_TYPE);
  const payload = data ? safeJsonParse(data) : null;
  if (payload && typeof payload === 'object') {
    const candidate = payload as Partial<TransitionDragPayload> & { type?: string };
    if ((candidate.dragKind === 'transition' || candidate.type === 'transition') && typeof candidate.transitionType === 'string') {
      return {
        dragKind: 'transition',
        transitionType: candidate.transitionType,
        duration: typeof candidate.duration === 'number' ? candidate.duration : 1,
      };
    }
  }

  const textData = dataTransfer.getData('text/plain');
  if (textData.startsWith('transition:')) {
    return { dragKind: 'transition', transitionType: textData.slice('transition:'.length), duration: 1 };
  }
  return null;
}

