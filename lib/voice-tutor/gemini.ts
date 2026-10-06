/**
 * GeminiProvider — Gemini Live API behind VoiceProvider.
 * WS protocol: BidiGenerateContent setup + realtimeInput audio/text,
 * serverContent modelTurn inlineData, transcriptions, toolCall/toolResponse.
 * Default model gemini-3.8-live (configurable; see docs/voice-tutor.md).
 */
import type { TutorBackend, TutorSessionConfig, TutorTurn, VoiceProvider } from "./provider";

export const GEMINI_WS =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

export const GEMINI_TOOL_DECL = {
  name: "record_turn",
  description: "Log a learner turn for scoring. Call after each learner utterance.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      learner_text: { type: "string" },
      expected_machines: { type: "array", items: { type: "string" } },
      target_machine: { type: "string" },
    },
    required: ["learner_text"],
  },
} as const;

type SocketLike = {
  send(data: string): void;
  close(): void;
  addEventListener(type: string, fn: (ev: { data?: string }) => void): void;
};

type SocketFactory = (url: string) => SocketLike;

export class GeminiProvider implements VoiceProvider {
  readonly backend: TutorBackend = "gemini";
  connected = false;
  private ws: SocketLike | null = null;
  private toolHandler: ((name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>) | null = null;
  private transcriptCbs: Array<(t: TutorTurn) => void> = [];
  private audioCbs: Array<(pcm: ArrayBuffer) => void> = [];

  constructor(
    private endpoint: string,
    private socketFactory?: SocketFactory,
    private model = "models/gemini-3.8-live"
  ) {}

  onTranscript(cb: (t: TutorTurn) => void): void {
    this.transcriptCbs.push(cb);
  }
  onAudio(cb: (pcm: ArrayBuffer) => void): void {
    this.audioCbs.push(cb);
  }
  onToolCall(cb: (name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>): void {
    this.toolHandler = cb;
  }

  async connect(config: TutorSessionConfig, prompt: string): Promise<void> {
    void config;
    const make: SocketFactory =
      this.socketFactory ??
      ((url) => {
        const WS = (globalThis as unknown as { WebSocket: new (u: string) => WebSocket }).WebSocket;
        if (!WS) throw new Error("No WebSocket available; pass a socketFactory.");
        const s = new WS(url);
        return {
          send: (d: string) => s.send(d),
          close: () => s.close(),
          addEventListener: (t: string, fn: (ev: { data?: string }) => void) =>
            s.addEventListener(t, fn as EventListener),
        };
      });
    this.ws = make(this.endpoint);
    this.ws.addEventListener("message", (ev) => this.handle(String(ev.data ?? "")));
    this.ws.addEventListener("open", () => {
      this.connected = true;
      this.send({
        setup: {
          model: this.model,
          responseModalities: ["AUDIO"],
          systemInstruction: { parts: [{ text: prompt }] },
          tools: [{ functionDeclarations: [GEMINI_TOOL_DECL] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });
    });
  }

  disconnect(): void {
    try {
      this.ws?.close();
    } catch {}
    this.ws = null;
    this.connected = false;
  }

  sendAudioChunk(pcm16k: ArrayBuffer): void {
    const bytes = new Uint8Array(pcm16k);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = typeof btoa !== "undefined" ? btoa(bin) : Buffer.from(bytes).toString("base64");
    this.send({ realtimeInput: { audio: { data: b64, mimeType: "audio/pcm;rate=16000" } } });
  }

  endUtterance(): void {
    this.send({ realtimeInput: { text: "" } });
  }

  private send(obj: unknown): void {
    this.ws?.send(JSON.stringify(obj));
  }

  handle(raw: string): void {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }
    const sc = msg.serverContent as Record<string, unknown> | undefined;
    if (sc) {
      const turn = sc.modelTurn as Record<string, unknown> | undefined;
      const parts = turn?.parts as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(parts)) {
        for (const p of parts) {
          const inline = p.inlineData as Record<string, unknown> | undefined;
          if (inline?.data) {
            const b64 = inline.data as string;
            const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
            const buf = new ArrayBuffer(bin.length);
            const u8 = new Uint8Array(buf);
            for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            for (const cb of this.audioCbs) cb(buf);
          }
        }
      }
      const out = sc.outputTranscription as Record<string, unknown> | undefined;
      if (out?.text) this.emitTranscript("tutor", String(out.text));
      const inp = sc.inputTranscription as Record<string, unknown> | undefined;
      if (inp?.text) this.emitTranscript("user", String(inp.text));
    }
    const toolCall = msg.toolCall as
      | { name?: string; args?: Record<string, unknown>; id?: string }
      | undefined;
    if (toolCall) {
      const name = toolCall.name ?? "record_turn";
      const args = toolCall.args ?? {};
      const id = toolCall.id ?? "";
      const handler = this.toolHandler;
      if (handler) {
        void handler(name, args).then((result) => {
          this.send({ toolResponse: { id, name, response: { result } } });
        });
      }
    }
  }

  private emitTranscript(role: "user" | "tutor", text: string): void {
    if (!text.trim()) return;
    for (const cb of this.transcriptCbs) cb({ role, textHindi: text, at: new Date().toISOString() });
  }
}
