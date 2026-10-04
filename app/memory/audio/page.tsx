"use client";

import Link from "next/link";
import { ArrowLeft, Volume2, PlayCircle } from "lucide-react";

const TRACKS = [
  {
    href: "/memory/audio/cycle_night1_a_aa.mp3",
    title: "Night 1 cycle",
    desc: "a → forehead · gap · ā → mouth and face · gap",
    time: "27s",
    primary: true,
  },
  {
    href: "/memory/audio/cycle_vowels.mp3",
    title: "Vowels cycle",
    desc: "All 14 vowel pairs, one pass each, 7s gap",
    time: "2:27",
  },
  {
    href: "/memory/audio/cycle_consonants.mp3",
    title: "Consonants cycle",
    desc: "ka → dha contrasts, one pass each",
    time: "2:06",
  },
  {
    href: "/memory/audio/cycle_full_starter.mp3",
    title: "Full starter",
    desc: "All 26 in order, 6s gap each",
    time: "4:03",
  },
  {
    href: "/memory/audio/night1_guided_circuit.mp3",
    title: "Guided circuit",
    desc: "Full coached Night 1 session (optional)",
    time: "4:27",
  },
];

export default function MemoryAudioPage() {
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
        <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
          <Volume2 className="w-7 h-7 text-primary" />
          Guided Audio
        </h1>
        <p className="text-muted-foreground text-sm">
          Pattern: <strong className="text-foreground">phoneme clip → locus once → gap for you → next</strong>.
          No in-track coaching loops on the cycles. Play, try yourself in the gap, replay the file.
        </p>
      </div>

      <div className="space-y-3">
        {TRACKS.map((t) => (
          <div
            key={t.href}
            className={`p-4 rounded-xl border ${t.primary ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {t.primary && <PlayCircle className="w-4 h-4 text-primary" />}
                  {t.title}
                </h3>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{t.time}</span>
            </div>
            <audio controls preload="none" className="w-full" src={t.href} />
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <h2 className="text-sm font-medium text-foreground mb-2">How to use</h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Hit play on Night 1 cycle.</li>
          <li>Hear <code>a</code> → say it → hear “forehead” → touch forehead.</li>
          <li>During the gap, do it yourself (maybe 2–3 times).</li>
          <li>Same for <code>ā</code> / mouth and face.</li>
          <li>Replay the file for another cycle.</li>
        </ol>
        <p className="mt-3">
          Phoneme models from <code>public/audio/phonemes</code>. Locus TTS pre-generated.
          Rebuild script lives in deitybody: <code>scripts/build_simple_cycles.py</code>.
        </p>
        <p className="mt-2">
          Also on{" "}
          <a className="text-primary" href="https://stonedoorway.com/audio/nyasa/cycle_night1_a_aa.mp3" target="_blank" rel="noreferrer">
            Stonedoorway
          </a>
          .
        </p>
      </section>
    </div>
  );
}
