"use client";

import Link from "next/link";
import { ArrowLeft, Play, Ear, Moon, BookOpen, Volume2 } from "lucide-react";

const STEPS = [
  {
    n: "1",
    title: "See the 50 reference phonemes",
    desc: "One chart: every sound, where it lives on the body, tap ▶ to hear it. This is the map — don't memorize it tonight, just look.",
    href: "/memory/practice-chart.html",
    cta: "Open Tonight 50",
  },
  {
    n: "2",
    title: "Do Night 1 (two phonemes: a + ā)",
    desc: "Forehead + mouth. Play the 27-second cycle, say each sound, touch the spot, try it yourself in the gap. That's the whole method.",
    href: "/memory/nyasa",
    cta: "Start Night 1",
  },
  {
    n: "3",
    title: "Replay until the gap feels easy",
    desc: "Same cycle again, or the vowels loop. When you can do a + ā without the recording, move to Night 2 (i + ī) tomorrow.",
    href: "/memory/audio",
    cta: "Guided audio",
  },
  {
    n: "4",
    title: "Morning: one line + one check",
    desc: "Write one line about last night. Then test yourself: random phoneme → point at the body. No phone first.",
    href: "/memory/night",
    cta: "Night handoff",
  },
];

const REFERENCE = [
  { title: "Tonight 50 chart (all sounds + clips)", href: "/memory/practice-chart.html", icon: Ear },
  { title: "Nyāsa practice (2-a-night calendar)", href: "/memory/nyasa", icon: Play },
  { title: "Guided audio cycles", href: "/memory/audio", icon: Volume2 },
  { title: "Full body diagram", href: "/memory/body-diagram.html", icon: BookOpen },
  { title: "Canonical table (sources + variants)", href: "/memory/canonical/TA15_TABLE.html", icon: BookOpen },
  { title: "Night handoff + dream log", href: "/memory/night", icon: Moon },
];

export default function MemoryStartPage() {
  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/memory"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Memory
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Start here tonight</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Forget everything else on this site. Four steps, one night, two phonemes.
          The rest — wheels, grammar, Hindi, tantra — waits until the map is in your body.
        </p>
      </div>

      <div className="grid gap-4 mb-10">
        {STEPS.map((s) => (
          <div key={s.n} className="flex gap-4 p-5 rounded-xl border-2 border-primary bg-primary/10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <span className="font-bold text-primary-foreground">{s.n}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{s.desc}</p>
              <Link
                href={s.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
              >
                {s.cta} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Reference — everything in one place
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {REFERENCE.map((r) => (
          <Link key={r.href} href={r.href}>
            <div className="flex gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary transition-all">
              <r.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{r.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
