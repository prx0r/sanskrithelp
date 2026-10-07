"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import HindiWheelLab from "@/components/HindiWheelLab";

function dayOfYear(d = new Date()): number {
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 864e5);
}

function TodayHindi() {
  const [line, setLine] = useState("");
  useEffect(() => {
    Promise.all([
      fetch("/memory/hindi/scenarios.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/memory/hindi/osho-shiv-sutra-01.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([sc, osho]) => {
      const targets: string[] = [];
      for (const s of sc?.scenarios ?? []) targets.push(...(s.targetLines ?? []));
      for (const s of osho?.segments ?? []) targets.push(s.hindi_simple);
      if (targets.length) setLine(targets[dayOfYear() % targets.length]);
    });
  }, []);
  if (!line) return null;
  return (
    <div className="mb-6 p-4 rounded-xl border-2 border-primary bg-primary/10">
      <p className="text-xs text-primary/80 mb-1 flex items-center gap-1">
        <CalendarDays className="w-3 h-3" /> Today&apos;s Hindi — say it, then score it
      </p>
      <p className="text-xl font-display">{line}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <Link className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground" href="/memory/hindi/scenarios">
          Practice in scenarios →
        </Link>
        <Link className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent" href="/memory/hindi/text-mode">
          Text Mode →
        </Link>
      </div>
    </div>
  );
}

export default function HindiMemoryPage() {
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
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">
          Hindi Wheels
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          Active Hindi layer over the Sanskrit memory machine: Mātṛkā sound bridge,
          grammatical Bruno sentence compiler, and Kumbh/Rishikesh/Varanasi field
          language.
        </p>
        <p className="text-muted-foreground text-sm max-w-3xl mt-2">
          <strong className="text-foreground">Daily flow (canonical):</strong>{" "}
          Sanskrit installs the phonemes (Mātṛkā drill) → Hindi extends them the same
          day into live sentences and conversation. Substrate and production advance
          together; neither waits for the other. See{" "}
          <code>docs/visions/awesomevision.md</code>.
        </p>
        <p className="text-muted-foreground text-sm max-w-3xl mt-2">
          <strong className="text-foreground">Dataset Zero:</strong> Osho Hindi{" "}
          <em>Śiva Sūtra</em> 01–10 (~14h, direct MP3, free download) — Sanskrit
          nucleus + Hindi explanation side by side. Start in{" "}
          <Link className="text-primary underline" href="/memory/hindi/text-mode">
            Text Mode
          </Link>
          , rehearse in{" "}
          <Link className="text-primary underline" href="/memory/hindi/scenarios">
            Field Scenarios
          </Link>
          . Osho teaches Hindi here, not Trika authority.
        </p>
      </div>

      <TodayHindi />
      <HindiWheelLab />
    </div>
  );
}
