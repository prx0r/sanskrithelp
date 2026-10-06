import { describe, expect, it } from "vitest";
import { assocScore, rankFillers, rankMachines } from "../lib/constructicon/types";
import { HINDI_EXEMPLARS, HINDI_ISLANDS, HINDI_MACHINES } from "../lib/constructicon/hindiMachines";

describe("constructicon engine", () => {
  it("registers machines with slots and examples", () => {
    expect(HINDI_MACHINES.length).toBeGreaterThanOrEqual(5);
    for (const m of HINDI_MACHINES) {
      expect(m.id).toBeTruthy();
      expect(m.meaning).toBeTruthy();
      expect(m.examples.length).toBeGreaterThan(0);
    }
  });

  it("every exemplar points at a real machine", () => {
    const ids = new Set(HINDI_MACHINES.map((m) => m.id));
    for (const e of HINDI_EXEMPLARS) expect(ids.has(e.machineId)).toBe(true);
  });

  it("islands reference real machines", () => {
    const ids = new Set(HINDI_MACHINES.map((m) => m.id));
    for (const isl of HINDI_ISLANDS)
      for (const m of isl.machineIds) expect(ids.has(m)).toBe(true);
  });

  it("assoc prefers distinctive + personal fillers", () => {
    const ranked = rankFillers({
      common: { form: "काम", gloss: "work", countInMachine: 50, countOverall: 5000 },
      niche: { form: "अभ्यास", gloss: "practice", countInMachine: 20, countOverall: 60, personal: 1 },
    });
    expect(ranked[0].form).toBe("अभ्यास");
  });

  it("greedy coverage ranks the highest-gain machine first", () => {
    const ex = new Map(HINDI_EXEMPLARS.map((e) => [e.id, e.machineId] as [string, string]));
    const cover = HINDI_MACHINES.map((m) => ({
      id: m.id, coverage: 0, frequency: 1, productivity: m.slots.length,
      usefulness: 1, complexity: m.slots.length + m.connections.length,
    }));
    const ranked = rankMachines(cover, ex, new Set());
    expect(ranked[0].gain).toBeGreaterThanOrEqual(ranked[1].gain);
    // installed machines lose their gain (marginal coverage)
    const covered = new Set(ex.keys());
    const ranked2 = rankMachines(cover, ex, covered);
    expect(ranked2.every((r) => r.gain <= 0)).toBe(true);
  });
});
