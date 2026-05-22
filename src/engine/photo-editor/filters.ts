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

export function applyLevels(imageData: ImageData, black: number, mid: number, white: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const inBlack = Math.max(0, Math.min(254, black));
  const inWhite = Math.max(inBlack + 1, Math.min(255, white));
  const gamma = Math.max(0.1, Math.min(9.99, mid));

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const normalized = Math.max(0, Math.min(1, (data[i + c] - inBlack) / (inWhite - inBlack)));
      data[i + c] = Math.pow(normalized, 1 / gamma) * 255;
    }
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applyCurve(imageData: ImageData, amount: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const strength = Math.max(-1, Math.min(1, amount / 100));

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const x = data[i + c] / 255;
      const sCurve = x * x * (3 - 2 * x);
      const inverted = x + (x - sCurve);
      const y = strength >= 0
        ? x + (sCurve - x) * strength
        : x + (inverted - x) * -strength;
      data[i + c] = Math.max(0, Math.min(255, y * 255));
    }
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applyColorBalance(imageData: ImageData, cyanRed: number, magentaGreen: number, yellowBlue: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const rShift = cyanRed * 1.28;
  const gShift = magentaGreen * 1.28;
  const bShift = yellowBlue * 1.28;

  for (let i = 0; i < data.length; i += 4) {
    const luma = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    const midtoneMask = 1 - Math.abs(luma - 0.5) * 1.4;
    const mask = Math.max(0.25, Math.min(1, midtoneMask));
    data[i] = Math.max(0, Math.min(255, data[i] + rShift * mask));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + gShift * mask));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + bShift * mask));
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applyVibrance(imageData: ImageData, vibrance: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const factor = vibrance / 100;

  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const skinHue = h > 0.03 && h < 0.13;
    const protection = skinHue ? 0.55 : 1;
    const boost = (1 - s) * factor * protection;
    const newS = Math.max(0, Math.min(1, s + boost));
    const [r, g, b] = hslToRgb(h, newS, l);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applySelectiveColor(imageData: ImageData, red: number, green: number, blue: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const shifts = [red / 100, green / 100, blue / 100];

  for (let i = 0; i < data.length; i += 4) {
    const total = data[i] + data[i + 1] + data[i + 2] || 1;
    for (let c = 0; c < 3; c++) {
      const dominance = data[i + c] / total;
      data[i + c] = Math.max(0, Math.min(255, data[i + c] + 90 * shifts[c] * dominance));
    }
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applyChannelMixer(
  imageData: ImageData,
  redFromGreen: number,
  redFromBlue: number,
  greenFromRed: number,
  greenFromBlue: number,
  blueFromRed: number,
  blueFromGreen: number
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const rg = redFromGreen / 100;
  const rb = redFromBlue / 100;
  const gr = greenFromRed / 100;
  const gb = greenFromBlue / 100;
  const br = blueFromRed / 100;
  const bg = blueFromGreen / 100;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = Math.max(0, Math.min(255, r + g * rg + b * rb));
    data[i + 1] = Math.max(0, Math.min(255, g + r * gr + b * gb));
    data[i + 2] = Math.max(0, Math.min(255, b + r * br + g * bg));
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applyLutPreset(imageData: ImageData, preset: number): ImageData {
  if (preset === 0) return imageData;
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    if (preset === 1) {
      r = r * 1.08 + 10; g = g * 1.02; b = b * 0.88;
    } else if (preset === 2) {
      r = r * 0.95 + 18; g = g * 0.95 + 14; b = b * 0.92 + 8;
    } else if (preset === 3) {
      r = r * 0.9; g = g * 1.02 + 4; b = b * 1.12 + 12;
    }
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
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

export function applyVignette(imageData: ImageData, amount = 45): ImageData {
  const { width, height } = imageData;
  const data = new Uint8ClampedArray(imageData.data);
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const strength = amount / 100;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
      const fade = 1 - Math.max(0, dist - 0.35) * strength;
      const idx = (y * width + x) * 4;
      data[idx] *= fade;
      data[idx + 1] *= fade;
      data[idx + 2] *= fade;
    }
  }

  return new ImageData(data, width, height);
}

export function applyMotionBlur(imageData: ImageData, distance = 12, angle = 0): ImageData {
  const { width, height, data: src } = imageData;
  const dst = new Uint8ClampedArray(src.length);
  const steps = Math.max(1, Math.round(distance));
  const radians = (angle * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sums = [0, 0, 0, 0];
      let count = 0;
      for (let step = -steps; step <= steps; step++) {
        const sx = Math.round(x + dx * step);
        const sy = Math.round(y + dy * step);
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
        const idx = (sy * width + sx) * 4;
        sums[0] += src[idx];
        sums[1] += src[idx + 1];
        sums[2] += src[idx + 2];
        sums[3] += src[idx + 3];
        count++;
      }
      const out = (y * width + x) * 4;
      dst[out] = sums[0] / count;
      dst[out + 1] = sums[1] / count;
      dst[out + 2] = sums[2] / count;
      dst[out + 3] = sums[3] / count;
    }
  }

  return new ImageData(dst, width, height);
}

export function applyNoise(imageData: ImageData, amount = 18): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const range = amount * 2.55;

  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * range;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }

  return new ImageData(data, imageData.width, imageData.height);
}

