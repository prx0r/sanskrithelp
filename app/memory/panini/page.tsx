"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shuffle, Check, X } from "lucide-react";

/** Pāṇini-flavoured compression tools for memorising the Sanskrit system. */

const PLACES = [
  { id: "kaṇṭhya", skt: "कण्ठ्य", en: "throat / velar", letters: "क ख ग घ ङ" },
  { id: "tālavya", skt: "तालव्य", en: "palate", letters: "च छ ज झ ञ" },
  { id: "mūrdhanya", skt: "मूर्धन्य", en: "retroflex", letters: "ट ठ ड ढ ण" },
  { id: "dantya", skt: "दन्त्य", en: "dental", letters: "त थ द ध न" },
  { id: "oṣṭhya", skt: "ओष्ठ्य", en: "lips", letters: "प फ ब भ म" },
];

const MANNERS = [
  { short: "V", en: "voiceless unaspirated" },
  { short: "Kh", en: "voiceless aspirated" },
  { short: "G", en: "voiced" },
  { short: "Gh", en: "voiced aspirated" },
  { short: "N", en: "nasal" },
];

const VARGAS: Record<string, string[]> = {
  kaṇṭhya: ["ka", "kha", "ga", "gha", "ṅa"],
  tālavya: ["ca", "cha", "ja", "jha", "ña"],
  mūrdhanya: ["ṭa", "ṭha", "ḍa", "ḍha", "ṇa"],
  dantya: ["ta", "tha", "da", "dha", "na"],
  oṣṭhya: ["pa", "pha", "ba", "bha", "ma"],
};

const DEV: Record<string, string> = {
  ka: "क", kha: "ख", ga: "ग", gha: "घ", "ṅa": "ङ",
  ca: "च", cha: "छ", ja: "ज", jha: "झ", "ña": "ञ",
  "ṭa": "ट", "ṭha": "ठ", "ḍa": "ड", "ḍha": "ढ", "ṇa": "ण",
  ta: "त", tha: "थ", da: "द", dha: "ध", na: "न",
  pa: "प", pha: "फ", ba: "ब", bha: "भ", ma: "म",
};

const VOWELS = ["a","ā","i","ī","u","ū","ṛ","ṝ","ḷ","ḹ","e","ai","o","au","aṃ","aḥ"];

const VOWEL_LOCUS: Record<string, string> = {
  a: "forehead", ā: "mouth/face", i: "right eye", ī: "left eye",
  u: "right ear", ū: "left ear", ṛ: "right nostril", ṝ: "left nostril",
  ḷ: "right cheek", ḹ: "left cheek", e: "lower teeth", ai: "upper teeth",
  o: "lower lip", au: "upper lip", aṃ: "crown", aḥ: "tongue",
};

const PRATYAHARAS = [
  { code: "aṭ", expands: ["a", "ā", "i", "ī", "u", "ū", "ṛ", "ṝ", "ḷ", "ḹ", "e", "ai", "o", "au", "aṃ", "aḥ"], note: "all vowels" },
  { code: "ka", expands: ["ka", "kha", "ga", "gha", "ṅa"], note: "gutturals" },
  { code: "ca", expands: ["ca", "cha", "ja", "jha", "ña"], note: "palatals" },
  { code: "ṭa", expands: ["ṭa", "ṭha", "ḍa", "ḍha", "ṇa"], note: "retroflex" },
  { code: "ta", expands: ["ta", "tha", "da", "dha", "na"], note: "dentals" },
  { code: "pa", expands: ["pa", "pha", "ba", "bha", "ma"], note: "labials" },
  { code: "ya", expands: ["ya", "ra", "la", "va"], note: "semivowels" },
  { code: "śa", expands: ["śa", "ṣa", "sa", "ha"], note: "sibilants" },
];

const MALINI = "na ṛ ṝ ḷ ḹ tha ca dha ī ṇa u ū ba ka kha ga gha ṅa i a va bha ya ḍa ḍha ṭha jha ña ja ra ṭa pa cha la ā sa aḥ ha ṣa kṣa ma śa aṃ ta e ai o au da pha".split(" ");

