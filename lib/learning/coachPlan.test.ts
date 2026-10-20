import { describe, expect, it } from "vitest";

import {
  allowedSanskritTokens,
  extractCandidateJson,
  findUnverifiedSanskrit,
  sanitizeModelAction,
} from "./coachPlan";

describe("coach response validation", () => {
  it("parses fenced JSON and preserves exact task content", () => {
    const payload = extractCandidateJson(
      'Intro text ```json\n{"instruction": "Predict √gam + ṇic aloud.", "stopCondition": "Twice."}\n``` trailing',
    );
    const action = sanitizeModelAction(payload);
    expect(action.instruction).toContain("√gam + ṇic");
    expect(action.stopCondition).toBe("Twice.");
  });

  it("rejects invented Sanskrit while accepting supplied terms", () => {
    const allowed = allowedSanskritTokens({
      task: { id: "manual", stimulus: "√gam + ṇic", expected: "asato mā sad gamayati" },
      context: { root: "√gam", operator: "ṇic", expected: "asato mā sad gamayati" },
    });
    expect(findUnverifiedSanskrit("Use √gam with ṇic.", allowed)).toEqual([]);
    expect(findUnverifiedSanskrit("Now add nāyayati and √bhū.", allowed)).toEqual(
      expect.arrayContaining(["nāyayati", "√bhū", "bhū"]),
    );
    expect(findUnverifiedSanskrit("Now add nāyayati and √bhū.", allowed)).toHaveLength(3);
  });

  it("rejects malformed, overlong, or non-text coach output", () => {
    expect(() => extractCandidateJson("no json here")).toThrow(/JSON/);
    expect(() => sanitizeModelAction({ instruction: "   " })).toThrow(
      /requires instruction text/,
    );
    expect(() => sanitizeModelAction({ instruction: "x".repeat(1501) })).toThrow(/too long/);
    expect(() => sanitizeModelAction({ instruction: "Do this.", stopCondition: 4 })).toThrow(
      /stop condition/,
    );
  });
});
