import { recordOutcome } from "../sanskrit/learner";
import type { LearnerObjectState } from "../sanskrit/types";
import { parseSkillId } from "./skills";
import {
  createAttemptEvent,
  type AttemptEvent,
  type LearningEvent,
} from "./events";

export interface SimulatorAttemptInput {
  skillId: string;
  taskId: string;
  mode: "INHABIT" | "DECOMPILE" | "GENERATE" | "PLAY";
  modality?: AttemptEvent["modality"];
  stimulus: AttemptEvent["stimulus"];
  expected?: AttemptEvent["expected"];
  response?: AttemptEvent["response"];
  correct: boolean | null;
  confidence?: number;
  latencyMs?: number;
  source?: AttemptEvent["source"];
  dimension?: AttemptEvent["dimension"];
}

export function commitSimulatorAttempt(
  previous: Record<string, LearnerObjectState>,
  input: SimulatorAttemptInput,
): { learner: Record<string, LearnerObjectState>; event: LearningEvent } {
  const event = createAttemptEvent({
    source: input.source ?? "simulator",
    skillId: input.skillId,
    taskId: input.taskId,
    mode: input.mode,
    modality: input.modality ?? "predict",
    stimulus: input.stimulus,
    expected: input.expected,
    response: input.response,
    correct: input.correct,
    confidence: input.confidence,
    latencyMs: input.latencyMs,
    dimension: input.dimension,
  });

  if (event.type !== "attempt") {
    throw new Error("Simulator attempts must be attempt events");
  }

  const skill = parseSkillId(event.skillId);
  if (!skill) throw new Error(`Attempt uses a non-canonical skill ID: ${event.skillId}`);

  // Observations do not alter aggregate scores, but they remain in the log.
  if (event.correct === null) return { learner: previous, event };

  const wrong =
    typeof event.response === "string" && event.response
      ? event.response
      : event.taskId;
  return { learner: recordOutcome(previous, event.skillId, event.correct, wrong), event };
}

/** Per-dimension tallies: the scheduler knows WHAT failed, not just that it failed. */
export function dimensionTallies(events: AttemptEvent[]): Record<
  string,
  Record<string, { seen: number; correct: number }>
> {
  const out: Record<string, Record<string, { seen: number; correct: number }>> = {};
  for (const e of events) {
    if (e.type !== "attempt" || e.correct === null) continue;
    const dim = e.dimension ?? "unspecified";
    out[e.skillId] ??= {};
    out[e.skillId][dim] ??= { seen: 0, correct: 0 };
    out[e.skillId][dim].seen += 1;
    if (e.correct) out[e.skillId][dim].correct += 1;
  }
  return out;
}
