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

  it("follows verse-literal, not apparatus tables", () => {
    expect(src).toMatch(/verse-literal/);
    expect(src).not.toMatch(/Loci follow the TĀ 15 apparatus tables/);
  });
});

describe("Tonight practice chart — full 50 canonical (Abhinavagupta truth)", () => {
  const html = readFileSync(resolve(ROOT, "public/memory/practice-chart.html"), "utf8");

  it("lists all 50 phonemes", () => {
    expect(html.match(/<li>/g)?.length).toBe(50);
  });

  it("declares Abhinavagupta as source of truth, no old divergence warn", () => {
    expect(html).toMatch(/Source of truth: Abhinavagupta/);
    expect(html).not.toMatch(/Diverges from canonical/);
  });

  it("uses canonical loci (e=lower teeth, aḥ=tongue, va=sinews, kṣa=generative organ)", () => {
    expect(html).toMatch(/e — lower teeth/);
    expect(html).toMatch(/ai — upper teeth/);
    expect(html).toMatch(/aḥ — tongue/);
    expect(html).toMatch(/va — sinews/);
    expect(html).toMatch(/kṣa — generative organ/);
    expect(html).not.toMatch(/fat \/ medas/);
    expect(html).not.toMatch(/mouth opening/);
  });

  it("orders pa-varga after ta-varga (Matrika emission order)", () => {
    const pa = html.indexOf("pa — right side");
    const ta = html.indexOf("ta — left hip");
    const tta = html.indexOf("ṭa — right hip");
    expect(tta).toBeGreaterThan(-1);
    expect(ta).toBeGreaterThan(tta);
    expect(pa).toBeGreaterThan(ta);
  });
});

describe("Bruno 50 volvelle — true wheels, 50 divisions", () => {
  const src = readFileSync(resolve(ROOT, "public/memory/bruno-50/index.html"), "utf8");

  it("declares Bruno mechanics + Abhinavagupta content separation", () => {
    expect(src).toMatch(/De umbris/);
    expect(src).toMatch(/Abhinavagupta/);
  });

  it("embeds 50 varna with canonical loci", () => {
    const m = src.match(/window\.BRUNO50=(\[.*?\]);/s);
    expect(m).toBeTruthy();
    const data = JSON.parse(m![1]);
    expect(data.length).toBe(50);
    const by = new Map(data.map((d: any) => [d.iast, d]));
    expect(by.get("a")?.locus).toBe("forehead");
    expect(by.get("ga")?.locus).toBe("right hand");
    expect(by.get("sa")?.locus).toMatch(/śukra/);
    expect(by.get("kṣa")?.locus).toBe("generative organ");
    // every entry has agent + action (true PAO, not faceted display)
    for (const d of data) {
      expect(d.agent?.length, d.iast).toBeGreaterThan(2);
      expect(d.action?.length, d.iast).toBeGreaterThan(2);
    }
  });

  it("is spinnable (drag + snap + spin controls)", () => {
    expect(src).toMatch(/pointerdown/);
    expect(src).toMatch(/Spin VAR/);
    expect(src).toMatch(/Encode/);
  });
});
