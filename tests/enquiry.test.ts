import { describe, expect, it } from "vitest";
import {
  enquiryDecide,
  enquiryFallback,
  enquiryState,
  ENQUIRY_QUESTIONS,
  ENQUIRY_THREADS,
} from "../lib/jev";
import { sessionIdFor } from "../lib/ai";

describe("jev enquiry partner (no key = safe fallback)", () => {
  it("fallback reflects, never pushes", () => {
    const f = enquiryFallback();
    expect((f.thread as any).pick).toBe("reflect_back");
    expect((f.ready_for_harder as any).p).toBe(0);
  });

  it("threads cover the enquiry moves", () => {
    expect([...ENQUIRY_THREADS]).toContain("silence_invite");
    expect([...ENQUIRY_THREADS]).toContain("close_session");
  });

  it("state assembles transcript + island context", () => {
    const s = enquiryState([{ role: "user", text: "who notices?" }], { island: "X-hii-Y-hai" });
    expect(s).toContain("who notices?");
    expect(s).toContain("X-hii-Y-hai");
  });

  it("state carries trajectory position (same words differ by turn)", () => {
    const early = enquiryState([{ role: "user", text: "i don't know" }], {
      trajectory: { turnIndex: 1, totalTurns: 10, movesUsed: [] },
    });
    const late = enquiryState([{ role: "user", text: "i don't know" }], {
      trajectory: { turnIndex: 9, totalTurns: 10, movesUsed: ["RM_03", "UM_02"], arcDirection: "toward aporia" },
    });
    expect(early).not.toBe(late);
    expect(late).toContain("Turn 9");
    expect(late).toContain("RM_03");
  });

  it("decides to fallback without a key (deterministic)", async () => {
    const r = await enquiryDecide([{ role: "user", text: "i keep looping on this thought" }]);
    expect(r.viaJev).toBe(false);
    expect((r.answers.thread as any).pick).toBe("reflect_back");
  });

  it("questions carry instructions + criteria for the Decisions API", () => {
    expect(ENQUIRY_QUESTIONS.thread.type).toBe("choice");
    if (ENQUIRY_QUESTIONS.thread.type === "choice") {
      expect(ENQUIRY_QUESTIONS.thread.criteria.reflect_back).toBeTruthy();
    }
    expect(ENQUIRY_QUESTIONS.depth.type).toBe("score");
    if (ENQUIRY_QUESTIONS.depth.type === "score") {
      expect(ENQUIRY_QUESTIONS.depth.criteria.length).toBe(10);
    }
  });

  it("ai session ids stay stable per conversation", () => {
    const a = [{ role: "user" as const, content: "who am i?" }];
    expect(sessionIdFor(a)).toBe(sessionIdFor(a));
  });
});
