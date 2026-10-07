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

describe("adaptive difficulty (config + suggestion)", () => {
  it("scenarios carry levels + delivery config", () => {
    const j = JSON.parse(
      readFileSync(resolve(ROOT, "public/memory/hindi/scenarios.json"), "utf8")
    );
    expect(j.difficulty.default).toBe("normal");
    for (const s of j.scenarios) {
      expect(s.level, s.id).toBeGreaterThanOrEqual(1);
      expect(s.config.easy.rate, s.id).toBeLessThan(1);
      expect(s.config.hard.transcript, s.id).toBe(false);
    }
  });

  it("suggestion engine degrades honestly with no history", async () => {
    const { suggestionFor, RATES, getDifficulty } = await import("../lib/hindi/difficulty");
    expect(RATES.easy).toBeLessThan(RATES.normal);
    expect(RATES.hard).toBeGreaterThan(RATES.normal);
    expect(getDifficulty()).toBe("normal");
    expect(suggestionFor("no-such-scenario", "normal")).toBeNull();
  });

  it("SpeakScore tags context; scenarios page has difficulty UI", () => {
    const sp = readFileSync(resolve(ROOT, "components/SpeakScore.tsx"), "utf8");
    expect(sp).toContain("context");
    expect(sp).toContain("[${context}]");
    const page = readFileSync(resolve(ROOT, "app/memory/hindi/scenarios/page.tsx"), "utf8");
    expect(page).toContain("Difficulty:");
    expect(page).toContain("suggestionFor");
    expect(page).toContain("playbackRate");
  });
});

describe("audio scenes (islands as listenable scenes)", () => {
  const j = JSON.parse(
    readFileSync(resolve(ROOT, "public/memory/hindi/scenarios.json"), "utf8")
  );

  it("every scenario has 3 removal stages with real files", () => {
    for (const s of j.scenarios) {
      const man = JSON.parse(
        readFileSync(resolve(ROOT, "public/memory/hindi/scenes", `${s.id}.json`), "utf8")
      );
      for (const stage of ["stage1", "stage2", "stage3"]) {
        expect(man.stages[stage], `${s.id}:${stage}`).toBeTruthy();
        expect(existsSync(resolve(ROOT, "public/memory/hindi", man.stages[stage].file))).toBe(true);
      }
      const muted2 = man.stages.stage2.slots.filter((x: any) => x.muted).length;
      const muted3 = man.stages.stage3.slots.filter((x: any) => x.muted).length;
      const total = man.stages.stage3.slots.length;
      expect(muted2, s.id).toBeGreaterThan(0);
      expect(muted3, s.id).toBe(total);
      expect(man.stages.stage1.slots.filter((x: any) => x.muted).length, s.id).toBe(0);
    }
  });

  it("scenarios page renders the stage player", () => {
    const src = readFileSync(resolve(ROOT, "app/memory/hindi/scenarios/page.tsx"), "utf8");
    expect(src).toContain("ScenePlayer");
    expect(src).toContain("stage3");
  });
});

describe("daily Hindi loop (islands spec, closed)", () => {
  it("practice log accepts hindi entries (shared sadhana log)", () => {
    const src = readFileSync(resolve(ROOT, "lib/practiceLog.ts"), "utf8");
    expect(src).toContain('"hindi"');
    const log = readFileSync(resolve(ROOT, "app/tantra/practice-log/page.tsx"), "utf8");
    expect(log).toContain('"hindi"');
  });

  it("scoring logs the attempt; hindi page shows today's line", () => {
    const sp = readFileSync(resolve(ROOT, "components/SpeakScore.tsx"), "utf8");
    expect(sp).toContain("practiceLog");
    expect(sp).toContain('type: "hindi"');
    const hub = readFileSync(resolve(ROOT, "app/memory/hindi/page.tsx"), "utf8");
    expect(hub).toMatch(/Today.*Hindi/);
    expect(hub).toContain("scenarios.json");
    expect(hub).toContain("osho-shiv-sutra-01.json");
  });
});
