/**
 * Draw assessment — Chutes vision API.
 * Reusable for drill, /draw page, and anywhere handwriting needs to be recognized.
 *
 * Usage:
 *   const result = await recognizeDrawing(canvas, "char");
 *   const correct = result?.predicted === targetDevanagari;
 */

export interface DrawResult {
  predicted: string;
  confidence: number;
}

export interface RecognizeResult {
  result: DrawResult | null;
  error?: string;
}

const CHAR_PROMPT =
  "This image shows a single handwritten Devanagari character. Reply with ONLY that one character, nothing else. No explanation, no punctuation.";

const WORD_PROMPT =
  "This image shows handwritten Devanagari (a word or phrase). Reply with ONLY the Devanagari text, nothing else. No explanation, no punctuation.";

/**
 * Recognize drawn Devanagari via Chutes vision API.
 * When candidates provided (e.g. drill options), constrains model to that set for better accuracy.
 * Returns { result, error } so callers can show the actual API error (e.g. "CHUTES_API_KEY not configured") instead of a generic message.
 */
export async function recognizeDrawing(
  canvas: HTMLCanvasElement,
  mode: "char" | "word" = "char",
  customPrompt?: string,
  candidates?: string[]
): Promise<RecognizeResult> {
  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  if (!base64) return { result: null, error: "No image data from canvas." };

  const res = await fetch("/api/draw-recognize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_base64: base64,
      prompt: customPrompt,
      mode,
      ...(candidates?.length && { candidates }),
    }),
  });

  const data = (await res.json()) as { predicted?: string; error?: string; debug?: Record<string, unknown> };
  if (data.predicted) return { result: { predicted: data.predicted, confidence: 0.9 } };
  if (!res.ok) {
    return { result: null, error: data.error ?? `Request failed (${res.status})` };
  }
  if (data.debug && typeof console !== "undefined") {
    console.debug("[drawAssessment] API returned no prediction:", data.debug);
  }
  return {
    result: null,
    error: data.error ?? "No Devanagari detected. Try drawing more clearly. Enable DEBUG_DRAW_RECOGNIZE=1 in .env.local for server logs.",
  };
}

import { isConfusable } from "@/lib/drawConfusables";

/**
 * Assess a drawing against an expected Devanagari character.
 * Pass candidates (e.g. drill options) to constrain the model.
 * Accepts "close" matches via confusable pairs (e.g. ज/ड, ग/ङ).
 */
export async function assessDrawing(
  canvas: HTMLCanvasElement,
  targetDevanagari: string,
  mode: "char" | "word" = "char",
  candidates?: string[]
): Promise<{ predicted: string | null; correct: boolean; error?: string }> {
  try {
    const { result, error } = await recognizeDrawing(canvas, mode, undefined, candidates);
    if (!result) {
      return {
        predicted: null,
        correct: false,
        error: error ?? "No Devanagari detected. Try drawing more clearly. Enable DEBUG_DRAW_RECOGNIZE=1 in .env.local to see server logs.",
      };
    }
    const predicted = result.predicted;
    const exactMatch = predicted === targetDevanagari;
    const closeMatch = isConfusable(predicted, targetDevanagari);
    const correct = exactMatch || closeMatch;
    return {
      predicted,
      correct,
      error: correct ? undefined : undefined,
    };
  } catch {
    return { predicted: null, correct: false, error: "Recognition failed" };
  }
}
