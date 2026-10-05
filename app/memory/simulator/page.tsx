"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Dices, ScanSearch, Boxes, Gamepad2 } from "lucide-react";
import type { Mode, MorphBit, OpKind } from "@/lib/sanskrit/types";
import { OPERATORS, applyPhonOp, iastToPhoneme } from "@/lib/sanskrit/operators";
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

const MODES: { id: Mode; icon: typeof Play; blurb: string }[] = [
  { id: "INHABIT", icon: Boxes, blurb: "Walk known structures in the world." },
  { id: "DECOMPILE", icon: ScanSearch, blurb: "Real Sanskrit → how it works." },
  { id: "GENERATE", icon: Play, blurb: "Meaning/operators → produce Sanskrit." },
  { id: "PLAY", icon: Gamepad2, blurb: "Mutate objects; see what is legal." },
];

const ROOTS = ["√gam", "√bhū", "√nī"];
const MORPH_OPS = ["", "ṇic", "kta", "ktvā", "tumun", "present"];

export default function SimulatorPage() {
  const [mode, setMode] = useState<Mode>("PLAY");
  const [world, setWorld] = useState(() => defaultWorld());
  const [learner, setLearner] = useState(() => defaultLearner());
  const [verseId, setVerseId] = useState(ASATO_MAM_ASATO.id);
  const [pendingRoot, setPendingRoot] = useState("√gam");
  const [pendingOp, setPendingOp] = useState<string>("ṇic");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"valid" | "conditional" | "invalid" | "">("");
  const [phonPlace, setPhonPlace] = useState<"kaṇṭhya" | "dantya">("kaṇṭhya");
  const [voice, setVoice] = useState<0 | 1>(0);
  const [asp, setAsp] = useState<0 | 1>(0);
  const [nas, setNas] = useState<0 | 1>(0);
  const [sandhiL, setSandhiL] = useState("sat");
  const [sandhiR, setSandhiR] = useState("gamaya");
  const [predicted, setPredicted] = useState("");
  const [sandhiOut, setSandhiOut] = useState<ReturnType<typeof collide>>(null);
  const [hideSurface, setHideSurface] = useState(false);
  const [derivationRing, setDerivationRing] = useState(0);

  useEffect(() => {
    setWorld(worldFromStorage());
    setLearner(loadLearner());
  }, []);

  useEffect(() => {
    saveWorld(world);
  }, [world]);
  useEffect(() => {
    saveLearner(learner);
  }, [learner]);

  const verse = world.verses[verseId] ?? ASATO_MAM_ASATO;

  const decoded = useMemo(() => {
    return applyPhonOp(iastToPhoneme("ka")!, "aspiration");
  }, []);

  const latent = useMemo(() => {
    const base = iastToPhoneme("ka")!;
    const next = applyPhonOp(
      { ...base, place: phonPlace, voice, aspirate: asp, nasal: nas, iast: "", devanagari: "" },
      "nasalization"
    );
    // decode directly
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
    const key = `${phonPlace}|${voice}|${asp}|${nas}`;
    return table[key] ?? "—";
  }, [phonPlace, voice, asp, nas]);

  const weak = weakestGeneralization(learner);
  const derivation = [
    { ring: 0, label: pendingRoot, hidden: false },
    {
      ring: 1,
      label:
        pendingOp === "ṇic"
          ? "cause-to-go"
          : pendingOp === "kta"
            ? "completed-going"
            : pendingOp === "tumun"
              ? "to-go"
              : pendingOp === "ktvā"
                ? "having-gone"
                : "go",
      hidden: false,
    },
    { ring: 2, label: pendingOp || "∅", hidden: false },
    {
      ring: 3,
      label:
        pendingOp === "ṇic"
          ? "causative surface"
          : pendingOp === "kta"
            ? "resultant"
            : "sandhi/guṇa",
      hidden: false,
    },
    {
      ring: 4,
      label: hideSurface
        ? "?"
        : pendingOp === "ṇic"
          ? "gamayati"
          : pendingOp === "kta"
            ? "gataḥ"
            : "gamaya",
      hidden: hideSurface,
    },
  ];

  function applyPending() {
    const morph: MorphBit = {
      root: pendingRoot,
      operator: pendingOp,
      person: pendingOp === "ṇic" ? "3sg" : undefined,
    };
    const outcome = validateMorph(morph, verse);
    setKind(outcome.kind);
    setMessage(outcome.message);
    setLearner((l) => recordOutcome(l, pendingOp || pendingRoot, outcome.kind === "valid", pendingRoot));

    if (outcome.kind === "valid" || outcome.kind === "conditional") {
      const next = applyMorphToVerse(verse, morph);
      if (next) {
        const w = installVerse(world, next);
        setWorld(w);
        setMessage(
          outcome.kind === "valid"
            ? `World transforms → ${next.surface}`
            : `${outcome.message}\n→ ${next.surface} (accepted after question)`
        );
        setKind(outcome.kind);
      }
    }
  }

  function doSandhi() {
    setPredicted(predictBoundary(sandhiL, sandhiR));
    const result = collide(sandhiL, sandhiR);
    setSandhiOut(result);
    setLearner((l) =>
      recordOutcome(l, "sandhi:" + sandhiL + "+" + sandhiR, !!result, sandhiL + "|" + sandhiR)
    );
    if (result) {
      setWorld((w) =>
        installVerse(w, {
          ...verse,
          installedGates: Array.from(new Set([...verse.installedGates, result.boundary])),
          tokens: result.after.split(/\s+/),
          surface: result.after,
        })
      );
    }
  }

  function playPhon() {
    // clip map
    const clip: Record<string, string> = {
      ka: "/memory/clips/ka.ogg",
      kha: "/memory/clips/kha.ogg",
      ga: "/memory/clips/ga.ogg",
      gha: "/memory/clips/gha.ogg",
      ta: "/memory/clips/ta.ogg",
      tha: "/memory/clips/tha.ogg",
      da: "/memory/clips/da.ogg",
      dha: "/memory/clips/dha.ogg",
    };
    const iast = latent.split(" ")[0];
    if (clip[iast]) new Audio(clip[iast]).play().catch(() => {});
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
          Instrument, not database. State → operator → predict → world changes → error → model.
          Abhinavagupta OS · Bruno operators · Pāṇini as physics engine.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          <Link className="text-primary" href="/memory/PEER_REVIEW_BRUNO_V2.md">
            Peer review v2
          </Link>{" "}
          ·{" "}
          <Link className="text-primary" href="/memory/bruno-wheels/">
            Old wheels
          </Link>
        </p>
      </div>

      {/* MODES */}
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

      {/* WEAK SPOT */}
      {weak && (
        <div className="mb-4 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm">
          <strong>Weakest generalization:</strong> {weak.id} · {weak.field} ({weak.value.toFixed(2)})
          <span className="text-muted-foreground">
            {" "}
            — next session should generate transformations around this, not restate the fact.
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* LIVE OBJECT */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Live object</h2>
          <div className="text-2xl font-display mb-1">{verse.surface}</div>
          <div className="text-xs text-muted-foreground mb-2">
            tokens: {verse.tokens.join(" · ")}
          </div>
          <div className="text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">hidden: </span>
              {verse.morph.map((m) => `${m.root}${m.operator ? " + " + m.operator : ""}`).join(" · ")}
            </div>
            <div>
              <span className="text-muted-foreground">semantic: </span>
              {verse.semantic.join(" · ")}
            </div>
            <div>
              <span className="text-muted-foreground">boundaries: </span>
              {verse.boundaries.join(" · ")}
            </div>
            <div>
              <span className="text-muted-foreground">machines: </span>
              {verse.installedMachines.join(", ") || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">gates: </span>
              {verse.installedGates.join(", ") || "—"}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-background border border-border">
              <div className="text-xs text-muted-foreground">World corridors</div>
              {world.architecture.corridors.join(", ")}
            </div>
            <div className="p-2 rounded bg-background border border-border">
              <div className="text-xs text-muted-foreground">Doorways</div>
              {world.architecture.doorways.join(", ")}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Verses install machines/gates — world patches accumulate.
          </p>
        </div>

        {/* OPERATORS + DERIVATION */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Operators · derivation wheel
          </h2>
          <p className="text-xs text-muted-foreground mb-2">
            Global Bruno images: aspiration=wind explosion · voicing=illumination · nasal=nasal
            chamber · ṇic=another agent responsible.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            <label className="block">
              <span className="text-xs text-muted-foreground">Invariant (root)</span>
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
            <label className="block">
              <span className="text-xs text-muted-foreground">Operator</span>
              <select
                className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-2"
                value={pendingOp}
                onChange={(e) => setPendingOp(e.target.value)}
              >
                {MORPH_OPS.map((o) => (
                  <option key={o} value={o}>
                    {o || "(none / plain)"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {derivation.map((d) => (
              <div
                key={d.ring}
                className={`px-2 py-1 rounded border text-xs ${
                  d.hidden
                    ? "border-dashed border-border text-muted-foreground"
                    : "border-primary/50 bg-primary/10"
                }`}
              >
                R{d.ring} {d.label}
              </div>
            ))}
            <button
              type="button"
              className="px-2 py-1 rounded border border-border text-xs"
              onClick={() => setHideSurface((h) => !h)}
            >
              {hideSurface ? "Show surface" : "Hide surface (predict)"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              Apply operator
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingRoot("√gam");
                setPendingOp("present");
              }}
              className="px-3 py-2 rounded-lg border border-border text-sm"
            >
              Reset √gam present
            </button>
          </div>

          {message && (
            <div
              className={`mt-3 p-3 rounded-lg text-sm border ${
                kind === "valid"
                  ? "border-green-500/40 bg-green-500/10"
                  : kind === "conditional"
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-red-500/40 bg-red-500/10"
              }`}
            >
              <div className="font-semibold uppercase text-xs tracking-wide">{kind || "result"}</div>
              <div className="whitespace-pre-wrap">{message}</div>
            </div>
          )}
        </div>

        {/* LATENT PHONEME */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Latent phoneme · decode coordinates
          </h2>
          <p className="text-xs text-muted-foreground mb-2">
            Place + voice + aspirate + nasal → phoneme. Generate dental + voiced + aspirated →{" "}
            <strong>dha</strong> should emerge.
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
            <label>
              <span className="text-xs text-muted-foreground">Place</span>
              <select
                className="w-full mt-1 rounded-lg border border-border bg-background px-2 py-2"
                value={phonPlace}
                onChange={(e) => setPhonPlace(e.target.value as "kaṇṭhya" | "dantya")}
              >
                <option value="kaṇṭhya">kaṇṭhya (velar)</option>
                <option value="dantya">dantya (dental)</option>
              </select>
            </label>
            <div className="flex flex-col gap-1 justify-end">
              {[
                ["voice", voice, () => setVoice(voice ? 0 : 1)],
                ["aspirate", asp, () => setAsp(asp ? 0 : 1)],
                ["nasal", nas, () => setNas(nas ? 0 : 1)],
              ].map(([label, val, fn]) => (
                <button
                  key={String(label)}
                  type="button"
                  onClick={fn as () => void}
                  className={`px-3 py-1.5 rounded border text-xs ${
                    val ? "border-primary text-primary bg-primary/10" : "border-border"
                  }`}
                >
                  {String(label)}: {val ? 1 : 0}
                </button>
              ))}
            </div>
          </div>
          <div className="text-center py-3">
            <div className="text-4xl text-primary font-display">{latent.split(" ")[1] || ""}</div>
            <div className="text-xl">{latent.split(" ")[0]}</div>
            <button
              type="button"
              onClick={playPhon}
              className="mt-2 px-3 py-1.5 rounded-lg border border-border text-sm"
            >
              <Play className="w-4 h-4 inline mr-1" />
              Hear
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Latent decode (not memorization). Operator basis: aspiration / voicing / nasalization.
          </p>
        </div>

        {/* SANDHI COLLISION */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Sandhi collision · predict then collide
          </h2>
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
            className="px-3 py-2 rounded-lg border border-border text-sm mb-2"
          >
            Predict boundary
          </button>
          {predicted && (
            <div className="text-sm mb-2">
              <span className="text-muted-foreground">you predicted: </span>
              <code>{predicted}</code>
            </div>
          )}
          <button
            type="button"
            onClick={doSandhi}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            Collide
          </button>
          {sandhiOut && (
            <div className="mt-3 text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">operator: </span>
                {sandhiOut.operator}
              </div>
              <div>
                <span className="text-muted-foreground">before: </span>
                {sandhiOut.before}
              </div>
              <div>
                <span className="text-muted-foreground">after: </span>
                <strong>{sandhiOut.after}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Bruno: </span>
                {sandhiOut.bruno}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Try sat + gamaya → sad gamaya (voicing at boundary).
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <h2 className="text-sm font-medium text-foreground mb-2">How this differs from the old wheels</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Old:</strong> rotate → reveal information.
          </li>
          <li>
            <strong>v2:</strong> state → operator → predict → world changes → error → learner model.
          </li>
          <li>Pāṇini is invisible physics: valid / conditional / invalid — not a lesson page.</li>
          <li>Bruno images are a <em>basis set</em> of operators, not 50 flashcards.</li>
          <li>
            Night loop later: activate nodes today → Stonedoorway traversal → reconstruct cold in the
            morning.
          </li>
        </ul>
      </div>
    </div>
  );
}
