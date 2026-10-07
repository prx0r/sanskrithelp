import { describe, expect, it } from "vitest";
import { FUNCTION_IDS, voicePrompt } from "../lib/hxrmxs";

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
