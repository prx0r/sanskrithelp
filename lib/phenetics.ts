/**
 * Phenetics: phoneme ID → phenetics folder filename (no extension).
 * Uses /phenetics/*.ogg files in public folder.
 */
export const PHONEME_TO_PHENETICS: Record<string, string> = {
  a: "a",
  aa: "aa",
  i: "i",
  ii: "ii",
  u: "u",
  uu: "uu",
  r: "R",
  rr: "RR",
  e: "e",
  ai: "ai",
  o: "o",
  au: "au",
  am: "anusvara",
  ah: "visarga",
  ka: "ka",
  kha: "kha",
  ga: "ga",
  gha: "gha",
  nga: "na_k",
  ca: "ca",
  cha: "cha",
  ja: "ja",
  jha: "jha",
  nya: "na_j",
  "ta-retro": "ta1",
  "tha-retro": "tha1",
  "da-retro": "da1",
  "dha-retro": "dha1",
  "na-retro": "na1",
  ta: "ta",
  tha: "tha",
  da: "da",
  dha: "dha",
  na: "na",
  pa: "pa",
  pha: "pha",
  ba: "ba",
  bha: "bha",
  ma: "ma",
  ya: "ya",
  ra: "ra",
  la: "la",
  va: "va",
  "sha-palatal": "sha",
  "sha-retro": "shha",
  sa: "sa",
  ha: "ha",
};

/**
 * Get phenetics path for a phoneme ID, or null if not available.
 */
export function getPheneticsPath(phonemeId: string): string | null {
  const file = PHONEME_TO_PHENETICS[phonemeId];
  return file ? `/phenetics/${file}.ogg` : null;
}

/**
 * Example words for landing/intro: Devanagari → array of phoneme IDs.
 * Used to play phenetics audio in sequence.
 */
export const EXAMPLE_WORDS: Record<string, string[]> = {
  धर्म: ["dha", "ra", "ma"],
  शिव: ["sha-palatal", "i", "va"],
  ओम्: ["o", "ma"],
  सत्य: ["sa", "ta", "ya"],
};
