"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Boxes, ScanSearch, Gamepad2, Download, Footprints } from "lucide-react";
import type { Mode, MorphBit } from "@/lib/sanskrit/types";
import { applyPhonOp, iastToPhoneme } from "@/lib/sanskrit/operators";
import {
  ASATO_MAM_ASATO,
  applyMorphToVerse,
  validateMorph,
} from "@/lib/sanskrit/panini";
import { collide, predictBoundary } from "@/lib/sanskrit/sandhi";
import {
  defaultWorld,
  installVerse,
  saveWorld,
  worldFromStorage,
} from "@/lib/sanskrit/world";
import {
  defaultLearner,
  loadLearner,
  recordOutcome,
  saveLearner,
  weakestGeneralization,
} from "@/lib/sanskrit/learner";
import { VERSE_LIBRARY, templateById, templateToVerse } from "@/lib/sanskrit/verses";
import {
  decompile,
  generateSurface,
  nightExport,
  reverseCompile,
  roweFloors,
} from "@/lib/sanskrit/decompile";

const MODES: { id: Mode; icon: typeof Play; blurb: string }[] = [
  { id: "INHABIT", icon: Boxes, blurb: "Walk the Sanskrit building." },
  { id: "DECOMPILE", icon: ScanSearch, blurb: "Real Sanskrit → structure." },
  { id: "GENERATE", icon: Play, blurb: "Intent/operators → surface." },
  { id: "PLAY", icon: Gamepad2, blurb: "Mutate; see what is legal." },
];

const ROOTS = ["√gam", "√bhū", "√nī"];
const MORPH_OPS = ["", "ṇic", "kta", "ktvā", "tumun", "present"];
const INTENTS = ["SOURCE→DESTINATION", "CAUSE motion", "RESULT state", "PURPOSE"];

