/**
 * Curriculum and progress for the AI Tutor.
 */

export const CURRICULUM = {
  vowels: ["a", "ā", "i", "ī", "u", "ū", "ṛ", "e", "o", "ai", "au"],
  stopsByPlace: [
    { place: "velar", desc: "soft palate", sounds: ["ka", "kha", "ga", "gha", "ṅa"] },
    { place: "palatal", desc: "hard palate", sounds: ["ca", "cha", "ja", "jha", "ña"] },
    { place: "retroflex", desc: "behind bony bump", sounds: ["ṭa", "ṭha", "ḍa", "ḍha", "ṇa"] },
    { place: "dental", desc: "teeth", sounds: ["ta", "tha", "da", "dha", "na"] },
    { place: "labial", desc: "lips", sounds: ["pa", "pha", "ba", "bha", "ma"] },
  ],
} as const;

export interface TutorProgress {
  topicsIntroduced: string[];
  topicsMastered: string[];
  lastTopic: string | null;
}

export const DEFAULT_PROGRESS: TutorProgress = {
  topicsIntroduced: [],
  topicsMastered: [],
  lastTopic: null,
};

const STORAGE_KEY = "sanskrit_tutor_progress";
const MESSAGES_KEY = "sanskrit_tutor_messages";

export function getTutorMessages(): Array<{ role: string; content: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTutorMessages(msgs: Array<{ role: string; content: string }>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs.slice(-40))); // keep last 20 turns
}

export function getTutorProgress(): TutorProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } : DEFAULT_PROGRESS;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveTutorProgress(p: Partial<TutorProgress>): void {
  if (typeof window === "undefined") return;
  const next = { ...getTutorProgress(), ...p };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
