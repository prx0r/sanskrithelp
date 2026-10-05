/** Sandhi Collision Mode — predict then collide. */

export interface CollisionPair {
  left: string;
  right: string;
  predicted?: string;
  actual?: string;
}

export interface CollisionResult {
  boundary: string;
  operator: string;
  before: string;
  after: string;
  bruno: string;
}

/** Teaching sandhi rules for the simulator. */
const RULES: Array<{
  test: (l: string, r: string) => boolean;
  operator: string;
  bruno: string;
  apply: (l: string, r: string) => { boundary: string; after: string };
}> = [
  {
    // t + g → d g  (sat + gamaya → sad gamaya)
    test: (l, r) => /t$/.test(l) && /^[g]/.test(r),
    operator: "voicing of final t before voiced g",
    bruno: "vibration / illumination — t loses its glow",
    apply: (l, r) => ({
      boundary: "t | g",
      after: l.slice(0, -1) + "d " + r,
    }),
  },
  {
    // ḥ + m → o m  (asato from asataḥ + mā teaching)
    test: (l, r) => /ḥ$/.test(l) || /asataḥ$/.test(l),
    operator: "visarga → o before m (teaching)",
    bruno: "visarga breath condenses into round vowel",
    apply: (l, r) => ({
      boundary: "ḥ | m",
      after: l.replace(/ḥ$/, "o") + " " + r,
    }),
  },
  {
    // t + g voiced already handled; s + g teaching: sat + g → sad g
    test: (l, r) => /^sat$/.test(l) && /^[g]/.test(r),
    operator: "final t voices before g",
    bruno: "vibration activates at boundary",
    apply: (_l, r) => ({
      boundary: "t | g",
      after: "sad " + r,
    }),
  },
];

export function collide(left: string, right: string): CollisionResult | null {
  const l = left.trim();
  const r = right.trim();
  for (const rule of RULES) {
    if (rule.test(l, r)) {
      const { boundary, after } = rule.apply(l, r);
      return {
        boundary,
        operator: rule.operator,
        before: `${l} + ${r}`,
        after,
        bruno: rule.bruno,
      };
    }
  }
  // default: no change
  return {
    boundary: `${l} | ${r}`,
    operator: "no sandhi (teaching default)",
    bruno: "—",
    before: `${l} + ${r}`,
    after: `${l} ${r}`,
  };
}

export function predictBoundary(left: string, right: string): string {
  const l = left.trim();
  const r = right.trim();
  if (/sat$/.test(l) && /^[g]/.test(r)) return "t|g → d|g → sad …";
  if (/ḥ$/.test(l) && /^m/.test(r)) return "ḥ|m → o|m";
  if (/t$/.test(l) && /^[gvd]/.test(r)) return "t|g → d|g (voicing)";
  return `${l} | ${r}`;
}
