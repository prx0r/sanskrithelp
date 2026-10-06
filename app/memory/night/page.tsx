"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun, Volume2 } from "lucide-react";
import { buildStoneDoorwayExport } from "@/lib/memory/stoneDoorwayExport";

const PROTOCOL = [
  "Quiet headphones, low volume. Stop always available.",
  "Bed: soft drone — aesthetic only, not doctrine.",
  "Spoken phonemes (vaikharī), 5–10 rows — Mātṛkā or Mālinī order, your own voice.",
  "Visualize: glyph + body locus.",
  "Drop to mental (madhyamā) — no lips.",
  "Pause at the dentals (ta-varga, left leg) longer.",
  "Optional: one VBT line or Śivasūtra.",
  "Silence — let it complete itself.",
  "Morning: one line log + 1 recall check (no phone first).",
];

const DREAM_PROMPT =
  "If useful, hold one unresolved Sanskrit relation lightly before sleep and record what appears without treating it as authoritative.";

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

type VbUnit = {
  id: string;
  devanagari: string;
  iast: string;
  english: string;
};

export default function NightHandoffPage() {
  const [installed, setInstalled] = useState("");
  const [dreamSeed, setDreamSeed] = useState("");
  const [morningLog, setMorningLog] = useState("");
  const [logs, setLogs] = useState<Record<string, string>>({});
  const [vbt, setVbt] = useState<VbUnit[]>([]);

  useEffect(() => {
    try {
      setDreamSeed(localStorage.getItem("night-dream-seed") ?? "");
      setLogs(JSON.parse(localStorage.getItem("night-morning-log") ?? "{}"));
    } catch {}
    fetch("/content/readings/vijnanabhairava/units.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => setVbt(Array.isArray(u) ? u.slice(0, 5) : []))
      .catch(() => {});
  }, []);

  function saveDreamSeed(v: string) {
    setDreamSeed(v);
    try {
      localStorage.setItem("night-dream-seed", v);
    } catch {}
  }

  function saveMorningLog() {
    if (!morningLog.trim()) return;
    const next = { ...logs, [dayKey()]: morningLog.trim() };
    setLogs(next);
    setMorningLog("");
    try {
      localStorage.setItem("night-morning-log", JSON.stringify(next));
    } catch {}
  }

  function exportHandoff() {
    const exp = buildStoneDoorwayExport(
      installed
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => ({ primitiveId: id })),
      []
    );
    const blob = new Blob([JSON.stringify(exp, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `night-handoff-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-1 flex items-center gap-3">
          <Moon className="w-8 h-8 text-primary" />
          Night Handoff
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          Day installs (this app) → night replays (Stonedoorway) → morning checks
          (here). Dream incubation is a <strong>modern synthesis</strong>, not
          Abhinavagupta doctrine. No Hz-per-phoneme, no medical claims.
        </p>
      </div>

      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Tonight&apos;s protocol</h2>
        <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal pl-5">
          {PROTOCOL.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/memory/audio/cycle_night1_a_aa.mp3"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            <Volume2 className="w-4 h-4" /> Night 1 cycle
          </a>
          <a
            href="https://stonedoorway.com/app/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
          >
            Open Stonedoorway night walk →
          </a>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-2">VBT breath dhāraṇās — sit with one before silence</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Vijñāna Bhairava Tantra, Jaideva Singh trans. Breath/visarga dhāraṇās that
          belong to step 7–8 of the protocol. Nothing invented — verse + translation.
        </p>
        {vbt.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading dhāraṇās…</p>
        ) : (
          <ul className="space-y-3">
            {vbt.map((u) => (
              <li key={u.id} className="border-t border-border pt-3">
                <p className="font-display text-xl">{u.devanagari}</p>
                <p className="text-xs text-muted-foreground">{u.iast}</p>
                <p className="text-sm text-muted-foreground mt-1">{u.english}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6 rounded-xl border border-primary/40 bg-primary/5 p-5">
        <h2 className="font-semibold mb-2">Dream seed — hold one thing lightly</h2>
        <p className="text-sm text-muted-foreground mb-3">{DREAM_PROMPT}</p>
        <textarea
          value={dreamSeed}
          onChange={(e) => saveDreamSeed(e.target.value)}
          placeholder="e.g. why does ga live on the right hand?"
          className="w-full min-h-[72px] rounded-lg border border-border bg-card p-3 text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">Saved on this device only.</p>
      </section>

      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-2">What did today install?</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Names of phonemes / machines / verses from today (comma-separated).
          Exports as the StoneDoorway handoff JSON.
        </p>
        <textarea
          value={installed}
          onChange={(e) => setInstalled(e.target.value)}
          placeholder="a, ā, ka-varga, X-kaa-arth-hai-ki-Y"
          className="w-full min-h-[56px] rounded-lg border border-border bg-background p-3 text-sm"
        />
        <button
          onClick={exportHandoff}
          className="mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
        >
          Export night handoff JSON
        </button>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <Sun className="w-4 h-4" /> Morning — one line, no phone first
        </h2>
        <div className="flex gap-2">
          <input
            value={morningLog}
            onChange={(e) => setMorningLog(e.target.value)}
            placeholder="One line: what surfaced?"
            className="flex-1 rounded-lg border border-border bg-background p-2.5 text-sm"
          />
          <button
            onClick={saveMorningLog}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            Log
          </button>
          <Link
            href="/memory/nyasa"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm inline-flex items-center"
          >
            Recall check →
          </Link>
        </div>
        {Object.keys(logs).length > 0 && (
          <ul className="mt-3 text-sm text-muted-foreground space-y-1">
            {Object.entries(logs)
              .sort()
              .reverse()
              .slice(0, 7)
              .map(([d, line]) => (
                <li key={d}>
                  <code className="text-primary">{d}</code> — {line}
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