export default function SimulatorPage() {
  const [mode, setMode] = useState<Mode>("INHABIT");
  const [world, setWorld] = useState(() => defaultWorld());
  const [learner, setLearner] = useState(() => defaultLearner());
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"valid" | "conditional" | "invalid" | "">("");
  const [pendingRoot, setPendingRoot] = useState("√gam");
  const [pendingOp, setPendingOp] = useState("ṇic");
  const [genIntent, setGenIntent] = useState(INTENTS[0]);
  const [genRoot, setGenRoot] = useState("√gam");
  const [genOp, setGenOp] = useState("ṇic");
  const [genOut, setGenOut] = useState<string>("");
  const [genVal, setGenVal] = useState<string>("");
  const [decSurface, setDecSurface] = useState("asato mā sad gamaya");
  const [decSteps, setDecSteps] = useState<{ q: string; a: string }[]>([]);
  const [revOut, setRevOut] = useState<{ hidden: string; steps: string[] } | null>(null);
  const [walkFloor, setWalkFloor] = useState("ground");
  const [nightJson, setNightJson] = useState("");
  const [hideSurface, setHideSurface] = useState(false);
  const [sandhiL, setSandhiL] = useState("sat");
  const [sandhiR, setSandhiR] = useState("gamaya");
  const [predicted, setPredicted] = useState("");
  const [sandhiOut, setSandhiOut] = useState<ReturnType<typeof collide>>(null);
  const [phonPlace, setPhonPlace] = useState<"kaṇṭhya" | "dantya">("kaṇṭhya");
  const [voice, setVoice] = useState<0 | 1>(0);
  const [asp, setAsp] = useState<0 | 1>(0);
  const [nas, setNas] = useState<0 | 1>(0);

  useEffect(() => {
    setWorld(worldFromStorage());
    setLearner(loadLearner());
  }, []);
  useEffect(() => saveWorld(world), [world]);
  useEffect(() => saveLearner(learner), [learner]);

  const verseId = Object.keys(world.verses)[0] || ASATO_MAM_ASATO.id;
  const verse = world.verses[verseId] ?? ASATO_MAM_ASATO;
  const floors = useMemo(() => roweFloors(world), [world]);
  const weak = weakestGeneralization(learner);

  const latent = useMemo(() => {
    const key = `${phonPlace}|${voice}|${asp}|${nas}`;
    const table: Record<string, string> = {
      "kaṇṭhya|0|0|0": "ka क",
      "kaṇṭhya|0|1|0": "kha ख",
      "kaṇṭhya|1|0|0": "ga ग",
      "kaṇṭhya|1|1|0": "gha घ",
      "kaṇṭhya|0|0|1": "ṅa ङ",
      "kaṇṭhya|1|0|1": "ṅa ङ",
      "dantya|0|0|0": "ta त",
      "dantya|0|1|0": "tha थ",
      "dantya|1|0|0": "da द",
      "dantya|1|1|0": "dha ध",
      "dantya|0|0|1": "na न",
      "dantya|1|0|1": "na न",
    };
    return table[key] ?? "—";
  }, [phonPlace, voice, asp, nas]);

  function applyPending() {
    const morph: MorphBit = {
      root: pendingRoot,
      operator: pendingOp,
      person: pendingOp === "ṇic" ? "3sg" : undefined,
    };
    const outcome = validateMorph(morph, verse);
    setKind(outcome.kind);
    setLearner((l) => recordOutcome(l, pendingOp || pendingRoot, outcome.kind === "valid", pendingRoot));
    if (outcome.kind !== "invalid") {
      const next = applyMorphToVerse(verse, morph);
      if (next) {
        setWorld(installVerse(world, next));
        setMessage(
          outcome.kind === "valid"
            ? `World transforms → ${next.surface}`
            : `${outcome.message}\n→ ${next.surface}`
        );
        setWorld((w) => ({
          ...w,
          todaysActivated: Array.from(
            new Set([...w.todaysActivated, pendingRoot, pendingOp || "plain", next.surface])
          ),
        }));
      }
    } else {
      setMessage(outcome.message);
    }
  }

  function doSandhi() {
    setPredicted(predictBoundary(sandhiL, sandhiR));
    const result = collide(sandhiL, sandhiR);
    setSandhiOut(result);
    setLearner((l) =>
      recordOutcome(l, "sandhi", !!result && result.operator !== "no sandhi (teaching default)", sandhiL)
    );
    if (result) {
      setWorld((w) =>
        installVerse(w, {
          ...verse,
          surface: result.after,
          tokens: result.after.split(/\s+/),
          installedGates: Array.from(new Set([...verse.installedGates, result.boundary])),
        })
      );
      setWorld((w) => ({
        ...w,
        todaysActivated: Array.from(
          new Set([...w.todaysActivated, result.boundary, result.operator])
        ),
      }));
    }
  }

  function doDecompile() {
    const d = decompile(decSurface);
    if (!d) {
      setDecSteps([]);
      setMessage("Unknown surface in teaching set. Try: asato mā sad gamaya · madhye madhye · ūrdhve prāṇo…");
      setKind("invalid");
      return;
    }
    setDecSteps(d.steps);
    setWorld(installVerse(world, d.verse));
    setWorld((w) => ({
      ...w,
      todaysActivated: Array.from(new Set([...w.todaysActivated, d.verse.id, ...d.verse.installedMachines, ...d.verse.knownRoots])),
    }));
    setLearner((l) => recordOutcome(l, d.verse.id, true));
    setMessage(`Installed ${d.verse.surface} — machines: ${d.verse.installedMachines.join(", ")}`);
    setKind("valid");
  }

  function doReverse() {
    const r = reverseCompile(decSurface);
    setRevOut(r ? { hidden: r.hidden, steps: r.steps } : null);
  }

  function doGenerate() {
    const g = generateSurface(genRoot, genOp, genIntent);
    setGenOut(g.surface);
    setGenVal(g.validation.kind + " — " + g.validation.message);
    setKind(g.validation.kind);
    if (g.validation.kind !== "invalid") {
      setWorld((w) =>
        installVerse(w, {
          ...verse,
          id: `gen-${genRoot}-${genOp}`,
          surface: g.surface,
          tokens: g.surface.split(/\s+/),
          morph: [{ root: genRoot, operator: genOp }],
          semantic: g.semantic,
          knownRoots: Array.from(new Set([...verse.knownRoots, genRoot])),
          installedMachines: Array.from(new Set([...verse.installedMachines, genOp || "plain"])),
        })
      );
      setWorld((w) => ({
        ...w,
        todaysActivated: Array.from(new Set([...w.todaysActivated, genRoot, genOp || "plain", g.surface])),
      }));
      setLearner((l) => recordOutcome(l, genOp || genRoot, g.validation.kind === "valid", genRoot));
    }
  }

  function exportNight() {
    const payload = nightExport(world);
    setNightJson(JSON.stringify(payload, null, 2));
  }

  function downloadNight() {
    exportNight();
    const blob = new Blob([nightJson || JSON.stringify(nightExport(world), null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "tonight-world-patch.json";
    a.click();
  }

  function loadVerse(id: string) {
    const t = templateById(id);
    if (!t) return;
    const v = templateToVerse(t);
    setWorld(installVerse(world, v));
    setWorld((w) => ({
      ...w,
      todaysActivated: Array.from(new Set([...w.todaysActivated, v.id, ...v.installedMachines, ...v.knownRoots])),
    }));
    setMessage(`Loaded ${v.surface}`);
    setKind("valid");
  }

  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/memory"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Memory
      </Link>

      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold mb-1">Sanskrit Simulator</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          State → operator → predict → world changes → error → model. Abhinavagupta OS · Bruno
          operators · Pāṇini as physics.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          <Link className="text-primary" href="/memory/PEER_REVIEW_BRUNO_V2.md">Peer review v2</Link>
          {" · "}
          <Link className="text-primary" href="/memory/bruno-wheels/">Old wheels</Link>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`p-3 rounded-xl border text-left ${
              mode === m.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <m.icon className="w-5 h-5 mb-1 text-primary" />
            <div className="font-semibold text-sm">{m.id}</div>
            <div className="text-xs text-muted-foreground">{m.blurb}</div>
          </button>
        ))}
      </div>

      {weak && (
        <div className="mb-4 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm">
          <strong>Weakest generalization:</strong> {weak.id} · {weak.field} ({weak.value.toFixed(2)})
        </div>
      )}

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm border whitespace-pre-wrap ${
            kind === "valid"
              ? "border-green-500/40 bg-green-500/10"
              : kind === "conditional"
                ? "border-amber-500/40 bg-amber-500/10"
                : "border-red-500/40 bg-red-500/10"
          }`}
        >
          <div className="font-semibold uppercase text-xs tracking-wide">{kind || "result"}</div>
          {message}
        </div>
      )}

      {/* INHABIT */}
      {mode === "INHABIT" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Footprints className="w-4 h-4" /> Rowe building
            </h2>
            <div className="flex flex-wrap gap-1 mb-3">
              {floors.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setWalkFloor(f.id)}
                  className={`px-2 py-1 rounded text-xs border ${
                    walkFloor === f.id ? "border-primary text-primary" : "border-border"
                  }`}
                >
                  {f.name.split("—")[0].trim()}
                </button>
              ))}
            </div>
            {floors.map((f) => (
              <div
                key={f.id}
                className={`mb-3 p-3 rounded-lg border ${
                  walkFloor === f.id ? "border-primary/50 bg-primary/5" : "border-border"
                }`}
              >
                <div className="font-semibold">{f.name}</div>
                <div className="text-xs text-muted-foreground mb-2">{f.role}</div>
                <div className="flex flex-wrap gap-1">
                  {f.nodes.map((n) => (
                    <span
                      key={n}
                      className="px-2 py-0.5 rounded bg-background border border-border text-xs"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Tonight’s world export</h2>
            <p className="text-xs text-muted-foreground mb-2">
              Nodes activated today → Stonedoorway traversal tomorrow morning reconstruct cold.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={exportNight}
                className="px-3 py-2 rounded-lg border border-border text-sm"
              >
                Build JSON
              </button>
              <button
                type="button"
                onClick={downloadNight}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm inline-flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Download patch
              </button>
            </div>
            <textarea
              readOnly
              value={nightJson || "— click Build JSON —"}
              className="w-full h-48 rounded-lg border border-border bg-background p-2 text-xs font-mono"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Also:{" "}
              <Link className="text-primary" href="/memory/audio/cycle_night1_a_aa.mp3">
                Night 1 audio
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* DECOMPILE */}
      {mode === "DECOMPILE" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Load verse</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {VERSE_LIBRARY.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setDecSurface(v.surface);
                    loadVerse(v.id);
                  }}
                  className="px-2 py-1 rounded border border-border text-xs"
                >
                  {v.id}
                </button>
              ))}
            </div>
            <textarea
              value={decSurface}
              onChange={(e) => setDecSurface(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2 mb-2"
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={doDecompile}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
              >
                Decompile
              </button>
              <button
                type="button"
                onClick={doReverse}
                className="px-3 py-2 rounded-lg border border-border text-sm"
              >
                Reverse-compile
              </button>
            </div>
            {revOut && (
              <div className="mt-3 text-sm">
                <div className="font-semibold">Hidden machinery</div>
                <div className="font-mono text-primary">{revOut.hidden}</div>
                <ul className="mt-2 list-disc pl-5 text-muted-foreground">
                  {revOut.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Decomposition</h2>
            <div className="text-2xl font-display mb-2">{verse.surface}</div>
            {decSteps.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Load a verse, then Decompile. Challenges: boundaries → forms → kārakas → machines.
              </p>
            )}
            <ol className="space-y-2 text-sm">
              {decSteps.map((s, i) => (
                <li key={i} className="p-2 rounded bg-background border border-border">
                  <div className="text-muted-foreground text-xs">Q{i + 1}</div>
                  <div className="font-medium">{s.q}</div>
                  <div className="text-primary mt-1">{s.a}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* GENERATE */}
      {mode === "GENERATE" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Intent → surface</h2>
            <div className="grid gap-2 text-sm mb-3">
              <label>
                <span className="text-xs text-muted-foreground">Intent</span>
                <select
                  className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-2"
                  value={genIntent}
                  onChange={(e) => setGenIntent(e.target.value)}
                >
                  {INTENTS.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs text-muted-foreground">Root</span>
                <select
                  className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-2"
                  value={genRoot}
                  onChange={(e) => setGenRoot(e.target.value)}
                >
                  {ROOTS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs text-muted-foreground">Operator</span>
                <select
                  className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-2"
                  value={genOp}
                  onChange={(e) => setGenOp(e.target.value)}
                >
                  {MORPH_OPS.map((o) => (
                    <option key={o} value={o}>
                      {o || "(plain)"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={doGenerate}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
            >
              Generate
            </button>
            {genOut && (
              <div className="mt-3">
                <div className="text-2xl font-display">{genOut}</div>
                <div className="text-sm text-muted-foreground">{genVal}</div>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Global operators (Bruno basis)</h2>
            <ul className="text-sm space-y-1">
              <li><strong>Aspiration</strong> = wind explosion → k→kh, g→gh, c→ch</li>
              <li><strong>Voicing</strong> = vibration/illumination → k→g, t→d</li>
              <li><strong>Nasalization</strong> = nasal chamber opens → k→ṅ, t→n</li>
              <li><strong>ṇic</strong> = another agent responsible for the motion</li>
              <li><strong>kta</strong> = event collapses into resultant state</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Learn the transformation once. Mind learns a basis set — not 50 flashcards.
            </p>
          </div>
        </div>
      )}

      {/* PLAY */}
      {mode === "PLAY" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Live object + operator</h2>
            <div className="text-2xl font-display mb-1">{verse.surface}</div>
            <div className="text-xs text-muted-foreground mb-3">
              {verse.morph.map((m) => m.root + (m.operator ? " + " + m.operator : "")).join(" · ")}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <label>
                <span className="text-xs text-muted-foreground">Root</span>
                <select
                  className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-2"
                  value={pendingRoot}
                  onChange={(e) => setPendingRoot(e.target.value)}
                >
                  {ROOTS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs text-muted-foreground">Operator</span>
                <select
                  className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-2"
                  value={pendingOp}
                  onChange={(e) => setPendingOp(e.target.value)}
                >
                  {MORPH_OPS.map((o) => (
                    <option key={o} value={o}>
                      {o || "(plain)"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyPending}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
              >
                Apply operator
              </button>
              <button
                type="button"
                onClick={() => setHideSurface((h) => !h)}
                className="px-3 py-2 rounded-lg border border-border text-sm"
              >
                {hideSurface ? "Show surface" : "Hide surface"}
              </button>
            </div>
            {hideSurface && (
              <div className="mt-2 text-muted-foreground text-sm">
                Surface hidden — predict what the operator produces.
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Sandhi collision</h2>
            <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
              <input
                value={sandhiL}
                onChange={(e) => setSandhiL(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2"
              />
              <input
                value={sandhiR}
                onChange={(e) => setSandhiR(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
            <button
              type="button"
              onClick={() => setPredicted(predictBoundary(sandhiL, sandhiR))}
              className="px-3 py-2 rounded-lg border border-border text-sm mr-2"
            >
              Predict
            </button>
            <button
              type="button"
              onClick={doSandhi}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
            >
              Collide
            </button>
            {predicted && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">predicted: </span>
                <code>{predicted}</code>
              </div>
            )}
            {sandhiOut && (
              <div className="mt-2 text-sm space-y-1">
                <div><span className="text-muted-foreground">op: </span>{sandhiOut.operator}</div>
                <div><span className="text-muted-foreground">after: </span><strong>{sandhiOut.after}</strong></div>
                <div><span className="text-muted-foreground">Bruno: </span>{sandhiOut.bruno}</div>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Latent phoneme decode</h2>
            <div className="grid grid-cols-2 gap-2 text-sm mb-2">
              <select
                className="rounded-lg border border-border bg-background px-2 py-2"
                value={phonPlace}
                onChange={(e) => setPhonPlace(e.target.value as "kaṇṭhya" | "dantya")}
              >
                <option value="kaṇṭhya">kaṇṭhya</option>
                <option value="dantya">dantya</option>
              </select>
              <div className="flex flex-col gap-1">
                {([
                  ["voice", voice, () => setVoice(voice ? 0 : 1)],
                  ["aspirate", asp, () => setAsp(asp ? 0 : 1)],
                  ["nasal", nas, () => setNas(nas ? 0 : 1)],
                ] as const).map(([label, val, fn]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={fn}
                    className={`px-2 py-1 rounded border text-xs ${val ? "border-primary text-primary" : "border-border"}`}
                  >
                    {label}: {val ? 1 : 0}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl text-primary font-display">{latent.split(" ")[1] || ""}</div>
              <div>{latent.split(" ")[0]}</div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Verse library</h2>
            <div className="flex flex-wrap gap-2">
              {VERSE_LIBRARY.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => loadVerse(v.id)}
                  className="px-2 py-1 rounded border border-border text-xs"
                >
                  {v.id}
                </button>
              ))}
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Machines: {verse.installedMachines.join(", ") || "—"}
              <br />
              Roots: {verse.knownRoots.join(", ") || "—"}
              <br />
              Gates: {verse.installedGates.join(", ") || "—"}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <h2 className="text-sm font-medium text-foreground mb-2">v2 vs old wheels</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Old: rotate → reveal. New: state → operator → predict → world → error → model.</li>
          <li>Pāṇini invisible: valid / conditional / invalid.</li>
          <li>Bruno = operator basis set, not 50 flashcards.</li>
          <li>
            Night: export today’s activated nodes → Stonedoorway walk → reconstruct cold in the
            morning.
          </li>
        </ul>
      </div>
    </div>
  );
}
