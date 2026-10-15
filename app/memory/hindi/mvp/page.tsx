"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2, Play, ChevronRight } from "lucide-react";
import SpeakScore from "@/components/SpeakScore";
import { speakHindi } from "@/lib/hindi/speak";
import { getDifficulty, setDifficulty, RATES, type Difficulty } from "@/lib/hindi/difficulty";

/** Full MVP: every scenario is listen -> flash -> say.
 *  Audio resolves per line: Fish free-lane files from scenes/voices.json
 *  (written by scripts/fish_render_free.py, $0) -> Edge l-files in the same
 *  map -> live speakHindi. Easy level prefers the slow-voice variant:
 *  voices.json entries for slow renders share the same text key, so the map
 *  lookup is unchanged — the render script decides which file a text maps to
 *  per level at render time via the scenario `voices.easyNpc` role.
 */

type Scenario = {
  id: string;
  title: string;
  subtitle: string;
  level?: number;
  objective: string;
  npcScript: { speaker: string; hindi: string }[];
  targetLines: string[];
};

function playFile(file: string) {
  new Audio(`/memory/hindi/scenes/${file}`).play().catch(() => {});
}

export default function HindiMvpPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [voices, setVoices] = useState<Record<string, { file: string; slow?: string }>>({});
  const [sid, setSid] = useState<string>("");
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(0);
  const [difficulty, setDifficultyState] = useState<Difficulty>("normal");

  useEffect(() => {
    setDifficultyState(getDifficulty());
    fetch("/memory/hindi/scenarios.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        const list: Scenario[] = j.scenarios ?? [];
        setScenarios(list);
        if (list.length && !sid) setSid(list[0].id);
      })
      .catch(() => {});
    fetch("/memory/hindi/scenes/voices.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => setVoices(j))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hear(text: string) {
    const v = voices[text];
    if (v) playFile(difficulty === "easy" && v.slow ? v.slow : v.file);
    else speakHindi(text, RATES[difficulty]);
  }

  const cur = scenarios.find((s) => s.id === sid);
  const sayText = cur?.targetLines[idx] ?? "";
  // NPC context for this step: pair target i with npc line i where it exists.
  const npc = cur && cur.npcScript[Math.min(idx, cur.npcScript.length - 1)];

  function pickDifficulty(d: Difficulty) {
    setDifficulty(d);
    setDifficultyState(d);
  }

  return (
    <div className="min-h-[80vh] py-6 pb-28 max-w-2xl mx-auto px-4">
      <Link
        href="/memory/hindi/scenarios"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Field Scenarios
      </Link>

      <h1 className="font-display text-3xl font-bold mb-1">Say it</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Listen, see the flash, say it back. {done} scored this visit.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Level:</span>
        {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => pickDifficulty(d)}
            className={`text-xs px-3 py-1.5 rounded-lg border ${difficulty === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
          >
            {d === "easy" ? "Easy · slow voice" : d === "normal" ? "Normal" : "Hard · hidden"}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSid(s.id); setIdx(0); }}
            className={`text-xs px-3 py-1.5 rounded-lg border ${s.id === sid ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {!cur ? (
        <p className="text-sm text-muted-foreground">Loading scenarios…</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-1">
            Step {idx + 1}/{cur.targetLines.length} · {cur.subtitle}
            {difficulty === "hard" ? " · transcript hidden until you answer" : ""}
          </p>

          {npc ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
              <p className="text-xs text-muted-foreground mb-1">{npc.speaker} — listen</p>
              <p className="text-lg mb-3">{npc.hindi}</p>
              <button
                onClick={() => hear(npc.hindi)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm"
              >
                <Play className="w-4 h-4" /> Play
              </button>
            </div>
          ) : null}

          <div className="rounded-xl border-2 border-amber-400/50 bg-amber-400/5 p-5 mb-4">
            <p className="text-xs text-amber-200/70 mb-1">YOUR LINE — say this</p>
            {difficulty === "hard" ? (
              <p className="text-3xl font-display mb-4 text-muted-foreground">··· tap Hear, then say it</p>
            ) : (
              <p className="text-3xl font-display mb-4">{sayText}</p>
            )}
            <button
              onClick={() => hear(sayText)}
              className="inline-flex items-center gap-1 text-sm text-primary mb-3"
            >
              <Volume2 className="w-4 h-4" /> Hear model
            </button>
            <SpeakScore
              key={`${sid}-${idx}`}
              target={sayText}
              context={`mvp-${sid}`}
              onScored={() => setDone((d) => d + 1)}
            />
          </div>

          <div className="flex gap-2">
            {idx < cur.targetLines.length - 1 ? (
              <button
                onClick={() => setIdx((i) => i + 1)}
                className="inline-flex items-center gap-1 px-4 py-2.5 rounded-lg border border-border hover:bg-accent text-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Done — pick another scenario above to keep going.
              </p>
            )}
            {idx > 0 ? (
              <button
                onClick={() => setIdx((i) => i - 1)}
                className="px-4 py-2.5 rounded-lg border border-border hover:bg-accent text-sm"
              >
                Back
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
