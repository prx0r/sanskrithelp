import type { OperatorDef, OpKind } from "./types";

/** Global Bruno operator basis — one image per transformation. */
export const OPERATORS: Record<OpKind, OperatorDef> = {
  aspiration: {
    id: "aspiration",
    label: "Aspiration",
    brunoImage: "wind explosion",
    kind: "phon",
  },
  voicing: {
    id: "voicing",
    label: "Voicing",
    brunoImage: "vibration / illumination",
    kind: "phon",
  },
  nasalization: {
    id: "nasalization",
    label: "Nasalization",
    brunoImage: "route opens into nasal chamber",
    kind: "phon",
  },
  devoicing: {
    id: "devoicing",
    label: "Devoicing",
    brunoImage: "glow goes out",
    kind: "phon",
  },
  causative: {
    id: "causative",
    label: "Causative (ṇic)",
    brunoImage: "another agent becomes responsible for the motion",
    kind: "morph",
  },
  kta: {
    id: "kta",
    label: "kta — resultant state",
    brunoImage: "moving event collapses into its result",
    kind: "morph",
  },
  ktva: {
    id: "ktva",
    label: "ktvā — having done",
    brunoImage: "event slides behind the current event",
    kind: "morph",
  },
  tumun: {
    id: "tumun",
    label: "tumun — to go",
    brunoImage: "event points forward as purpose",
    kind: "morph",
  },
  present: {
    id: "present",
    label: "Present (loṭ / laṭ)",
    brunoImage: "event stands in the open present",
    kind: "morph",
  },
  root_swap: {
    id: "root_swap",
    label: "Root swap",
    brunoImage: "the walker changes identity on the same road",
    kind: "morph",
  },
};

export const PHON_OP_MAP: Record<string, OpKind[]> = {
  ka: ["aspiration", "voicing"],
  kha: ["voicing", "devoicing"],
  ga: ["aspiration", "devoicing"],
  gha: ["devoicing", "nasalization"],
  ca: ["aspiration", "voicing"],
  cha: ["voicing", "devoicing"],
  ta: ["aspiration", "voicing"],
  tha: ["voicing", "devoicing"],
  da: ["aspiration", "devoicing"],
  pa: ["aspiration", "voicing"],
  tha2: ["voicing"],
};

/** Latent coordinates → phoneme (decode). */
export function decodePhoneme(
  place: PhonemeBit["place"],
  voice: 0 | 1,
  aspirate: 0 | 1,
  nasal: 0 | 1
): { iast: string; devanagari: string } | null {
  const table: Record<string, { iast: string; devanagari: string }> = {
    "kaṇṭhya|0|0|0": { iast: "ka", devanagari: "क" },
    "kaṇṭhya|0|1|0": { iast: "kha", devanagari: "ख" },
    "kaṇṭhya|1|0|0": { iast: "ga", devanagari: "ग" },
    "kaṇṭhya|1|1|0": { iast: "gha", devanagari: "घ" },
    "kaṇṭhya|0|0|1": { iast: "ṅa", devanagari: "ङ" },
    "kaṇṭhya|1|0|1": { iast: "ṅa", devanagari: "ङ" },
    "tālavya|0|0|0": { iast: "ca", devanagari: "च" },
    "tālavya|0|1|0": { iast: "cha", devanagari: "छ" },
    "tālavya|1|0|0": { iast: "ja", devanagari: "ज" },
    "tālavya|1|1|0": { iast: "jha", devanagari: "झ" },
    "tālavya|0|0|1": { iast: "ña", devanagari: "ञ" },
    "tālavya|1|0|1": { iast: "ña", devanagari: "ञ" },
    "mūrdhanya|0|0|0": { iast: "ṭa", devanagari: "ट" },
    "mūrdhanya|0|1|0": { iast: "ṭha", devanagari: "ठ" },
    "mūrdhanya|1|0|0": { iast: "ḍa", devanagari: "ड" },
    "mūrdhanya|1|1|0": { iast: "ḍha", devanagari: "ढ" },
    "mūrdhanya|0|0|1": { iast: "ṇa", devanagari: "ण" },
    "mūrdhanya|1|0|1": { iast: "ṇa", devanagari: "ण" },
    "dantya|0|0|0": { iast: "ta", devanagari: "त" },
    "dantya|0|1|0": { iast: "tha", devanagari: "थ" },
    "dantya|1|0|0": { iast: "da", devanagari: "द" },
    "dantya|1|1|0": { iast: "dha", devanagari: "ध" },
    "dantya|0|0|1": { iast: "na", devanagari: "न" },
    "dantya|1|0|1": { iast: "na", devanagari: "न" },
    "oṣṭhya|0|0|0": { iast: "pa", devanagari: "प" },
    "oṣṭhya|0|1|0": { iast: "pha", devanagari: "फ" },
    "oṣṭhya|1|0|0": { iast: "ba", devanagari: "ब" },
    "oṣṭhya|1|1|0": { iast: "bha", devanagari: "भ" },
    "oṣṭhya|0|0|1": { iast: "ma", devanagari: "म" },
    "oṣṭhya|1|0|1": { iast: "ma", devanagari: "म" },
  };
  const key = `${place}|${voice}|${aspirate}|${nasal}`;
  return table[key] ?? null;
}

