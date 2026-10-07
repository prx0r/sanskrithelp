import { loadEntries } from "@/lib/practiceLog";

export type Difficulty = "easy" | "normal" | "hard";

const KEY = "hindi-difficulty";

export const RATES: Record<Difficulty, number> = { easy: 0.85, normal: 1.0, hard: 1.1 };

export function getDifficulty(): Difficulty {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "easy" || v === "normal" || v === "hard") return v;
  } catch {}
  return "normal";
}

export function setDifficulty(d: Difficulty) {
  try {
    localStorage.setItem(KEY, d);
  } catch {}
}

/** Last-N SpeakScore results for a context tag, parsed from the shared log. */
export function recentScores(context: string, n = 3): number[] {
  try {
    const out: number[] = [];
    for (const e of loadEntries()) {
      if (e.type !== "hindi" || !e.label.includes(`[${context}]`)) continue;
      const m = e.label.match(/Scored (\d+)/);
      if (m) out.push(parseInt(m[1], 10));
    }
    return out.slice(-n);
  } catch {
    return [];
  }
}

export function suggestionFor(
  context: string,
  current: Difficulty,
  strugglingBelow = 60,
  coastingAbove = 90
): string | null {
  const scores = recentScores(context);
  if (scores.length < 2) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg < strugglingBelow && current !== "easy") {
    return `Last ${scores.length} here averaged ${Math.round(avg)} — finding it hard is data, not failure. Try Easy: slower audio, transcript kept, hints auto-shown.`;
  }
  if (avg > coastingAbove && current !== "hard") {
    return `Last ${scores.length} here averaged ${Math.round(avg)} — this one's installed. Try Hard: faster audio, transcript hidden.`;
  }
  return null;
}
