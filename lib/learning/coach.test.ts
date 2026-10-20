import { describe, expect, it } from "vitest";

import { selectNextManualTask } from "./coach";
import { createAttemptEvent } from "./events";
import { defaultLearner } from "../sanskrit/learner";
import { morphTransferSkillId, sandhiBoundarySkillId } from "./skills";

function gradedAttempt(
  skillId: string,
  correct: boolean,
  timestamp: string,
  response = "test response",
) {
  return createAttemptEvent({
    source: "simulator",
    skillId,
    taskId: "simulator:test",
    mode: "PLAY",
    modality: "predict",
    stimulus: "test stimulus",
    response,
    correct,
    timestamp,
  });
}

describe("manual task selection", () => {
  it("targets a repeatedly missed operator-transfer skill", () => {
    const skillId = morphTransferSkillId("√gam", "ṇic");
    const events = [
      gradedAttempt(skillId, false, "2026-10-05T00:00:01.000Z", "plain"),
      gradedAttempt(skillId, false, "2026-10-05T00:00:02.000Z", "kta"),
    ];
    const task = selectNextManualTask({
      learner: defaultLearner(),
      events,
      current: { mode: "PLAY", taskId: "current", skillId },
    });
    expect(task.id).toBe("manual:root-transfer");
    expect(task.skillId).toBe(skillId);
    expect(task.stopCondition.length).toBeGreaterThan(0);
  });

  it("targets sandhi when its recent accuracy is lower", () => {
    const sandhi = sandhiBoundarySkillId("sat", "gamaya");
    const morph = morphTransferSkillId("√gam", "ṇic");
    const events = [
      gradedAttempt(sandhi, false, "2026-10-05T00:00:01.000Z", "sat gamaya"),
      gradedAttempt(sandhi, false, "2026-10-05T00:00:02.000Z", "sat gamaya"),
      gradedAttempt(morph, true, "2026-10-05T00:00:03.000Z", "ṇic"),
    ];
    const task = selectNextManualTask({ learner: defaultLearner(), events });
    expect(task.id).toBe("manual:sandhi-boundary");
    expect(task.skillId).toBe(sandhi);
  });
});
