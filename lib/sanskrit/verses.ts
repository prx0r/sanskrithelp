import type { VerseState } from "./types";

/** Teaching verse library — VBT + classic seed objects. */
export interface VerseTemplate {
  id: string;
  surface: string;
  iast: string;
  english?: string;
  source?: string;
  morph: VerseState["morph"];
  semantic: string[];
  boundaries: string[];
  machines: string[];
  gates: string[];
  roots: string[];
  karaka?: { role: string; form: string }[];
}

export const VERSE_LIBRARY: VerseTemplate[] = [
  {
    id: "asato-ma-sad-gamaya",
    surface: "asato mā sad gamaya",
    iast: "asato mā sad gamaya",
    english: "Lead me from untruth to truth.",
    source: "Bṛhadāraṇyaka 1.3.28 (teaching seed)",
    morph: [
      { root: "√as", operator: "kta", surfaceHint: "asato" },
      { root: "√gam", operator: "ṇic", surfaceHint: "gamaya", person: "2sg", tense: "loṭ" },
    ],
    semantic: ["SOURCE(asat)", "DESTINATION(sat)", "EVENT(√gam)", "CAUSE", "COMMAND"],
    boundaries: ["ḥ+m → o m", "t+g → d g"],
    machines: ["ṇic"],
    gates: ["visarga-o", "voicing t→d"],
    roots: ["√gam"],
    karaka: [
      { role: "apādāna (source)", form: "asataḥ / asato" },
      { role: "sampradāna / destination", form: "sat" },
      { role: "karman / event", form: "gamaya (causative command)" },
    ],
  },
  {
    id: "vb-urvdhve-prano",
    surface: "ūrdhve prāṇo hy adho jīvo visargātmā paroccaret",
    iast: "ūrdhve prāṇo hy adho jīvo visargātmā paroccaret",
    english:
      "Upward breath and downward life force are to be exhaled through emission; fullness from filling the two emergence points.",
    source: "Vijñānabhairava (Singh) — dhāraṇā breath axis",
    morph: [
      { root: "√prāṇa", operator: "present", surfaceHint: "prāṇaḥ" },
      { root: "√i", operator: "present", surfaceHint: "paroccaret" },
    ],
    semantic: ["UP(prāṇa)", "DOWN(jīva)", "EMISSION(visarga)", "FILLING(fullness)"],
    boundaries: ["o hy adho", "ātmā paroccaret"],
    machines: ["visarga", "breath-axis"],
    gates: ["visarga-saḥ/haṃ later"],
    roots: ["√prāṇa"],
  },
  {
    id: "vb-madhye-madhye",
    surface: "madhye madhye",
    iast: "madhye madhye",
    english: "In the middle, in the middle.",
    source: "Vijñānabhairava — void/center dhāraṇā family",
    morph: [{ root: "√madhya", operator: "present", surfaceHint: "madhye" }],
    semantic: ["CENTER", "REPEAT"],
    boundaries: ["e e"],
    machines: ["locative"],
    gates: [],
    roots: ["√madhya"],
  },
];

export function templateToVerse(t: VerseTemplate): VerseState {
  return {
    id: t.id,
    surface: t.surface,
    tokens: t.surface.split(/\s+/),
    morph: t.morph,
    semantic: t.semantic,
    boundaries: t.boundaries,
    installedMachines: t.machines,
    installedGates: t.gates,
    knownRoots: t.roots,
  };
}

export function templateById(id: string): VerseTemplate | undefined {
  return VERSE_LIBRARY.find((v) => v.id === id);
}
