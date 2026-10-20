import {
  isAttemptEvent,
  type AttemptEvent,
  type LearningEvent,
} from "./events";
import { parseSkillId, type CanonicalSkill } from "./skills";
import type { LearnerObjectState } from "../sanskrit/types";
import { weakestGeneralization } from "../sanskrit/learner";
import type { Mode } from "../sanskrit/types";

export interface ManualContext {
  mode: Mode;
  taskId: string;
  skillId?: string;
  stimulus: string;
  expected?: string;
  canvas?: Record<string, string>;
}

export interface ManualTask {
  id: string;
  title: string;
  mode: Mode;
  skillId: string;
  stimulus: string;
  expected?: string;
  checks: string[];
  stopCondition: string;
  objective: string;
}

export interface LearnerSnapshot {
  generatedAt: string;
  totalEvents: number;
  gradedEvents: number;
  recentAccuracy: number | null;
  skills: Array<{
    skillId: string;
    kind: CanonicalSkill["kind"];
    dimension: CanonicalSkill["dimension"];
    attempts: number;
    accuracy: number | null;
    medianLatencyMs: number | null;
    errors: number;
    confusions: string[];
  }>;
  legacyWeakest?: { id: string; field: string; value: number } | null;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeLearner(
  learner: Record<string, LearnerObjectState>,
  events: LearningEvent[],
  lookback = 12,
): LearnerSnapshot {
  const attempts = events.filter(isAttemptEvent).slice(-Math.max(0, lookback));
  const graded = attempts.filter((event) => typeof event.correct === "boolean");
  const latencies = graded
    .map((event) => event.latencyMs)
    .filter((value): value is number => typeof value === "number");

  const bySkill = new Map<string, AttemptEvent[]>();
  for (const event of attempts) {
    const skill = parseSkillId(event.skillId);
    if (!skill) continue;
    const list = bySkill.get(skill.id) ?? [];
    list.push(event);
    bySkill.set(skill.id, list);
  }

  const skillIds = new Set<string>([
    ...Object.keys(learner),
    ...[...bySkill.keys()],
  ]);

  const skills = [...skillIds]
    .map((id) => parseSkillId(id))
    .filter((skill): skill is CanonicalSkill => skill !== null)
    .map((skill) => {
      const skillEvents = bySkill.get(skill.id) ?? [];
      const gradedEvents = skillEvents.filter((event) => typeof event.correct === "boolean");
      const confusions = new Set<string>();
      const state = learner[skill.id];
      for (const confusion of state?.confusions ?? []) confusions.add(confusion);
      for (const event of skillEvents) {
        if (event.correct === false && typeof event.response === "string") {
          confusions.add(event.response);
        }
      }
      return {
        skillId: skill.id,
        kind: skill.kind,
        dimension: skill.dimension,
        attempts: skillEvents.length,
        accuracy:
          gradedEvents.length > 0
            ? gradedEvents.filter((event) => event.correct).length / gradedEvents.length
            : null,
        medianLatencyMs: median(
          gradedEvents
            .map((event) => event.latencyMs)
            .filter((value): value is number => typeof value === "number"),
        ),
        errors: skillEvents.filter((event) => event.correct === false).length,
        confusions: [...confusions].slice(0, 8),
      };
    })
    .sort((a, b) => {
      const left = a.accuracy ?? Number.POSITIVE_INFINITY;
      const right = b.accuracy ?? Number.POSITIVE_INFINITY;
      if (left !== right) return left - right;
      return b.errors - a.errors;
    });

  return {
    generatedAt: new Date().toISOString(),
    totalEvents: events.filter(isAttemptEvent).length,
    gradedEvents: graded.length,
    recentAccuracy:
      graded.length > 0
        ? graded.filter((event) => event.correct).length / graded.length
        : null,
    skills,
    legacyWeakest: weakestGeneralization(learner),
  };
}

const TASK_TEMPLATES: Record<string, Omit<ManualTask, "skillId" | "stimulus" | "expected">> = {
  "root-transfer": {
    id: "manual:root-transfer",
    title: "Predict the operator before applying it",
    mode: "PLAY",
    checks: [
      "State the root and operator aloud before pressing Apply",
      "Read the valid/conditional/invalid verdict",
      "Name the world change or the blocking question",
    ],
    stopCondition: "Two consecutive correct operator transfers for the target root.",
    objective: "Transfer one operator to a new root without guessing.",
  },
  "sandhi-boundary": {
    id: "manual:sandhi-boundary",
    title: "Predict the boundary, then collide",
    mode: "PLAY",
    checks: [
      "Write or say the boundary first",
      "Press Collide",
      "Compare the predicted and actual boundary",
    ],
    stopCondition: "Two consecutive correct boundary predictions.",
    objective: "Read collision geometry instead of memorizing sandhi tables.",
  },
  "verse-reverse": {
    id: "manual:verse-reverse",
    title: "Peel the surface before revealing it",
    mode: "DECOMPILE",
    checks: [
      "List candidate roots before revealing the hidden machinery",
      "Name each operator",
      "Say what survives the transformation",
    ],
    stopCondition: "One independent reverse-parse with no reveal.",
    objective: "Recover hidden morphology from a real surface form.",
  },
  "phoneme-production": {
    id: "manual:phoneme-production",
    title: "Decode coordinates into one phoneme",
    mode: "PLAY",
    checks: [
      "Read place plus voice/aspirate/nasal",
      "Produce the phoneme before pressing Hear",
      "Use Hear only to verify",
    ],
    stopCondition: "Three consecutive coordinate decodes.",
    objective: "Generate sounds from features instead of recalling cards.",
  },
  "zone-review": {
    id: "manual:zone-review",
    title: "One zone, one testable action",
    mode: "INHABIT",
    checks: ["Choose exactly one locus", "Do the action", "Log what changed"],
    stopCondition: "One clean repetition with no lookup.",
    objective: "Convert map browsing into an installed locus.",
  },
};

function templateForSkill(skill: CanonicalSkill | null, legacyWeakest?: { id: string } | null): keyof typeof TASK_TEMPLATES {
  if (!skill) {
    if (legacyWeakest?.id === "sandhi") return "sandhi-boundary";
    if (legacyWeakest?.id && legacyWeakest.id.startsWith("verse:")) return "verse-reverse";
    return "root-transfer";
  }
  if (skill.kind === "sandhi") return "sandhi-boundary";
  if (skill.kind === "verse") return "verse-reverse";
  if (skill.kind === "phoneme") return "phoneme-production";
  if (skill.kind === "zone" || skill.kind === "drill" || skill.kind === "audio") {
    return "zone-review";
  }
  return "root-transfer";
}

export function selectNextManualTask(input: {
  learner: Record<string, LearnerObjectState>;
  events: LearningEvent[];
  current?: Partial<ManualContext>;
}): ManualTask {
  const snapshot = summarizeLearner(input.learner, input.events);
  const practiced = snapshot.skills.find((skill) => skill.attempts > 0 && skill.accuracy !== null);
  const unpracticed = snapshot.skills.find((skill) => skill.attempts === 0);
  const selectedSkillId = input.current?.skillId ?? practiced?.skillId ?? unpracticed?.skillId;
  const selected = selectedSkillId ? parseSkillId(selectedSkillId) : null;
  const template = TASK_TEMPLATES[templateForSkill(selected, snapshot.legacyWeakest)];

  const stimulus =
    input.current?.stimulus ??
    (selected
      ? `${selected.kind} practice: ${selected.path}`
      : "Choose one unsettled Sanskrit relation");
  const expected =
    input.current?.expected ??
    (selected?.dimension === "operatorTransfer" ? "Name the operator, apply it, read the verdict" : undefined);

  return {
    ...template,
    skillId: selected?.id ?? input.current?.skillId ?? "root:review.operatorTransfer",
    stimulus,
    expected,
  };
}
