import {
  HINDI_FRAMES,
  HINDI_SUBJECTS,
  HINDI_TIMES,
  HINDI_VERBS,
  KUMBH_PHRASES,
  type HindiComplement,
  type HindiFrame,
  type HindiSubject,
  type HindiTime,
  type HindiVerb,
} from "./hindiPresets";

export type DecompiledHindi = {
  /** Exact Kumbh phrase hit, if the input matches one. */
  phraseId: string | null;
  /** Osho-register construction hit (Dataset Zero), if the input matches one. */
  constructionId: string | null;
  /** Topic span for construction hits (X in `X का अर्थ है कि Y`). */
  topic: string | null;
  /** Predicate span for construction hits (Y). */
  predicate: string | null;
  question: boolean;
  subjectId: string | null;
  frameId: string | null;
  verbId: string | null;
  complement: HindiComplement | null;
  timeId: string | null;
  /** Spans the deterministic grammar cannot account for (relations, novel lexicon). */
  unknown: string[];
};

const DATIVE_SUBJECT: Record<string, string> = {
  मुझे: "main-m",
  तुम्हें: "tum-m",
  आपको: "aap-m",
  उसे: "vah-m",
  हमें: "ham-m",
};

function strip(s: string): string {
  return s.replace(/[।?!]/g, " ").replace(/\s+/g, " ").trim();
}

function findSubject(tokens: string[]): { subject: HindiSubject | null; rest: string[] } {
  if (!tokens.length) return { subject: null, rest: [] };
  const head = tokens[0];
  const direct = HINDI_SUBJECTS.find((s) => s.dev === head);
  if (direct) return { subject: direct, rest: tokens.slice(1) };
  const mapped = DATIVE_SUBJECT[head];
  if (mapped) {
    const s = HINDI_SUBJECTS.find((x) => x.id === mapped) ?? null;
    return { subject: s, rest: tokens.slice(1) };
  }
  return { subject: null, rest: tokens };
}

function findTime(tokens: string[]): { time: HindiTime | null; rest: string[] } {
  const ids = ["अभी", "हर", "सुबह", "शाम", "यहाँ"];
  const idx = tokens.findIndex((t) => ids.includes(t));
  if (idx === -1) return { time: HINDI_TIMES[0], rest: tokens };
  // हर दिन and शाम को are two-token times
  for (const t of HINDI_TIMES) {
    const parts = t.dev.split(" ").filter(Boolean);
    if (parts.length && tokens.slice(idx, idx + parts.length).join(" ") === t.dev) {
      const rest = [...tokens];
      rest.splice(idx, parts.length);
      return { time: t, rest };
    }
  }
  return { time: HINDI_TIMES[0], rest: tokens };
}

function findVerb(tokens: string[]): {
  frame: HindiFrame | null;
  verb: HindiVerb | null;
  complement: HindiComplement | null;
  unknown: string[];
} {
  const text = tokens.join(" ");
  // generalized -ें (e + anusvara) subjunctive, minus auxiliaries/pronouns/postpositions.
  // stem = token minus ें, then minus trailing े (करें→कर, बनाएं→बना).
  const SUBJ_EXCLUDE = new Set(["हैं", "में", "उन्हें", "इन्हें", "जिन्हें", "किन्हें", "तुम्हें", "हमें"]);
  for (const t of tokens) {
    if (t.endsWith("ें") && !SUBJ_EXCLUDE.has(t)) {
      const frame = HINDI_FRAMES.find((f) => f.id === "subjunctive") ?? null;
      const stem = t.slice(0, -1).replace(/े$/, "");
      const verb = HINDI_VERBS.find((v) => stem === v.root) ?? null;
      const { complement, unknown } = verb
        ? splitComplement(verb, tokens, [t])
        : { complement: null, unknown: tokens.filter((x) => x !== t) };
      return { frame, verb, complement, unknown };
    }
  }
  for (const verb of HINDI_VERBS) {
    // honorific imperative: root + िए (समझिए/देखिए/बोलिए), plus कीजिए→कर
    const impForms = [verb.root + "िए"];
    if (verb.id === "kar") impForms.push("कीजिए");
    if (tokens.some((t) => impForms.includes(t))) {
      const frame = HINDI_FRAMES.find((f) => f.id === "imperative") ?? null;
      const { complement, unknown } = splitComplement(verb, tokens, impForms);
      return { frame, verb, complement, unknown };
    }
    // subjunctive request: stem + ें on known roots
    const subForms = [verb.root + "ें"];
    if (tokens.some((t) => subForms.includes(t))) {
      const frame = HINDI_FRAMES.find((f) => f.id === "subjunctive") ?? null;
      const { complement, unknown } = splitComplement(verb, tokens, subForms);
      return { frame, verb, complement, unknown };
    }
    // want-frame: infinitive present
    if (text.includes(verb.infinitive)) {
      const frame = HINDI_FRAMES.find((f) => f.id === "want") ?? null;
      const { complement, unknown } = splitComplement(verb, tokens, [verb.infinitive]);
      return { frame, verb, complement, unknown };
    }
    // ability: root + सक*
    const sakIdx = tokens.findIndex((t) => t.startsWith("सक"));
    if (sakIdx !== -1 && tokens.slice(0, sakIdx).some((t) => t.startsWith(verb.root))) {
      const frame = HINDI_FRAMES.find((f) => f.id === "ability") ?? null;
      const { complement, unknown } = splitComplement(verb, tokens, [verb.root]);
      return { frame, verb, complement, unknown };
    }
    // progressive: root + रह*
    const rahIdx = tokens.findIndex((t) => t.startsWith("रह"));
    if (rahIdx !== -1 && tokens.slice(0, rahIdx).some((t) => t.startsWith(verb.root))) {
      const frame = HINDI_FRAMES.find((f) => f.id === "progressive") ?? null;
      const { complement, unknown } = splitComplement(verb, tokens, [verb.root]);
      return { frame, verb, complement, unknown };
    }
    // habitual: root+ता/ती/ते fused token
    const habIdx = tokens.findIndex(
      (t) => t !== verb.root && t.startsWith(verb.root) && /ता|ती|ते$/.test(t)
    );
    if (habIdx !== -1) {
      const frame = HINDI_FRAMES.find((f) => f.id === "habitual") ?? null;
      const { complement, unknown } = splitComplement(verb, tokens, [verb.root]);
      return { frame, verb, complement, unknown };
    }
  }
  return { frame: null, verb: null, complement: null, unknown: tokens };
}

