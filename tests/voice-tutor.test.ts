import { describe, expect, it } from "vitest";
import { buildTutorPrompt } from "../lib/voice-tutor/provider";
import { QwenProvider } from "../lib/voice-tutor/qwen";
import { checkAdherence, logTurn, scoreTurn } from "../lib/voice-tutor/recordTurn";
import { scoreSession } from "../lib/voice-tutor/ab";

function mockSocket() {
  const sent: string[] = [];
  const listeners: Record<string, Array<(ev: { data?: string }) => void>> = {};
  return {
    sent,
    socket: {
      send: (d: string) => sent.push(d),
      close: () => {},
      addEventListener: (t: string, fn: (ev: { data?: string }) => void) => {
        (listeners[t] ??= []).push(fn);
      },
    },
    emit: (type: string, obj: Record<string, unknown>) => {
      for (const fn of listeners[type] ?? []) fn({ data: JSON.stringify(obj) });
    },
  };
}

const WORLD = {
  world: "test",
  knownConstructions: [{ id: "a", form: "मैं X कर रहा हूँ", meaning: "doing" }],
  activeVocabCount: 10,
  recognizedVocabCount: 20,
};

describe("voice tutor", () => {
  it("builds one shared prompt for all backends", () => {
    const p = buildTutorPrompt({
      ...WORLD,
      targetConstruction: { id: "t", form: "X क्योंकि Y", meaning: "because" },
    });
    expect(p).toContain("मैं X कर रहा हूँ");
    expect(p).toContain("X क्योंकि Y");
    expect(p).toContain("Recast");
  });

  it("Qwen provider: open sends session.update with tools", async () => {
    const m = mockSocket();
    const q = new QwenProvider("wss://x", "k", () => m.socket);
    await q.connect({ backend: "qwen" }, "PROMPT");
    m.emit("open", {});
    const update = JSON.parse(m.sent[0]);
    expect(update.type).toBe("session.update");
    expect(JSON.stringify(update)).toContain("record_turn");
    expect(JSON.stringify(update)).toContain("PROMPT");
  });

  it("Qwen provider: audio delta fires bytes, transcript extracts text", async () => {
    const m = mockSocket();
    const q = new QwenProvider("wss://x", "k", () => m.socket);
    const audios: ArrayBuffer[] = [];
    const talks: string[] = [];
    q.onAudio((b) => audios.push(b));
    q.onTranscript((t) => talks.push(t.textHindi));
    await q.connect({ backend: "qwen" }, "P");
    m.emit("open", {});
    const b64 = Buffer.from([1, 2, 3, 4]).toString("base64");
    m.emit("message", { type: "response.audio.delta", delta: b64 });
    expect(audios.length).toBe(1);
    expect(new Uint8Array(audios[0])).toEqual(new Uint8Array([1, 2, 3, 4]));
    m.emit("message", {
      type: "conversation.item.created",
      item: { role: "assistant", content: [{ transcript: "नमस्ते" }] },
    });
    expect(talks).toEqual(["नमस्ते"]);
  });

  it("Qwen provider: tool round-trip returns output + new response", async () => {
    const m = mockSocket();
    const q = new QwenProvider("wss://x", "k", () => m.socket);
    q.onToolCall(async () => ({ ok: true }));
    await q.connect({ backend: "qwen" }, "P");
    m.emit("open", {});
    m.emit("message", {
      type: "response.function_call_arguments.done",
      name: "record_turn",
      call_id: "c1",
      arguments: JSON.stringify({ learner_text: "मैं हिंदी सीख रहा हूँ।" }),
    });
    await new Promise((r) => setTimeout(r, 20));
    const types = m.sent.map((s) => JSON.parse(s).type);
    expect(types).toContain("conversation.item.create");
    expect(types).toContain("response.create");
  });

  it("record_turn scores productive vs unrecognized turns", () => {
    const good = scoreTurn({ learner_text: "मैं हिंदी सीख रहा हूँ।" });
    expect(good.understood).toBe(true);
    expect(good.dimension).toBe("productive-speech");
    const bad = scoreTurn({ learner_text: "xyz abc" });
    expect(bad.understood).toBe(false);
    expect(bad.dimension).toBe("audio-recognition");
  });

  it("logTurn writes canonical dimensioned attempt", () => {
    const { result } = logTurn({}, { learner_text: "मैं हिंदी सीख रहा हूँ।" });
    expect(result.frameId).toBe("progressive");
  });

  it("checkAdherence flags uninstalled markers in tutor speech", () => {
    const known = ["मैं X कर रहा हूँ"];
    expect(checkAdherence("मैं हिंदी सीख रहा हूँ।", known).ok).toBe(true);
    const bad = checkAdherence("क्या मैं जा सकता हूँ?", known);
    expect(bad.ok).toBe(false);
    expect(bad.flags.join()).toContain("क्या");
  });

  it("AB scoring measures hindi-ratio and target introduction", () => {
    const s = scoreSession(
      [
        { role: "tutor", textHindi: "मैं हिंदी सीख रहा हूँ।", at: "" },
        { role: "tutor", textHindi: "Hello there friend", at: "" },
      ],
      ["मैं X कर रहा हूँ"],
      undefined,
      "सीख"
    );
    expect(s.turns).toBe(2);
    expect(s.hindiRatio).toBeGreaterThan(0.3);
    expect(s.hindiRatio).toBeLessThan(1);
    expect(s.targetIntroduced).toBe(true);
  });
});
