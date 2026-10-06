import { describe, expect, it } from "vitest";
import { createAttemptEvent } from "../lib/learning/events";
import { dimensionTallies } from "../lib/learning/skillModel";
import { verseReverseSkillId } from "../lib/learning/skills";

const SKILL = verseReverseSkillId("lineage");

const ev = (skillId: string, dimension: string | undefined, correct: boolean | null) =>
  createAttemptEvent({
    source: "simulator",
    skillId,
    taskId: "t",
    mode: "PLAY",
    modality: "predict",
    stimulus: "s",
    correct,
    ...(dimension ? { dimension } : {}),
  });

describe("dimension-aware scheduling", () => {
  it("tallies per-dimension mastery separately", () => {
    const events = [
      ev(SKILL, "audio-recognition", true),
      ev(SKILL, "audio-recognition", true),
      ev(SKILL, "productive-speech", false),
      ev(SKILL, "productive-speech", false),
      ev(SKILL, undefined, true),
    ];
    const t = dimensionTallies(events);
    expect(t[SKILL]["audio-recognition"]).toEqual({ seen: 2, correct: 2 });
    expect(t[SKILL]["productive-speech"]).toEqual({ seen: 2, correct: 0 });
    // same item: recognized perfectly, unproducible — different memories, as claimed
  });

  it("skips null (observation) events", () => {
    const events = [ev(SKILL, "lexical-recall", null)];
    expect(dimensionTallies(events)).toEqual({});
  });
});
