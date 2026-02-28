import type { SandhiRule } from "./types";

// Vowel sandhi: a + a → ā
export function applyVowelSandhi(a: string, b: string): string | null {
  const last = a.slice(-1).toLowerCase();
  const first = b[0]?.toLowerCase() ?? "";

  // a + a → ā
  if (last === "a" && first === "a") return a.slice(0, -1) + "ā" + b.slice(1);
  // ā + a → ā
  if ((last === "ā" || last === "a") && first === "a") return a + b.slice(1);
  // a + i → e
  if (last === "a" && first === "i") return a.slice(0, -1) + "e" + b.slice(1);
  // a + u → o
  if (last === "a" && first === "u") return a.slice(0, -1) + "o" + b.slice(1);
  // ā + i → ai
  if (last === "ā" && first === "i") return a.slice(0, -1) + "ai" + b.slice(1);
  // ā + u → au
  if (last === "ā" && first === "u") return a.slice(0, -1) + "au" + b.slice(1);
  // i + vowel → y + vowel (simplified)
  if ((last === "i" || last === "ī") && "aeiouāēīōū".includes(first)) return a.slice(0, -1) + "y" + b;
  // u + vowel → v + vowel (simplified)
  if ((last === "u" || last === "ū") && "aeiouāēīōū".includes(first)) return a.slice(0, -1) + "v" + b;

  return null;
}

// Visarga sandhi: ḥ + voiceless stays, ḥ + voiced → o
export function applyVisargaSandhi(word: string, next: string): string | null {
  if (!word.endsWith("ḥ") && !word.endsWith("h")) return null;
  const first = next[0]?.toLowerCase() ?? "";

  const voiceless = "kkgṅccñṭṭṇṭṭṭṭppb";
  const voiced = "gghñjḍṇdhnbhmylvśṣs";

  if (voiced.includes(first) || "aeiouāēīōū".includes(first)) {
    return word.replace(/[ḥh]$/, "o") + " " + next;
  }
  return null;
}

// Grassmann's Law: first aspirate drops when two aspirates in word
export function applyGrassmannsLaw(phonemes: string[]): string[] {
  let foundFirst = false;
  return phonemes.map((p) => {
    const isAspirate = ["kh", "gh", "ch", "jh", "ṭh", "ḍh", "th", "dh", "ph", "bh"].some((h) =>
      p.toLowerCase().startsWith(h)
    );
    if (isAspirate && foundFirst) return p.replace(/h/g, "").replace(/ṭ/g, "t").replace(/ḍ/g, "d");
    if (isAspirate) foundFirst = true;
    return p;
  });
}

// Bartholomae's Law: voiced aspirate + voiceless → voiced + voiced aspirate
export function applyBartholomaesLaw(word: string): string {
  // √budh + ta → buddha (simplified pattern matching)
  const patterns = [
    { from: /budh\s*\+\s*ta/i, to: "buddha" },
    { from: /dh\s*\+\s*t/i, to: "ddh" },
    { from: /gh\s*\+\s*t/i, to: "gd" },
  ];
  let result = word;
  for (const { from, to } of patterns) {
    result = result.replace(from, to);
  }
  return result;
}

// Apply sandhi between two words
export function applySandhi(word1: string, word2: string): { result: string; ruleId?: string } {
  const v = applyVowelSandhi(word1, word2);
  if (v) return { result: v, ruleId: "vowel-sandhi" };

  const vis = applyVisargaSandhi(word1, word2);
  if (vis) return { result: vis.trim(), ruleId: "visarga-sandhi" };

  return { result: word1 + " " + word2 };
}

// Get matching rule from rules data
export function findMatchingRule(
  input: [string, string],
  output: string,
  rules: SandhiRule[]
): SandhiRule | null {
  const combined = input[0] + " " + input[1];
  for (const rule of rules) {
    for (const ex of rule.examples) {
      const exCombined = ex.input[0] + " " + ex.input[1];
      if (exCombined === combined && ex.output === output) return rule;
    }
  }
  return null;
}
