/**
 * Draw assessment — Tesseract.js Devanagari OCR via server API.
 * No external API keys required.
 */

export interface DrawResult {
  predicted: string;
  confidence: number;
}

export interface RecognizeResult {
  result: DrawResult | null;
  error?: string;
}

import { isConfusable } from "@/lib/drawConfusables";

export type SelfEval = "correct" | "close" | "wrong" | null;

export async function recognizeDrawing(
  canvas: HTMLCanvasElement,
  mode: "char" | "word" = "char",
): Promise<RecognizeResult> {
  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  if (!base64) return { result: null, error: "No image data from canvas." };

  try {
    const res = await fetch("/api/draw-recognize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: base64, mode }),
    });
    const data = await res.json();
    if (data.predicted) {
      return { result: { predicted: data.predicted, confidence: data.confidence ?? 0.5 } };
    }
    return { result: null };
  } catch {
    return { result: null };
  }
}

export async function assessDrawing(
  canvas: HTMLCanvasElement,
  targetDevanagari: string,
  mode: "char" | "word" = "char",
): Promise<{ predicted: string | null; correct: boolean; error?: string }> {
  try {
    const { result } = await recognizeDrawing(canvas, mode);
    if (!result?.predicted) {
      return { predicted: null, correct: false };
    }
    const predicted = result.predicted;
    return {
      predicted,
      correct: predicted === targetDevanagari || isConfusable(predicted, targetDevanagari),
    };
  } catch {
    return { predicted: null, correct: false };
  }
}
