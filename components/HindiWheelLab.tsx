"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CHUNKS,
  HINDI_FRAMES,
  HINDI_SOUND_EXTENSIONS,
  HINDI_SUBJECTS,
  HINDI_TIMES,
  HINDI_VERBS,
  KUMBH_DOMAINS,
  KUMBH_PHRASES,
  MINIMAL_PAIRS,
  NEIGHBOURHOODS,
  PALACE_WORLDS,
  PI_ITEMS,
  SCHWA_DRILLS,
  compileHindiSentence,
  type HindiComplement,
} from "@/lib/memory/hindiPresets";
import { decompileHindi } from "@/lib/memory/hindiDecompile";
import { speakHindi } from "@/lib/hindi/speak";
import { type TutorTurn, type TutorWorldState } from "@/lib/voice-tutor/provider";
import { QwenProvider } from "@/lib/voice-tutor/qwen";
import { logTurn } from "@/lib/voice-tutor/recordTurn";
import { HINDI_EXEMPLARS, HINDI_ISLANDS, HINDI_MACHINES } from "@/lib/constructicon/hindiMachines";
import { rankMachines } from "@/lib/constructicon/types";
import { RotateCcw, Shuffle, Volume2 } from "lucide-react";

type MatrikaSound = {
  id: string;
  dev: string;
  iast: string;
  group: string;
  art: string;
  artCode: string;
  locus: string;
  locusCode: string;
  dhvani: string;
};

type Ring = {
  id: string;
  label: string;
  items: readonly { id: string; label: string; gloss?: string }[];
};

