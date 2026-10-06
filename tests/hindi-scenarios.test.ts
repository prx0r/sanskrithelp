import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { decompileHindi } from "../lib/memory/hindiDecompile";
import { HINDI_MACHINES } from "../lib/constructicon/hindiMachines";

const ROOT = resolve(__dirname, "..");

describe("assess route (ported scoring, free backend)", () => {
  const src = readFileSync(resolve(ROOT, "app/api/assess/route.ts"), "utf8");

  it("runs on the shared free client with graceful fallbacks", () => {
    expect(src).toContain("chatCompletion");
    expect(src).toContain("Could not parse assessment");
    expect(src).toContain("Assessment service unavailable");
    expect(src).not.toContain("CHUTES");
  });

  it("grounds scoring in the deterministic pre-check", () => {
    expect(src).toContain("decompileHindi");
    expect(src).toContain("construction");
  });
});

describe("field scenarios (NPC shape, own lines)", () => {
  const j = JSON.parse(
    readFileSync(resolve(ROOT, "public/memory/hindi/scenarios.json"), "utf8")
  );

  it("has 3 staged scenarios with full shape", () => {
    expect(j.scenarios.length).toBe(3);
    for (const s of j.scenarios) {
      expect(s.pattern?.length, s.id).toBeGreaterThan(3);
      expect(s.npcScript.length, s.id).toBeGreaterThanOrEqual(2);
      expect(s.hints.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.targetLines.length, s.id).toBeGreaterThanOrEqual(3);
      for (const v of s.vocab) {
        expect(v.hindi?.length, s.id).toBeGreaterThan(0);
        expect(v.english?.length, s.id).toBeGreaterThan(0);
      }
    }
  });

  it("scenario constructions resolve to real machines", () => {
    const ids = new Set(HINDI_MACHINES.map((m) => m.id));
    for (const s of j.scenarios) {
      if (s.construction) expect(ids.has(s.construction), s.id).toBe(true);
    }
  });

  it("Osho scenario targets decompile to the Osho register", () => {
    const osho = j.scenarios.find((s: any) => s.id === "osho-sutra-1");
    expect(osho).toBeTruthy();
    for (const t of osho.targetLines.slice(1)) {
      const r = decompileHindi(t);
      expect(r.constructionId, t).toBeTruthy();
      expect(r.unknown, t).toEqual([]);
    }
  });

  it("scenarios route + speak-score component exist and are wired", () => {
    expect(existsSync(resolve(ROOT, "app/memory/hindi/scenarios/page.tsx"))).toBe(true);
    expect(existsSync(resolve(ROOT, "components/SpeakScore.tsx"))).toBe(true);
    const tm = readFileSync(resolve(ROOT, "app/memory/hindi/text-mode/page.tsx"), "utf8");
    expect(tm).toContain("SpeakScore");
    const hub = readFileSync(resolve(ROOT, "app/memory/hindi/page.tsx"), "utf8");
    expect(hub).toContain("/memory/hindi/scenarios");
  });
});
