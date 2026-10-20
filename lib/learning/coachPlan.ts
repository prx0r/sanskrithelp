export interface CoachActionResponse {
  instruction: string;
  stopCondition?: string;
  model?: string;
}

export interface ValidatedCoachAction {
  instruction: string;
  stopCondition: string;
  model: string | null;
  usedFallback: boolean;
}

const DEVANAGARI_TOKEN = /[\u0900-\u097F][\u0900-\u097F\u0951-\u0954\u1CD0-\u1CFA]*/gu;
const ROOT_TOKEN = /√[^\s.,;:!?()[\]{}"']+/gu;
const DIACRITIC_TOKEN =
  /[A-Za-z]*[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣḻṟṉḻĀĪŪṚṜḶḸĒŌṂḤṄÑṬḌṆŚṢ][A-Za-zāīūṛṝḷḹēōṃḥṅñṭḍṇśṣḻṟṉḻĀĪŪṚṜḶḸĒŌṂḤṄÑṬḌṆŚṢ]*/gu;

export function stripCodeFences(text: string): string {
  return text
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
}

export function extractCandidateJson(text: string): unknown {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Coach response did not contain JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export function extractSanskritishTokens(text: string): string[] {
  const normalized = text.normalize("NFKC");
  const tokens = new Set<string>();
  for (const pattern of [DEVANAGARI_TOKEN, ROOT_TOKEN, DIACRITIC_TOKEN]) {
    pattern.lastIndex = 0;
    for (const match of normalized.matchAll(pattern)) {
      const token = match[0].trim().toLowerCase();
      if (token && token !== "√") tokens.add(token);
    }
  }
  return [...tokens];
}

function collectStrings(value: unknown, into: string[]): void {
  if (typeof value === "string") {
    if (value) into.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, into);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, into);
  }
}

export function allowedSanskritTokens(engineState: unknown): Set<string> {
  const strings: string[] = [];
  collectStrings(engineState, strings);
  const allowed = new Set<string>();
  for (const text of strings) {
    for (const token of extractSanskritishTokens(text)) allowed.add(token);
  }
  return allowed;
}

export function findUnverifiedSanskrit(
  instruction: string,
  allowedTokens: Set<string>,
): string[] {
  return extractSanskritishTokens(instruction).filter((token) => !allowedTokens.has(token));
}

export function sanitizeModelAction(payload: unknown): CoachActionResponse {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Coach action must be an object");
  }
  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.instruction !== "string" || !candidate.instruction.trim()) {
    throw new Error("Coach action requires instruction text");
  }
  if (candidate.instruction.length > 1500) {
    throw new Error("Coach instruction is too long");
  }
  if (candidate.stopCondition !== undefined && typeof candidate.stopCondition !== "string") {
    throw new Error("Coach stop condition must be text");
  }
  if (candidate.model !== undefined && typeof candidate.model !== "string") {
    throw new Error("Coach model must be text");
  }
  return {
    instruction: candidate.instruction.trim(),
    stopCondition:
      typeof candidate.stopCondition === "string" && candidate.stopCondition.trim()
        ? candidate.stopCondition.trim()
        : "Do exactly one testable action, then stop.",
    model: typeof candidate.model === "string" ? candidate.model : undefined,
  };
}
