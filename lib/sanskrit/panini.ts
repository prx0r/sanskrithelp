import type { MorphBit, ValidationOutcome, VerseState } from "./types";

/**
 * Pāṇini as invisible physics engine.
 * Outcomes: valid | conditional | invalid — never a lesson page.
 */

const VALID_OPS = new Set(["ṇic", "kta", "ktvā", "tumun", "san", "present", null, ""]);

/** Teaching conditions that produce "conditional" (user must discover why). */
const CONDITIONAL: Array<{
  test: (m: MorphBit, v: VerseState) => boolean;
  message: string;
  ruleHint: string;
}> = [
  {
    test: (m) => m.root === "√gam" && m.operator === "ṇic",
    message:
      "Something about this environment permits causation on √gam. What makes another agent responsible for the motion?",
    ruleHint: "causative requires an agent that is not the mover",
  },
  {
    test: (m) => m.operator === "kta" && !!m.person,
    message:
      "Resultant state is allowed here, but person is fixed by context. What is acting?",
    ruleHint: "kta collapses event → state; agent still required",
  },
  {
    test: (m) => m.root === "√nī" && m.operator === "ṇic",
    message:
      "Causative on √nī is blocked in this environment. Why doesn't the operator fire?",
    ruleHint: "certain roots resist causative formation in this teaching set",
  },
];

export function validateMorph(m: MorphBit, verse: VerseState): ValidationOutcome {
  if (!VALID_OPS.has(m.operator) && m.operator !== "") {
    return {
      kind: "invalid",
      message: "Transformation failed. Why didn't this operator fire?",
      ruleHint: "operator not licensed in this object's environment",
      worldChange: "",
    };
  }

  for (const c of CONDITIONAL) {
    if (c.test(m, verse)) {
      return {
        kind: "conditional",
        message: c.message,
        ruleHint: c.ruleHint,
        worldChange: "",
      };
    }
  }

  // root_swap must stay within known roots or become conditional
  if (m.root.startsWith("√") && !verse.knownRoots.includes(m.root)) {
    return {
      kind: "conditional",
      message:
        "New root on the same road. What survives from the old walker? What must change?",
      ruleHint: "root swap keeps structure; changes identity",
      worldChange: `root → ${m.root}`,
    };
  }

  return {
    kind: "valid",
    message: "World transforms.",
    worldChange: describeMorphChange(m),
  };
}

function describeMorphChange(m: MorphBit): string {
  const bits: string[] = [`root ${m.root}`];
  if (m.operator) bits.push(`operator ${m.operator}`);
  if (m.tense) bits.push(m.tense);
  if (m.person) bits.push(m.person);
  return bits.join(" · ");
}

export function applyMorphToVerse(
  verse: VerseState,
  morph: MorphBit
): VerseState | null {
  const outcome = validateMorph(morph, verse);
  if (outcome.kind === "invalid") return null;
  // conditional: still allow if user chose to force after seeing the question —
  // product rule: only valid/conditional that user accepts proceed. Caller decides.
  if (outcome.kind !== "valid" && outcome.kind !== "conditional") return null;

  const machines = [...verse.installedMachines];
  if (morph.operator && !machines.includes(morph.operator)) {
    machines.push(morph.operator);
  }
  if (morph.root && !verse.knownRoots.includes(morph.root)) {
    // known roots strengthen rather than duplicate when same; new root installs
  }

  const surface = reconstructSurface(verse, morph);
  const morphBits: MorphBit[] = [
    ...verse.morph.filter((m) => m.root !== morph.root),
    morph,
  ];

  return {
    ...verse,
    surface,
    morph: morphBits,
    installedMachines: machines,
    knownRoots: verse.knownRoots.includes(morph.root)
      ? verse.knownRoots
      : [...verse.knownRoots, morph.root],
  };
}

/** Teaching reconstruction — not a full Pāṇini engine. */
export function reconstructSurface(verse: VerseState, morph: MorphBit): string {
  // asato mā sad gamaya base with √gam
  if (morph.root === "√gam") {
    switch (morph.operator) {
      case "ṇic":
        return "asato mā sad gamayati"; // causative surface teaching form
      case "kta":
        return "asato mā gataḥ"; // resultant
      case "ktvā":
        return "asato mā gatvā"; // having gone
      case "tumun":
        return "asato mā gamitum"; // to go
      case "present":
        return "asato mā sad gacchati"; // ordinary present-ish teaching form
      default:
        return "asato mā sad gamaya";
    }
  }
  if (morph.root === "√bhū") {
    switch (morph.operator) {
      case "ṇic":
        return "asato mā sad bhāvayati";
      case "kta":
        return "asato mā bhūtaḥ";
      case "ktvā":
        return "asato mā bhūtvā";
      case "tumun":
        return "asato mā bhavitum";
      default:
        return "asato mā sad bhavati";
    }
  }
  if (morph.root === "√nī") {
    if (morph.operator === "ṇic") return "asato mā sad nāyayati"; // may be conditional
    return "asato mā sad nayati";
  }
  return verse.surface;
}

export const ASATO_MAM_ASATO: VerseState = {
  id: "asato-ma-sad-gamaya",
  surface: "asato mā sad gamaya",
  tokens: ["asato", "mā", "sad", "gamaya"],
  morph: [
    { root: "√as", operator: "kta", surfaceHint: "asato (asataḥ)" },
    { root: "√gam", operator: "ṇic", surfaceHint: "gamaya", person: "2sg", tense: "loṭ" },
  ],
  semantic: [
    "SOURCE(asat)",
    "DESTINATION(sat)",
    "EVENT(√gam)",
    "CAUSE(event)",
    "COMMAND(to you)",
  ],
  boundaries: ["ḥ + m → o m", "t + g → d g"],
  installedMachines: ["ṇic", "causative"],
  installedGates: ["visarga-o", "voicing t→d"],
  knownRoots: ["√gam"],
};
