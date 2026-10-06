import { describe, expect, it } from "vitest";
import { buildSSML } from "../lib/hindi/ssml";

describe("Edge TTS SSML builder", () => {
  it("builds hi-IN SwaraNeural SSML by default", () => {
    const ssml = buildSSML({ text: "मैं हिंदी सीख रहा हूँ।" });
    expect(ssml).toContain('voice name="hi-IN-SwaraNeural"');
    expect(ssml).toContain("मैं हिंदी सीख रहा हूँ।");
    expect(ssml).toContain('rate="0.9"');
  });

  it("escapes XML entities", () => {
    const ssml = buildSSML({ text: "a & b <c>" });
    expect(ssml).toContain("a &amp; b &lt;c&gt;");
    expect(ssml).not.toContain("a & b");
  });
});
