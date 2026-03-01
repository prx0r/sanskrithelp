/**
 * Two-model Devanagari recognition: Character CNN + Word CRNN.
 *
 * Model 1 (char): 32×32 → single character
 * Model 2 (word): variable canvas → word/phrase via CTC
 *
 * Load both on init. Auto-detect by aspect ratio: tall/square = char, wide = word.
 */

const CHAR_SIZE = 32;
const WORD_H = 32;
const WORD_W = 128;
const CHAR_MODEL_URL = "/dhcd/tfjs_model/model.json";
const WORD_MODEL_URL = "/dhcd/word_tfjs_model/model.json";
// Model 1: class_labels.json (46 DHCD chars) — from ml/dhcd/export_mapping.py
const CLASS_LABELS_URL = "/dhcd/class_labels.json";
// Model 2: charlist.json (word model charset + blank) — from ml/word/ train, copied by convert
const CHARLIST_URL = "/dhcd/charlist.json";

type LayersModel = import("@tensorflow/tfjs").LayersModel;

let charModelPromise: Promise<LayersModel> | null = null;
let wordModelPromise: Promise<LayersModel> | null = null;
let classLabelsPromise: Promise<string[]> | null = null;
let charlistPromise: Promise<string[]> | null = null;

/** Load both models and labels. Call early to warm up. */
export async function loadBothModels(): Promise<{ char: LayersModel; word: LayersModel | null }> {
  const char = await loadCharModel();
  const word = await loadWordModel();
  return { char, word };
}

/** Load character model only. */
export function loadCharModel(): Promise<LayersModel> {
  if (!charModelPromise) {
    charModelPromise = import("@tensorflow/tfjs").then((tf) =>
      tf.loadLayersModel(CHAR_MODEL_URL)
    );
  }
  return charModelPromise;
}

/** Load word model only. Returns null if not available. */
export async function loadWordModel(): Promise<LayersModel | null> {
  if (!wordModelPromise) {
    wordModelPromise = import("@tensorflow/tfjs")
      .then((tf) => tf.loadLayersModel(WORD_MODEL_URL))
      .catch(() => null);
  }
  return wordModelPromise;
}

async function loadClassLabels(): Promise<string[]> {
  if (!classLabelsPromise) {
    classLabelsPromise = fetch(CLASS_LABELS_URL)
      .then((r) => (r.ok ? r : fetch("/dhcd/classes.json")))
      .then((r) => r.json())
      .then((arr: string[]) => {
        if (arr.length !== 46) throw new Error("Expected 46 DHCD classes");
        return arr;
      });
  }
  return classLabelsPromise;
}

async function loadCharlist(): Promise<string[]> {
  if (!charlistPromise) {
    charlistPromise = fetch(CHARLIST_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("charlist not found"))))
      .then((arr: string[]) => arr);
  }
  return charlistPromise;
}

export interface CharResult {
  char: string;
  confidence: number;
  classIndex: number;
}

/** @deprecated Use CharResult */
export type RecognitionResult = CharResult & { label: string };

export interface WordResult {
  text: string;
  confidence: number;
}

/** Recognize a single character from 32×32 binarized pixels. */
export async function charRecognize(
  pixels: Uint8Array | Float32Array | number[]
): Promise<CharResult | null> {
  if (pixels.length !== CHAR_SIZE * CHAR_SIZE) {
    console.warn(`charRecognize: expected ${CHAR_SIZE * CHAR_SIZE} pixels`);
    return null;
  }

  const [model, classes] = await Promise.all([loadCharModel(), loadClassLabels()]);
  const tf = await import("@tensorflow/tfjs");

  const arr = new Float32Array(CHAR_SIZE * CHAR_SIZE);
  for (let i = 0; i < pixels.length; i++) {
    arr[i] = (pixels[i] as number) > 0 ? 1 : 0;
  }
  const input = tf.tensor4d(Array.from(arr), [1, CHAR_SIZE, CHAR_SIZE, 1]);

  const logits = model.predict(input) as import("@tensorflow/tfjs").Tensor;
  const probs = await (logits as import("@tensorflow/tfjs").Tensor).data();
  input.dispose();
  (logits as import("@tensorflow/tfjs").Tensor).dispose();

  let bestIdx = 0;
  let bestProb = 0;
  for (let i = 0; i < 46; i++) {
    const p = probs[i];
    if (p > bestProb) {
      bestProb = p;
      bestIdx = i;
    }
  }

  return {
    char: classes[bestIdx],
    confidence: bestProb,
    classIndex: bestIdx,
  };
}

/** Alias for charRecognize when passing 32×32 pixels. */
export async function recognizePixels(
  pixels: Uint8Array | Float32Array | number[]
): Promise<CharResult | null> {
  return charRecognize(pixels);
}

/**
 * Greedy CTC decode: argmax per timestep, collapse repeated, remove blank.
 * TF.js has no native CTC decoder — this implements it in JS.
 */
export function ctcGreedyDecode(
  logits: Float32Array,
  seqLen: number,
  numClasses: number,
  blankIndex: number = 0
): number[] {
  const chars: number[] = [];
  let prev = -1;
  for (let t = 0; t < seqLen; t++) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let c = 0; c < numClasses; c++) {
      const v = logits[t * numClasses + c];
      if (v > bestVal) {
        bestVal = v;
        bestIdx = c;
      }
    }
    if (bestIdx !== blankIndex) {
      if (bestIdx !== prev) chars.push(bestIdx);
      prev = bestIdx;
    } else {
      prev = -1;
    }
  }
  return chars;
}

