import { describe, expect, it } from "vitest";
import {
  enquiryDecide,
  enquiryFallback,
  enquiryState,
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

  it("decides to fallback without a key (deterministic)", async () => {
    const r = await enquiryDecide([{ role: "user", text: "i keep looping on this thought" }]);
    expect(r.viaJev).toBe(false);
    expect((r.answers.thread as any).pick).toBe("reflect_back");
  });

  it("ai session ids stay stable per conversation", () => {
    const a = [{ role: "user" as const, content: "who am i?" }];
    expect(sessionIdFor(a)).toBe(sessionIdFor(a));
  });
});