function splitComplement(
  verb: HindiVerb,
  tokens: string[],
  verbMarkers: string[]
): { complement: HindiComplement | null; unknown: string[] } {
  // complement = longest known complement string inside the remaining tokens
  const text = tokens.join(" ");
  let best: HindiComplement | null = null;
  for (const c of verb.complements) {
    if (text.includes(c.dev) && (!best || c.dev.length > best.dev.length)) best = c;
  }
  if (!best) return { complement: null, unknown: tokens };
  // unknown = tokens not covered by complement or verb markers or auxiliaries
  const aux = new Set(["हूँ", "हो", "है", "हैं"]);
  const covered = new Set(best.dev.split(" "));
  const unknown = tokens.filter(
    (t) =>
      !covered.has(t) &&
      !aux.has(t) &&
      !verbMarkers.some((m) => t === m || t.startsWith(m)) &&
      !/^(सक|रह|चाह|ता|ती|ते)/.test(t) &&
      !t.startsWith("चाह")
  );
  return { complement: best, unknown };
}

/**
 * Osho-register constructions (Dataset Zero: Osho Śiva Sūtra Hindi).
 * These are explanatory/copular machines, disjoint from the 4 action frames.
 * Osho teaches Hindi here, not Trika authority.
 */
function detectOsho(
  clean: string
): { constructionId: string; topic: string; predicate: string } | null {
  // X का अर्थ है कि Y — "the meaning of X is that Y"
  const arth = clean.match(/^(.+?) का अर्थ है कि (.+)$/);
  if (arth) {
    return {
      constructionId: "X-kaa-arth-hai-ki-Y",
      topic: arth[1].trim(),
      predicate: arth[2].trim(),
    };
  }
  // X ही Y है — emphatic equation ("X itself is Y")
  const hii = clean.match(/^(.+?) ही (.+?) है$/);
  if (hii) {
    return {
      constructionId: "X-hii-Y-hai",
      topic: hii[1].trim(),
      predicate: hii[2].trim(),
    };
  }
  return null;
}

/**
 * Deterministic Hindi decompiler: surface string -> Bruno wheel state.
 * Covers what our compiler generates (4 frames, known lexicon, क्या-questions,
 * dative subjects) plus Osho-register constructions (Dataset Zero).
 * Everything else lands in `unknown` — that is the honest
 * boundary where Stanza/LLM takes over (see awesomevision.md pipeline).
 */
export function decompileHindi(input: string): DecompiledHindi {
  const clean = strip(input);
  const exact = KUMBH_PHRASES.find((p) => strip(p.dev) === clean);
  const tokens0 = clean.split(" ").filter(Boolean);
  const question = tokens0.includes("क्या");
  const osho = detectOsho(clean);
  const tokens = tokens0.filter((t) => t !== "क्या");

  const { subject, rest: r1 } = findSubject(tokens);
  const { time, rest: r2 } = findTime(r1);
  const { frame, verb, complement, unknown } = findVerb(r2);

  return {
    phraseId: exact ? exact.id : null,
    constructionId: osho ? osho.constructionId : null,
    topic: osho ? osho.topic : null,
    predicate: osho ? osho.predicate : null,
    question,
    subjectId: subject ? subject.id : null,
    frameId: frame ? frame.id : null,
    verbId: verb ? verb.id : null,
    complement,
    timeId: time ? time.id : null,
    // construction hits fully account for the input — no unknowns
    unknown: osho ? [] : unknown,
  };
}
