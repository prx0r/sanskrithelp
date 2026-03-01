/**
 * Tutor preferences — native language (for Qwen) and voice (for Kokoro TTS).
 * Stored in localStorage.
 */

export const NATIVE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "hi", label: "Hindi" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "ko", label: "Korean" },
] as const;

export const KOKORO_VOICES = [
  { id: "af_heart", label: "Female (Heart)", lang: "en" },
  { id: "af_bella", label: "Female (Bella)", lang: "en" },
  { id: "af_nicole", label: "Female (Nicole)", lang: "en" },
  { id: "af_sarah", label: "Female (Sarah)", lang: "en" },
  { id: "af_sky", label: "Female (Sky)", lang: "en" },
  { id: "af_alloy", label: "Female (Alloy)", lang: "en" },
  { id: "af_aoede", label: "Female (Aoede)", lang: "en" },
  { id: "af_jessica", label: "Female (Jessica)", lang: "en" },
  { id: "af_kore", label: "Female (Kore)", lang: "en" },
  { id: "af_nova", label: "Female (Nova)", lang: "en" },
  { id: "af_river", label: "Female (River)", lang: "en" },
  { id: "am_adam", label: "Male (Adam)", lang: "en" },
  { id: "am_echo", label: "Male (Echo)", lang: "en" },
  { id: "am_eric", label: "Male (Eric)", lang: "en" },
  { id: "am_michael", label: "Male (Michael)", lang: "en" },
  { id: "am_liam", label: "Male (Liam)", lang: "en" },
  { id: "bf_emma", label: "Female British (Emma)", lang: "en" },
  { id: "bf_isabella", label: "Female British (Isabella)", lang: "en" },
  { id: "bm_george", label: "Male British (George)", lang: "en" },
  { id: "bm_lewis", label: "Male British (Lewis)", lang: "en" },
] as const;

export type NativeLanguageCode = (typeof NATIVE_LANGUAGES)[number]["code"];
export type KokoroVoiceId = (typeof KOKORO_VOICES)[number]["id"];

export interface TutorPreferences {
  nativeLanguage: NativeLanguageCode;
  tutorVoice: KokoroVoiceId;
}

const STORAGE_KEY = "sanskrit_tutor_preferences";
const DEFAULTS: TutorPreferences = {
  nativeLanguage: "en",
  tutorVoice: "af_heart",
};

export function getTutorPreferences(): TutorPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      nativeLanguage: NATIVE_LANGUAGES.some((l) => l.code === parsed.nativeLanguage)
        ? parsed.nativeLanguage
        : DEFAULTS.nativeLanguage,
      tutorVoice: KOKORO_VOICES.some((v) => v.id === parsed.tutorVoice)
        ? parsed.tutorVoice
        : DEFAULTS.tutorVoice,
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveTutorPreferences(p: Partial<TutorPreferences>): void {
  if (typeof window === "undefined") return;
  const next = { ...getTutorPreferences(), ...p };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
