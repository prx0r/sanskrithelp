import type { ValidationOutcome, VerseState } from "./types";
import { templateById, templateToVerse } from "./verses";

/** Rowe architecture walk for INHABIT mode. */
export interface Floor {
  id: string;
  name: string;
  role: string;
  nodes: string[];
  connectsTo: string[];
}

export function roweFloors(world: {
  architecture: { ground: string[]; arcade: string[]; corridors: string[]; doorways: string[] };
  verses: Record<string, VerseState>;
}): Floor[] {
  const machines = new Set<string>();
  const roots = new Set<string>();
  const gates = new Set<string>();
  Object.values(world.verses).forEach((v) => {
    v.installedMachines.forEach((m) => machines.add(m));
    v.knownRoots.forEach((r) => roots.add(r));
    v.installedGates.forEach((g) => gates.add(g));
  });
  return [
    {
      id: "ground",
      name: "Ground — sound matrix",
      role: "5×5 articulation. Walk places or manners.",
      nodes: world.architecture.ground,
      connectsTo: ["arcade"],
    },
    {
      id: "arcade",
      name: "Outer arcade — Māheśvara",
      role: "Pratyāhāra spans (ac, ik, yaṅ…).",
      nodes: world.architecture.arcade,
      connectsTo: ["corridors"],
    },
    {
      id: "corridors",
      name: "Corridors — Pāṇinian rules",
      role: "Routes open/close by conditions.",
      nodes: [...machines, ...world.architecture.corridors],
      connectsTo: ["chamber", "doors"],
    },
    {
      id: "doors",
      name: "Doorways — sandhi",
      role: "Two objects cross → both change.",
      nodes: [...gates, ...world.architecture.doorways],
      connectsTo: ["chamber"],
    },
    {
      id: "chamber",
      name: "Central chamber — event",
      role: "Verb/agent at centre; kārakas arrange around.",
      nodes: [...roots, "√gam", "√bhū"],
      connectsTo: ["dome", "corridors"],
    },
    {
      id: "dome",
      name: "Dome — meaning",
      role: "Semantic relations above the sentence.",
      nodes: ["SOURCE", "DESTINATION", "EVENT", "CAUSE", "COMMAND"],
      connectsTo: [],
    },
  ];
}

/** DECOMPILE: given surface, return teaching decomposition + questions. */
export function decompile(surface: string): {
  verse: VerseState;
  steps: { q: string; a: string }[];
} | null {
  const key = surface.trim().toLowerCase().replace(/\s+/g, " ");
  const match = Object.entries({
    "asato mā sad gamaya": "asato-ma-sad-gamaya",
    "ūrdhve prāṇo hy adho jīvo visargātmā paroccaret": "vb-urvdhve-prano",
    "madhye madhye": "vb-madhye-madhye",
  }).find(([s]) => s === key || key.includes(s.toLowerCase().slice(0, 12)));

  const id = match?.[1] ?? (key.startsWith("asato") ? "asato-ma-sad-gamaya" : null);
  if (!id) return null;
  const t = templateById(id);
  if (!t) return null;
  const verse = templateToVerse(t);
  return {
    verse,
    steps: [
      { q: "Where are the sound boundaries?", a: t.boundaries.join(" · ") },
      { q: "Which roots/forms do you recognize?", a: t.roots.join(" · ") + " · " + t.morph.map((m) => m.surfaceHint || m.root).join(" · ") },
      { q: "What is acting on what?", a: (t.karaka ?? []).map((k) => `${k.role}: ${k.form}`).join(" · ") || t.semantic.join(" · ") },
      { q: "What machines/gates does this install?", a: t.machines.join(", ") + " · gates: " + (t.gates.join(", ") || "—") },
    ],
  };
}

/** GENERATE: semantic intent + root + op → surface teaching form. */
export function generateSurface(
  root: string,
  operator: string,
  intent: string
): { surface: string; validation: ValidationOutcome; semantic: string[] } {
  const semantic = [intent, `ROOT(${root})`, operator ? `OP(${operator})` : "OP(plain)"].filter(
    Boolean
  );
  const table: Record<string, string> = {
    "√gam|ṇic": "asato mā sad gamayati",
    "√gam|kta": "asato mā gataḥ",
    "√gam|ktvā": "asato mā gatvā",
    "√gam|tumun": "asato mā gamitum",
    "√gam|present": "asato mā sad gacchati",
    "√gam|": "asato mā sad gamaya",
    "√bhū|ṇic": "asato mā sad bhāvayati",
    "√bhū|kta": "asato mā bhūtaḥ",
    "√bhū|ktvā": "asato mā bhūtvā",
    "√bhū|tumun": "asato mā bhavitum",
    "√bhū|present": "asato mā sad bhavati",
    "√bhū|": "asato mā sad bhavati",
    "√nī|ṇic": "asato mā sad nāyayati",
    "√nī|present": "asato mā sad nayati",
    "√nī|kta": "asato mā nītaḥ",
    "√nī|": "asato mā sad nayati",
  };
  const key = `${root}|${operator}`;
  const surface = table[key] ?? "asato mā sad …";
  let validation: ValidationOutcome = {
    kind: "valid",
    message: "World transforms.",
    worldChange: surface,
  };
  if (root === "√nī" && operator === "ṇic") {
    validation = {
      kind: "conditional",
      message:
        "Causative on √nī — what environment permits another agent to lead?",
      ruleHint: "certain roots resist causative in this teaching set",
      worldChange: surface,
    };
  }
  if (surface.includes("…")) {
    validation = {
      kind: "invalid",
      message: "No surface for this combination in the teaching set.",
    };
  }
  return { surface, validation, semantic };
}

/** Reverse: surface → machinery (peel). */
export function reverseCompile(surface: string): {
  surface: string;
  hidden: string;
  steps: string[];
} | null {
  const d = decompile(surface);
  if (!d) return null;
  return {
    surface: d.verse.surface,
    hidden: d.verse.morph.map((m) => `${m.root}${m.operator ? " + " + m.operator : ""}`).join(" · "),
    steps: d.steps.map((s) => s.a),
  };
}

/** Night export payload for Stonedoorway. */
export function nightExport(world: {
  todaysActivated: string[];
  verses: Record<string, VerseState>;
  architecture: { corridors: string[]; doorways: string[] };
}) {
  const machines = new Set<string>();
  const roots = new Set<string>();
  Object.values(world.verses).forEach((v) => {
    v.installedMachines.forEach((m) => machines.add(m));
    v.knownRoots.forEach((r) => roots.add(r));
  });
  return {
    id: "tonight-world-patch",
    date: new Date().toISOString().slice(0, 10),
    activated: world.todaysActivated,
    machines: [...machines],
    roots: [...roots],
    corridors: world.architecture.corridors,
    doorways: world.architecture.doorways,
    stonedoorway: {
      suggested_preset: "notoria-grammar-study",
      note: "Traverse activated nodes as imaginal/audio. Reconstruct cold in sanskrithelp morning.",
      walk_order: [
        "ground:sound-matrix",
        "arcade:pratyahara",
        ...[...machines].map((m) => `corridor:${m}`),
        ...[...roots].map((r) => `chamber:${r}`),
        "dome:meaning",
      ],
    },
  };
}