import type { PhonemeBit } from "./types";

/** Apply a phonological operator to a latent phoneme. Returns next or null if illegal. */
export function applyPhonOp(p: PhonemeBit, op: OpKind): PhonemeBit | null {
  const n: PhonemeBit = { ...p };
  switch (op) {
    case "aspiration":
      if (p.aspirate || p.nasal || p.place === "vowel") return null;
      n.aspirate = 1;
      break;
    case "voicing":
      if (p.voice || p.nasal || p.place === "vowel") return null;
      n.voice = 1;
      // aspiration often co-occurs for aspirated voiced in teaching; keep simple
      break;
    case "devoicing":
      if (!p.voice || p.nasal) return null;
      n.voice = 0;
      break;
    case "nasalization":
      if (p.aspirate || p.place === "vowel") return null;
      n.nasal = 1;
      n.voice = 1; // nasal voiced in this teaching model
      break;
    default:
      return null;
  }
  const glyph = decodePhoneme(n.place, n.voice, n.aspirate, n.nasal);
  if (!glyph) return null;
  n.iast = glyph.iast;
  n.devanagari = glyph.devanagari;
  return n;
}

export function iastToPhoneme(iast: string): PhonemeBit | null {
  const map: Record<string, Partial<PhonemeBit>> = {
    ka: { place: "kaṇṭhya", voice: 0, aspirate: 0, nasal: 0 },
    kha: { place: "kaṇṭhya", voice: 0, aspirate: 1, nasal: 0 },
    ga: { place: "kaṇṭhya", voice: 1, aspirate: 0, nasal: 0 },
    gha: { place: "kaṇṭhya", voice: 1, aspirate: 1, nasal: 0 },
    "ṅa": { place: "kaṇṭhya", voice: 1, aspirate: 0, nasal: 1 },
    ca: { place: "tālavya", voice: 0, aspirate: 0, nasal: 0 },
    cha: { place: "tālavya", voice: 0, aspirate: 1, nasal: 0 },
    ja: { place: "tālavya", voice: 1, aspirate: 0, nasal: 0 },
    jha: { place: "tālavya", voice: 1, aspirate: 1, nasal: 0 },
    "ña": { place: "tālavya", voice: 1, aspirate: 0, nasal: 1 },
    ta: { place: "dantya", voice: 0, aspirate: 0, nasal: 0 },
    tha: { place: "dantya", voice: 0, aspirate: 1, nasal: 0 },
    da: { place: "dantya", voice: 1, aspirate: 0, nasal: 0 },
    dha: { place: "dantya", voice: 1, aspirate: 1, nasal: 0 },
    na: { place: "dantya", voice: 1, aspirate: 0, nasal: 1 },
    pa: { place: "oṣṭhya", voice: 0, aspirate: 0, nasal: 0 },
    pha: { place: "oṣṭhya", voice: 0, aspirate: 1, nasal: 0 },
    ba: { place: "oṣṭhya", voice: 1, aspirate: 0, nasal: 0 },
    bha: { place: "oṣṭhya", voice: 1, aspirate: 1, nasal: 0 },
    ma: { place: "oṣṭhya", voice: 1, aspirate: 0, nasal: 1 },
  };
  const base = map[iast];
  if (!base) return null;
  const glyph = decodePhoneme(
    base.place as PhonemeBit["place"],
    base.voice as 0 | 1,
    base.aspirate as 0 | 1,
    base.nasal as 0 | 1
  );
  if (!glyph) return null;
  return {
    place: base.place as PhonemeBit["place"],
    voice: base.voice as 0 | 1,
    aspirate: base.aspirate as 0 | 1,
    nasal: base.nasal as 0 | 1,
    iast: glyph.iast,
    devanagari: glyph.devanagari,
  };
}
