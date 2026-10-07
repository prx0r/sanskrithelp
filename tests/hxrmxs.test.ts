import { describe, expect, it } from "vitest";
import { FUNCTION_IDS, normalizeFunction, retrieveExemplar, voicePrompt } from "../lib/hxrmxs";
import exemplarsData from "../data/hxrmxs-exemplars.json";

describe("hxrmxs voice (decisions in, teacher speech out)", () => {
  it("covers all 18 taxonomy moves", () => {
    expect(FUNCTION_IDS.length).toBe(18);
    for (const id of ["UM_01", "RM_03", "SM_02", "ME_02"]) {
      expect(FUNCTION_IDS).toContain(id);
    }
  });

  it("renders RM_03 with register style + lineage, one move only", () => {
    const p = voicePrompt({
      function_id: "RM_03",
      mechanism: "comparison_contrast",
      register: ["PR_02", "LS_01"],
      lineage: "Therapeutic",
    });
    expect(p).toContain("A is not B");
    expect(p).toContain("hold the thread unbroken");
    expect(p).toContain("fewest words");
    expect(p.toLowerCase()).toContain("one move only");
  });

  it("degrades honestly on unknown function", () => {
    const p = voicePrompt({ function_id: "XX_99" });
    expect(p).toContain("directly and usefully");
  });
});

describe("transmission (verbatim teacher words)", () => {
  it("exemplar store is substantial", () => {
    const d = exemplarsData as any;
    expect(d.count).toBeGreaterThan(500);
    for (const e of d.exemplars) {
      expect(e.text.trim().length, e.id).toBeGreaterThan(0);
      expect(e.text, e.id).not.toContain("[PEDAGOGY]");
    }
  });

  it("META_ normalizes to ME_", () => {
    expect(normalizeFunction("META_01")).toBe("ME_01");
    expect(normalizeFunction("RM_03")).toBe("RM_03");
  });

  it("retrieval is deterministic and prefers register overlap", () => {
    const a = retrieveExemplar({ function_id: "RM_03", register: ["PR_02", "LS_01"] });
    const b = retrieveExemplar({ function_id: "RM_03", register: ["PR_02", "LS_01"] });
    expect(a?.id).toBe(b?.id);
    const c = retrieveExemplar({ function_id: "RM_03", register: ["PR_04", "LS_05"] });
    expect(c).toBeTruthy();
    if (a && c && a.id !== c.id) {
      expect(a.register["PR"] ?? a.register["LS"]).toBeTruthy();
    }
  });

  it("unknown function retrieves nothing (rendered path)", () => {
    expect(retrieveExemplar({ function_id: "XX_99" })).toBeNull();
  });
});
