"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import pratyaharasData from "@/data/pratyaharas.json";
import phonemesData from "@/data/phonemes.json";
import { PratyaharaDrill } from "@/components/PratyaharaDrill";
import type { Pratyahara, Phoneme } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ZoneGate } from "@/components/ZoneGate";

const pratyaharas = pratyaharasData as Pratyahara[];
const phonemes = phonemesData as Phoneme[];

const PHONEME_TO_DEVANAGARI: Record<string, string> = Object.fromEntries(
  phonemes.map((p) => [p.id, p.devanagari])
);

// Marker char → which line (1-based) it ends
const MARKER_TO_LINE: Record<string, number> = {
  ṇ: 1, k: 2, ṅ: 3, c: 4, ṭ: 5, m: 7, ñ: 8, ṣ: 9, ś: 10, v: 11, y: 12, r: 13, l: 14,
};

// Shiva Sutras: each line = { devanagari, roman, marker, meaning }
const SHIVA_SUTRAS_LINES: { dev: string; roman: string; marker: string; meaning: string }[] = [
  { dev: "अ इ उ ण्", roman: "a i u ṇ", marker: "ṇ", meaning: "basic vowels a i u" },
  { dev: "ऋ लृ क्", roman: "ṛ lṛ k", marker: "k", meaning: "vocalic ṛ, ḷ" },
  { dev: "ए ओ ङ्", roman: "e o ṅ", marker: "ṅ", meaning: "guṇa vowels e o" },
  { dev: "ऐ औ च्", roman: "ai au c", marker: "c", meaning: "vṛddhi vowels ai au" },
  { dev: "ह य व र ट्", roman: "ha ya va ra ṭ", marker: "ṭ", meaning: "semivowels" },
  { dev: "ल ण्", roman: "la ṇ", marker: "ṇ", meaning: "l" },
  { dev: "ञ म ङ ण न म्", roman: "ña ma ṅ ṇa na m", marker: "m", meaning: "nasals" },
  { dev: "झ भ ञ्", roman: "jha bha ñ", marker: "ñ", meaning: "…" },
  { dev: "घ ढ ध ष्", roman: "gha ḍha dha ṣ", marker: "ṣ", meaning: "…" },
  { dev: "ज ब ग ड द श्", roman: "ja ba ga ḍa da ś", marker: "ś", meaning: "…" },
  { dev: "ख फ छ ठ थ च ट त व्", roman: "kha pha cha ṭha tha ca ṭa ta v", marker: "v", meaning: "…" },
  { dev: "क प य्", roman: "ka pa y", marker: "y", meaning: "…" },
  { dev: "श ष स र्", roman: "śa ṣa sa r", marker: "r", meaning: "sibilants" },
  { dev: "ह ल्", roman: "ha l", marker: "l", meaning: "ha" },
];

