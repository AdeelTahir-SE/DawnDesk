/**
 * Brush & Eraser tool — draw strokes on the canvas using bresenham-interpolated
 * points and configurable size/hardness/opacity.
 */

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

/**
 * Draw a single brush stamp at a given position.
 */
export function drawBrushStamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  hardness: number,
  color: string,
  opacity: number,
  isEraser = false
) {
  ctx.save();

  if (isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = opacity / 100;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = opacity / 100;
  }

  if (hardness >= 95) {
    // Hard brush — filled circle
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    // Soft brush — radial gradient
    const radius = size / 2;
    const innerRadius = radius * (hardness / 100);
    const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Interpolate between two points and draw stamps at each interpolated position.
 * Uses bresenham-like spacing based on brush size.
 */
export function drawStrokeBetween(
  ctx: CanvasRenderingContext2D,
  from: StrokePoint,
  to: StrokePoint,
  size: number,
  hardness: number,
  color: string,
  opacity: number,
  isEraser = false
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Spacing: 25% of brush size for smooth strokes
  const spacing = Math.max(1, size * 0.25);
  const steps = Math.max(1, Math.ceil(dist / spacing));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t;
    const y = from.y + dy * t;
    drawBrushStamp(ctx, x, y, size, hardness, color, opacity, isEraser);
  }
}

/**
 * Flood fill algorithm — fills a contiguous region of similar color.
 */
export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: { r: number; g: number; b: number; a: number },
  tolerance = 32
): ImageData {
  const { width, height, data } = imageData;
  const result = new Uint8ClampedArray(data);

  const sx = Math.round(startX);
  const sy = Math.round(startY);

  if (sx < 0 || sx >= width || sy < 0 || sy >= height) return imageData;

  const startIdx = (sy * width + sx) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  // Don't fill if target color equals fill color
  if (
    targetR === fillColor.r && targetG === fillColor.g &&
    targetB === fillColor.b && targetA === fillColor.a
  ) {
    return imageData;
  }

  const visited = new Uint8Array(width * height);
  const stack: number[] = [sx, sy];

  const matches = (idx: number): boolean => {
    return (
      Math.abs(data[idx] - targetR) <= tolerance &&
      Math.abs(data[idx + 1] - targetG) <= tolerance &&
      Math.abs(data[idx + 2] - targetB) <= tolerance &&
      Math.abs(data[idx + 3] - targetA) <= tolerance
    );
  };

  while (stack.length > 0) {
    const y = stack.pop()!;
    const x = stack.pop()!;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const pixelIdx = y * width + x;
    if (visited[pixelIdx]) continue;
    visited[pixelIdx] = 1;

    const dataIdx = pixelIdx * 4;
    if (!matches(dataIdx)) continue;

    result[dataIdx] = fillColor.r;
    result[dataIdx + 1] = fillColor.g;
    result[dataIdx + 2] = fillColor.b;
    result[dataIdx + 3] = fillColor.a;

    stack.push(x + 1, y);
    stack.push(x - 1, y);
    stack.push(x, y + 1);
    stack.push(x, y - 1);
  }

  return new ImageData(result, width, height);
}

/**
 * Eyedropper — sample the color at a specific pixel.
 */
export function sampleColor(
  imageData: ImageData,
  x: number,
  y: number
): string {
  const px = Math.round(x);
  const py = Math.round(y);

  if (px < 0 || px >= imageData.width || py < 0 || py >= imageData.height) {
    return '#000000';
  }

  const idx = (py * imageData.width + px) * 4;
  const r = imageData.data[idx];
  const g = imageData.data[idx + 1];
  const b = imageData.data[idx + 2];

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Parse a hex color string to RGBA values.
 */
export function hexToRGBA(hex: string): { r: number; g: number; b: number; a: number } {
  const match = hex.replace('#', '').match(/.{2}/g);
  if (!match) return { r: 0, g: 0, b: 0, a: 255 };
  return {
    r: parseInt(match[0], 16),
    g: parseInt(match[1], 16),
    b: parseInt(match[2], 16),
    a: match[3] ? parseInt(match[3], 16) : 255,
  };
}
