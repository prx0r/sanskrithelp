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
