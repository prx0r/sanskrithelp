import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { FUNCTION_IDS, normalizeFunction, retrieveExemplar, voicePrompt } from "../lib/hxrmxs";
import exemplarsData from "../data/hxrmxs-exemplars.json";

const ROOT = resolve(__dirname, "..");

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

describe("missing corpus normalized (long arcs integrated)", () => {
  const eps = readFileSync(resolve(ROOT, "data/hxrmxs-missing-normalized.jsonl"), "utf8")
    .trim().split("\n").map((l) => JSON.parse(l));

  it("grows with each corpus batch (≥392 episodes, 10+ lineages)", () => {
    expect(eps.length).toBeGreaterThanOrEqual(392);
    const lins = new Set(eps.map((e: any) => e.lineage));
    for (const l of ["ISTDP", "Zen", "Socratic", "Buddhist", "Krishnamurti", "Modern", "Stoic", "Cynic"]) {
      expect(lins.has(l), l).toBe(true);
    }
  });

  it("contains the long arcs (20/14/13/12 assistant turns)", () => {
    const lens = eps.map((e: any) => e.turns.filter((t: any) => t.role === "assistant").length);
    for (const n of [20, 14, 13, 12]) {
      expect(lens.includes(n), String(n)).toBe(true);
    }
  });

  it("lineages are real traditions; synthetic work is flagged at source", () => {
    const lins = new Set(eps.map((e: any) => e.lineage));
    for (const l of lins) {
      expect(String(l)).not.toMatch(/_|\(/);
    }
    const synth = eps.filter((e: any) => e.synthetic);
    expect(synth.length).toBeGreaterThan(0);
    for (const e of synth) {
      expect(e.source_file, e.id).toMatch(/diamond-numbered/);
    }
  });

  it("turns are clean: no pedagogy leak, no raw speaker codes as roles", () => {
    for (const e of eps) {
      for (const t of e.turns) {
        expect(["user", "assistant", "other"]).toContain(t.role);
        expect(t.text || "").not.toContain("[PEDAGOGY]");
      }
    }
  });
});
