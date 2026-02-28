const KEY = "sanskrit_lesson_progress";

export interface LessonProgress {
  completedPhonemes: Record<string, string[]>; // unitId -> phonemeIds[]
  completedUnits: string[];
}

function load(): LessonProgress {
  if (typeof window === "undefined") return { completedPhonemes: {}, completedUnits: [] };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultProgress(), ...JSON.parse(raw) } : defaultProgress();
  } catch {
    return defaultProgress();
  }
}

function defaultProgress(): LessonProgress {
  return { completedPhonemes: {}, completedUnits: [] };
}

export function getLessonProgress(): LessonProgress {
  return load();
}

export function markPhonemePassed(unitId: string, phonemeId: string, totalInUnit?: number): void {
  const p = load();
  const arr = p.completedPhonemes[unitId] ?? [];
  if (!arr.includes(phonemeId)) arr.push(phonemeId);
  p.completedPhonemes[unitId] = arr;
  if (totalInUnit != null && arr.length >= totalInUnit && !p.completedUnits.includes(unitId)) {
    p.completedUnits.push(unitId);
  }
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function markUnitComplete(unitId: string): void {
  const p = load();
  if (!p.completedUnits.includes(unitId)) p.completedUnits.push(unitId);
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function getCompletedPhonemesForUnit(unitId: string): Set<string> {
  const arr = load().completedPhonemes[unitId] ?? [];
  return new Set(arr);
}

export function isUnitComplete(unitId: string): boolean {
  return load().completedUnits.includes(unitId);
}

export function isUnitUnlocked(unitId: string, allUnitIds: string[]): boolean {
  const idx = allUnitIds.indexOf(unitId);
  if (idx <= 0) return true;
  return isUnitComplete(allUnitIds[idx - 1]);
}
