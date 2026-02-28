import { Phoneme } from "./types";
import { getPheneticsPath } from "./phenetics";

const audioCache = new Map<string, HTMLAudioElement>();
const pheneticsCache = new Map<string, HTMLAudioElement>();

// Use phenetics when available, else phoneme audioFile (.ogg, .mp3)
function getPhonemePaths(phoneme: Phoneme): string[] {
  const pheneticsPath = getPheneticsPath(phoneme.id);
  if (pheneticsPath) return [pheneticsPath];
  const base = phoneme.audioFile.replace(/\.(mp3|ogg)$/, "");
  return [`${base}.ogg`, `${base}.mp3`];
}

export async function loadPhonemeAudio(phoneme: Phoneme): Promise<HTMLAudioElement | null> {
  if (audioCache.has(phoneme.id)) {
    return audioCache.get(phoneme.id)!;
  }

  const paths = getPhonemePaths(phoneme);
  for (const path of paths) {
    try {
      const audio = new Audio(path);
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener("canplaythrough", () => resolve());
        audio.addEventListener("error", reject);
        audio.addEventListener("abort", reject);
      });
      audioCache.set(phoneme.id, audio);
      return audio;
    } catch {
      continue;
    }
  }
  return null;
}

/** Consonants need vowel context for clean TTS; vowels are standalone */
const VOWEL_IDS = new Set(["a", "aa", "i", "ii", "u", "uu", "r", "rr", "l", "e", "ai", "o", "au"]);
function getTTSPhonemeText(phoneme: Phoneme): string {
  const devanagari = phoneme.devanagari;
  return VOWEL_IDS.has(phoneme.id) ? devanagari : `${devanagari}अ`;
}

export async function playPhonemeAudio(phoneme: Phoneme): Promise<void> {
  const audio = await loadPhonemeAudio(phoneme);
  if (audio) {
    audio.currentTime = 0;
    await audio.play();
    return;
  }
  // Fallback: TTS with Devanagari (Hindi handles retroflexes correctly)
  await playTTSAudio(getTTSPhonemeText(phoneme), { speed: 0.75 });
}

/** Sanskrit TTS with Aryan voice (indic-parler-tts via Sabdakrida) */
export async function playSanskritTTS(
  text: string,
  opts?: { style?: "narration" | "command" | "praise"; onGenerated?: (audioUrl: string) => void; signal?: AbortSignal }
): Promise<void> {
  const { style = "narration", onGenerated, signal } = opts ?? {};
  try {
    const controller = signal ? null : new AbortController();
    const timeout = controller ? setTimeout(() => controller.abort(), 90_000) : null;
    const response = await fetch("/api/sabdakrida/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, style }),
      signal: signal ?? controller?.signal,
    });
    if (timeout) clearTimeout(timeout);
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err?.error ?? "Sanskrit TTS failed");
    }
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    if (onGenerated) onGenerated(audioUrl);
    const audio = new Audio(audioUrl);
    await audio.play();
    audio.addEventListener("ended", () => URL.revokeObjectURL(audioUrl));
  } catch (error) {
    console.error("Sanskrit TTS error:", error);
    throw error;
  }
}

export async function playTTSAudio(
  text: string,
  opts?: { speed?: number; onGenerated?: (audioUrl: string) => void }
): Promise<void> {
  const { speed = 0.85, onGenerated } = opts ?? {};
  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        isDevanagari: /[\u0900-\u097F]/.test(text),
        speed,
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    if (onGenerated) onGenerated(audioUrl);

    const audio = new Audio(audioUrl);
    await audio.play();

    // Clean up after playback
    audio.addEventListener("ended", () => {
      URL.revokeObjectURL(audioUrl);
    });
  } catch (error) {
    console.error("Failed to play TTS audio:", error);
    throw error;
  }
}

export function clearAudioCache(): void {
  audioCache.forEach((audio) => {
    audio.pause();
    audio.src = "";
  });
  audioCache.clear();
}

export function preloadPhonemeAudio(phonemes: Phoneme[]): Promise<void> {
  return Promise.all(
    phonemes.map((phoneme) =>
      loadPhonemeAudio(phoneme).catch((error) => {
        console.warn(`Preload failed for ${phoneme.iast}:`, error);
      })
    )
  ).then(() => undefined);
}

/** Play a word by sequencing phenetics files. phonemeIds e.g. ["dha","ra","ma"] for धर्म */
export async function playWordFromPhenetics(phonemeIds: string[]): Promise<void> {
  const { getPheneticsPath } = await import("./phenetics");
  for (const id of phonemeIds) {
    const path = getPheneticsPath(id);
    if (!path) continue;
    let audio = pheneticsCache.get(path);
    if (!audio) {
      audio = new Audio(path);
      pheneticsCache.set(path, audio);
    }
    await new Promise<void>((resolve, reject) => {
      audio!.addEventListener("ended", () => resolve());
      audio!.addEventListener("error", reject);
      audio!.currentTime = 0;
      audio!.play().catch(reject);
    });
  }
}