type Mode = "wheel" | "pratyahara" | "malini" | "locus";

export default function MemoryPaniniPage() {
  const [mode, setMode] = useState<Mode>("wheel");
  const [place, setPlace] = useState("kaṇṭhya");
  const [phIndex, setPhIndex] = useState(0);
  const [prIndex, setPrIndex] = useState(0);
  const [malIndex, setMalIndex] = useState(0);
  const [quizPlace, setQuizPlace] = useState<"kaṇṭhya"|"tālavya"|"mūrdhanya"|"dantya"|"oṣṭhya">("kaṇṭhya");
  const [quizManner, setQuizManner] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [score, setScore] = useState({ ok: 0, miss: 0 });

  const currentVarga = VARGAS[place];
  const ph = currentVarga[phIndex];
  const pr = PRATYAHARAS[prIndex];
  const malPh = MALINI[malIndex];
  const quizPh = VARGAS[quizPlace][quizManner];

  const placeChoices = useMemo(() => PLACES.map(p => p.id), []);

  function answerVarga(p: string) {
    if (p === quizPlace) {
      setAnswered("correct");
      setScore(s => ({ ...s, ok: s.ok + 1 }));
    } else {
      setAnswered("wrong");
      setScore(s => ({ ...s, miss: s.miss + 1 }));
    }
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
        <h1 className="font-display text-3xl font-bold mb-1">Pāṇini Machine</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Compress the system with its own grammar: <strong className="text-foreground">varṇamālā</strong> 5×5,
          <strong className="text-foreground"> pratyāhāra</strong> expanders, Mālinī order, locus quiz.
          Memorise structure — not isolated letters.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ["wheel", "5×5 wheel"],
          ["pratyahara", "Pratyāhāra"],
          ["malini", "Mālinī order"],
          ["locus", "Locus quiz"],
        ] as [Mode, string][]).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`px-3 py-2 rounded-lg text-sm border ${mode === id ? "border-primary text-primary" : "border-border"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "wheel" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {PLACES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setPlace(p.id); setPhIndex(0); }}
                className={`px-3 py-2 rounded-lg text-sm border ${place === p.id ? "border-primary text-primary" : "border-border"}`}
              >
                {p.en}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            {PLACES.find(p => p.id === place)?.skt} · {PLACES.find(p => p.id === place)?.letters}
          </p>
          <div className="text-center py-6">
            <div className="text-5xl text-primary font-display mb-2">{DEV[ph] ?? ph}</div>
            <div className="text-xl">{ph}</div>
            <div className="text-sm text-muted-foreground mt-1">
              manner {phIndex + 1}/5 · {MANNERS[phIndex].en}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {currentVarga.map((letter, i) => (
              <button
                key={letter}
                type="button"
                onClick={() => setPhIndex(i)}
                className={`p-2 rounded-lg border text-center ${i === phIndex ? "border-primary text-primary" : "border-border"}`}
              >
                <div className="text-lg">{DEV[letter]}</div>
                <div className="text-xs">{letter}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-5 gap-1 text-center text-xs text-muted-foreground">
            {MANNERS.map((m) => (
              <div key={m.short} className="p-2 rounded bg-background border border-border">
                <div className="text-primary font-medium">{m.short}</div>
                {m.en.split(" ")[0]}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Rotate place × manner → generate the varga. You are learning a 5×5 instrument in the mouth.
          </p>
        </div>
      )}

      {mode === "pratyahara" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Pāṇini compression: one code expands to a class. Say the code, then expand.
          </p>
          <div className="text-center py-4">
            <div className="text-5xl text-primary font-display">{pr.code}</div>
            <div className="text-sm text-muted-foreground mt-1">{pr.note}</div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {pr.expands.map((e) => (
              <span key={e} className="px-2 py-1 rounded bg-background border border-border text-sm">
                {DEV[e] ?? ""} {e}
              </span>
            ))}
          </div>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => { setPrIndex((i) => (i - 1 + PRATYAHARAS.length) % PRATYAHARAS.length); }}
              className="px-3 py-2 rounded-lg border border-border text-sm"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPrIndex((i) => (i + 1) % PRATYAHARAS.length)}
              className="px-3 py-2 rounded-lg border border-border text-sm"
            >
              Next pratyāhāra
            </button>
          </div>
        </div>
      )}

      {mode === "malini" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Mālinī order (MV 3.37–41) — bhinna-yoni. Learn after Mātṛkā is stable. na → pha.
          </p>
          <div className="text-center py-4">
            <div className="text-2xl text-primary">
              {malIndex + 1} / {MALINI.length}
            </div>
            <div className="text-4xl font-display mt-2">{malPh}</div>
          </div>
          <div className="flex flex-wrap gap-1 justify-center mb-4 max-h-40 overflow-y-auto p-2">
            {MALINI.map((p, i) => (
              <button
                key={p + i}
                type="button"
                onClick={() => setMalIndex(i)}
                className={`px-2 py-1 rounded text-xs border ${i === malIndex ? "border-primary text-primary" : "border-border"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => setMalIndex((i) => (i - 1 + MALINI.length) % MALINI.length)}
              className="px-3 py-2 rounded-lg border border-border text-sm"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setMalIndex((i) => (i + 1) % MALINI.length)}
              className="px-3 py-2 rounded-lg border border-border text-sm"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setMalIndex(Math.floor(Math.random() * MALINI.length))}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm"
            >
              <Shuffle className="w-3 h-3" /> Random
            </button>
          </div>
        </div>
      )}

      {mode === "locus" && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Where does this varga phoneme sit in the Mātṛkā body map?
          </p>
          <div className="text-center py-3">
            <div className="text-5xl text-primary font-display">{DEV[quizPh]}</div>
            <div className="text-xl">{quizPh}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {placeChoices.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => answerVarga(p)}
                className="p-3 rounded-lg border border-border text-sm hover:bg-accent"
              >
                {PLACES.find(x => x.id === p)?.en}
              </button>
            ))}
          </div>
          {answered === "correct" && (
            <p className="text-sm text-green-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> Correct — {quizPlace}
            </p>
          )}
          {answered === "wrong" && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <X className="w-4 h-4" /> {quizPh} sits in <strong>{quizPlace}</strong>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Score: {score.ok} ok · {score.miss} miss
          </p>
          <button
            type="button"
            onClick={() => {
              const places = placeChoices;
              const p = places[Math.floor(Math.random() * places.length)];
              const list = VARGAS[p];
              setQuizPlace(p as typeof quizPlace);
              setQuizManner(Math.floor(Math.random() * list.length));
              setAnswered(null);
            }}
            className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
          >
            New question
          </button>
          <div className="mt-4 text-xs text-muted-foreground">
            Vowels (head/face) drill separately in Nyāsa — not on this quiz.
            Vowel loci: {VOWELS.slice(0, 4).map(v => `${v}=${VOWEL_LOCUS[v]}`).join(" · ")}…
          </div>
        </div>
      )}

      <section className="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <h2 className="text-sm font-medium text-foreground mb-2">How Pāṇini plugs into Memory</h2>
        <ul className="space-y-1 list-disc pl-5">
          <li><strong className="text-foreground">Pratyāhāra</strong> = compression codes (aṭ, ka, ca…) — memorise classes, not 50 isolated letters.</li>
          <li><strong className="text-foreground">Varga geometry</strong> = 5 places × 5 manners — the instrument in the mouth.</li>
          <li><strong className="text-foreground">Sandhi</strong> later = felt transformation of articulations, not rule cards.</li>
          <li><strong className="text-foreground">Bruno wheels</strong> add dual coordinates + imaginal signatures on top.</li>
          <li><strong className="text-foreground">Nyāsa</strong> installs the same phonemes on the body (Abhinavagupta/Trika OS).</li>
        </ul>
      </section>
    </div>
  );
}
