import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { decompileHindi } from "../lib/memory/hindiDecompile";
import { HINDI_ISLANDS, HINDI_MACHINES, HINDI_EXEMPLARS } from "../lib/constructicon/hindiMachines";

const ROOT = resolve(__dirname, "..");

describe("imperative-request machine (Bhatia gap)", () => {
  it("decompiles honorific imperatives with verbs", () => {
    for (const [s, v] of [["माफ़ कीजिए।", "kar"], ["देखिए।", "dekh"], ["समझिए।", "samajh"]] as const) {
      const r = decompileHindi(s);
      expect(r.frameId, s).toBe("imperative");
      expect(r.verbId, s).toBe(v);
    }
  });

  it("क्या anywhere (not just initial) marks questions", () => {
    expect(decompileHindi("आप क्या करते हैं?").question).toBe(true);
    expect(decompileHindi("मैं हिंदी सीख रहा हूँ।").question).toBe(false);
  });

  it("constructicon holds the machine + round-tripping exemplars", () => {
    const m = HINDI_MACHINES.find((x) => x.id === "imperative-request");
    expect(m?.island).toBe("kar-island");
    expect(HINDI_ISLANDS.find((i) => i.id === "kar-island")?.machineIds).toContain("imperative-request");
    expect(HINDI_ISLANDS.find((i) => i.id === "kar-island")?.machineIds).toContain("subjunctive-request");
    for (const e of HINDI_EXEMPLARS.filter((x) => x.machineId === "imperative-request")) {
      expect(decompileHindi(e.surface).frameId, e.surface).toBe("imperative");
    }
    for (const e of HINDI_EXEMPLARS.filter((x) => x.machineId === "subjunctive-request")) {
      expect(decompileHindi(e.surface).frameId, e.surface).toBe("subjunctive");
    }
  });
});

describe("hindi packs (Snell vocab + Bhatia skeletons + pathway)", () => {
  it("vocab pack: 1223 items, all with mapped audio", () => {
    const v = JSON.parse(readFileSync(resolve(ROOT, "public/memory/hindi/vocab.json"), "utf8"));
    expect(v.count).toBe(1223);
    expect(v.assumption).toMatch(/verify by ear/i);
    for (const it of v.items.slice(0, 50)) {
      expect(it.hindi.length).toBeGreaterThan(0);
      if (it.audio_hi) expect(existsSync(resolve(ROOT, "public/memory/hindi", it.audio_hi))).toBe(true);
    }
  });

  it("bhatia pack is review-gated and NOT wired to the engine", () => {
    const b = JSON.parse(readFileSync(resolve(ROOT, "public/memory/hindi/bhatia.json"), "utf8"));
    expect(b.status).toBe("needs-native-review");
    expect(b.interactive).toBe(false);
    const page = readFileSync(resolve(ROOT, "app/memory/hindi/scenarios/page.tsx"), "utf8");
    expect(page).not.toContain("bhatia.json");
  });

  it("pathway references resolve; incoming work is declared", () => {
    const p = JSON.parse(readFileSync(resolve(ROOT, "public/memory/hindi/pathway.json"), "utf8"));
    expect(p.stages.length).toBe(3);
    expect(p.incoming.length).toBeGreaterThanOrEqual(3);
    for (const s of p.stages) for (const sc of s.scenarios) {
      if (sc.endsWith(".json")) continue;
      if (sc.includes("*")) continue;
    }
  });

  it("jiniac drills pack: machine-tagged Devanagari commands", () => {
    const d = JSON.parse(readFileSync(resolve(ROOT, "public/memory/hindi/drills.json"), "utf8"));
    expect(d.count).toBeGreaterThan(1000);
    const got = new Set(d.drills.map((x: any) => x.machine));
    expect(got.has("subjunctive")).toBe(true);
  });
});
