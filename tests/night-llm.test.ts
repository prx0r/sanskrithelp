import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sessionIdFor } from "../lib/ai";

const ROOT = resolve(__dirname, "..");

describe("LLM backend (free-tier, session-routed)", () => {
  const src = readFileSync(resolve(ROOT, "lib/ai.ts"), "utf8");

  it("defaults to the free model, never a paid one", () => {
    expect(src).toContain("longcat-2.5-preview-free");
    expect(src).not.toContain("deepseek-v4-flash\";");
    expect(src).not.toMatch(/gpt-oss-120b/);
  });

  it("sends the required session header + app user agent", () => {
    expect(src).toContain("x-opencode-session");
    expect(src).toContain("sanskrithelp/1.0");
  });

  it("session ids are stable per conversation, distinct across conversations", () => {
    const a = [{ role: "user" as const, content: "what is karma?" }];
    const b = [{ role: "user" as const, content: "explain sandhi" }];
    expect(sessionIdFor(a)).toBe(sessionIdFor(a));
    expect(sessionIdFor(a)).not.toBe(sessionIdFor(b));
  });

  it("tutor footer no longer demands the wrong key", () => {
    const tutor = readFileSync(resolve(ROOT, "app/learn/tutor/page.tsx"), "utf8");
    expect(tutor).not.toContain("Ensure CHUTES_API_KEY is set");
  });
});

describe("Night Handoff (dream loop UI)", () => {
  const src = readFileSync(resolve(ROOT, "app/memory/night/page.tsx"), "utf8");

  it("page exists with protocol, dream seed, morning log", () => {
    expect(existsSync(resolve(ROOT, "app/memory/night/page.tsx"))).toBe(true);
    expect(src).toMatch(/Tonight.*protocol/i);
    expect(src).toMatch(/Morning — one line/i);
    expect(src).toMatch(/no phone first/i);
  });

  it("labels dream incubation as modern synthesis, disclaims Hz/medical", () => {
    expect(src).toMatch(/modern synthesis/);
    expect(src).toMatch(/No Hz-per-phoneme/);
    expect(src).not.toMatch(/binaural beats cure|heals|therapy/i);
  });

  it("reuses the existing handoff contract (no new schema)", () => {
    expect(src).toContain("buildStoneDoorwayExport");
  });

  it("memory hub has a Night door", () => {
    const hub = readFileSync(resolve(ROOT, "app/memory/page.tsx"), "utf8");
    expect(hub).toContain("/memory/night");
  });
});

describe("Daily VB (dharana of the day)", () => {
  const daily = JSON.parse(
    readFileSync(resolve(ROOT, "public/memory/vbt-daily.json"), "utf8")
  );

  it("covers the mapped dharanas honestly (65 of 112)", () => {
    expect(daily.entries.length).toBe(65);
    expect(daily.count_total).toBe(112);
    for (const e of daily.entries) {
      expect(e.technique?.length, String(e.dharana)).toBeGreaterThan(3);
      expect(e.upaya?.length, String(e.dharana)).toBeGreaterThan(3);
      expect(e.coord?.length, String(e.dharana)).toBeGreaterThan(3);
    }
  });

  it("rotation is deterministic (day-of-year mod count)", () => {
    const idx = (day: number) => day % daily.entries.length;
    expect(idx(65)).toBe(0);
    expect(idx(66)).toBe(1);
  });

  it("night page renders today's dharana from the file", () => {
    const src = readFileSync(resolve(ROOT, "app/memory/night/page.tsx"), "utf8");
    expect(src).toContain("vbt-daily.json");
    expect(src).toMatch(/Today.*dhāraṇā/);
  });
});

describe("organisation (canon links + cross-links + provenance)", () => {
  it("hub links the TA15 record + frozen table; maps links both", () => {
    const hub = readFileSync(resolve(ROOT, "app/memory/page.tsx"), "utf8");
    expect(hub).toContain("/memory/canonical/TA15_NYASA.md");
    expect(hub).toContain("/memory/canonical/TA15_TABLE.html");
    const maps = readFileSync(resolve(ROOT, "app/memory/maps/page.tsx"), "utf8");
    expect(maps).toContain("TA15_NYASA");
    expect(maps).toContain("TA15_TABLE");
  });

  it("tantra cakra grid carries provenance + points at the verse map", () => {
    const src = readFileSync(resolve(ROOT, "app/tantra/matrika/page.tsx"), "utf8");
    expect(src).toMatch(/pedagogical/);
    expect(src).toContain("/memory/practice-chart.html");
    expect(src).toContain("/memory/canonical/TA15_TABLE.html");
  });

  it("tantra hub links back to Memory", () => {
    const hub = readFileSync(resolve(ROOT, "app/tantra/page.tsx"), "utf8");
    expect(hub).toContain("/memory/practice-chart.html");
  });
});
