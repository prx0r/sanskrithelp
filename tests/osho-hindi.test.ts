import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { decompileHindi } from "../lib/memory/hindiDecompile";
import { HINDI_EXEMPLARS, HINDI_ISLANDS, HINDI_MACHINES } from "../lib/constructicon/hindiMachines";

const ROOT = resolve(__dirname, "..");

describe("Osho Hindi Dataset Zero (corpus truth)", () => {
  const corpus = JSON.parse(
    readFileSync(resolve(ROOT, "public/memory/hindi/corpus.json"), "utf8")
  );

  it("osho source is ready with verified pattern", () => {
    const osho = corpus.sources.find((s: any) => s.id === "osho-shiv-sutra");
    expect(osho.status).toBe("ready");
    expect(osho.pattern).toContain("OSHO-Shiv_Sutra_{01..10}.mp3");
    expect(osho.verified).toMatch(/2026-10-06/);
  });

  it("anchors file exists with 3 sutra nuclei", () => {
    expect(existsSync(resolve(ROOT, "public/memory/hindi/osho-shiv-sutra-01.json"))).toBe(true);
    const a = JSON.parse(
      readFileSync(resolve(ROOT, "public/memory/hindi/osho-shiv-sutra-01.json"), "utf8")
    );
    expect(a.segments.length).toBe(3);
  });

  it("anchor unit_ids resolve against siva_sutras units", () => {
    const a = JSON.parse(
      readFileSync(resolve(ROOT, "public/memory/hindi/osho-shiv-sutra-01.json"), "utf8")
    );
    const units = JSON.parse(
      readFileSync(resolve(ROOT, "public/content/readings/siva_sutras/units.json"), "utf8")
    );
    const ids = new Set(units.map((u: any) => u.id));
    for (const s of a.segments) expect(ids.has(s.unit_id)).toBe(true);
  });

  it("bulk audio stays out of git", () => {
    const gi = readFileSync(resolve(ROOT, ".gitignore"), "utf8");
    expect(gi).toMatch(/public\/memory\/hindi\/audio\//);
  });
});

describe("Osho-register decompile", () => {
  it("detects X-kaa-arth-hai-ki-Y with zero unknowns", () => {
    const r = decompileHindi("इस सूत्र का अर्थ है कि चैतन्य ही आत्मा है।");
    expect(r.constructionId).toBe("X-kaa-arth-hai-ki-Y");
    expect(r.topic).toBe("इस सूत्र");
    expect(r.predicate).toContain("चैतन्य");
    expect(r.unknown).toEqual([]);
  });

  it("detects X-hii-Y-hai", () => {
    const r = decompileHindi("चैतन्य ही आत्मा है।");
    expect(r.constructionId).toBe("X-hii-Y-hai");
    expect(r.topic).toBe("चैतन्य");
    expect(r.predicate).toBe("आत्मा");
    expect(r.unknown).toEqual([]);
  });

  it("anchor Hindi_simple strings all decompile cleanly", () => {
    const a = JSON.parse(
      readFileSync(resolve(ROOT, "public/memory/hindi/osho-shiv-sutra-01.json"), "utf8")
    );
    for (const s of a.segments) {
      const r = decompileHindi(s.hindi_simple);
      expect(r.constructionId, s.hindi_simple).toBe(s.construction);
      expect(r.unknown, s.hindi_simple).toEqual([]);
    }
  });
});

describe("Osho constructicon", () => {
  it("osho-island holds the two machines", () => {
    const isl = HINDI_ISLANDS.find((i) => i.id === "osho-island");
    expect(isl?.machineIds).toContain("X-kaa-arth-hai-ki-Y");
    expect(isl?.machineIds).toContain("X-hii-Y-hai");
    expect(HINDI_MACHINES.some((m) => m.id === "X-kaa-arth-hai-ki-Y")).toBe(true);
  });

  it("osho exemplars round-trip through the decompiler", () => {
    const ex = HINDI_EXEMPLARS.filter((e) => e.machineId.startsWith("X-"));
    expect(ex.length).toBeGreaterThanOrEqual(3);
    for (const e of ex) {
      const r = decompileHindi(e.surface);
      expect(r.constructionId, e.surface).toBe(e.machineId);
    }
  });

  it("text-mode page exists", () => {
    expect(existsSync(resolve(ROOT, "app/memory/hindi/text-mode/page.tsx"))).toBe(true);
  });
});
