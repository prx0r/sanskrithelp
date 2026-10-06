/**
 * record_turn handler + tutor-output validation.
 * Model proposes; deterministic grammar disposes (awesomevision pipeline).
 */
import { decompileHindi } from "../memory/hindiDecompile";
import { createAttemptEvent } from "../learning/events";
import { commitSimulatorAttempt } from "../learning/skillModel";
import { zoneSkillId } from "../learning/skills";
import type { LearnerObjectState } from "../sanskrit/types";

export interface RecordTurnArgs {
  learner_text: string;
  expected_machines?: string[];
  target_machine?: string;
}

export interface RecordTurnResult {
  understood: boolean;
  usedTarget: boolean;
  frameId: string | null;
  unknownSpans: string[];
  dimension: string;
}

/** Score a learner turn against expected/target machines. */
export function scoreTurn(args: RecordTurnArgs): RecordTurnResult {
  const d = decompileHindi(args.learner_text || "");
  const understood = d.subjectId !== null || d.phraseId !== null || d.frameId !== null;
  const usedTarget =
    !!args.target_machine &&
    (d.frameId === args.target_machine ||
      (d.unknown.join(" ").includes(args.target_machine) as boolean));
  return {
    understood,
    usedTarget,
    frameId: d.frameId,
    unknownSpans: d.unknown,
    dimension: understood ? "productive-speech" : "audio-recognition",
  };
}

export function logTurn(
  previous: Record<string, LearnerObjectState>,
  args: RecordTurnArgs
): { learner: Record<string, LearnerObjectState>; result: RecordTurnResult } {
  const result = scoreTurn(args);
  const skillId = zoneSkillId("hindi-voice", result.understood ? "production" : "recognition");
  const { learner } = commitSimulatorAttempt(previous, {
    skillId,
    taskId: `voice:${Date.now()}`,
    mode: "PLAY",
    modality: "audio",
    stimulus: args.learner_text,
    expected: args.expected_machines ?? [],
    response: result.frameId ?? result.unknownSpans.join(" "),
    correct: result.understood,
    dimension: result.dimension,
    source: "simulator",
  });
  return { learner, result };
}

/** Validate a TUTOR utterance: every construction used must be known or the target. */
export function checkAdherence(
  tutorHindi: string,
  knownForms: string[],
  targetForm?: string
): { ok: boolean; flags: string[] } {
  const flags: string[] = [];
  // v0: question-markers and modals must come from the known set
  const markers = ["क्या", "सकता", "सकती", "चाहता", "चाहती", "रहा", "रही"];
  const knownText = knownForms.join(" ") + " " + (targetForm ?? "");
  for (const m of markers) {
    if (tutorHindi.includes(m) && !knownText.includes(m)) {
      flags.push(`uninstalled marker in tutor speech: ${m}`);
    }
  }
  return { ok: flags.length === 0, flags };
}
