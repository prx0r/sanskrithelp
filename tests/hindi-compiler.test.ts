import { describe, expect, it } from "vitest";
import {
  HINDI_FRAMES,
  HINDI_SUBJECTS,
  HINDI_TIMES,
  HINDI_VERBS,
  compileHindiSentence,
} from "../lib/memory/hindiPresets";

const S = Object.fromEntries(HINDI_SUBJECTS.map((s) => [s.id, s]));
const F = Object.fromEntries(HINDI_FRAMES.map((f) => [f.id, f]));
const V = Object.fromEntries(HINDI_VERBS.map((v) => [v.id, v]));
const T = Object.fromEntries(HINDI_TIMES.map((t) => [t.id, t]));
const compOf = (verbId: string, compId: string) => {
  const c = V[verbId].complements.find((x) => x.id === compId);
  if (!c) throw new Error(`no complement ${compId} for ${verbId}`);
  return c;
};

describe("Hindi sentence compiler (README examples)", () => {
  it("मैं हिंदी सीख रहा हूँ।", () => {
    const r = compileHindiSentence(S["main-m"], F.progressive, V.seekh, compOf("seekh", "hindi"), T.none);
    expect(r.hindi).toBe("मैं हिंदी सीख रहा हूँ।");
  });
  it("मैं हर दिन संस्कृत पढ़ता हूँ।", () => {
    const r = compileHindiSentence(S["main-m"], F.habitual, V.padh, compOf("padh", "sanskrit"), T.daily);
    expect(r.hindi).toBe("मैं हर दिन संस्कृत पढ़ता हूँ।");
  });
  it("आप हिंदी बोल सकते हैं।", () => {
    const r = compileHindiSentence(S["aap-m"], F.ability, V.bol, compOf("bol", "hindi"), T.none);
    expect(r.hindi).toBe("आप हिंदी बोल सकते हैं।");
  });
  it("मैं यह अभ्यास करना चाहता हूँ।", () => {
    const r = compileHindiSentence(S["main-m"], F.want, V.kar, compOf("kar", "this-practice"), T.none);
    expect(r.hindi).toBe("मैं यह अभ्यास करना चाहता हूँ।");
  });
  it("feminine agreement: मैं हिंदी सीख रही हूँ।", () => {
    const r = compileHindiSentence(S["main-f"], F.progressive, V.seekh, compOf("seekh", "hindi"), T.none);
    expect(r.hindi).toBe("मैं हिंदी सीख रही हूँ।");
  });
  it("no ergative/perfective in frame set (deferred by design)", () => {
    expect(HINDI_FRAMES.map((f) => f.id)).toEqual(["habitual", "progressive", "ability", "want"]);
  });
});
