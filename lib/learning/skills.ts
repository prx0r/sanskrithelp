export const SKILL_DIMENSIONS = [
  "recognition",
  "production",
  "reverseParse",
  "operatorTransfer",
  "latency",
  "confidence",
] as const;

export type SkillDimension = (typeof SKILL_DIMENSIONS)[number];

export const SKILL_KINDS = [
  "phoneme",
  "root",
  "verse",
  "sandhi",
  "zone",
  "drill",
  "audio",
] as const;

export type SkillKind = (typeof SKILL_KINDS)[number];

export interface CanonicalSkill {
  kind: SkillKind;
  path: string;
  dimension: SkillDimension;
  id: string;
}

const SEGMENT_PATTERN = /^[\p{L}\p{N}_\-+√.:]{1,160}$/u;

export function normalizeSkillSegment(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_\-+√.:]/gu, "");

  if (!SEGMENT_PATTERN.test(normalized)) {
    throw new Error(`Invalid skill segment: ${value}`);
  }

  return normalized;
}

export function canonicalSkillId(
  kind: SkillKind,
  path: string,
  dimension: SkillDimension,
): string {
  if (!SKILL_KINDS.includes(kind)) throw new Error(`Invalid skill kind: ${kind}`);
  if (!SKILL_DIMENSIONS.includes(dimension)) {
    throw new Error(`Invalid skill dimension: ${dimension}`);
  }

  const normalizedPath = normalizeSkillSegment(path);
  return `${kind}:${normalizedPath}.${dimension}`;
}

export function parseSkillId(id: string): CanonicalSkill | null {
  if (typeof id !== "string") return null;

  const dimensionSeparator = id.lastIndexOf(".");
  if (dimensionSeparator <= 0 || dimensionSeparator === id.length - 1) return null;

  const head = id.slice(0, dimensionSeparator);
  const dimension = id.slice(dimensionSeparator + 1) as SkillDimension;
  if (!SKILL_DIMENSIONS.includes(dimension)) return null;

  const kindSeparator = head.indexOf(":");
  if (kindSeparator <= 0) return null;
  const kind = head.slice(0, kindSeparator) as SkillKind;
  const path = head.slice(kindSeparator + 1);
  if (!SKILL_KINDS.includes(kind) || !path) return null;

  try {
    const normalizedPath = normalizeSkillSegment(path);
    if (normalizedPath !== path) return null;
  } catch {
    return null;
  }

  if (kind === "root") {
    const match = /^(.+)\.operator:(.+)$/.exec(path);
    if (!match?.[1] || !match?.[2]) return null;
  } else if (kind === "phoneme") {
    if (!/^[^.]+\.[01]\.[01]\.[01]$/.exec(path)) return null;
  } else if (kind === "sandhi") {
    if (!/^.+__plus__.+$/.exec(path)) return null;
  } else if (path.includes(".") || path.includes(":")) {
    return null;
  }

  return { kind, path, dimension, id };
}

/** Canonical root/operator transfer skill: root:√gam.operator:ṇic.operatorTransfer */
export function morphTransferSkillId(root: string, operator: string): string {
  const cleanRoot = normalizeSkillSegment(root);
  const cleanOperator = normalizeSkillSegment(operator || "plain");
  return canonicalSkillId("root", `${cleanRoot}.operator:${cleanOperator}`, "operatorTransfer");
}

/** Canonical production skill for one articulated phoneme. */
export function phonemeProductionSkillId(
  place: string,
  voice: 0 | 1,
  aspirate: 0 | 1,
  nasal: 0 | 1,
): string {
  return canonicalSkillId(
    "phoneme",
    `${normalizeSkillSegment(place)}.${voice}.${aspirate}.${nasal}`,
    "production",
  );
}

/** Canonical reverse-parse skill for an installed verse. */
export function verseReverseSkillId(verseId: string): string {
  return canonicalSkillId("verse", normalizeSkillSegment(verseId), "reverseParse");
}

/** Canonical sandhi boundary skill. The ID is stable and deliberately lossy. */
export function sandhiBoundarySkillId(left: string, right: string): string {
  const clean = (value: string) =>
    value
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      .replace(/[\s+]+/g, "_")
      .replace(/[^\p{L}\p{N}_\-]/gu, "");
  const cleanLeft = normalizeSkillSegment(clean(left));
  const cleanRight = normalizeSkillSegment(clean(right));
  return canonicalSkillId("sandhi", `${cleanLeft}__plus__${cleanRight}`, "reverseParse");
}

export function zoneSkillId(zone: string, dimension: SkillDimension): string {
  return canonicalSkillId("zone", normalizeSkillSegment(zone.toLowerCase()), dimension);
}

export function isCanonicalSkillId(id: string): boolean {
  return parseSkillId(id) !== null;
}
