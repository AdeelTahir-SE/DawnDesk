import { DEFAULT_ADJUSTMENTS } from './types';
import type { ImageDocument } from './types';

/**
 * Open a file picker and load the selected image into an ImageDocument.
 * Uses a hidden <input type="file"> element for cross-platform compatibility.
 * Returns null if the user cancels.
 */
export function openImageFromDisk(): Promise<ImageDocument | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/bmp,image/gif';
    input.multiple = false;

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const doc = await loadImageFile(file);
        resolve(doc);
      } catch (err) {
        console.error('Failed to load image:', err);
        resolve(null);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Load an image File into an ImageDocument by drawing it on an offscreen canvas.
 */
export async function loadImageFile(file: File): Promise<ImageDocument> {
  const url = URL.createObjectURL(file);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Generate thumbnail for filmstrip (80px wide)
    const thumbCanvas = document.createElement('canvas');
    const thumbHeight = Math.round((80 / img.naturalWidth) * img.naturalHeight);
    thumbCanvas.width = 80;
    thumbCanvas.height = thumbHeight;
    const thumbCtx = thumbCanvas.getContext('2d')!;
    thumbCtx.drawImage(img, 0, 0, 80, thumbHeight);
    const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);

    const doc: ImageDocument = {
      id: crypto.randomUUID(),
      fileName: file.name,
      filePath: null,
      width: img.naturalWidth,
      height: img.naturalHeight,
      dpi: 72,
      colorMode: 'RGB',
      bitDepth: 8,
      imageData,
      originalImageData: new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      ),
      thumbnail,
      isDirty: false,
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      pendingAdjustments: { ...DEFAULT_ADJUSTMENTS },
    };

    return doc;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Load an HTMLImageElement from a URL and wait for it to be ready.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Calculate the initial zoom level to fit the image within the viewport.
 */
export function calculateFitZoom(
  imgWidth: number,
  imgHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  padding = 40
): number {
  const availW = viewportWidth - padding * 2;
  const availH = viewportHeight - padding * 2;
  const scaleX = availW / imgWidth;
  const scaleY = availH / imgHeight;
  return Math.min(scaleX, scaleY, 1); // Never zoom above 100% on open
}