// 10 lessons from first principles - no jumping ahead
const LESSON_STEPS: Array<{
  title: string;
  body: string;
  interactive?: "range-quiz" | "marker-quiz" | "sound-order" | "trace-ac" | "trace-ik" | "shiva-preview";
}> = [
  {
    title: "The problem",
    body: "Pāṇini wrote about 4,000 grammar rules. Many say things like 'change the vowel' or 'applies to i, u, ṛ, ḷ'. Sanskrit has 49 basic sounds (phonemes). Writing them out every time — a, ā, i, ī, u, ū, ṛ, ḷ, e, ai, o, au… — would make each rule pages long. He needed a way to say 'these sounds' in just a few characters.",
  },
  {
    title: "We do this all the time",
    body: "We compress constantly. 'etc.' instead of 'and so on'. 'A–Z' instead of listing every letter. 'Mon–Fri' instead of Monday, Tuesday, Wednesday, Thursday, Friday. The key idea: a short code can stand for a whole group, if we agree on what it means.",
  },
  {
    title: "Ranges: from X to Y",
    body: "One powerful pattern is the range. Instead of 'A, B, C, D, E' we say 'A through E'. We give a start and an end; everything in between is included. Same with numbers: '1 to 10' is obvious. Pāṇini's codes use this exact idea — but with a twist.",
  },
  {
    title: "Try it: alphabet ranges",
    body: "If the alphabet is A B C D E F G… and we say 'from B up to (but not including) E', what do we get?",
    interactive: "range-quiz",
  },
  {
    title: "The twist: markers",
    body: "Pāṇini's twist: the 'end' isn't a letter we include — it's a cutoff marker. Like a fence: everything before the fence is in, the fence itself is out. So 'from A to before D' = A, B, C. The letter D marks where to stop; we don't include D.",
    interactive: "marker-quiz",
  },
  {
    title: "Sanskrit's sound order",
    body: "Sanskrit sounds have a fixed order. Vowels first: a, i, u, ṛ, ḷ, e, o, ai, au. Then semivowels (y, r, l, v), then consonants by place (velars, palatals, retroflexes, dentals, labials). This order is our 'alphabet' for ranges.",
    interactive: "sound-order",
  },
  {
    title: "The Shiva Sutras",
    body: "Pāṇini didn't invent the order — tradition before him had it. The classic list is the Shiva Sutras: 14 lines that lay out all sounds. Each line ends with a special 'marker' letter. That marker is our fence: it says 'cut here'. The sounds before it are in the group.",
    interactive: "shiva-preview",
  },
  {
    title: "The rule",
    body: "A pratyāhāra (literally 'withdrawal' or 'abbreviation') = start letter + marker. It means: from the start letter, through the last sound before the marker. So if a is in line 1 and c is the marker at the end of line 4, then ac = everything from a through the letter before c — i.e. all vowels.",
  },
  {
    title: "Trace it: ac",
    body: "Let's trace ac. Start: अ (a) in line 1. Marker: च (c) at the end of line 4. ac = from a through औ (au) — the letter before c. That's अ इ उ ऋ लृ ए ओ ऐ औ = all vowels. Tap to see the range.",
    interactive: "trace-ac",
  },
  {
    title: "Where you'll see this",
    body: "Every page of the Aṣṭādhyāyī uses pratyāhāras. A rule might say 'apply guṇa to the ik of the root' — ik = i, u, ṛ, ḷ. So √bhū → bhavati: the u became o because u is in ik. Or 'ac' for all vowels, 'hal' for consonants. Learning these codes is your decoder for the grammar.",
    interactive: "trace-ik",
  },
];

