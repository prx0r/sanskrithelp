"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";

interface Technique {
  name: string;
  ratio: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  cycle: number;
  rounds: number;
  instructions: string;
  effect: string;
  color: string;
}

const TECHNIQUES: Technique[] = [
  {
    name: "Nāḍī Śodhana",
    ratio: "1:4:2",
    inhale: 4, holdIn: 16, exhale: 8, holdOut: 0, cycle: 28, rounds: 5,
    instructions: "Sit with right hand in Vishnu mudra (thumb over right nostril, ring finger over left). Close right nostril, exhale left. Inhale left 4s. Close both, hold 16s (with mūla bandha + uḍḍīyāna bandha). Release right, exhale 8s. Inhale right 4s. Close both, hold 16s. Release left, exhale 8s. That is one round. The 1:4:2 ratio IS the tetrahedron: 1 (apex Śiva), 4 (the 4 faces), 2 (Euler characteristic V−E+F = 4−6+4 = 2).",
    effect: "Balances iḍā and piṅgalā, forces prāṇa into suṣumṇā. When both nostrils flow equally, duality ceases.",
    color: "#22c55e",
  },
  {
    name: "Sama Vṛtti (Box)",
    ratio: "1:1:1:1",
    inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, cycle: 16, rounds: 10,
    instructions: "Inhale 4s, hold full 4s, exhale 4s, hold empty 4s. Equal phases — the tetrahedron's 4 vertices in time. Use before any Mātṛkā practice to establish equanimity.",
    effect: "Calms the mind, establishes the 4-fold rhythm that mirrors the tetrahedron's structure.",
    color: "#3b82f6",
  },
  {
    name: "Green Core Breath",
    ratio: "4:8:8",
    inhale: 4, holdIn: 8, exhale: 8, holdOut: 0, cycle: 20, rounds: 5,
    instructions: "Inhale 4s into the heart center (Anāhata). Hold 8s — feel the green core at 550 nm. Exhale 8s from the heart. Visualize green light at the center of the chest during the hold. After the breath, chant 'ta tha da dha na' mentally at the heart.",
    effect: "Anchors awareness at the green core — the center of the tetrahedron where all 6 edges relax simultaneously.",
    color: "#22c55e",
  },
  {
    name: "KHPHREṄ — The Withdrawal Seed",
    ratio: "4:16:8",
    inhale: 4, holdIn: 16, exhale: 8, holdOut: 0, cycle: 28, rounds: 11,
    instructions: "Chant KHPHREṄ (क्ष्फ्रेṁ) on each exhalation. Inhale 4s, hold 16s feeling the mantra at the heart, exhale 8s vibrating KHPHREṄ aloud. 11 repetitions. This bīja forces consciousness out of the peripheral nāḍīs into suṣumṇā.",
    effect: "KHPHREṄ IS the withdrawal seed — from Earth (kṣa) back through the elements (ph, re) through the veil (ṁ). Dissolves any blockage.",
    color: "#ef4444",
  },
  {
    name: "The 5 Voids (Daśaśūnya)",
    ratio: "5:5:5",
    inhale: 5, holdIn: 5, exhale: 5, holdOut: 0, cycle: 15, rounds: 6,
    instructions: "Inhale, then follow awareness through 5 voids: (1) Heart — hypnagogic images, (2) Throat — dream narrative, (3) Palate — lucid awareness, (4) Above palate — dreamless awareness, (5) 12 fingers above head — pure consciousness. One void per breath cycle.",
    effect: "Dissolves the subtle body upward through the voids toward the dvādaśānta — the End of the Twelve.",
    color: "#a855f7",
  },
  {
    name: "SAUḤ Emission",
    ratio: "4:8:8",
    inhale: 4, holdIn: 8, exhale: 8, holdOut: 0, cycle: 20, rounds: 3,
    instructions: "Chant SAUḤ (सौः) on each exhalation. Inhale 4s, hold 8s, exhale 8s vibrating SAUḤ. 3 repetitions. S = sat (Śiva), AU = expansion (Śakti→Īśvara), Ḥ = emission (Śuddhavidyā). Opens the pure path.",
    effect: "SAUḤ IS the emission seed — 'I am Śiva.' Opens the field for practice.",
    color: "#f59e0b",
  },
  {
    name: "The Complete Bīja Sequence",
    ratio: "4:16:8",
    inhale: 4, holdIn: 16, exhale: 8, holdOut: 0, cycle: 28, rounds: 0,
    instructions: "A full sequence: (1) SAUḤ 3× — open the field. (2) YAṄ 7× — anchor at the green core (heart). (3) KHPHREṄ 11× — dissolve blockages. (4) Mālīnī 1× — dissolve all 36 tattvas from Earth to Śiva. (5) Sit in silence 2 min.",
    effect: "This IS the complete layayoga session. SAUḤ opens. YAṄ centers. KHPHREṄ dissolves. Mālīnī completes. Silence absorbs.",
    color: "#22c55e",
  },
];

