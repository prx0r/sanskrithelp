/**
 * Pronunciation assessment — record audio, send to Sabdakrida, get feedback.
 * Reusable for drill (say mode), pronunciation page, and anywhere voice assessment is needed.
 *
 * Usage:
 *   const result = await assessPronunciation(audioBlob, targetIast);
 */

import { blobToWavBlob } from "@/lib/audioUtils";

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
    return {
      correct: false,
      error: data.error ?? "Assessment failed",
    };
  } catch {
    return {
      correct: false,
      error: "Backend unavailable. Run Sabdakrida on port 8010.",
    };
  }
}
