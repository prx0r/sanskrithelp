/**
 * Client-side draw recognition via pixel comparison.
 * Renders reference Devanagari glyphs and compares to user's drawing.
 * No API, no ML — works offline.
 *
 * Path 1 improvements: fit-to-bbox normalization, 64×64, chamfer distance.
 */

const SIZE = 64;
const PADDING = 4;
const FONT = "var(--font-devanagari), 'Noto Sans Devanagari', sans-serif";

/** Load pixels from base64 PNG (e.g. hand-drawn reference). Returns SIZE×SIZE grayscale. */
function pixelsFromBase64(base64: string): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const imgData = ctx.getImageData(0, 0, SIZE, SIZE);
      const out = new Uint8Array(SIZE * SIZE);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const gray = 255 - (0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2]);
        out[i / 4] = Math.round(gray);
      }
      resolve(out);
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/png;base64,${base64}`;
  });
}

/** Render a Devanagari character to SIZE×SIZE grayscale (0=white, 255=black). */
function renderReference(char: string): Uint8Array {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8Array(SIZE * SIZE);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = "#000000";
  ctx.font = `bold ${SIZE * 0.85}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, SIZE / 2, SIZE / 2);

  const imgData = ctx.getImageData(0, 0, SIZE, SIZE);
  const out = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const gray = 255 - (0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2]);
    out[i / 4] = Math.round(gray);
  }
  return out;
}

/** Get user's drawn canvas as SIZE×SIZE grayscale (0=white, 255=black). */
export function getDrawnPixels(sourceCanvas: HTMLCanvasElement): Uint8Array {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8Array(SIZE * SIZE);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(sourceCanvas, 0, 0, SIZE, SIZE);

  const imgData = ctx.getImageData(0, 0, SIZE, SIZE);
  const out = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const gray = 255 - (0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2]);
    out[i / 4] = Math.round(gray);
  }
  return out;
}

/** Binarize: threshold at 48 (more forgiving for faint strokes), return 0 or 1. */
function binarize(pixels: Uint8Array): Uint8Array {
  const out = new Uint8Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    out[i] = pixels[i] > 48 ? 1 : 0;
  }
  return out;
}

/**
 * Fit-to-bounding-box normalization: scale content to fill inner region.
 * Find bbox, scale to (size - 2*padding)×(size - 2*padding), paste centered.
 */
function normalizeToFit(pixels: Uint8Array, w: number, h: number): Uint8Array {
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (pixels[y * w + x] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  if (bw < 2 || bh < 2) return pixels;

  const inner = w - 2 * PADDING;
  const out = new Uint8Array(w * h);
  for (let ty = 0; ty < inner; ty++) {
    for (let tx = 0; tx < inner; tx++) {
      const sx = minX + Math.floor((tx * bw) / inner);
      const sy = minY + Math.floor((ty * bh) / inner);
      if (sx <= maxX && sy <= maxY && pixels[sy * w + sx] > 0) {
        const dx = PADDING + tx;
        const dy = PADDING + ty;
        out[dy * w + dx] = 1;
      }
    }
  }
  return out;
}

/**
 * Chamfer distance transform (3-4 mask). Returns distance from each pixel to nearest dark pixel.
 */
function distanceTransform(pixels: Uint8Array, w: number, h: number): Float32Array {
  const INF = 1e6;
  const d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = pixels[i] > 0 ? 0 : INF;

  // Forward pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (d[i] === 0) continue;
      let m = INF;
      if (x > 0) m = Math.min(m, d[i - 1] + 4);
      if (y > 0) m = Math.min(m, d[i - w] + 4);
      if (x > 0 && y > 0) m = Math.min(m, d[i - w - 1] + 3);
      if (x < w - 1 && y > 0) m = Math.min(m, d[i - w + 1] + 3);
      d[i] = Math.min(d[i], m);
    }
  }
  // Backward pass
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (d[i] === 0) continue;
      let m = d[i];
      if (x < w - 1) m = Math.min(m, d[i + 1] + 4);
      if (y < h - 1) m = Math.min(m, d[i + w] + 4);
      if (x < w - 1 && y < h - 1) m = Math.min(m, d[i + w + 1] + 3);
      if (x > 0 && y < h - 1) m = Math.min(m, d[i + w - 1] + 3);
      d[i] = m;
    }
  }
  return d;
}

/**
 * Chamfer-based similarity: score user pixels by distance to nearest reference pixel.
 * Tolerates stroke thickness; lower avg distance = higher similarity.
 */
function chamferSimilarity(user: Uint8Array, ref: Uint8Array, w: number, h: number): number {
  const dRef = distanceTransform(ref, w, h);
  const dUser = distanceTransform(user, w, h);
  let sumUser = 0, countUser = 0;
  let sumRef = 0, countRef = 0;
  for (let i = 0; i < user.length; i++) {
    if (user[i] > 0) {
      sumUser += dRef[i];
      countUser++;
    }
    if (ref[i] > 0) {
      sumRef += dUser[i];
      countRef++;
    }
  }
  const avgUser = countUser > 0 ? sumUser / countUser : 0;
  const avgRef = countRef > 0 ? sumRef / countRef : 0;
  const avgDist = (avgUser + avgRef) / 2;
  return 1 / (1 + avgDist);
}

export interface PhonemeOption {
  devanagari: string;
  id: string;
}

/**
 * Compare user's drawing to reference renders of each option.
 * Returns the best-matching option, or null if no clear winner.
 */
export function matchByPixels(
  sourceCanvas: HTMLCanvasElement,
  options: PhonemeOption[]
): PhonemeOption | null {
  const raw = getDrawnPixels(sourceCanvas);
  const drawn = normalizeToFit(binarize(raw), SIZE, SIZE);
  const drawnMass = drawn.reduce((s, v) => s + v, 0);
  if (drawnMass < 8) return null;

  let best: PhonemeOption | null = null;
  let bestScore = 0;

  for (const opt of options) {
    const refRaw = binarize(renderReference(opt.devanagari));
    const ref = normalizeToFit(refRaw, SIZE, SIZE);
    const score = chamferSimilarity(drawn, ref, SIZE, SIZE);
    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  }

  return bestScore > 0.35 ? best : null;
}

/**
 * Async version that uses hand-drawn references when available.
 * Pass refs: { [devanagari]: base64Png } from getReferenceDrawings().
 */
export async function matchByPixelsWithRefs(
  sourceCanvas: HTMLCanvasElement,
  options: PhonemeOption[],
  refs?: Record<string, string>
): Promise<PhonemeOption | null> {
  const raw = getDrawnPixels(sourceCanvas);
  const drawn = normalizeToFit(binarize(raw), SIZE, SIZE);
  const drawnMass = drawn.reduce((s, v) => s + v, 0);
  if (drawnMass < 8) return null;

  let best: PhonemeOption | null = null;
  let bestScore = 0;

  for (const opt of options) {
    const refPixels = await (refs?.[opt.devanagari]
      ? pixelsFromBase64(refs[opt.devanagari])
      : Promise.resolve(null));
    const refRaw = refPixels ? binarize(refPixels) : binarize(renderReference(opt.devanagari));
    const ref = normalizeToFit(refRaw, SIZE, SIZE);
    const score = chamferSimilarity(drawn, ref, SIZE, SIZE);
    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  }

  return bestScore > 0.35 ? best : null;
}
