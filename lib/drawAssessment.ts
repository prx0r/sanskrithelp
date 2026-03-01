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

const CHAR_PROMPT =
  "This image shows a single handwritten Devanagari character. Reply with ONLY that one character, nothing else. No explanation, no punctuation.";

const WORD_PROMPT =
  "This image shows handwritten Devanagari (a word or phrase). Reply with ONLY the Devanagari text, nothing else. No explanation, no punctuation.";

/** API error when no prediction. */
const DEFAULT_ERROR = "Recognition failed. Check CHUTES_API_KEY in .env.local.";

/**
 * Recognize drawn Devanagari via Chutes vision API.
 * Returns predicted character(s) or null on failure.
 */
export async function recognizeDrawing(
  canvas: HTMLCanvasElement,
  mode: "char" | "word" = "char",
  customPrompt?: string
): Promise<DrawResult | null> {
  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  if (!base64) return null;

  const prompt = customPrompt ?? (mode === "char" ? CHAR_PROMPT : WORD_PROMPT);

  const res = await fetch("/api/draw-recognize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: base64, prompt, mode }),
  });

  const data = (await res.json()) as { predicted?: string; error?: string; debug?: Record<string, unknown> };
  if (!res.ok) return null;
  if (data.predicted) return { predicted: data.predicted, confidence: 0.9 };
  if (data.debug && typeof console !== "undefined") {
    console.debug("[drawAssessment] API returned no prediction:", data.debug);
  }
  return null;
}

/**
 * Assess a drawing against an expected Devanagari character.
 * For drill mode: compare predicted to target.
 */
export async function assessDrawing(
  canvas: HTMLCanvasElement,
  targetDevanagari: string,
  mode: "char" | "word" = "char"
): Promise<{ predicted: string | null; correct: boolean; error?: string }> {
  try {
    const result = await recognizeDrawing(canvas, mode);
    if (!result) {
      return {
        predicted: null,
        correct: false,
        error: "No Devanagari detected. Try drawing more clearly. Enable DEBUG_DRAW_RECOGNIZE=1 in .env.local to see server logs.",
      };
    }
    const correct = result.predicted === targetDevanagari;
    return {
      predicted: result.predicted,
      correct,
      error: correct ? undefined : undefined,
    };
  } catch {
    return { predicted: null, correct: false, error: "Recognition failed" };
  }
}