export function applyDenoise(imageData: ImageData): ImageData {
  return applyBlurFast(imageData, 1);
}

export function applyLiquifyWarp(imageData: ImageData, strength = 18): ImageData {
  const { width, height, data: src } = imageData;
  const dst = new Uint8ClampedArray(src.length);
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) / 2;
  const twist = strength / 100;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const influence = Math.max(0, 1 - distance / maxRadius);
      const angle = twist * influence * influence * Math.PI;
      const sx = Math.round(cx + dx * Math.cos(angle) - dy * Math.sin(angle));
      const sy = Math.round(cy + dx * Math.sin(angle) + dy * Math.cos(angle));
      const srcX = Math.max(0, Math.min(width - 1, sx));
      const srcY = Math.max(0, Math.min(height - 1, sy));
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = (y * width + x) * 4;
      dst[dstIdx] = src[srcIdx];
      dst[dstIdx + 1] = src[srcIdx + 1];
      dst[dstIdx + 2] = src[srcIdx + 2];
      dst[dstIdx + 3] = src[srcIdx + 3];
    }
  }

  return new ImageData(dst, width, height);
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

export function applySmartSharpen(imageData: ImageData, amount = 65): ImageData {
  const sharpened = applySharpen(imageData, amount);
  const src = imageData.data;
  const out = new Uint8ClampedArray(sharpened.data);

  for (let i = 0; i < src.length; i += 4) {
    const contrast = Math.max(src[i], src[i + 1], src[i + 2]) - Math.min(src[i], src[i + 1], src[i + 2]);
    const mask = Math.min(1, contrast / 64);
    for (let c = 0; c < 3; c++) {
      out[i + c] = src[i + c] + (out[i + c] - src[i + c]) * mask;
    }
  }

  return new ImageData(out, imageData.width, imageData.height);
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
  adjustments: import('./types').AdjustmentState
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
  if (adjustments.levelsBlack !== 0 || adjustments.levelsMid !== 1 || adjustments.levelsWhite !== 255) {
    result = applyLevels(result, adjustments.levelsBlack, adjustments.levelsMid, adjustments.levelsWhite);
  }
  if (adjustments.curveAmount !== 0) {
    result = applyCurve(result, adjustments.curveAmount);
  }
  if (adjustments.colorBalanceCyanRed !== 0 || adjustments.colorBalanceMagentaGreen !== 0 || adjustments.colorBalanceYellowBlue !== 0) {
    result = applyColorBalance(result, adjustments.colorBalanceCyanRed, adjustments.colorBalanceMagentaGreen, adjustments.colorBalanceYellowBlue);
  }
  if (adjustments.vibrance !== 0) {
    result = applyVibrance(result, adjustments.vibrance);
  }
  if (adjustments.selectiveRed !== 0 || adjustments.selectiveGreen !== 0 || adjustments.selectiveBlue !== 0) {
    result = applySelectiveColor(result, adjustments.selectiveRed, adjustments.selectiveGreen, adjustments.selectiveBlue);
  }
  if (
    adjustments.channelRedFromGreen !== 0 || adjustments.channelRedFromBlue !== 0 ||
    adjustments.channelGreenFromRed !== 0 || adjustments.channelGreenFromBlue !== 0 ||
    adjustments.channelBlueFromRed !== 0 || adjustments.channelBlueFromGreen !== 0
  ) {
    result = applyChannelMixer(
      result,
      adjustments.channelRedFromGreen,
      adjustments.channelRedFromBlue,
      adjustments.channelGreenFromRed,
      adjustments.channelGreenFromBlue,
      adjustments.channelBlueFromRed,
      adjustments.channelBlueFromGreen
    );
  }
  if (adjustments.lutPreset !== 0) {
    result = applyLutPreset(result, adjustments.lutPreset);
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
