/**
 * Export the current canvas as a PNG or JPEG file download.
 */
export async function exportImageToFile(
  imageData: ImageData,
  fileName: string,
  format: 'png' | 'jpeg' = 'png',
  quality = 0.92
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, quality)
  );

  if (!blob) throw new Error('Failed to create image blob');

  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.replace(/\.[^.]+$/, '') + (format === 'jpeg' ? '.jpg' : '.png');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
