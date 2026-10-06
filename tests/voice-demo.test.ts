import { describe, expect, it } from "vitest";
import { demoTutorTurn } from "../lib/voice-tutor/demoTutor";

describe("demo tutor brain", () => {
  it("recasts understood turns into next questions", () => {
    const r = demoTutorTurn("मैं हिंदी सीख रहा हूँ।", 0);
    expect(r.score.understood).toBe(true);
    expect(r.say).toContain("अच्छा");
  });

  it("asks to repeat when nothing parses", () => {
    const r = demoTutorTurn("xyz abc", 0);
    expect(r.score.understood).toBe(false);
    expect(r.say).toContain("फिर से कहिए");
  });

  it("steers every 3rd turn toward the target structure", () => {
    const r = demoTutorTurn("मैं हिंदी सीख रहा हूँ।", 2, "अभ्यास क्योंकि मन शांत होता है");
    expect(r.say).toContain("अभ्यास क्योंकि मन शांत होता है");
  });
});
