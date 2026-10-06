/**
 * QwenProvider — qwen3.8-omni-flash-realtime (Singapore) behind VoiceProvider.
 * Protocol: Alibaba realtime WS (OpenAI-realtime-shaped events, VAD mode).
 * Docs: docs/qwen-omni-realtime.md + interaction-process guide.
 */

import type {
  TutorSessionConfig,
  TutorBackend,
  TutorTurn,
  VoiceProvider,
} from "./provider";

export const QWEN_WS_SG =
  "wss://{workspace}.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime?model=qwen3.8-omni-flash-realtime";

export const RECORD_TURN_TOOL = {
  type: "function",
  name: "record_turn",
  description: "Log a learner turn for scoring. Call after each learner utterance.",
  parameters: {
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

type SocketFactory = (url: string, apiKey: string) => SocketLike;

export class QwenProvider implements VoiceProvider {
  readonly backend: TutorBackend = "qwen";
  connected = false;
  private ws: SocketLike | null = null;
  private toolBuf = "";
  private toolName = "";
  private toolHandler: ((name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>) | null = null;
  private transcriptCbs: Array<(t: TutorTurn) => void> = [];
  private audioCbs: Array<(pcm: ArrayBuffer) => void> = [];

  constructor(
    private endpoint: string,
    private apiKey: string,
    private socketFactory?: SocketFactory
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
    const make: SocketFactory =
      this.socketFactory ??
      ((url, key) => {
        const WS = (globalThis as unknown as { WebSocket: new (u: string, p?: string[]) => WebSocket }).WebSocket;
        if (!WS) throw new Error("No WebSocket available; pass a socketFactory.");
        const s = new WS(url, ["realtime", `openai-insecure-api-key.${key}`, "openai-beta.realtime-v1"]);
        return {
          send: (d: string) => s.send(d),
          close: () => s.close(),
          addEventListener: (t: string, fn: (ev: { data?: string }) => void) =>
            s.addEventListener(t, fn as EventListener),
        };
      });
    this.ws = make(this.endpoint, this.apiKey);
    this.ws.addEventListener("message", (ev) => this.handle(String(ev.data ?? "")));
    this.ws.addEventListener("open", () => {
      this.connected = true;
      this.send({
        type: "session.update",
        session: {
          turn_detection: { type: "server_vad" },
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          voice: config.voice ?? "Tina",
          instructions: prompt,
          tools: [RECORD_TURN_TOOL],
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
    this.send({ type: "input_audio_buffer.append", audio: b64 });
  }

  endUtterance(): void {
    this.send({ type: "input_audio_buffer.commit" });
    this.send({ type: "response.create" });
  }

  private send(obj: unknown): void {
    this.ws?.send(JSON.stringify(obj));
  }

  private emitTranscript(t: TutorTurn): void {
    for (const cb of this.transcriptCbs) cb(t);
  }
  private emitAudio(pcm: ArrayBuffer): void {
    for (const cb of this.audioCbs) cb(pcm);
  }

  handle(raw: string): void {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }
    const type = msg.type as string;
    if (type === "response.audio.delta") {
      const b64 = (msg.delta as string) ?? "";
      const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
      const buf = new ArrayBuffer(bin.length);
      const u8 = new Uint8Array(buf);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      this.emitAudio(buf);
    } else if (type === "response.audio_transcript.done" || type === "conversation.item.created") {
      const item = (msg.item ?? msg) as Record<string, unknown>;
      const text = this.extractText(item);
      if (text) {
        const role = (item.role as string) === "user" ? "user" : "tutor";
        this.emitTranscript({ role, textHindi: text, at: new Date().toISOString() });
      }
    } else if (type === "response.function_call_arguments.delta") {
      this.toolBuf += (msg.delta as string) ?? "";
      if (msg.name) this.toolName = msg.name as string;
    } else if (type === "response.function_call_arguments.done") {
      const name = (msg.name as string) || this.toolName || "record_turn";
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(this.toolBuf || (msg.arguments as string) || "{}") as Record<string, unknown>;
      } catch {}
      this.toolBuf = "";
      const handler = this.toolHandler;
      if (handler) {
        void handler(name, args).then((result) => {
          this.send({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: (msg.call_id as string) ?? "",
              output: JSON.stringify(result),
            },
          });
          this.send({ type: "response.create" });
        });
      }
    }
  }

  private extractText(item: Record<string, unknown>): string {
    const content = item.content as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(content)) {
      return content
        .map((c) => (c.transcript as string) || (c.text as string) || "")
        .join("")
        .trim();
    }
    return ((item.transcript as string) || (item.text as string) || "").trim();
  }
}
