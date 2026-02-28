import type { Phoneme } from "./types";
import unitsData from "@/data/units.json";

const units = unitsData as Array<{ id: string; phonemeIds: string[] }>;
const phonemeToUnit = new Map<string, string>();
units.forEach((u) => {
  u.phonemeIds.forEach((pid) => phonemeToUnit.set(pid, u.id));
});

/** Get unit ID for a phoneme (e.g. "vowels-1", "velar") */
export function getPhonemeUnit(phonemeId: string): string | null {
  return phonemeToUnit.get(phonemeId) ?? null;
}

/** Get phonemes in the same unit (siblings). Excludes the given phoneme. */
export function getSameGroupPhonemes(
  phonemeId: string,
  allPhonemes: Phoneme[]
): Phoneme[] {
  const unitId = phonemeToUnit.get(phonemeId);
  if (!unitId) return [];
  const unit = units.find((u) => u.id === unitId);
  if (!unit) return [];
  return allPhonemes.filter((p) => unit.phonemeIds.includes(p.id) && p.id !== phonemeId);
}

/** Pick n options from same group for distractors. Falls back to random if not enough. */
export function getSameGroupOptions(
  correct: Phoneme,
  allPhonemes: Phoneme[],
  count: number
): Phoneme[] {
  const siblings = getSameGroupPhonemes(correct.id, allPhonemes);
  const need = count - 1;
  if (siblings.length >= need) {
    const shuffled = [...siblings].sort(() => Math.random() - 0.5);
    return [correct, ...shuffled.slice(0, need)].sort(() => Math.random() - 0.5);
  }
  const others = allPhonemes.filter((p) => p.id !== correct.id);
  const picks = [...siblings];
  others.forEach((p) => {
    if (picks.length >= need) return;
    if (!picks.find((x) => x.id === p.id)) picks.push(p);
  });
  const shuffled = [correct, ...picks.slice(0, need)].sort(() => Math.random() - 0.5);
  return shuffled;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Pick n options from any phonemes (easier distractors) */
export function getRandomOptions(
  correct: Phoneme,
  allPhonemes: Phoneme[],
  count: number
): Phoneme[] {
  const others = allPhonemes.filter((p) => p.id !== correct.id);
  const picks = shuffle(others).slice(0, count - 1);
  return shuffle([correct, ...picks]);
}

/** Get n IAST options (one correct) from same group for roman-pick. Returns shuffled array. */
export function getSameGroupRomanOptions(
  correct: Phoneme,
  allPhonemes: Phoneme[],
  count: number
): Phoneme[] {
  const siblings = getSameGroupPhonemes(correct.id, allPhonemes);
  const need = count - 1;
  if (siblings.length >= need) {
    const shuffled = shuffle([correct, ...siblings.slice(0, need)]);
    return shuffled;
  }
  const others = allPhonemes.filter((p) => p.id !== correct.id);
  const picks = [...siblings];
  others.forEach((p) => {
    if (picks.length >= need) return;
    if (!picks.find((x) => x.id === p.id)) picks.push(p);
  });
  return shuffle([correct, ...picks.slice(0, need)]);
}
