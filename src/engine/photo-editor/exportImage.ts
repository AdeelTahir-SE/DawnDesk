import { invoke } from '@tauri-apps/api/core';

export async function exportImageToFile(
  imageData: ImageData,
  fileName: string,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.92,
  scale = 1
): Promise<void> {
  const blob = await imageDataToBlob(imageData, format, quality, scale);

  try {
    const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
    await invoke('photo_export_file', {
      fileName: withExtension(fileName, format),
      bytes,
    });
    return;
  } catch (error) {
    console.warn('Native export failed, falling back to browser download:', error);
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = withExtension(fileName, format);
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export async function imageDataToBlob(
  imageData: ImageData,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  quality = 0.92,
  scale = 1
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(imageData.width * scale));
  canvas.height = Math.max(1, Math.round(imageData.height * scale));
  const ctx = canvas.getContext('2d')!;

  if (scale === 1) {
    ctx.putImageData(imageData, 0, 0);
  } else {
    const source = document.createElement('canvas');
    source.width = imageData.width;
    source.height = imageData.height;
    source.getContext('2d')!.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }

  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, quality)
  );

  if (!blob) throw new Error('Failed to create image blob');
  return blob;
}

export async function exportBatchToFiles(
  documents: { fileName: string; imageData: ImageData | null }[],
  format: 'png' | 'jpeg' | 'webp',
  quality: number,
  scale: number
): Promise<void> {
  for (const doc of documents) {
    if (!doc.imageData) continue;
    await exportImageToFile(doc.imageData, doc.fileName, format, quality, scale);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

function withExtension(fileName: string, format: 'png' | 'jpeg' | 'webp'): string {
  const ext = format === 'jpeg' ? '.jpg' : `.${format}`;
  return fileName.replace(/\.[^.]+$/, '') + ext;
}

/**
 * Copy image data to clipboard using the browser Clipboard API.
 */
export async function copyImageToClipboard(imageData: ImageData): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );

  if (!blob) throw new Error('Failed to create image blob for clipboard');

  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ]);
}