/** Recognize a word/phrase from canvas. Resizes to 128×32. */
export async function wordRecognize(
  canvas: HTMLCanvasElement
): Promise<WordResult | null> {
  const model = await loadWordModel();
  if (!model) return null;

  let charlist: string[];
  try {
    charlist = await loadCharlist();
  } catch {
    return null;
  }
  const tf = await import("@tensorflow/tfjs");

  // Resize canvas to 128×32, grayscale
  const temp = document.createElement("canvas");
  temp.width = WORD_W;
  temp.height = WORD_H;
  const ctx = temp.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, WORD_W, WORD_H);
  ctx.drawImage(canvas, 0, 0, WORD_W, WORD_H);
  const imgData = ctx.getImageData(0, 0, WORD_W, WORD_H);

  const arr = new Float32Array(WORD_W * WORD_H);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const gray =
      1 - (0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2]) / 255;
    arr[i / 4] = gray;
  }
  const input = tf.tensor4d(Array.from(arr), [1, WORD_H, WORD_W, 1]);

  const out = model.predict(input) as import("@tensorflow/tfjs").Tensor;
  const data = await (out as import("@tensorflow/tfjs").Tensor).data();
  input.dispose();
  (out as import("@tensorflow/tfjs").Tensor).dispose();

  const shape = (out as import("@tensorflow/tfjs").Tensor).shape;
  const timeSteps = shape[1];
  const numClasses = shape[2];
  const logitsArr = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) logitsArr[i] = data[i];
  const indices = ctcGreedyDecode(logitsArr, timeSteps, numClasses, 0);
  const text = indices
    .map((i) => charlist[i])
    .filter((c) => c && c !== "<blank>")
    .join("");

  // Softmax per timestep, average max prob as confidence
  let sumMax = 0;
  for (let t = 0; t < timeSteps; t++) {
    let maxLogit = -Infinity;
    for (let c = 0; c < numClasses; c++) {
      const v = data[t * numClasses + c];
      if (v > maxLogit) maxLogit = v;
    }
    let sumExp = 0;
    for (let c = 0; c < numClasses; c++) {
      sumExp += Math.exp(data[t * numClasses + c] - maxLogit);
    }
    sumMax += Math.exp(0) / sumExp;
  }
  const confidence = timeSteps > 0 ? sumMax / timeSteps : 0;

  return { text, confidence };
}

/** Count distinct dark pixel column groups (for char vs word heuristic). */
function countDarkColumnGroups(canvas: HTMLCanvasElement, threshold = 48): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  let groups = 0;
  let inDark = false;
  for (let x = 0; x < w; x++) {
    let hasDark = false;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      const gray = 255 - (0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2]);
      if (gray > threshold) {
        hasDark = true;
        break;
      }
    }
    if (hasDark && !inDark) groups++;
    inDark = hasDark;
  }
  return groups;
}

/** Auto-detect: tall/square or few column groups → char, wide + many groups → word. */
export async function recognize(
  canvas: HTMLCanvasElement,
  pixels32?: Uint8Array | Float32Array | number[]
): Promise<CharResult | WordResult | null> {
  const w = canvas.width;
  const h = canvas.height;
  const aspect = w / h;
  const columnGroups = countDarkColumnGroups(canvas);

  // Single char: aspect ≤ 2.0 OR ≤ 20 distinct dark column groups (handles wide conjuncts)
  const isChar = aspect <= 2.0 || columnGroups <= 20;

  if (isChar) {
    // Tall or square: character
    if (pixels32 && pixels32.length === CHAR_SIZE * CHAR_SIZE) {
      return charRecognize(pixels32);
    }
    // Extract 32×32 from canvas center
    const temp = document.createElement("canvas");
    temp.width = CHAR_SIZE;
    temp.height = CHAR_SIZE;
    const ctx = temp.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, CHAR_SIZE, CHAR_SIZE);
    const s = Math.min(w, h);
    const x = (w - s) / 2;
    const y = (h - s) / 2;
    ctx.drawImage(canvas, x, y, s, s, 0, 0, CHAR_SIZE, CHAR_SIZE);
    const imgData = ctx.getImageData(0, 0, CHAR_SIZE, CHAR_SIZE);
    const px = new Uint8Array(CHAR_SIZE * CHAR_SIZE);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const gray = 255 - (0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2]);
      px[i / 4] = gray > 48 ? 1 : 0;
    }
    return charRecognize(px);
  }

  // Wide: word
  return wordRecognize(canvas);
}

/** Downsample 64×64 to 32×32 for char model. */
export function downsampleTo32x32(
  pixels64: Uint8Array | number[]
): Float32Array {
  const out = new Float32Array(1024);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      let v = 0;
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          if ((pixels64[(y * 2 + dy) * 64 + (x * 2 + dx)] as number) > 0) v = 1;
        }
      }
      out[y * 32 + x] = v;
    }
  }
  return out;
}

/** @deprecated Use loadCharModel or loadBothModels */
export const loadModel = loadCharModel;