function point(cx: number, cy: number, r: number, a: number) {
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

function ConcentricWheel({
  rings,
  selections,
  centreTop,
  centreBottom,
}: {
  rings: readonly Ring[];
  selections: Record<string, number>;
  centreTop: string;
  centreBottom: string;
}) {
  const cx = 300;
  const cy = 300;
  const maxR = 268;
  const ringWidth = Math.max(42, 195 / Math.max(rings.length, 1));

  return (
    <svg viewBox="0 0 600 600" className="w-full max-w-[680px] mx-auto select-none">
      <circle cx={cx} cy={cy} r={maxR + 8} fill="none" stroke="currentColor" opacity=".15" />
      {rings.map((ring, ri) => {
        const r = maxR - ri * ringWidth;
        const inner = r - ringWidth + 8;
        return (
          <g key={ring.id}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" opacity=".25" />
            <circle cx={cx} cy={cy} r={inner} fill="none" stroke="currentColor" opacity=".12" />
            {ring.items.map((item, i) => {
              const a = -Math.PI / 2 + (i / ring.items.length) * Math.PI * 2;
              const p1 = point(cx, cy, inner, a);
              const p2 = point(cx, cy, r, a);
              const lp = point(cx, cy, inner + ringWidth * 0.48, a);
              const selected = (selections[ring.id] ?? 0) === i;
              const shown =
                item.label.length > 14 ? `${item.label.slice(0, 13)}…` : item.label;
              return (
                <g key={item.id}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="currentColor"
                    opacity=".13"
                  />
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={selected ? 13 : 10}
                    fontWeight={selected ? 700 : 400}
                    fill="currentColor"
                    opacity={selected ? 1 : 0.5}
                  >
                    {shown}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="52" fill="currentColor" opacity=".07" />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="currentColor"
        fontSize="12"
        opacity=".62"
      >
        {centreTop}
      </text>
      <text
        x={cx}
        y={cy + 15}
        textAnchor="middle"
        fill="currentColor"
        fontSize="15"
        fontWeight="700"
      >
        {centreBottom}
      </text>
    </svg>
  );
}

function Selector({
  title,
  label,
  gloss,
  onPrev,
  onNext,
}: {
  title: string;
  label: string;
  gloss?: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-lg font-semibold mt-1">{label || "—"}</div>
      {gloss && <div className="text-sm text-muted-foreground">{gloss}</div>}
      <div className="flex gap-2 mt-3">
        <button className="px-3 py-1 border rounded" onClick={onPrev}>
          ←
        </button>
        <button className="px-3 py-1 border rounded" onClick={onNext}>
          →
        </button>
      </div>
    </div>
  );
}

function cycle(i: number, delta: number, n: number) {
  return (i + delta + n) % n;
}

const STRANDS = ["input", "output", "study", "fluency"] as const;

function loadStrands(): Record<string, number> {
  try {
    const raw = localStorage.getItem("hindi-strands");
    if (raw) return { input: 0, output: 0, study: 0, fluency: 0, ...JSON.parse(raw) };
  } catch {}
  return { input: 0, output: 0, study: 0, fluency: 0 };
}

function StrandBar() {
  const [secs, setSecs] = useState<Record<string, number>>(loadStrands);
  const [active, setActive] = useState<string | null>(null);
  const [fluCount, setFluCount] = useState(0);
  const [fluSent, setFluSent] = useState("");
  const t0 = useMemo(() => ({ v: 0 }), []);

  function stop() {
    if (active) {
      const add = Math.floor((Date.now() - t0.v) / 1000);
      setSecs((s) => {
        const n = { ...s, [active]: (s[active] || 0) + add };
        try { localStorage.setItem("hindi-strands", JSON.stringify(n)); } catch {}
        return n;
      });
      setActive(null);
    }
  }
  function start(s: string) {
    stop();
    t0.v = Date.now();
    setActive(s);
  }
  function newFluSent() {
    const sub = HINDI_SUBJECTS[Math.floor(Math.random() * HINDI_SUBJECTS.length)];
    const vb = HINDI_VERBS[Math.floor(Math.random() * HINDI_VERBS.length)];
    const cp = vb.complements[Math.floor(Math.random() * vb.complements.length)];
    const fr = HINDI_FRAMES[Math.floor(Math.random() * 2)];
    setFluSent(compileHindiSentence(sub, fr, vb, cp, HINDI_TIMES[0]).hindi);
  }
  const nudge = secs.study > 1200 && secs.output < 300;
  return (
    <section className="rounded-xl border border-border bg-card p-3 text-sm">
      <span className="text-xs text-muted-foreground mr-2">FOUR STRANDS · Nation balance</span>
      {STRANDS.map((s) => (
        <button key={s} onClick={() => (active === s ? stop() : start(s))}
          className={`px-2 py-1 border rounded text-xs mr-1 ${active === s ? "border-primary text-primary" : ""}`}>
          {s} {Math.floor((secs[s] || 0) / 60)}m
        </button>
      ))}
      <button onClick={() => { newFluSent(); setFluCount(0); start("fluency"); }}
        className="px-2 py-1 border rounded text-xs mr-1">⚡ fluency run</button>
      {active === "fluency" && fluSent && (
        <span className="ml-2">
          <strong>{fluSent}</strong>
          <button onClick={() => { setFluCount((c) => c + 1); newFluSent(); }}
            className="ml-2 px-2 py-1 border rounded text-xs">said it ✓ ({fluCount})</button>
        </span>
      )}
      {nudge && <div className="mt-2 text-amber-400 text-xs">Stop analyzing. Conversation mode — only installed machines.</div>}
    </section>
  );
}

const FAMILY_MAP: Record<string, { id: string; label: string }> = {
  vowels: { id: "vowels", label: "VOWELS" },
  "ka-varga": { id: "ka-varga", label: "VELAR" },
  "ca-varga": { id: "ca-varga", label: "PALATAL" },
  "tta-varga": { id: "tta-varga", label: "RETROFLEX" },
  "ta-varga": { id: "ta-varga", label: "DENTAL" },
  "pa-varga": { id: "pa-varga", label: "LABIAL" },
  deep: { id: "deep", label: "SONORANT / SIBILANT" },
};

export default function HindiWheelLab() {
  const [mode, setMode] = useState<"sound" | "sentence" | "kumbh" | "discriminate" | "chunks" | "decompile" | "palace" | "notice" | "machines" | "talk">("sentence");
  const [revealed, setRevealed] = useState(false);

  // Sound bridge
  const [matrika, setMatrika] = useState<MatrikaSound[]>([]);
  const [familyIdx, setFamilyIdx] = useState(0);
  const [soundIdx, setSoundIdx] = useState(0);
  const [soundSource, setSoundSource] = useState<"matrika" | "hindi">("matrika");
  const [schwaIdx, setSchwaIdx] = useState(0);

  // Sentence compiler
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [frameIdx, setFrameIdx] = useState(1);
  const [verbIdx, setVerbIdx] = useState(0);
  const [compIdx, setCompIdx] = useState(0);
  const [timeIdx, setTimeIdx] = useState(0);

  // Kumbh phrase wheel
  const [domainIdx, setDomainIdx] = useState(2);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [rehearse, setRehearse] = useState<"fwd" | "rev" | "shuffle">("fwd");

  // AwesomeVision drills
  const [pairIdx, setPairIdx] = useState(0);
  const [pairTarget, setPairTarget] = useState<"a" | "b">("a");
  const [pairGuess, setPairGuess] = useState<"a" | "b" | null>(null);
  const [hoodIdx, setHoodIdx] = useState(0);
  const [chunkIdx, setChunkIdx] = useState(0);
  const [fillerIdx, setFillerIdx] = useState(0);
  const [decompInput, setDecompInput] = useState("क्या मैं आपके साथ अभ्यास कर सकता हूँ?");
  const [palaceIdx, setPalaceIdx] = useState(0);
  const [piIdx, setPiIdx] = useState(0);
  const [piPick, setPiPick] = useState<0 | 1 | null>(null);
  const [talkState, setTalkState] = useState<"idle" | "live" | "blocked">("idle");
  const [talkLog, setTalkLog] = useState<TutorTurn[]>([]);
  const [talkMsg, setTalkMsg] = useState("");
  const [demoOn, setDemoOn] = useState(false);
  const [demoTurn, setDemoTurn] = useState(0);

  type SRWindow = Window & {
    webkitSpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start(): void;
      stop(): void;
    };
  };

  function demoListen() {
    const W = window as unknown as SRWindow;
    const SR = W.webkitSpeechRecognition;
    if (!SR) {
      setTalkMsg("demo needs Chrome speech recognition");
      return;
    }
    const rec = new SR();
    rec.lang = "hi-IN";
    rec.interimResults = false;
    setTalkMsg("listening… speak Hindi");
    rec.onresult = (e) => {
      const text = String(e.results[0]?.[0]?.transcript ?? "").trim();
      if (!text) return;
      setTalkLog((l) => [...l.slice(-49), { role: "user", textHindi: text, at: new Date().toISOString() }]);
      import("@/lib/voice-tutor/demoTutor").then(({ demoTutorTurn }) => {
        const reply = demoTutorTurn(text, demoTurn);
        setDemoTurn((n) => n + 1);
        setTalkLog((l) => [...l.slice(-49), { role: "tutor", textHindi: reply.say, at: new Date().toISOString() }]);
        void speakHindi(reply.say);
      });
    };
    rec.onerror = () => setTalkMsg("mic error — try again");
    rec.onend = () => { if (demoOn) setTalkMsg("tap Talk to speak again"); };
    rec.start();
  }

  async function startTalk() {
    const world: TutorWorldState = {
      world: "Kumbh field Hindi + Śiva Sūtra study",
      sutra: "चैतन्यमात्मा",
      knownConstructions: [
        { id: "progressive", form: "मैं X कर रहा हूँ", meaning: "I am doing X" },
        { id: "ability", form: "मैं X कर सकता हूँ", meaning: "I can do X" },
        { id: "kiske", form: "आप किस X से हैं?", meaning: "which X are you from" },
      ],
      activeVocabCount: 120,
      recognizedVocabCount: 300,
    };
    let session: { wsUrl: string; prompt: string; voice: string };
    try {
      const r = await fetch("/api/voice-tutor/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backend: "qwen", worldState: world }),
      });
      const j = await r.json();
      if (!r.ok) {
        setTalkState("blocked");
        setTalkMsg(j.note ?? j.error ?? "voice tutor unavailable");
        return;
      }
      session = j;
    } catch {
      setTalkState("blocked");
      setTalkMsg("voice tutor route unreachable");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const actx = new AC({ sampleRate: 48000 });
      const prov = new QwenProvider(session.wsUrl, "");
      prov.onTranscript((t) => {
        setTalkLog((l) => [...l.slice(-49), t]);
      });
      const playCtx = new AC({ sampleRate: 24000 });
      let playAt = 0;
      prov.onAudio((pcm) => {
        const buf = playCtx.createBuffer(1, pcm.byteLength / 2, 24000);
        const d = buf.getChannelData(0);
        const v = new Int16Array(pcm);
        for (let i = 0; i < v.length; i++) d[i] = v[i] / 32768;
        const src = playCtx.createBufferSource();
        src.buffer = buf;
        src.connect(playCtx.destination);
        playAt = Math.max(playAt, playCtx.currentTime);
        src.start(playAt);
        playAt += buf.duration;
      });
      prov.onToolCall(async (name, args) => {
        if (name === "record_turn") {
          const { logTurn } = await import("@/lib/voice-tutor/recordTurn");
          const { result } = logTurn({}, args as { learner_text: string });
          return { ok: true, ...result } as Record<string, unknown>;
        }
        return { ok: false };
      });
      await prov.connect({ backend: "qwen" }, session.prompt);
      // NOTE: browser-direct Qwen auth is dev-only (no ephemeral tokens yet).
      // Mic capture: ScriptProcessor downsample to 16k mono PCM.
      const src = actx.createMediaStreamSource(stream);
      const proc = actx.createScriptProcessor(4096, 1, 1);
      proc.onaudioprocess = (e) => {
        const inp = e.inputBuffer.getChannelData(0);
        const out = new Int16Array(Math.floor(inp.length / 3));
        for (let i = 0; i < out.length; i++) {
          const s = Math.max(-1, Math.min(1, inp[i * 3] || 0));
          out[i] = s * 32767;
        }
        prov.sendAudioChunk(out.buffer as ArrayBuffer);
      };
      src.connect(proc);
      proc.connect(actx.destination);
      setTalkState("live");
      setTalkMsg("live — speak Hindi; server VAD detects turns");
    } catch {
      setTalkState("blocked");
      setTalkMsg("mic or connection failed");
    }
  }

  useEffect(() => {
    fetch("/memory/matrka-wheel/matrka-data.json")
      .then((r) => r.json())
      .then((data) => setMatrika(data))
      .catch(() => setMatrika([]));
  }, []);

  const families = useMemo(() => {
    const seen = new Set<string>();
    const base = matrika
      .map((x) => FAMILY_MAP[x.group])
      .filter(Boolean)
      .filter((x) => {
        if (seen.has(x.id)) return false;
        seen.add(x.id);
        return true;
      });
    return [...base, { id: "hindi-extension", label: "HINDI EXT." }];
  }, [matrika]);

  const currentFamily = families[familyIdx] ?? families[0];
  const currentBaseSounds = useMemo(() => {
    if (!currentFamily) return [];
    if (currentFamily.id === "hindi-extension") return [];
    return matrika.filter((x) => x.group === currentFamily.id);
  }, [currentFamily, matrika]);

  useEffect(() => {
    setSoundIdx(0);
    setSoundSource(currentFamily?.id === "hindi-extension" ? "hindi" : "matrika");
    setRevealed(false);
  }, [familyIdx, currentFamily?.id]);

  const baseSound = currentBaseSounds[soundIdx] ?? currentBaseSounds[0];
  const extSound = HINDI_SOUND_EXTENSIONS[soundIdx] ?? HINDI_SOUND_EXTENSIONS[0];

  const verb = HINDI_VERBS[verbIdx];
  const complements = verb.complements;
  const complement: HindiComplement = complements[compIdx] ?? complements[0];

  useEffect(() => {
    setCompIdx(0);
    setRevealed(false);
  }, [verbIdx]);

  const compiled = compileHindiSentence(
    HINDI_SUBJECTS[subjectIdx],
    HINDI_FRAMES[frameIdx],
    verb,
    complement,
    HINDI_TIMES[timeIdx]
  );

  const selectedDomain = KUMBH_DOMAINS[domainIdx];
  const domainPhrases = useMemo(() => {
    const list = KUMBH_PHRASES.filter((p) => p.domain === selectedDomain.id);
    if (rehearse === "rev") return [...list].reverse();
    if (rehearse === "shuffle") return [...list].sort(() => Math.random() - 0.5);
    return list;
  }, [selectedDomain, rehearse]);
  const phrase = domainPhrases[phraseIdx] ?? domainPhrases[0];

  useEffect(() => {
    setPhraseIdx(0);
    setRevealed(false);
  }, [domainIdx]);

  function resetReveal<T>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) {
    setRevealed(false);
    setter(value);
  }

  const sentenceRings: readonly Ring[] = [
    {
      id: "subject",
      label: "SUBJECT",
      items: HINDI_SUBJECTS.map((x) => ({ id: x.id, label: x.dev, gloss: x.en })),
    },
    {
      id: "frame",
      label: "FRAME",
      items: HINDI_FRAMES.map((x) => ({ id: x.id, label: x.label, gloss: x.en })),
    },
    {
      id: "verb",
      label: "VERB",
      items: HINDI_VERBS.map((x) => ({ id: x.id, label: x.infinitive, gloss: x.en })),
    },
    {
      id: "complement",
      label: "OBJECT / COMPLEMENT",
      items: complements.map((x) => ({ id: x.id, label: x.dev, gloss: x.en })),
    },
    {
      id: "time",
      label: "TIME / PLACE",
      items: HINDI_TIMES.map((x) => ({
        id: x.id,
        label: x.dev || "—",
        gloss: x.en || "none",
      })),
    },
  ];

  const sentenceSelections = {
    subject: subjectIdx,
    frame: frameIdx,
    verb: verbIdx,
    complement: compIdx,
    time: timeIdx,
  };

  const soundRings: readonly Ring[] = [
    {
      id: "family",
      label: "SOUND FAMILY",
      items: families.map((x) => ({ id: x.id, label: x.label })),
    },
    {
      id: "sound",
      label: "SOUND",
      items:
        currentFamily?.id === "hindi-extension"
          ? HINDI_SOUND_EXTENSIONS.map((x) => ({
              id: x.id,
              label: x.dev,
              gloss: x.roman,
            }))
          : currentBaseSounds.map((x) => ({
              id: x.id,
              label: x.dev,
              gloss: x.iast,
            })),
    },
  ];

  const kumbhRings: readonly Ring[] = [
    {
      id: "domain",
      label: "DOMAIN",
      items: KUMBH_DOMAINS.map((x) => ({ id: x.id, label: x.label })),
    },
    {
      id: "phrase",
      label: "PHRASE",
      items: domainPhrases.map((x) => ({
        id: x.id,
        label: x.dev,
        gloss: x.en,
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <StrandBar />
      <div className="flex flex-wrap gap-2">
        {([
          ["sentence", "Hindi Sentence Compiler"],
          ["sound", "Mātṛkā → Hindi Sound Bridge"],
          ["kumbh", "Kumbh Conversation Wheel"],
          ["discriminate", "Ear: Minimal Pairs"],
          ["chunks", "Chunks & Mutations"],
          ["decompile", "Decompile Audio→Wheels"],
          ["palace", "Palace Recall"],
          ["notice", "Notice the Cue"],
          ["machines", "Constructicon"],
          ["talk", "Talk (Live)"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setMode(id);
              setRevealed(false);
            }}
            className={`px-3 py-2 rounded-lg border text-sm ${
              mode === id
                ? "border-primary bg-primary/10"
                : "border-border bg-card"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "sentence" && (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Hindi Sentence Compiler</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Bruno-style combinatorics with a grammatical compiler underneath it.
              Rotate semantic dimensions; do not concatenate raw words.
            </p>
            <p className="text-sm mt-2">
              <strong>Prediction rule:</strong> read the selected rings, produce the
              Hindi aloud, then reveal.
            </p>
          </section>

          <div className="grid lg:grid-cols-[1fr_370px] gap-6">
            <div className="rounded-xl border border-border bg-card p-3">
              <ConcentricWheel
                rings={sentenceRings}
                selections={sentenceSelections}
                centreTop="BRUNO ×"
                centreBottom="HINDI"
              />
            </div>

            <div className="space-y-3">
              <Selector
                title="SUBJECT"
                label={HINDI_SUBJECTS[subjectIdx].dev}
                gloss={HINDI_SUBJECTS[subjectIdx].en}
                onPrev={() =>
                  resetReveal(
                    setSubjectIdx,
                    cycle(subjectIdx, -1, HINDI_SUBJECTS.length)
                  )
                }
                onNext={() =>
                  resetReveal(
                    setSubjectIdx,
                    cycle(subjectIdx, 1, HINDI_SUBJECTS.length)
                  )
                }
              />
              <Selector
                title="FRAME"
                label={HINDI_FRAMES[frameIdx].label}
                gloss={`${HINDI_FRAMES[frameIdx].en} · ${HINDI_FRAMES[frameIdx].note}`}
                onPrev={() =>
                  resetReveal(setFrameIdx, cycle(frameIdx, -1, HINDI_FRAMES.length))
                }
                onNext={() =>
                  resetReveal(setFrameIdx, cycle(frameIdx, 1, HINDI_FRAMES.length))
                }
              />
              <Selector
                title="VERB"
                label={verb.infinitive}
                gloss={verb.en}
                onPrev={() =>
                  resetReveal(setVerbIdx, cycle(verbIdx, -1, HINDI_VERBS.length))
                }
                onNext={() =>
                  resetReveal(setVerbIdx, cycle(verbIdx, 1, HINDI_VERBS.length))
                }
              />
              <Selector
                title="OBJECT / COMPLEMENT"
                label={complement.dev}
                gloss={complement.en}
                onPrev={() =>
                  resetReveal(setCompIdx, cycle(compIdx, -1, complements.length))
                }
                onNext={() =>
                  resetReveal(setCompIdx, cycle(compIdx, 1, complements.length))
                }
              />
              <Selector
                title="TIME / PLACE"
                label={HINDI_TIMES[timeIdx].dev || "—"}
                gloss={HINDI_TIMES[timeIdx].en || "none"}
                onPrev={() =>
                  resetReveal(setTimeIdx, cycle(timeIdx, -1, HINDI_TIMES.length))
                }
                onNext={() =>
                  resetReveal(setTimeIdx, cycle(timeIdx, 1, HINDI_TIMES.length))
                }
              />
            </div>
          </div>

          <section className="rounded-xl border border-primary/50 bg-primary/5 p-5">
            {!revealed ? (
              <div>
                <div className="text-xs text-muted-foreground mb-2">
                  PREDICT BEFORE REVEAL
                </div>
                <div className="text-sm text-muted-foreground">{compiled.english}</div>
                <button
                  className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                  onClick={() => setRevealed(true)}
                >
                  Reveal Hindi
                </button>
              </div>
            ) : (
              <div>
                <div className="text-3xl md:text-4xl font-semibold leading-relaxed">
                  {compiled.hindi}
                </div>
                <div className="mt-2 text-muted-foreground">{compiled.english}</div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {compiled.formula}
                </div>
                <button
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border"
                  onClick={() => speakHindi(compiled.hindi)}
                >
                  <Volume2 className="w-4 h-4" /> Speak
                </button>
              </div>
            )}
          </section>

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border"
              onClick={() => {
                setSubjectIdx(Math.floor(Math.random() * HINDI_SUBJECTS.length));
                setFrameIdx(Math.floor(Math.random() * HINDI_FRAMES.length));
                setVerbIdx(Math.floor(Math.random() * HINDI_VERBS.length));
                setTimeIdx(Math.floor(Math.random() * HINDI_TIMES.length));
                setCompIdx(0);
                setRevealed(false);
              }}
            >
              <Shuffle className="w-4 h-4" /> Random drill
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border"
              onClick={() => {
                setSubjectIdx(0);
                setFrameIdx(1);
                setVerbIdx(0);
                setCompIdx(0);
                setTimeIdx(0);
                setRevealed(false);
              }}
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </>
      )}

      {mode === "sound" && (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Mātṛkā → Hindi Sound Bridge</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Reuse the existing canonical Sanskrit sound/body data as the substrate.
              Hindi-only sounds are an overlay: they do not create invented tantric loci.
            </p>
          </section>

          <div className="grid lg:grid-cols-[1fr_370px] gap-6">
            <div className="rounded-xl border border-border bg-card p-3">
              <ConcentricWheel
                rings={soundRings}
                selections={{ family: familyIdx, sound: soundIdx }}
                centreTop="MĀTṚKĀ →"
                centreBottom="HINDI"
              />
            </div>

            <div className="space-y-3">
              <Selector
                title="SOUND FAMILY"
                label={currentFamily?.label || "loading"}
                onPrev={() => {
                  if (!families.length) return;
                  resetReveal(setFamilyIdx, cycle(familyIdx, -1, families.length));
                }}
                onNext={() => {
                  if (!families.length) return;
                  resetReveal(setFamilyIdx, cycle(familyIdx, 1, families.length));
                }}
              />
              <Selector
                title="SOUND"
                label={
                  currentFamily?.id === "hindi-extension"
                    ? extSound?.dev || "—"
                    : baseSound?.dev || "—"
                }
                gloss={
                  currentFamily?.id === "hindi-extension"
                    ? `${extSound?.roman || ""} · ${extSound?.ipa || ""}`
                    : baseSound?.iast
                }
                onPrev={() => {
                  const n =
                    currentFamily?.id === "hindi-extension"
                      ? HINDI_SOUND_EXTENSIONS.length
                      : currentBaseSounds.length;
                  if (!n) return;
                  resetReveal(setSoundIdx, cycle(soundIdx, -1, n));
                }}
                onNext={() => {
                  const n =
                    currentFamily?.id === "hindi-extension"
                      ? HINDI_SOUND_EXTENSIONS.length
                      : currentBaseSounds.length;
                  if (!n) return;
                  resetReveal(setSoundIdx, cycle(soundIdx, 1, n));
                }}
              />

              <div className="rounded-xl border border-border bg-card p-4">
                {currentFamily?.id === "hindi-extension" && extSound ? (
                  <>
                    <div className="text-5xl font-semibold">{extSound.dev}</div>
                    <div className="mt-2 text-sm">{extSound.articulation}</div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {extSound.note}
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      {extSound.examples.map((x) => (
                        <div key={x}>{x}</div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-primary">
                      Hindi overlay · no new nyāsa locus assigned
                    </div>
                  </>
                ) : baseSound ? (
                  <>
                    <div className="text-5xl font-semibold">{baseSound.dev}</div>
                    <div className="mt-1 text-lg">{baseSound.iast}</div>
                    <div className="mt-3 text-sm">{baseSound.art}</div>
                    <div className="text-sm text-muted-foreground">{baseSound.dhvani}</div>
                    <div className="mt-3 text-sm">
                      <span className="text-muted-foreground">Canonical Mātṛkā locus:</span>{" "}
                      <span className="text-primary">{baseSound.locus}</span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Keep this locus exactly as the Sanskrit source layer defines it.
                      Hindi reuses the sound; it does not rewrite the Trika map.
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">Loading Mātṛkā data…</div>
                )}
              </div>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">HINDI SCHWA DELETION DRILL</div>
            <div className="text-3xl font-semibold mt-2">{SCHWA_DRILLS[schwaIdx].dev}</div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">DO NOT READ MECHANICALLY AS</div>
                <div className="mt-1">{SCHWA_DRILLS[schwaIdx].careful}</div>
              </div>
              <div className="rounded-lg border border-primary/50 bg-primary/5 p-3">
                <div className="text-xs text-muted-foreground">LIVING HINDI TARGET</div>
                <div className="mt-1 font-semibold">{SCHWA_DRILLS[schwaIdx].spoken}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {SCHWA_DRILLS[schwaIdx].note}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setSchwaIdx(cycle(schwaIdx, -1, SCHWA_DRILLS.length))}
              >
                ←
              </button>
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setSchwaIdx(cycle(schwaIdx, 1, SCHWA_DRILLS.length))}
              >
                →
              </button>
              <button
                className="inline-flex items-center gap-2 px-3 py-1 border rounded"
                onClick={() => speakHindi(SCHWA_DRILLS[schwaIdx].dev)}
              >
                <Volume2 className="w-4 h-4" /> Speak
              </button>
            </div>
          </section>
        </>
      )}

      {mode === "kumbh" && phrase && (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Kumbh Conversation Wheel</h2>
            <p className="text-sm text-muted-foreground mt-1">
              High-value field Hindi: comprehension, teachers, practice, permission,
              and logistics. English prompt first; Hindi only after prediction.
            </p>
          </section>

          <div className="grid lg:grid-cols-[1fr_370px] gap-6">
            <div className="rounded-xl border border-border bg-card p-3">
              <ConcentricWheel
                rings={kumbhRings}
                selections={{ domain: domainIdx, phrase: phraseIdx }}
                centreTop="FIELD"
                centreBottom="HINDI"
              />
            </div>
            <div className="space-y-3">
              <Selector
                title="DOMAIN"
                label={selectedDomain.label}
                onPrev={() =>
                  resetReveal(setDomainIdx, cycle(domainIdx, -1, KUMBH_DOMAINS.length))
                }
                onNext={() =>
                  resetReveal(setDomainIdx, cycle(domainIdx, 1, KUMBH_DOMAINS.length))
                }
              />
              <Selector
                title="PHRASE"
                label={`#${phraseIdx + 1}`}
                gloss={phrase.en}
                onPrev={() =>
                  resetReveal(setPhraseIdx, cycle(phraseIdx, -1, domainPhrases.length))
                }
                onNext={() =>
                  resetReveal(setPhraseIdx, cycle(phraseIdx, 1, domainPhrases.length))
                }
              />
            </div>
          </div>

          <section className="rounded-xl border border-primary/50 bg-primary/5 p-5">
            {!revealed ? (
              <>
                <div className="text-xs text-muted-foreground">SAY THIS IN HINDI</div>
                <div className="text-xl mt-2">{phrase.en}</div>
                <button
                  className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                  onClick={() => setRevealed(true)}
                >
                  Reveal
                </button>
              </>
            ) : (
              <>
                <div className="text-3xl md:text-4xl font-semibold leading-relaxed">
                  {phrase.dev}
                </div>
                <div className="mt-2">{phrase.roman}</div>
                <div className="mt-2 text-muted-foreground">{phrase.en}</div>
                {phrase.note && (
                  <div className="mt-2 text-xs text-muted-foreground">{phrase.note}</div>
                )}
                <button
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border"
                  onClick={() => speakHindi(phrase.dev)}
                >
                  <Volume2 className="w-4 h-4" /> Speak
                </button>
              </>
            )}
          </section>

          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border"
            onClick={() => {
              const di = Math.floor(Math.random() * KUMBH_DOMAINS.length);
              setDomainIdx(di);
              setPhraseIdx(0);
              setRevealed(false);
            }}
          >
            <Shuffle className="w-4 h-4" /> Random domain
          </button>
          <div className="flex gap-2 items-center text-sm text-muted-foreground">
            <span>Recall order:</span>
            {(["fwd", "rev", "shuffle"] as const).map((r) => (
              <button
                key={r}
                className={`px-3 py-1 border rounded ${rehearse === r ? "border-primary text-primary" : ""}`}
                onClick={() => { setRehearse(r); setPhraseIdx(0); setRevealed(false); }}
              >
                {r === "fwd" ? "→ forward" : r === "rev" ? "← backward" : "⤨ stations"}
              </button>
            ))}
          </div>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border"
            onClick={() => speakHindi(phrase.dev)}
          >
            <Volume2 className="w-4 h-4" /> Hear first (audio-first recall)
          </button>
        </>
      )}

      {mode === "discriminate" && (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Ear First: Minimal Pairs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Wyner rule: hear the distinction before you reproduce it. Audio plays
              one sound, no text. Identify its wheel coordinate, then say it.
            </p>
          </section>
          <section className="rounded-xl border border-primary/50 bg-primary/5 p-5">
            <div className="text-xs text-muted-foreground mb-2">
              PAIR {pairIdx + 1}/{MINIMAL_PAIRS.length} · {MINIMAL_PAIRS[pairIdx].note}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                onClick={() => {
                  const t = Math.random() < 0.5 ? "a" : "b";
                  setPairTarget(t);
                  setPairGuess(null);
                  const s = MINIMAL_PAIRS[pairIdx][t].dev;
                  speakHindi(s);
                }}
              >
                <Volume2 className="w-4 h-4 inline mr-2" /> Play mystery sound
              </button>
              <button
                className="px-3 py-2 rounded-lg border border-border text-sm"
                onClick={() => { setPairIdx((pairIdx + 1) % MINIMAL_PAIRS.length); setPairGuess(null); }}
              >
                Next pair →
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {(["a", "b"] as const).map((side) => {
                const s = MINIMAL_PAIRS[pairIdx][side];
                const picked = pairGuess === side;
                const right = pairGuess && side === pairTarget;
                return (
                  <button
                    key={side}
                    onClick={() => setPairGuess(side)}
                    className={`p-4 rounded-xl border text-left ${picked ? (right ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10") : "border-border bg-card"}`}
                  >
                    <div className="text-4xl">{s.dev}</div>
                    <div className="text-sm mt-1">{s.coord}</div>
                    {pairGuess && <div className="text-xs mt-1 text-muted-foreground">{s.roman}</div>}
                  </button>
                );
              })}
            </div>
            {pairGuess && (
              <p className="text-sm mt-3">
                {pairGuess === pairTarget ? "✓ Correct — now say it aloud." : "✗ Listen again, then choose."}
              </p>
            )}
          </section>
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-2">DONER NEIGHBOURHOODS — one cues the next</div>
            <div className="flex gap-2 mb-3">
              {NEIGHBOURHOODS.map((n, i) => (
                <button key={n.id} onClick={() => setHoodIdx(i)}
                  className={`px-3 py-1 border rounded text-sm ${hoodIdx === i ? "border-primary text-primary" : ""}`}>
                  {n.shape}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {NEIGHBOURHOODS[hoodIdx].words.map((w) => (
                <button key={w.dev} onClick={() => speakHindi(w.dev)}
                  className="p-3 rounded-lg border border-border text-left hover:border-primary">
                  <span className="text-xl font-semibold">{w.dev}</span>
                  <span className="text-sm text-muted-foreground ml-2">{w.roman} · {w.en}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{NEIGHBOURHOODS[hoodIdx].note}</p>
          </section>
        </>
      )}

      {mode === "chunks" && (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Chunks, Not Bricks</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Formulaic sequences are the syllabus unit. Learn the template, mutate the slot.
            </p>
          </section>
          <section className="rounded-xl border border-primary/50 bg-primary/5 p-5">
            <div className="flex flex-wrap gap-2 mb-4">
              {CHUNKS.map((c, i) => (
                <button key={c.id} onClick={() => { setChunkIdx(i); setFillerIdx(0); setRevealed(false); }}
                  className={`px-3 py-2 rounded-lg border text-sm ${chunkIdx === i ? "border-primary text-primary" : "border-border"}`}>
                  {c.id}
                </button>
              ))}
            </div>
            {(() => {
              const c = CHUNKS[chunkIdx];
              const f = c.fillers[fillerIdx];
              const full = f ? c.frame.replace("____", f.dev) : c.frame;
              return (
                <>
                  <div className="text-xs text-muted-foreground">CLOZE — fill the frame aloud, then reveal</div>
                  <div className="text-3xl font-semibold mt-2">
                    {c.frame.split("____")[0]}
                    <span className="text-primary">…</span>
                    {c.frame.split("____")[1]}
                  </div>
                  {!revealed ? (
                    <button className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                      onClick={() => setRevealed(true)}>Reveal + mutate</button>
                  ) : (
                    <>
                      <div className="text-2xl mt-3 text-primary">{full}</div>
                      {f && <div className="text-sm text-muted-foreground mt-1">{f.roman} · {f.en}</div>}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {c.fillers.map((x, i) => (
                          <button key={x.dev} onClick={() => setFillerIdx(i)}
                            className={`px-3 py-1 border rounded text-sm ${fillerIdx === i ? "border-primary text-primary" : ""}`}>
                            {x.dev}
                          </button>
                        ))}
                        <button onClick={() => speakHindi(full)}
                          className="inline-flex items-center gap-2 px-3 py-1 border rounded text-sm">
                          <Volume2 className="w-4 h-4" /> Speak
                        </button>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">{c.note} · {c.en}</p>
                </>
              );
            })()}
          </section>
        </>
      )}

      {mode === "decompile" && (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Hear → Compile</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Paste or type Hindi. The deterministic decompiler snaps it to wheel state.
              Spans it cannot account for are listed honestly — that is where Stanza/LLM takes over.
            </p>
          </section>
          <section className="rounded-xl border border-primary/50 bg-primary/5 p-5">
            <textarea
              value={decompInput}
              onChange={(e) => setDecompInput(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-background p-3 text-xl"
            />
            {(() => {
              const d = decompileHindi(decompInput);
              return (
                <div className="mt-4 text-sm space-y-1">
                  <div><span className="text-muted-foreground">Speech act:</span> {d.question ? "yes/no question (क्या)" : "statement"}</div>
                  <div><span className="text-muted-foreground">Actor:</span> {d.subjectId ?? "—"}</div>
                  <div><span className="text-muted-foreground">Frame:</span> {d.frameId ?? "—"}</div>
                  <div><span className="text-muted-foreground">Verb:</span> {d.verbId ?? "—"}</div>
                  <div><span className="text-muted-foreground">Object:</span> {d.complement?.dev ?? "—"}</div>
                  <div><span className="text-muted-foreground">Time:</span> {d.timeId ?? "—"}</div>
                  {d.phraseId && <div><span className="text-muted-foreground">Known phrase:</span> {d.phraseId}</div>}
                  {d.unknown.length > 0 && (
                    <div className="text-amber-400">Beyond 4-frame grammar: {d.unknown.join(" · ")}</div>
                  )}
                </div>
              );
            })()}
          </section>
        </>
      )}

      {mode === "palace" && (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Sparse Palaces</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Max 3 stations per world. Anchor the hard word only — grammar reconstructs the rest.
              Drop the screen and walk it when ready.
            </p>
          </section>
          <div className="flex flex-wrap gap-2">
            {PALACE_WORLDS.map((w, i) => (
              <button key={w.id} onClick={() => { setPalaceIdx(i); setRevealed(false); }}
                className={`px-3 py-2 rounded-lg border text-sm ${palaceIdx === i ? "border-primary text-primary" : "border-border"}`}>
                {w.name}
              </button>
            ))}
          </div>
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="text-sm text-muted-foreground">{PALACE_WORLDS[palaceIdx].place} · {PALACE_WORLDS[palaceIdx].rule}</div>
            <div className="space-y-2 mt-3">
              {PALACE_WORLDS[palaceIdx].stations.map((s) => {
                const phrase = KUMBH_PHRASES.find((p) => p.id === s.phraseId);
                return (
                  <div key={s.phraseId} className="p-3 rounded-lg border border-border">
                    <div className="text-lg font-semibold">{s.anchor} <span className="text-sm font-normal text-muted-foreground">· {s.anchorEn}</span></div>
                    {!revealed ? (
                      <button className="mt-2 text-sm text-primary" onClick={() => setRevealed(true)}>
                        Recall the phrase →
                      </button>
                    ) : (
                      <div className="mt-1">
                        <div className="text-primary">{phrase?.dev}</div>
                        <div className="text-xs text-muted-foreground">{phrase?.roman}</div>
                        <button className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground" onClick={() => phrase && speakHindi(phrase.dev)}>
                          <Volume2 className="w-3 h-3" /> Hear
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {mode === "notice" && (
        <section className="rounded-xl border border-primary/50 bg-primary/5 p-5">
          <h2 className="text-xl font-semibold">Notice the Cue</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Processing Instruction: the answer hides inside the morphology. Hear it, decide, then check.
          </p>
          <div className="text-xs text-muted-foreground mb-2">ITEM {piIdx + 1}/{PI_ITEMS.length}</div>
          <button
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground mb-4"
            onClick={() => { setPiPick(null); speakHindi(PI_ITEMS[piIdx].audio); }}
          >
            <Volume2 className="w-4 h-4 inline mr-2" /> Play (no text shown)
          </button>
          <div className="text-lg mb-3">{PI_ITEMS[piIdx].question}</div>
          <div className="flex gap-2">
            {PI_ITEMS[piIdx].options.map((o, i) => (
              <button key={o} onClick={() => setPiPick(i as 0 | 1)}
                className={`px-4 py-2 rounded-lg border ${piPick === i ? (i === PI_ITEMS[piIdx].answer ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10") : "border-border"}`}>
                {o}
              </button>
            ))}
            <button onClick={() => { setPiIdx((piIdx + 1) % PI_ITEMS.length); setPiPick(null); }}
              className="px-3 py-2 rounded-lg border border-border text-sm">Next →</button>
          </div>
          {piPick !== null && (
            <p className="text-sm mt-3">
              {piPick === PI_ITEMS[piIdx].answer ? "✓ " : "✗ Listen once more. "}
              <span className="text-muted-foreground">{PI_ITEMS[piIdx].cue}</span>
            </p>
          )}
        </section>
      )}

      {mode === "machines" && (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-xl font-semibold">Constructicon</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Machines are the linguistic objects; wheels merely visualize them. Ranked by
              marginal coverage over our exemplars.
            </p>
          </section>
          {(() => {
            const ex = new Map(HINDI_EXEMPLARS.map((e) => [e.id, e.machineId] as [string, string]));
            const cover = HINDI_MACHINES.map((m) => ({
              id: m.id, coverage: 0, frequency: HINDI_EXEMPLARS.filter((e) => e.machineId === m.id).length,
              productivity: m.slots.length, usefulness: 1, complexity: m.slots.length + m.connections.length,
            }));
            const ranked = rankMachines(cover, ex, new Set());
            return (
              <>
                <section className="rounded-xl border border-primary/50 bg-primary/5 p-4 text-sm">
                  <strong>Next machine by coverage:</strong> {ranked[0]?.id} (gain {ranked[0]?.gain.toFixed(1)})
                </section>
                {HINDI_MACHINES.map((m) => (
                  <section key={m.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="font-semibold">{m.id} <span className="text-xs font-normal text-muted-foreground">· island {m.island}</span></div>
                    <div className="text-sm text-muted-foreground mt-1">{m.meaning}</div>
                    <div className="text-sm mt-2 font-mono">{m.form}</div>
                    <div className="text-xs mt-2 text-muted-foreground">
                      slots: {m.slots.map((s) => `${s.name}(${s.constraint})`).join(" · ") || "— (fixed chunk)"}
                    </div>
                    <div className="text-xs mt-1 text-muted-foreground">
                      examples: {m.examples.join(" / ")}
                    </div>
                    {m.connections.length > 0 && (
                      <div className="text-xs mt-1 text-primary">
                        → {m.connections.map((c) => `${c.relation} ${c.to}`).join(" · ")}
                      </div>
                    )}
                  </section>
                ))}

      <section className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                  Islands stay concrete first: {HINDI_ISLANDS.map((i) => `${i.id}(${i.anchor})`).join(" · ")}.
                  Abstract wheels unlock at exemplar counts, not before.
                </section>
              </>
            );
          })()}
        </>
      )}

      <section className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              {mode === "talk" && (
        <section className="rounded-xl border border-primary/50 bg-primary/5 p-5">
          <h2 className="text-xl font-semibold">Talk — Live Tutor (Qwen first backend)</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Constrained conversation: the tutor knows your installed machines and one target.
            Turns are scored through the deterministic grammar, not vibes.
          </p>
          {talkState === "idle" && (
            <>
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground mr-2" onClick={startTalk}>
                Start talking (Live)
              </button>
              <button
                className="px-4 py-2 rounded-lg border border-border"
                onClick={() => { setDemoOn(true); setTalkMsg("demo mode — scripted teacher, no key needed"); demoListen(); }}
              >
                Talk demo (no key)
              </button>
            </>
          )}
          {demoOn && talkState === "idle" && (
            <div className="mt-3 flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground" onClick={demoListen}>
                🎙 Talk
              </button>
              <button className="px-3 py-2 rounded-lg border border-border text-sm"
                onClick={() => { setDemoOn(false); setTalkMsg(""); }}>
                Stop demo
              </button>
            </div>
          )}
          {talkState === "blocked" && (
            <p className="text-sm text-amber-400">Blocked: {talkMsg}. Configure QWEN_API_KEY + relay (see docs/voice-tutor.md).</p>
          )}
          {talkState === "live" && (
            <p className="text-sm text-green-400">{talkMsg}</p>
          )}
          <div className="mt-4 space-y-2 max-h-64 overflow-auto">
            {talkLog.map((t, i) => (
              <div key={i} className={`text-sm p-2 rounded ${t.role === "user" ? "bg-card border border-border" : ""}`}>
                <span className="text-xs text-muted-foreground mr-2">{t.role === "user" ? "YOU" : "TUTOR"}</span>
                {t.textHindi}
              </div>
            ))}
          </div>
        </section>
      )}

      <strong className="text-foreground">Architecture:</strong> Sanskrit/Mātṛkā
        remains the canonical sound/body substrate. Hindi adds living pronunciation,
        a constrained grammar compiler, and field-language scenes. Bruno supplies the
        combinatorial interface; it does not supply linguistic claims.
      </section>
    </div>
  );
}
