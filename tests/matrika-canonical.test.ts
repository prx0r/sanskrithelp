import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

type Entry = {
  iast: string;
  devanagari: string;
  locus: string;
  source?: { text: string; sanskrit: string };
  apparatus_variant?: string;
};

function allEntries(map: any): Entry[] {
  const out: Entry[] = [...(map.vowels ?? [])];
  for (const v of map.vargas ?? []) out.push(...(v.sequence ?? []));
  return out;
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

describe("canonical Mātṛkā body map (TĀ 15.117-120 verse-literal)", () => {
  const map = JSON.parse(
    readFileSync(resolve(ROOT, "public/memory/data/matrika_body_map.json"), "utf8")
  );
  const entries = allEntries(map);
  const byIast = new Map(entries.map((e) => [e.iast, e]));

  it("covers all 50 phonemes", () => {
    expect(entries.length).toBe(50);
  });

  it("every entry carries a verse source tag", () => {
    for (const e of entries) {
      expect(e.source?.text, `${e.iast} source.text`).toMatch(/TĀ 15\.11[789]/);
      expect(e.source?.sanskrit, `${e.iast} source.sanskrit`).toBeTruthy();
    }
  });

  it("locks the peer-review checklist", () => {
    expect(byIast.get("ga")?.locus).toBe("right hand");
    expect(byIast.get("gha")?.locus).toBe("right fingers");
    expect(byIast.get("ṅa")?.locus).toBe("right nails");
    expect(byIast.get("ja")?.locus).toBe("left hand");
    expect(byIast.get("jha")?.locus).toBe("left fingers");
    expect(byIast.get("ña")?.locus).toBe("left nails");
    expect(byIast.get("ṭa")?.locus).toBe("right hip");
    expect(byIast.get("ta")?.locus).toBe("left hip");
    expect(byIast.get("sa")?.locus).toBe("śukra / generative fluid");
    expect(byIast.get("a")?.locus).toBe("forehead");
    expect(byIast.get("ma")?.locus).toBe("heart");
  });

  it("no elbow/wrist/buttock in canonical loci (apparatus_variant only)", () => {
    for (const e of entries) {
      expect(e.locus, e.iast).not.toMatch(/elbow|wrist|buttock/);
    }
  });

  it("wheel dataset agrees with canonical loci", () => {
    const wheel: Array<{ iast: string; locus: string }> = JSON.parse(
      readFileSync(resolve(ROOT, "public/memory/matrka-wheel/matrka-data.json"), "utf8")
    );
    expect(wheel.length).toBe(50);
    for (const w of wheel) {
      const c = byIast.get(w.iast);
      expect(c, `canonical entry for ${w.iast}`).toBeTruthy();
      expect(norm(w.locus), w.iast).toBe(norm(c!.locus));
    }
  });
});

describe("nyasa page regression", () => {
  const src = readFileSync(resolve(ROOT, "app/memory/nyasa/page.tsx"), "utf8");

  it("includes Night 5", () => {
    expect(src).toMatch(/night:\s*5/);
  });

  it("teaches hand/fingers, not elbow/wrist", () => {
    const nights = src.slice(src.indexOf("const NIGHTS"), src.indexOf("const LADDER"));
    expect(nights).toMatch(/right hand/);
    expect(nights).not.toMatch(/elbow|wrist/);
  });

  it("labels pacing as ours, not textual", () => {
    expect(src).toMatch(/modern pacing, not Abhinavagupta/);
  });
});