export default function PracticePage() {
  const [activeTech, setActiveTech] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<"inhale" | "holdIn" | "exhale" | "holdOut" | "idle">("idle");
  const [phaseTime, setPhaseTime] = useState(0);
  const [round, setRound] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseStartRef = useRef(0);

  const tech = TECHNIQUES.find(t => t.name === activeTech);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startPractice(t: Technique) {
    setIsRunning(true);
    setRound(1);
    startPhase("inhale", t, 1);
  }

  function startPhase(p: "inhale" | "holdIn" | "exhale" | "holdOut", t: Technique, r: number) {
    setPhase(p);
    phaseStartRef.current = Date.now();
    setPhaseTime(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPhaseTime(Date.now() - phaseStartRef.current);
    }, 50);

    const duration = p === "inhale" ? t.inhale : p === "holdIn" ? t.holdIn : p === "exhale" ? t.exhale : t.holdOut;
    const ms = duration * 1000;

    setTimeout(() => {
      if (p === "inhale") {
        if (t.holdIn > 0) startPhase("holdIn", t, r);
        else startPhase("exhale", t, r);
      } else if (p === "holdIn") {
        startPhase("exhale", t, r);
      } else if (p === "exhale") {
        if (t.holdOut > 0) startPhase("holdOut", t, r);
        else if (r < t.rounds || t.rounds === 0) startPractice(t);
        else finishPractice();
      } else if (p === "holdOut") {
        if (r < t.rounds || t.rounds === 0) startPractice(t);
        else finishPractice();
      }
    }, ms);
  }

  function finishPractice() {
    setIsRunning(false);
    setPhase("idle");
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function cancelPractice() {
    setIsRunning(false);
    setPhase("idle");
    setRound(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/tantra"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tantra
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Layayoga Breath Practice</h1>
        <p className="text-muted-foreground text-sm">
          Breath techniques from the Tantraloka and Layayoga traditions
        </p>
      </div>

      {/* Active practice display */}
      {tech && isRunning && (
        <div className="mb-6 rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-6 text-center">
          <div className="text-lg font-semibold mb-2" style={{ color: tech.color }}>{tech.name}</div>
          <div className="text-4xl font-bold mb-2" style={{ color: phase === "inhale" ? "#22c55e" : phase === "holdIn" ? "#eab308" : phase === "exhale" ? "#3b82f6" : "#a855f7" }}>
            {phase === "inhale" && "INHALE"}
            {phase === "holdIn" && "HOLD"}
            {phase === "exhale" && "EXHALE"}
            {phase === "holdOut" && "HOLD EMPTY"}
          </div>
          <div className="text-3xl font-mono text-muted-foreground">
            {Math.max(0, Math.ceil(((
              phase === "inhale" ? tech.inhale :
              phase === "holdIn" ? tech.holdIn :
              phase === "exhale" ? tech.exhale :
              tech.holdOut
            ) * 1000 - phaseTime) / 1000))}s
          </div>
          {tech.rounds > 0 && (
            <div className="text-sm text-muted-foreground mt-2">
              Round {round} / {tech.rounds}
            </div>
          )}
          <button
            onClick={cancelPractice}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Technique list */}
      <div className="space-y-3">
        {TECHNIQUES.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border border-border bg-card/50 hover:border-border/80 transition-all"
          >
            <button
              onClick={() => setActiveTech(activeTech === t.name ? null : t.name)}
              className="w-full p-4 flex items-center gap-4"
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {t.ratio}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t.rounds > 0 ? `${t.rounds} rounds · ` : ""}{t.cycle}s per cycle
                </div>
              </div>
            </button>

            {activeTech === t.name && (
              <div className="px-4 pb-4 pt-0 border-t border-border/50">
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Instructions</div>
                    <p className="text-muted-foreground leading-relaxed">{t.instructions}</p>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Effect</div>
                    <p className="text-muted-foreground/70 italic">{t.effect}</p>
                  </div>
                  <button
                    onClick={() => startPractice(t)}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
                  >
                    <Play className="w-4 h-4" />
                    Start Practice
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Link to companion app */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-2">Breath Companion App</h2>
        <p className="text-sm text-muted-foreground mb-3">
          For a full-featured breath visualizer with animated rings, focus mode, and meditation timer:
        </p>
        <a
          href="https://github.com/prx0r/meditate"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
        >
          Open Breath Companion →
        </a>
      </div>
    </div>
  );
}
