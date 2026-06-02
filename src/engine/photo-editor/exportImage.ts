import { invoke } from '@tauri-apps/api/core';

type ExportFormat = 'png' | 'jpeg' | 'webp' | 'svg';

export async function exportImageToFile(
  imageData: ImageData,
  fileName: string,
  format: ExportFormat = 'png',
  quality = 0.92,
  scale = 1
): Promise<void> {
  const blob = format === 'svg'
    ? await imageDataToSvgBlob(imageData, scale)
    : await imageDataToBlob(imageData, format, quality, scale);
  const exportName = withExtension(fileName, format);

  if (await saveWithBrowserPicker(blob, exportName, format)) {
    return;
  }

  try {
    const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
    await invoke('photo_export_file', {
      fileName: exportName,
      bytes,
    });
    return;
  } catch (error) {
    console.warn('Native export failed, falling back to browser download:', error);
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  window.setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

async function saveWithBrowserPicker(
  blob: Blob,
  fileName: string,
  format: ExportFormat
): Promise<boolean> {
  const picker = (window as unknown as {
    showSaveFilePicker?: (options: {
      suggestedName: string;
      types: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{ createWritable: () => Promise<{ write: (blob: Blob) => Promise<void>; close: () => Promise<void> }> }>;
  }).showSaveFilePicker;

  if (!picker) return false;

  try {
    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : format === 'svg' ? 'image/svg+xml' : 'image/png';
    const extension = format === 'jpeg' ? '.jpg' : `.${format}`;
    const handle = await picker({
      suggestedName: fileName,
      types: [
        {
          description: `${format.toUpperCase()} image`,
          accept: { [mimeType]: [extension] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') return true;
    console.warn('Save picker failed, falling back to native export:', error);
    return false;
  }
}

export async function imageDataToBlob(
  imageData: ImageData,
  format: Exclude<ExportFormat, 'svg'> = 'png',
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

async function imageDataToSvgBlob(imageData: ImageData, scale = 1): Promise<Blob> {
  const png = await imageDataToBlob(imageData, 'png', 1, scale);
  const dataUrl = await blobToDataUrl(png);
  const width = Math.max(1, Math.round(imageData.width * scale));
  const height = Math.max(1, Math.round(imageData.height * scale));
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<image href="${dataUrl}" width="${width}" height="${height}" preserveAspectRatio="none"/>`,
    '</svg>',
  ].join('');
  return new Blob([svg], { type: 'image/svg+xml' });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

export async function exportBatchToFiles(
  documents: { fileName: string; imageData: ImageData | null }[],
  format: ExportFormat,
  quality: number,
  scale: number
): Promise<void> {
  for (const doc of documents) {
    if (!doc.imageData) continue;
    await exportImageToFile(doc.imageData, doc.fileName, format, quality, scale);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

function withExtension(fileName: string, format: ExportFormat): string {
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