export default function CompressionPage() {
  const [lessonStep, setLessonStep] = useState(0);
  const [showDrill, setShowDrill] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [selected, setSelected] = useState<Pratyahara | null>(null);
  const [rangeQuizAnswer, setRangeQuizAnswer] = useState<string | null>(null);
  const [markerQuizAnswer, setMarkerQuizAnswer] = useState<string | null>(null);
  const [traceRevealed, setTraceRevealed] = useState(false);

  const getDevanagari = (id: string) => PHONEME_TO_DEVANAGARI[id] ?? id;
  const currentStep = LESSON_STEPS[lessonStep];
  const canNext = lessonStep < LESSON_STEPS.length - 1;
  const canPrev = lessonStep > 0;

  useEffect(() => {
    setRangeQuizAnswer(null);
    setMarkerQuizAnswer(null);
    setTraceRevealed(false);
  }, [lessonStep]);

  const renderInteractive = () => {
    const step = currentStep.interactive;
    if (!step) return null;

    if (step === "range-quiz") {
      const correct = "B, C, D";
      const options = ["B, C", "B, C, D", "B, C, D, E", "C, D"];
      return (
        <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30">
          <p className="text-sm font-medium mb-3">From B up to (but not including) E = ?</p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => setRangeQuizAnswer(opt)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  rangeQuizAnswer === opt
                    ? opt === correct
                      ? "border-emerald-600 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : "border-border hover:bg-accent"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          {rangeQuizAnswer && (
            <p className={cn("mt-3 text-sm", rangeQuizAnswer === correct ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400")}>
              {rangeQuizAnswer === correct ? "Correct! B, C, D — we stop before E." : `Answer: ${correct}. We include up to the letter before E.`}
            </p>
          )}
        </div>
      );
    }

    if (step === "marker-quiz") {
      const correct = "A, B, C";
      const options = ["A, B", "A, B, C", "A, B, C, D", "B, C"];
      return (
        <div className="mt-4 p-4 rounded-xl border border-border bg-muted/30">
          <p className="text-sm font-medium mb-3">From A up to before D (D is the marker) = ?</p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => setMarkerQuizAnswer(opt)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  markerQuizAnswer === opt
                    ? opt === correct
                      ? "border-emerald-600 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : "border-border hover:bg-accent"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          {markerQuizAnswer && (
            <p className={cn("mt-3 text-sm", markerQuizAnswer === correct ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400")}>
              {markerQuizAnswer === correct ? "Correct! D marks the fence — we stop before it." : `Answer: ${correct}. We include up to the letter before D.`}
            </p>
          )}
        </div>
      );
    }

    if (step === "sound-order") {
      return (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 font-mono text-sm">
          <p className="text-xs text-muted-foreground mb-2">Vowels (first 9):</p>
          <p className="mb-3">a i u ṛ ḷ | e o | ai au</p>
          <p className="text-xs text-muted-foreground mb-1">Then semivowels: y r l v</p>
          <p className="text-xs text-muted-foreground">Then consonants (k, c, ṭ, t, p… by place)</p>
        </div>
      );
    }

    if (step === "shiva-preview") {
      return (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 font-mono text-sm space-y-2">
          <p className="text-xs text-muted-foreground mb-2">First 4 lines (vowels):</p>
          {SHIVA_SUTRAS_LINES.slice(0, 4).map((line, i) => (
            <div key={i} className="flex flex-wrap items-baseline gap-2">
              <span className="text-primary">{line.dev}</span>
              <span className="text-muted-foreground">→</span>
              <span>{line.roman}</span>
              <span className="text-xs text-muted-foreground">(marker: {line.marker})</span>
            </div>
          ))}
        </div>
      );
    }

    if (step === "trace-ac") {
      return (
        <div className="mt-4 space-y-2">
          <button
            onClick={() => setTraceRevealed(!traceRevealed)}
            className="px-4 py-2 rounded-lg bg-primary/20 text-primary font-medium hover:bg-primary/30 text-sm"
          >
            {traceRevealed ? "Hide" : "Reveal"} range
          </button>
          {traceRevealed && (
            <div className="p-4 rounded-lg border border-primary/50 bg-primary/5 space-y-2">
              {SHIVA_SUTRAS_LINES.slice(0, 4).map((line, i) => (
                <div key={i} className="flex flex-wrap items-baseline gap-2 font-mono text-sm">
                  <span className="text-primary">{line.dev}</span>
                  <span className="text-muted-foreground">{line.roman}</span>
                  <span className="text-xs text-muted-foreground">
                    {i === 0 ? "↑ ac starts here (a)" : ""}
                    {i === 3 ? "↑ ac ends before c" : ""}
                  </span>
                </div>
              ))}
              <p className="text-sm pt-2">
                <strong>ac</strong> = अ इ उ ऋ लृ ए ओ ऐ औ (all vowels)
              </p>
            </div>
          )}
        </div>
      );
    }

    if (step === "trace-ik") {
      // ik = from i to marker k (lines 1-2), so i u ṛ ḷ
      return (
        <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
          <p className="text-sm font-medium mb-2">ik = from इ (i) to marker क (k)</p>
          <div className="font-mono text-sm space-y-1 opacity-90">
            <div>Line 1: अ इ उ ण् (a i u) — i is here</div>
            <div>Line 2: ऋ लृ क् (ṛ lṛ k) — k marks the cut</div>
          </div>
          <p className="text-sm mt-3">
            <strong>ik</strong> = इ उ ऋ लृ (i, u, ṛ, ḷ) — the four vowels that take guṇa.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pratyāhāras</h1>
        <p className="text-muted-foreground">
          Short codes for groups of sounds. Learn the concept, then practice.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ZoneGate zoneId="compression" />
          {!showDrill && (
            <button
              onClick={() => setShowDrill(true)}
              className="text-sm text-primary hover:underline"
            >
              Skip to drills →
            </button>
          )}
        </div>
      </div>

      {/* Lesson: step-by-step from first principles */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Lesson {lessonStep + 1} of {LESSON_STEPS.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setLessonStep((s) => Math.max(0, s - 1))}
              disabled={!canPrev}
              className="px-3 py-1 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              ← Prev
            </button>
            <button
              onClick={() => setLessonStep((s) => Math.min(LESSON_STEPS.length - 1, s + 1))}
              disabled={!canNext}
              className="px-3 py-1 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              Next →
            </button>
          </div>
        </div>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-3">{currentStep.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{currentStep.body}</p>
          {renderInteractive()}
        </div>
        {lessonStep === LESSON_STEPS.length - 1 && (
          <div className="px-6 pb-6">
            <button
              onClick={() => setShowDrill(true)}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
            >
              Practice with drills →
            </button>
          </div>
        )}
      </div>

      {/* Drills - same structure as GunaDrill */}
      {showDrill && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Drills</h2>
          <p className="text-muted-foreground text-sm">
            Decode: what does a pratyāhāra mean? Encode: which pratyāhāra fits the description?
          </p>
          <PratyaharaDrill pratyaharas={pratyaharas} getDevanagari={getDevanagari} />
        </div>
      )}

      {/* Reference: Shiva Sutras + full list (like Explore mode) */}
      <div>
        <button
          onClick={() => setShowReference(!showReference)}
          className="text-primary hover:underline font-medium"
        >
          {showReference ? "Hide" : "Show"} reference: Shiva Sutras & full list
        </button>
        {showReference && (
          <div className="mt-4 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-2">Shiva Sutras</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Each line: Devanagari | Roman (IAST) | marker cuts here. Pick a pratyāhāra below to see its range.
              </p>
              <div className="space-y-2 font-mono text-sm">
                {SHIVA_SUTRAS_LINES.map((line, i) => {
                  const lineNum = i + 1;
                  const markerLine = selected ? MARKER_TO_LINE[selected.marker] : 0;
                  const isInRange = selected && selected.sura <= lineNum && lineNum <= markerLine;
                  const isMarkerLine = selected?.marker === line.marker;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5 px-2 rounded",
                        isInRange && "bg-primary/10",
                        isMarkerLine && "ring-1 ring-primary/30"
                      )}
                    >
                      <span className="text-primary">{line.dev}</span>
                      <span className="text-muted-foreground">{line.roman}</span>
                      <span className="text-xs text-muted-foreground">
                        marker: {line.marker}
                        {isMarkerLine && ` ← ${selected.id} ends before this`}
                      </span>
                    </div>
                  );
                })}
              </div>
              {selected && (
                <div className="mt-4 p-3 rounded-lg bg-primary/10 text-sm">
                  <strong>{selected.id}</strong> = {selected.explanation}<br />
                  <span className="text-muted-foreground">Starts line {selected.sura}, ends before marker {selected.marker} (line {MARKER_TO_LINE[selected.marker] ?? "?"}).</span> Sounds: {selected.result.map(getDevanagari).join(" ")}
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pratyaharas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={cn(
                    "text-left p-4 rounded-xl border transition-all",
                    selected?.id === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <span className="font-mono font-semibold">{p.id}</span>
                  <p className="text-muted-foreground text-sm mt-1">{p.explanation}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.result.slice(0, 6).map((id) => (
                      <span key={id} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {getDevanagari(id)}
                      </span>
                    ))}
                    {p.result.length > 6 && (
                      <span className="text-xs text-muted-foreground">+{p.result.length - 6}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {selected && (
              <div className="rounded-xl border border-primary p-6 bg-primary/5">
                <h3 className="font-mono font-semibold mb-2">{selected.id}</h3>
                <p className="text-muted-foreground mb-2">{selected.explanation}</p>
                <div className="flex flex-wrap gap-2">
                  {selected.result.map((id) => (
                    <span key={id} className="px-2 py-1 rounded bg-background border text-sm">
                      {getDevanagari(id)} <span className="text-muted-foreground text-xs">{id}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Link href="/" className="text-primary hover:underline">← Back</Link>
        <Link href="/learn/phonetics/" className="text-primary hover:underline">Next: Phonemes →</Link>
      </div>
    </div>
  );
}
