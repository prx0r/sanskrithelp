import type { FSRSState } from "./types";

const STORAGE_KEYS = {
  CARD_STATES: "sanskrit_app_card_states",
  SESSION_HISTORY: "sanskrit_app_session_history",
  USER_PREFERENCES: "sanskrit_app_preferences",
  COMPLETED_CHAPTERS: "sanskrit_app_completed_chapters",
  DRILL_LEVEL_PROGRESS: "sanskrit_app_drill_level_progress",
} as const;

export type DrillLevelKey = "hear:easy" | "hear:medium" | "hear:hard"
  | "say:easy" | "say:medium" | "say:hard"
  | "draw:easy" | "draw:medium" | "draw:hard"
  | "combined";

export function getDrillLevelProgress(): Record<DrillLevelKey, boolean> {
  if (typeof window === "undefined") {
    return {} as Record<DrillLevelKey, boolean>;
  }
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DRILL_LEVEL_PROGRESS);
    return (data ? JSON.parse(data) : {}) as Record<DrillLevelKey, boolean>;
  } catch {
    return {} as Record<DrillLevelKey, boolean>;
  }
}

export function markDrillLevelCompleted(key: DrillLevelKey): void {
  if (typeof window === "undefined") return;
  const progress = getDrillLevelProgress();
  progress[key] = true;
  localStorage.setItem(STORAGE_KEYS.DRILL_LEVEL_PROGRESS, JSON.stringify(progress));
}

export function isDrillLevelUnlocked(key: DrillLevelKey): boolean {
  return true; // All drills unlocked for now
}

export type StorageCardState = Omit<FSRSState, "dueDate" | "lastReview"> & {
  dueDate: string;
  lastReview: string;
};

export function toStorageCardState(state: FSRSState): StorageCardState {
  return {
    ...state,
    dueDate: state.dueDate.toISOString(),
    lastReview: state.lastReview.toISOString(),
  };
}

export function fromStorageCardState(state: StorageCardState): FSRSState {
  return {
    ...state,
    dueDate: new Date(state.dueDate),
    lastReview: new Date(state.lastReview),
  };
}

export function saveCardState(state: FSRSState): void {
  if (typeof window === "undefined") return;
  const cardStates = getCardStates();
  const key = `${state.cardId}:${state.mode}`;
  cardStates[key] = toStorageCardState(state);
  localStorage.setItem(STORAGE_KEYS.CARD_STATES, JSON.stringify(cardStates));
}

export function getCardState(cardId: string, mode: string): FSRSState | null {
  const cardStates = getCardStates();
  const key = `${cardId}:${mode}`;
  const state = cardStates[key];
  return state ? fromStorageCardState(state) : null;
}

export function getCardStates(): Record<string, StorageCardState> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CARD_STATES);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to load card states:", error);
    return {};
  }
}

export function getAllCardStates(): FSRSState[] {
  const cardStates = getCardStates();
  return Object.values(cardStates).map(fromStorageCardState);
}

export function clearCardStates(): void {
  localStorage.removeItem(STORAGE_KEYS.CARD_STATES);
}

export interface SessionRecord {
  id: string;
  timestamp: string;
  cardsReviewed: number;
  cardsCorrect: number;
  duration: number;
  chapter?: number;
}

export function saveSessionRecord(record: SessionRecord): void {
  const history = getSessionHistory();
  history.push(record);
  // Keep only last 100 sessions
  if (history.length > 100) {
    history.shift();
  }
  localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(history));
}

export function getSessionHistory(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load session history:", error);
    return [];
  }
}

export interface UserPreferences {
  autoplayAudio: boolean;
  cardsPerSession: number;
  showHints: boolean;
  theme: "dark" | "light" | "auto";
}

export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === "undefined") return;
  const current = getUserPreferences();
  const updated = { ...current, ...preferences };
  localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
}

export function getUserPreferences(): UserPreferences {
  const defaults: UserPreferences = {
    autoplayAudio: true,
    cardsPerSession: 20,
    showHints: true,
    theme: "dark",
  };

  if (typeof window === "undefined") return defaults;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  } catch (error) {
    console.error("Failed to load user preferences:", error);
    return defaults;
  }
}

export function markChapterCompleted(chapter: number): void {
  const completed = getCompletedChapters();
  if (!completed.includes(chapter)) {
    completed.push(chapter);
    localStorage.setItem(STORAGE_KEYS.COMPLETED_CHAPTERS, JSON.stringify(completed));
  }
}

export function getCompletedChapters(): number[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COMPLETED_CHAPTERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load completed chapters:", error);
    return [];
  }
}

export function isChapterCompleted(chapter: number): boolean {
  return getCompletedChapters().includes(chapter);
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
}
