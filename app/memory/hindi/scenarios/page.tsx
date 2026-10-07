"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2 } from "lucide-react";
import { speakHindi } from "@/lib/hindi/speak";
import SpeakScore from "@/components/SpeakScore";

type Slot = { speaker: string; text: string; start: number; dur: number; muted: boolean };

function ScenePlayer({ id }: { id: string }) {
  const [manifest, setManifest] = useState<Record<string, { file: string; slots: Slot[] }> | null>(null);
  const [stage, setStage] = useState("stage1");
  useEffect(() => {
    fetch(`/memory/hindi/scenes/${id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setManifest(j.stages ?? null))
      .catch(() => {});
  }, [id]);
  if (!manifest || !manifest[stage]) return null;
  const cur = manifest[stage];
  const labels: Record<string, string> = { stage1: "Full scene", stage2: "Your lines muted — autocomplete", stage3: "Empty — act it all" };
  return (
    <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex flex-wrap gap-2 mb-2">
        {Object.keys(manifest).map((s) => (
          <button
            key={s}
            onClick={() => setStage(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border ${s === stage ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
          >
            {labels[s] ?? s}
          </button>
        ))}
      </div>
      <audio controls preload="none" className="w-full" src={`/memory/hindi/${cur.file}`} />
      <div className="mt-2 space-y-1.5">
        {cur.slots.map((sl, i) => (
          <div key={i} className={`text-sm rounded p-1.5 ${sl.muted ? "border border-amber-400/40 bg-amber-400/5" : ""}`}>
            <span className="text-xs text-muted-foreground">{sl.speaker}{sl.muted ? " — YOUR LINE" : ""} · </span>
            {sl.text}
            {sl.muted ? <SpeakScore target={sl.text} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

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
              <ScenePlayer id={s.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
