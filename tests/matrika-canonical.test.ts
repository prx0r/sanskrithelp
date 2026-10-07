import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
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

  it("uses canonical loci (e=lower teeth, aḥ=tongue, va=sūtra-sinews, kṣa=generative organ)", () => {
    expect(html).toMatch(/e — lower teeth/);
    expect(html).toMatch(/ai — upper teeth/);
    expect(html).toMatch(/aḥ — tongue/);
    expect(html).toMatch(/va — sūtra \(sinews\)/);
    expect(html).toMatch(/kṣa — generative organ/);
    expect(html).not.toMatch(/fat \/ medas/);
    expect(html).not.toMatch(/mouth opening/);
    expect(html).not.toMatch(/kṣa — jīva/);
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
    const start = src.indexOf("window.BRUNO50=");
    const end = src.indexOf(";\nconst S=", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const data = JSON.parse(src.slice(start + "window.BRUNO50=".length, end));
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

describe("clip sync (human grid mapped to canonical ids)", () => {
  const wheel: Array<{ id: string; iast: string }> = JSON.parse(
    readFileSync(resolve(ROOT, "public/memory/matrka-wheel/matrka-data.json"), "utf8")
  );
  const dir = resolve(ROOT, "public/memory/clips");
  const files = new Set(readdirSync(dir).filter((f) => f.endsWith(".ogg")).map((f) => f.replace(".ogg", "")));

  it("47/50 human clips present; only ḷ ḹ kṣa missing", () => {
    expect(files.size).toBe(47);
    for (const w of wheel) {
      const has = files.has(w.id);
      if (["l", "ll", "ksha"].includes(w.id)) expect(has, w.id).toBe(false);
      else expect(has, w.id).toBe(true);
    }
  });

  it("grid filename mapping is pinned (ta1=ṭa, na_j=ña, na_k=ṅa, shha=ṣa)", () => {
    const grid = resolve(ROOT, "public/audio/phonemes");
    const pairs: Array<[string, string]> = [["ta1", "tta"], ["tha1", "ttha"], ["da1", "dda"],
      ["dha1", "ddha"], ["na1", "nna"], ["na_j", "nya"], ["na_k", "nga"], ["shha", "ssa"]];
    for (const [src, dst] of pairs) {
      const a = readFileSync(resolve(grid, `${src}.ogg`));
      const b = readFileSync(resolve(dir, `${dst}.ogg`));
      expect(a.equals(b), `${src}→${dst}`).toBe(true);
    }
  });

  it("chart shows 47 ▶ and 3 ○", () => {
    const html = readFileSync(resolve(ROOT, "public/memory/practice-chart.html"), "utf8");
    expect(html.match(/▶<\/button>/g)?.length).toBe(47);
    expect(html.match(/>○<\/span>/g)?.length).toBe(3);
  });
});
describe("frozen canonical dataset v2 (user-locked TĀ15_MĀTRIKĀ)", () => {
  const map = JSON.parse(
    readFileSync(resolve(ROOT, "public/memory/data/matrika_body_map.json"), "utf8")
  );
  const entries: Array<{ iast: string; locus: string }> = [
    ...map.vowels,
    ...map.vargas.flatMap((v: any) => v.sequence),
  ];

  it("is frozen v2 with the six corrections on record", () => {
    expect(map.id).toBe("matrika-body-map-v2");
    expect(map.frozen).toBeTruthy();
    expect(map.corrections.length).toBe(6);
  });

  it("aṃ is #15, aḥ #16; e/ai lower/upper teeth", () => {
    expect(entries[14].iast).toBe("aṃ");
    expect(entries[15].iast).toBe("aḥ");
    expect(entries[15].locus).toBe("tongue");
    expect(entries.find((e) => e.iast === "e")?.locus).toBe("lower teeth");
    expect(entries.find((e) => e.iast === "ai")?.locus).toBe("upper teeth");
  });

  it("ṭa/ta blocks (#27–36) come before pa-varga (#37–41)", () => {
    const idx = (ia: string) => entries.findIndex((e) => e.iast === ia);
    expect(idx("ṭa")).toBe(26);
    expect(idx("ta")).toBe(31);
    expect(idx("pa")).toBe(36);
  });

  it("va is sūtra (sinews), kṣa is generative organ — never medas/jīva", () => {
    expect(entries.find((e) => e.iast === "va")?.locus).toBe("sūtra (sinews)");
    expect(entries.find((e) => e.iast === "kṣa")?.locus).toBe("generative organ");
    for (const e of entries) {
      expect(e.locus, e.iast).not.toMatch(/medas|jīva/);
    }
  });
});

describe("canonical table page (invisible made visible)", () => {
  const html = readFileSync(resolve(ROOT, "public/memory/canonical/TA15_TABLE.html"), "utf8");

  it("shows all 50 Mātṛkā + 50 Mālinī rows from frozen v2", () => {
    expect(html).toContain("matrika-body-map-v2");
    expect(html.match(/<tr>/g)!.length).toBeGreaterThanOrEqual(100);
    expect(html).toMatch(/va[\s\S]{0,40}sūtra \(sinews\)/);
  });

  it("exposes verse sources + apparatus variants per phoneme", () => {
    expect(html).toMatch(/TĀ 15\.11[789]/);
    expect(html).toMatch(/apparatus variant/);
  });

  it("night page surfaces VBT dhāraṇās; hub links the table", () => {
    const night = readFileSync(resolve(ROOT, "app/memory/night/page.tsx"), "utf8");
    expect(night).toContain("vijnanabhairava/units.json");
    const hub = readFileSync(resolve(ROOT, "app/memory/page.tsx"), "utf8");
    expect(hub).toContain("/memory/canonical/TA15_TABLE.html");
    expect(hub).toContain("/memory/canonical/THEORY_SHELF.html");
  });

  it("theory shelf names all seven works with legitimate access", () => {
    const shelf = readFileSync(resolve(ROOT, "public/memory/canonical/THEORY_SHELF.html"), "utf8");
    for (const name of ["Journey", "Bang", "Kubjik", "Synaesthetic", "Mālinī", "Padoux", "Yantra"]) {
      expect(shelf, name).toContain(name);
    }
    expect(shelf).toContain("ediss");
    expect(shelf).not.toMatch(/z-library|Anna.?s Archive|pdfcoffee/i);
  });
});

describe("start-here index (orientation)", () => {
  it("four guided steps plus a reference shelf, hub points at it first", () => {
    const src = readFileSync(resolve(ROOT, "app/memory/start/page.tsx"), "utf8");
    expect(src).toContain("/memory/practice-chart");
    expect(src).toContain("/memory/nyasa");
    expect(src).toContain("/memory/audio");
    expect(src).toContain("/memory/night");
    expect(src).toContain("two phonemes");
    const hub = readFileSync(resolve(ROOT, "app/memory/page.tsx"), "utf8");
    expect(hub).toContain("/memory/start");
  });
});
