"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2 } from "lucide-react";
import { speakHindi } from "@/lib/hindi/speak";
import SpeakScore from "@/components/SpeakScore";

type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  stage: number;
  objective: string;
  pattern: string;
  vocab: { hindi: string; transliteration: string; english: string }[];
  npcScript: { speaker: string; hindi: string; transliteration: string; english: string }[];
  hints: string[];
  targetLines: string[];
};

export default function HindiScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [hintsShown, setHintsShown] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/memory/hindi/scenarios.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setScenarios(j.scenarios ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/memory/hindi"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Hindi Wheels
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">Field Scenarios</h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          Rehearse real exchanges before Varanasi: hear the NPC, reveal hints one at a
          time, speak each target line and get scored. All lines from our own Kumbh
          phrases + Osho anchors.
        </p>
      </div>

      <div className="grid gap-4">
        {scenarios.map((s) => {
          const n = hintsShown[s.id] ?? 0;
          return (
            <div key={s.id} className="p-5 rounded-xl border border-border bg-card">
              <p className="text-xs text-muted-foreground">Stage {s.stage} · {s.subtitle}</p>
              <h2 className="font-semibold text-xl">{s.title}</h2>
              <p className="text-sm text-muted-foreground">{s.objective}</p>
              <p className="text-sm mt-2">
                Pattern: <code className="text-primary">{s.pattern}</code>
              </p>

              <div className="mt-3 space-y-2">
                {s.npcScript.map((d, i) => (
                  <div key={i} className="rounded-lg bg-primary/5 border border-primary/20 p-2.5 text-sm">
                    <p className="text-xs text-muted-foreground">{d.speaker}</p>
                    <p className="text-base">{d.hindi}</p>
                    <p className="text-xs text-muted-foreground">{d.transliteration} — {d.english}</p>
                    <button
                      onClick={() => speakHindi(d.hindi)}
                      className="inline-flex items-center gap-1 text-xs text-primary mt-1"
                    >
                      <Volume2 className="w-3 h-3" /> Hear
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <button
                  onClick={() => setHintsShown((m) => ({ ...m, [s.id]: Math.min(n + 1, s.hints.length) }))}
                  disabled={n >= s.hints.length}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40"
                >
                  {n >= s.hints.length ? "All hints shown" : `Hint ${n + 1}/${s.hints.length}`}
                </button>
                {s.hints.slice(0, n).map((h, i) => (
                  <p key={i} className="text-sm text-amber-300/90 mt-1">Hint {i + 1}: {h}</p>
                ))}
              </div>

              <div className="mt-3 space-y-2">
                {s.targetLines.map((t) => (
                  <div key={t} className="rounded-lg border border-border p-2.5">
                    <p className="text-base">{t}</p>
                    <SpeakScore target={t} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
