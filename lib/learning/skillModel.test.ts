import { describe, expect, it } from "vitest";

import { commitSimulatorAttempt } from "./skillModel";
import { createAttemptEvent } from "./events";
import { defaultLearner } from "../sanskrit/learner";
import { morphTransferSkillId, sandhiBoundarySkillId } from "./skills";

describe("simulator attempt integration", () => {
  it("updates the canonical skill for a correct outcome", () => {
    const { learner, event } = commitSimulatorAttempt(defaultLearner(), {
      skillId: morphTransferSkillId("√gam", "ṇic"),
      taskId: "simulator:play:morph",
      mode: "PLAY",
      modality: "predict",
      stimulus: { root: "√gam", operator: "ṇic" },
      expected: "asato mā sad gamayati",
      response: { root: "√gam", operator: "ṇic" },
      correct: true,
    });

    expect(event.type).toBe("attempt");
    if (event.type !== "attempt") throw new Error("Expected attempt event");
    const skill = learner[event.skillId];
    expect(event.skillId).toBe("root:√gam.operator:ṇic.operatorTransfer");
    expect(skill?.recognition).toBeGreaterThan(0.5);
    expect(skill?.errors).toBe(0);
  });

  it("records errors and confusion without changing unrelated skills", () => {
    const { learner } = commitSimulatorAttempt(defaultLearner(), {
      skillId: sandhiBoundarySkillId("sat", "gamaya"),
      taskId: "simulator:play:sandhi",
      mode: "PLAY",
      stimulus: { left: "sat", right: "gamaya" },
      expected: "sad gamaya",
      response: "sat gamaya",
      correct: false,
    });

    const skill = learner["sandhi:sat__plus__gamaya.reverseParse"];
    expect(skill?.errors).toBe(1);
    expect(skill?.confusions).toContain("sat gamaya");
    expect(learner["√gam"].confusions).toContain("√nī");
  });

  it("keeps observations in the event without changing aggregate scores", () => {
    const event = createAttemptEvent({
      source: "simulator",
      skillId: sandhiBoundarySkillId("sat", "gamaya"),
      taskId: "simulator:verse:load",
      mode: "DECOMPILE",
      modality: "review",
      stimulus: "asato mā sad gamaya",
      response: "verse opened",
      correct: null,
    });
    const { learner } = commitSimulatorAttempt(defaultLearner(), {
      skillId: event.skillId,
      taskId: event.taskId,
      mode: "DECOMPILE",
      stimulus: event.stimulus,
      response: event.response,
      correct: null,
    });
    expect(learner[event.skillId]).toBeUndefined();
  });
});
