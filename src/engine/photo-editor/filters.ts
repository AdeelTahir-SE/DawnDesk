/**
 * Frontend color adjustment and filter operations.
 * Operates directly on ImageData pixel buffers.
 */

// ─── Color Adjustments ───────────────────────────────────────────────────────

export function applyBrightnessContrast(
  imageData: ImageData,
  brightness: number, // -100 to 100
  contrast: number    // -100 to 100
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const bFactor = brightness / 100 * 255;
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let val = data[i + c];
      val += bFactor;                           // brightness
      val = cFactor * (val - 128) + 128;         // contrast
      data[i + c] = Math.max(0, Math.min(255, val));
    }
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applyExposure(
  imageData: ImageData,
  exposure: number // -5.0 to 5.0
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const factor = Math.pow(2, exposure);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, Math.min(255, data[i] * factor));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor));
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applyHueSaturation(
  imageData: ImageData,
  hueShift: number,    // -180 to 180
  saturation: number,  // -100 to 100
  lightness: number    // -100 to 100
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const hueDelta = hueShift / 360;
  const satFactor = 1 + saturation / 100;
  const lightDelta = lightness / 100;

  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const newH = ((h + hueDelta) % 1 + 1) % 1;
    const newS = Math.max(0, Math.min(1, s * satFactor));
    const newL = Math.max(0, Math.min(1, l + lightDelta));
    const [r, g, b] = hslToRgb(newH, newS, newL);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export function applyGrayscale(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    // Luminance-weighted grayscale
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applyInvert(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applySepia(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    data[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
    data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
    data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
  }

  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Gaussian blur — simplified box blur for frontend preview.
 * For production quality, the Rust backend uses a proper separable Gaussian.
 */
export function applyBlurFast(imageData: ImageData, radius: number): ImageData {
  if (radius <= 0) return imageData;

  const { width, height } = imageData;
  const src = imageData.data;
  const dst = new Uint8ClampedArray(src.length);
  const r = Math.round(radius);

  // Horizontal pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;

      for (let kx = -r; kx <= r; kx++) {
        const sx = Math.min(width - 1, Math.max(0, x + kx));
        const idx = (y * width + sx) * 4;
        rSum += src[idx];
        gSum += src[idx + 1];
        bSum += src[idx + 2];
        aSum += src[idx + 3];
        count++;
      }

      const idx = (y * width + x) * 4;
      dst[idx] = rSum / count;
      dst[idx + 1] = gSum / count;
      dst[idx + 2] = bSum / count;
      dst[idx + 3] = aSum / count;
    }
  }

  // Vertical pass (use dst as source, write to result)
  const result = new Uint8ClampedArray(src.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;

      for (let ky = -r; ky <= r; ky++) {
        const sy = Math.min(height - 1, Math.max(0, y + ky));
        const idx = (sy * width + x) * 4;
        rSum += dst[idx];
        gSum += dst[idx + 1];
        bSum += dst[idx + 2];
        aSum += dst[idx + 3];
        count++;
      }

      const idx = (y * width + x) * 4;
      result[idx] = rSum / count;
      result[idx + 1] = gSum / count;
      result[idx + 2] = bSum / count;
      result[idx + 3] = aSum / count;
    }
  }

  return new ImageData(result, width, height);
}

/**
 * Sharpen using an unsharp mask approach.
 */
export function applySharpen(imageData: ImageData, amount: number): ImageData {
  if (amount <= 0) return imageData;

  const blurred = applyBlurFast(imageData, 1);
  const src = imageData.data;
  const blur = blurred.data;
  const result = new Uint8ClampedArray(src.length);
  const factor = amount / 50;

  for (let i = 0; i < src.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const diff = src[i + c] - blur[i + c];
      result[i + c] = Math.max(0, Math.min(255, src[i + c] + diff * factor));
    }
    result[i + 3] = src[i + 3]; // preserve alpha
  }

  return new ImageData(result, imageData.width, imageData.height);
}

// ─── Highlights / Shadows / Whites / Blacks ───────────────────────────────────

export function applyToneAdjustments(
  imageData: ImageData,
  highlights: number,
  shadows: number,
  whites: number,
  blacks: number
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let val = data[i + c] / 255;

      // Shadows: affect dark tones (val < 0.3)
      if (shadows !== 0) {
        const shadowMask = Math.max(0, 1 - val / 0.3);
        val += (shadows / 100) * 0.3 * shadowMask;
      }

      // Highlights: affect bright tones (val > 0.7)
      if (highlights !== 0) {
        const highlightMask = Math.max(0, (val - 0.7) / 0.3);
        val += (highlights / 100) * 0.3 * highlightMask;
      }

      // Blacks: lift or crush the black point
      if (blacks !== 0) {
        const blacksMask = Math.max(0, 1 - val / 0.15);
        val += (blacks / 100) * 0.15 * blacksMask;
      }

      // Whites: extend or compress the white point
      if (whites !== 0) {
        const whitesMask = Math.max(0, (val - 0.85) / 0.15);
        val += (whites / 100) * 0.15 * whitesMask;
      }

      data[i + c] = Math.max(0, Math.min(255, val * 255));
    }
  }

  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Apply all pending adjustments to a source ImageData.
 * Used for real-time preview on the canvas.
 */
export function applyAllAdjustments(
  source: ImageData,
  adjustments: {
    exposure: number;
    contrast: number;
    highlights: number;
    shadows: number;
    whites: number;
    blacks: number;
    brightness: number;
    hue: number;
    saturation: number;
    lightness: number;
  }
): ImageData {
  let result = source;

  // Only apply non-zero adjustments for performance
  if (adjustments.exposure !== 0) {
    result = applyExposure(result, adjustments.exposure);
  }
  if (adjustments.brightness !== 0 || adjustments.contrast !== 0) {
    result = applyBrightnessContrast(result, adjustments.brightness, adjustments.contrast);
  }
  if (adjustments.highlights !== 0 || adjustments.shadows !== 0 || adjustments.whites !== 0 || adjustments.blacks !== 0) {
    result = applyToneAdjustments(result, adjustments.highlights, adjustments.shadows, adjustments.whites, adjustments.blacks);
  }
  if (adjustments.hue !== 0 || adjustments.saturation !== 0 || adjustments.lightness !== 0) {
    result = applyHueSaturation(result, adjustments.hue, adjustments.saturation, adjustments.lightness);
  }

  return result;
}

// ─── HSL Conversion Helpers ───────────────────────────────────────────────────

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}
