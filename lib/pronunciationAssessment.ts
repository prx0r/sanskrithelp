/**
 * Pronunciation assessment — record audio, send to Sabdakrida, get feedback.
 * Reusable for drill (say mode), pronunciation page, and anywhere voice assessment is needed.
 * Falls back to Chutes Whisper when Sabdakrida is unavailable.
 *
 * Usage:
 *   const result = await assessPronunciation(audioBlob, targetIast);
 */

import { blobToWavBlob, blobToWavBase64 } from "@/lib/audioUtils";

export interface PronunciationResult {
  correct: boolean;
  heard?: string;
  heard_iast?: string;
  feedback_english?: string;
  score?: number;
  error?: string;
  /** For pronunciation page: fetch feedback audio via /api/sabdakrida/feedback-audio */
  feedback_audio_key?: { text: string; style: string };
  error_types?: string[];
  error_details?: unknown[];
  target?: string;
  errors?: [string, string][];
}

/**
 * Assess pronunciation: send audio + target text to Sabdakrida session API.
 */
export async function assessPronunciation(
  audioBlob: Blob,
  targetIast: string,
  userId: string = "local"
): Promise<PronunciationResult> {
  try {
    const wavBlob = await blobToWavBlob(audioBlob);
    const form = new FormData();
    form.append("audio", wavBlob, "recording.wav");
    form.append("target_text", targetIast);
    form.append("user_id", userId);

    const res = await fetch("/api/sabdakrida/session", { method: "POST", body: form });
    const data = (await res.json()) as {
      correct?: boolean;
      heard?: string;
      heard_iast?: string;
      feedback_english?: string;
      score?: number;
      error?: string;
      feedback_audio_key?: { text: string; style: string };
      error_types?: string[];
      error_details?: unknown[];
      target?: string;
      errors?: [string, string][];
    };

    if (res.ok) {
      return {
        correct: data.correct ?? false,
        heard: data.heard,
        heard_iast: data.heard_iast ?? data.heard,
        feedback_english: data.feedback_english,
        score: data.score,
        feedback_audio_key: data.feedback_audio_key,
        error_types: data.error_types,
        error_details: data.error_details,
        target: data.target,
        errors: data.errors,
      };
    }
    const sabdakridaError = data.error ?? "Assessment failed";
    const fallback = await assessPronunciationFallback(audioBlob, targetIast);
    if (fallback) {
      return { ...fallback, feedback_english: `(Chutes Whisper fallback — Sabdakrida: ${sabdakridaError})` };
    }
    return { correct: false, error: sabdakridaError };
  } catch {
    const fallback = await assessPronunciationFallback(audioBlob, targetIast);
    if (fallback) {
      return { ...fallback, feedback_english: "(Chutes Whisper fallback — Sabdakrida unavailable)" };
    }
    return {
      correct: false,
      error: "Backend unavailable. Run Sabdakrida on port 8010, or set CHUTES_API_KEY for fallback.",
    };
  }
}

/** Normalize IAST for lenient comparison (retroflexes often transcribed as dentals by Whisper). */
function normalizeForMatch(s: string): string {
  const map: Record<string, string> = { ṭ: "t", ḍ: "d", ṇ: "n", ṣ: "s", ś: "s", ṅ: "n", ñ: "n", ṛ: "r", ṝ: "r", ḷ: "l" };
  return s
    .trim()
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/\s+/g, "");
}

/** Fallback: Chutes Whisper transcribe + simple match when Sabdakrida fails. */
async function assessPronunciationFallback(
  audioBlob: Blob,
  targetIast: string
): Promise<PronunciationResult | null> {
  try {
    const audioB64 = await blobToWavBase64(audioBlob);
    const res = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_b64: audioB64, language: "hi" }),
    });
    const data = (await res.json()) as { text?: string; error?: string };
    if (!res.ok || !data.text) return null;
    const heard = (data.text as string).trim();
    const heardNorm = normalizeForMatch(heard);
    const targetNorm = normalizeForMatch(targetIast);
    const correct = heardNorm === targetNorm || heardNorm.includes(targetNorm) || targetNorm.includes(heardNorm);
    const score = correct ? 0.9 : Math.max(0.2, 0.6 - Math.abs(heardNorm.length - targetNorm.length) * 0.1);
    return {
      correct,
      heard,
      heard_iast: heard,
      score,
    };
  } catch {
    return null;
  }
}
