import { describe, expect, it } from "vitest";

import {
  createAttemptEvent,
  createCoachInstructionEvent,
  exportLearningLog,
  importLearningLog,
  mergeLearningEvents,
  type AttemptEvent,
} from "./events";
import { morphTransferSkillId } from "./skills";

function attempt(overrides: Partial<AttemptEvent> = {}): AttemptEvent {
  return createAttemptEvent({
    source: "simulator",
    skillId: morphTransferSkillId("√gam", "ṇic"),
    taskId: "simulator:play:morph",
    mode: "PLAY",
    modality: "predict",
    stimulus: { root: "√gam", operator: "ṇic" },
    expected: "asato mā sad gamayati",
    response: { root: "√gam", operator: "ṇic" },
    correct: true,
    ...overrides,
  });
}

describe("learning events", () => {
  it("creates schema-versioned canonical attempts", () => {
    const event = attempt();
    expect(event.type).toBe("attempt");
    expect(event.schemaVersion).toBe("learning-events-v1");
    expect(event.id.startsWith("evt_")).toBe(true);
    expect(new Date(event.timestamp).toString()).not.toBe("Invalid Date");
  });

  it("rejects non-canonical skills and invalid values", () => {
    expect(() => attempt({ skillId: "gam" })).toThrow(/non-canonical/);
    expect(() => attempt({ timestamp: "not-a-date" })).toThrow(/timestamp/);
    expect(() => attempt({ confidence: 2 })).toThrow(/Confidence/);
    expect(() => attempt({ taskId: "" })).toThrow(/task ID/);
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(() => attempt({ stimulus: cyclic as never })).toThrow(/JSON/);
  });

  it("deduplicates, sorts, and preserves imports", () => {
    const first = attempt({ timestamp: "2026-10-05T00:00:01.000Z" });
    const second = attempt({
      timestamp: "2026-10-05T00:00:02.000Z",
      response: { root: "√bhū", operator: "ṇic" },
      id: "evt_custom_duplicate",
    });
    const duplicate = { ...second, response: { root: "changed", operator: "changed" } };
    const merged = mergeLearningEvents([second], [first, duplicate]);
    expect(merged.map((event) => event.timestamp)).toEqual([
      "2026-10-05T00:00:01.000Z",
      "2026-10-05T00:00:02.000Z",
    ]);
    expect(merged).toHaveLength(2);
  });

  it("round-trips exports and records coach instructions", () => {
    const log = exportLearningLog([attempt()]);
    const imported = importLearningLog(JSON.parse(JSON.stringify(log)));
    const coach = createCoachInstructionEvent({
      source: "ai-coach",
      skillId: morphTransferSkillId("√gam", "ṇic"),
      taskId: "manual:root-transfer",
      instruction: "Predict the operator aloud before applying it.",
      stopCondition: "Two correct transfers.",
      model: "server-coach",
      validation: "checked",
      usedEventIds: [imported[0].id],
    });
    expect(coach.validation).toBe("checked");
    expect(() => importLearningLog({ version: "wrong", events: [] })).toThrow(
      /Unsupported learning-log/,
    );
  });
});
