"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Shuffle, Volume2 } from "lucide-react";

type Obj = {
  iast: string;
  devanagari: string;
  class: string;
  place_en: string;
  manner_en: string;
  production_locus: string;
  tantric_locus: string;
  bruno_env: string;
  bruno_actor: string;
  imaginal_signature_rule: string;
};

const PLACE_ENV: Record<string, string> = {
  "kaṇṭhya": "cave",
  "tālavya": "vaulted hall",
  "mūrdhanya": "dome",
  "dantya": "gate of teeth",
  "oṣṭhya": "pair of doors / lips",
  "vowel-field": "head-face field",
};

const CLIP: Record<string, string> = {
  a: "/memory/clips/a.ogg",
  ā: "/memory/clips/aa.ogg",
  i: "/memory/clips/i.ogg",
  ī: "/memory/clips/ii.ogg",
  u: "/memory/clips/u.ogg",
  ū: "/memory/clips/uu.ogg",
  e: "/memory/clips/e.ogg",
  ai: "/memory/clips/ai.ogg",
  o: "/memory/clips/o.ogg",
  au: "/memory/clips/au.ogg",
  aṃ: "/memory/clips/anusvara.ogg",
  aḥ: "/memory/clips/visarga.ogg",
  ka: "/memory/clips/ka.ogg",
  kha: "/memory/clips/kha.ogg",
  ga: "/memory/clips/ga.ogg",
  gha: "/memory/clips/gha.ogg",
  ca: "/memory/clips/ca.ogg",
  cha: "/memory/clips/cha.ogg",
  ja: "/memory/clips/ja.ogg",
  jha: "/memory/clips/jha.ogg",
  ta: "/memory/clips/ta.ogg",
  tha: "/memory/clips/tha.ogg",
  da: "/memory/clips/da.ogg",
  dha: "/memory/clips/dha.ogg",
};

async function loadObjects(): Promise<Obj[]> {
  const r = await fetch("/memory/data/phoneme_objects.json");
  const j = await r.json();
  return j.objects as Obj[];
}

export default function MemoryBrunoPage() {
  const [objs, setObjs] = useState<Obj[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mode, setMode] = useState<"ray" | "locus">("ray");

  useEffect(() => {
    loadObjects().then((o) => setObjs(o));
  }, []);

  const cur = objs[idx];

  function next() {
    setRevealed(false);
    setIdx((i) => (objs.length ? (i + 1) % objs.length : 0));
  }
  function shuffle() {
    setRevealed(false);
    if (!objs.length) return;
    setIdx(Math.floor(Math.random() * objs.length));
  }
  function playClip() {
    if (!cur) return;
    const src = CLIP[cur.iast];
    if (src) new Audio(src).play().catch(() => {});
  }

  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/memory"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Memory
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Bruno Memory Wheels</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Each phoneme is a <strong className="text-foreground">bundle</strong>, not a gloss:
          glyph · articulation · production locus · tantric locus · imaginal signature.
          The image must <em>teach</em> the phonetic property — never invent mnemonics harder than Sanskrit.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`px-3 py-2 rounded-lg text-sm border ${mode === "ray" ? "border-primary text-primary" : "border-border"}`}
          onClick={() => setMode("ray")}
        >
          Full ray
        </button>
        <button
          type="button"
          className={`px-3 py-2 rounded-lg text-sm border ${mode === "locus" ? "border-primary text-primary" : "border-border"}`}
          onClick={() => setMode("locus")}
        >
          Locus quiz
        </button>
      </div>

      {!cur ? (
        <p className="text-muted-foreground">Loading phoneme objects…</p>
      ) : mode === "ray" ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-center mb-4">
            <div className="text-6xl font-display text-primary mb-2">{cur.devanagari}</div>
            <div className="text-2xl text-foreground">{cur.iast}</div>
            {/* 26/50 clips on disk — button disables honestly where uncut */}
            <button
              type="button"
              onClick={playClip}
              disabled={!cur || !CLIP[cur.iast]}
              title={cur && !CLIP[cur.iast] ? "clip not yet cut — use night audio cycles" : "play clip"}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent disabled:opacity-40"
            >
              <Volume2 className="w-4 h-4" /> Hear
            </button>
            {cur && !CLIP[cur.iast] && (
              <p className="text-xs text-muted-foreground mt-1">clip not yet cut</p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="text-xs text-muted-foreground mb-1">Ring 2 · Articulation</div>
              <div>{cur.place_en} · {cur.manner_en}</div>
              <div className="text-muted-foreground mt-1">{cur.production_locus}</div>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="text-xs text-muted-foreground mb-1">Ring 3 · Tantric locus (apparatus reading — verse differs; see integrated wheel)</div>
              <div className="text-primary">{cur.tantric_locus}</div>
            </div>
            <div className="p-3 rounded-lg bg-background border border-border sm:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Ring 4 · Bruno imaginal signature</div>
              <div>{cur.bruno_env} + {cur.bruno_actor}</div>
              <div className="text-muted-foreground mt-1 text-xs">{cur.imaginal_signature_rule}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Rings: centre aham → glyph → articulation → tantric locus → image → examples (later).
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground mb-2">Where is this phoneme installed?</p>
          <div className="text-5xl font-display text-primary mb-3">{cur.devanagari}</div>
          <div className="text-lg mb-4">{cur.iast}</div>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
          >
            Reveal locus
          </button>
          {revealed && (
            <div className="mt-4 space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Tantric:</span>{" "}
                <span className="text-primary font-medium">{cur.tantric_locus}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mouth:</span> {cur.production_locus}
              </div>
              <div>
                <span className="text-muted-foreground">Image:</span> {cur.bruno_env} + {cur.bruno_actor}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={next}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
        >
          Next phoneme
        </button>
        <button
          type="button"
          onClick={shuffle}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
        >
          <Shuffle className="w-4 h-4" /> Shuffle
        </button>
        <button
          type="button"
          onClick={() => { setIdx(0); setRevealed(false); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
        <span className="text-xs text-muted-foreground self-center">
          {objs.length ? `${idx + 1} / ${objs.length}` : ""}
        </span>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <h2 className="text-sm font-medium text-foreground mb-2">Wheel spec</h2>
        <pre className="text-xs overflow-x-auto">{`centre     awareness / aham
ring 1     Devanāgarī glyph
ring 2     articulation (sthāna + manner)
ring 3     Abhinavagupta/Mālinī bodily locus
ring 4     mnemonic image (teaches the property)
ring 5     Sanskrit examples (later)`}</pre>
        <p className="mt-2">
          Synthetic pedagogy — Bruno and Abhinavagupta had no historical connection.
          Ontology is Trika; Bruno is combinatorial machinery only.
        </p>
      </section>
    </div>
  );
}
