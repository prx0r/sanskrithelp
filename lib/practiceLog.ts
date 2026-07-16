/**
 * Practice log — localStorage-based daily sadhana tracking.
 * Shared between the practice-log page and the chat (for AI context).
 */

export type PracticeType = "matrika" | "breath" | "vb" | "tattvas" | "meditation";

export interface Entry {
  date: string;
  type: PracticeType;
  label: string;
  duration: number;
  note?: string;
}

const STORAGE_KEY = "tantra_practice_log";

export function loadEntries(): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

export function saveEntries(entries: Entry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getRecentPracticeSummary(days = 7): string {
  const entries = loadEntries();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recent = entries.filter((e) => e.date >= cutoff.toISOString().split("T")[0]);
  if (recent.length === 0) return "No practice logged recently.";
  const byDay: Record<string, string[]> = {};
  for (const e of recent) {
    if (!byDay[e.date]) byDay[e.date] = [];
    byDay[e.date].push(`${e.label} (${e.duration}min)`);
  }
  return Object.entries(byDay)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([d, items]) => `${d}: ${items.join(", ")}`)
    .join("\n");
}
