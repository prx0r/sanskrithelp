import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

describe("repo organisation", () => {
  it("duplicate clip dirs are gone (single source: public/)", () => {
    expect(existsSync(resolve(ROOT, "audio"))).toBe(false);
    expect(existsSync(resolve(ROOT, "phenetics"))).toBe(false);
    expect(existsSync(resolve(ROOT, "public/audio/phonemes"))).toBe(true);
    expect(existsSync(resolve(ROOT, "public/memory/clips"))).toBe(true);
  });

  it("tantra cakra grid resolves every row id to a real clip file", () => {
    const src = readFileSync(resolve(ROOT, "app/tantra/matrika/page.tsx"), "utf8");
    expect(src).toContain("/memory/clips");
    expect(src).not.toContain('"/audio/phonemes"');
    const rows = [...src.matchAll(/row:\s*\[([^\]]+)\]/g)].flatMap((m) =>
      [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
    );
    expect(rows.length).toBeGreaterThan(30);
    const map: Record<string, string> = {
      "ṅa": "nga", "ña": "nya", "ṭa": "tta", "ṭha": "ttha",
      "ḍa": "dda", "ḍha": "ddha", "ṇa": "nna", "śa": "sha", "ṣa": "ssa",
    };
    for (const id of rows) {
      const file = `${map[id] ?? id}.ogg`;
      expect(existsSync(resolve(ROOT, "public/memory/clips", file)), id).toBe(true);
    }
  });

  it("README orients; scope doc is marked future", () => {
    const readme = readFileSync(resolve(ROOT, "README.md"), "utf8");
    expect(readme).toContain("sanskrit.help");
    expect(readme).toContain("HANDOVER.md");
    const scope = readFileSync(resolve(ROOT, "docs/STONEDOORWAY-TANTRA-BODY.md"), "utf8");
    expect(scope).toMatch(/FUTURE|not built|SCOPE ONLY/);
    expect(scope).toContain("matrika-body-map-v2");
    expect(scope).toContain("matrika-night");
    expect(scope).toContain("Wheel II");
  });
});
