import { describe, expect, it } from "vitest";
import { decompileHindi } from "../lib/memory/hindiDecompile";

describe("deterministic Hindi decompiler", () => {
  it("decompiles the flagship sentence (relations land in unknown)", () => {
    const r = decompileHindi("क्या मैं आपके साथ अभ्यास कर सकता हूँ?");
    expect(r.question).toBe(true);
    expect(r.subjectId).toBe("main-m");
    expect(r.frameId).toBe("ability");
    expect(r.verbId).toBe("kar");
    // relation + bare object are outside the 4-frame lexicon: honest boundary
    expect(r.unknown.join(" ")).toContain("आपके साथ");
  });

  it("round-trips a compiler-generated sentence with zero unknowns", () => {
    const r = decompileHindi("मैं हिंदी सीख रहा हूँ।");
    expect(r.subjectId).toBe("main-m");
    expect(r.frameId).toBe("progressive");
    expect(r.verbId).toBe("seekh");
    expect(r.complement?.id).toBe("hindi");
    expect(r.unknown).toEqual([]);
  });

  it("round-trips habitual + time", () => {
    const r = decompileHindi("मैं हर दिन संस्कृत पढ़ता हूँ।");
    expect(r.frameId).toBe("habitual");
    expect(r.timeId).toBe("daily");
    expect(r.unknown).toEqual([]);
  });

  it("matches exact Kumbh phrases", () => {
    const r = decompileHindi("आप किस परंपरा से हैं?");
    expect(r.phraseId).toBe("lineage");
  });

  it("handles dative subjects without crashing", () => {
    const r = decompileHindi("मुझे समझ नहीं आया।");
    expect(r.phraseId).toBe("understand-no");
    expect(r.subjectId).toBe("main-m");
  });

  it("returns unknowns, not garbage, for out-of-grammar input", () => {
    const r = decompileHindi("मैंने खाना खाया।");
    expect(r.frameId).toBeNull(); // perfective/ergative deferred by design
    expect(r.unknown.length).toBeGreaterThan(0);
  });
});
