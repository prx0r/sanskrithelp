/**
 * Devanagari confusable pairs — accept when model returns "close" character.
 * Same varga (place) or visually similar. Extend as needed.
 */
const CONFUSABLE_PAIRS: [string, string][] = [
  // Velars
  ["क", "ख"],
  ["ग", "घ"],
  ["ङ", "ञ"],
  // Palatals
  ["च", "छ"],
  ["ज", "झ"],
  // Retroflexes
  ["ट", "ठ"],
  ["ड", "ढ"],
  ["ण", "न"],
  // Dentals
  ["त", "थ"],
  ["द", "ध"],
  ["न", "ण"],
  // Labials — प/फ removed: distinct phonemes (unaspirated vs aspirated), model often confuses them
  ["ब", "भ"],
  // Cross-varga (commonly confused)
  ["ज", "ड"],
  ["ग", "ङ"],
  ["द", "ड"],
  ["ब", "व"],
  ["र", "ड"],
  ["घ", "ध"],
];

const pairSet = new Set<string>();
for (const [a, b] of CONFUSABLE_PAIRS) {
  pairSet.add(`${a}\0${b}`);
  pairSet.add(`${b}\0${a}`);
}

/** True if (a, b) is a confusable pair — we accept as "close enough". */
export function isConfusable(a: string, b: string): boolean {
  if (a === b) return true;
  return pairSet.has(`${a}\0${b}`);
}
