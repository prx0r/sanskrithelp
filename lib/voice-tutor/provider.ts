/**
 * VoiceTutorProvider — one interface, many realtime voice backends.
 * First backend: Qwen (qwen3.8-omni-flash-realtime, Singapore).
 * The model is the mouth; the Constructicon + learner state is the teacher.
 */

export type TutorBackend = "qwen" | "gemini" | "openai";

export interface KnownConstruction {
  id: string;
  form: string;
  meaning: string;
}

export interface TutorWorldState {
  world: string;
  sutra?: string;
  knownConstructions: KnownConstruction[];
  targetConstruction?: KnownConstruction;
  activeVocabCount: number;
  recognizedVocabCount: number;
}

export interface TutorSessionConfig {
  backend: TutorBackend;
  voice?: string;
  hindiBias?: string[];
  maxTurns?: number;
}

export interface TutorTurn {
  role: "user" | "tutor";
  textHindi: string;
  at: string;
}

export interface TurnScore {
  understood: boolean;
  usedTarget: boolean;
  offGrammar: string[];
  dimension: string;
}

/** Shared system-prompt builder: identical constraints on every backend (A/B fair). */
export function buildTutorPrompt(state: TutorWorldState): string {
  const known = state.knownConstructions.map((c) => `${c.form} = ${c.meaning}`).join("\n");
  const target = state.targetConstruction
    ? `TARGET TODAY (introduce at most this one new structure):\n${state.targetConstruction.form} = ${state.targetConstruction.meaning}`
    : "TARGET TODAY: none — fluency only, zero new grammar.";
  return [
    "You are a Hindi conversation teacher. Respond in Hindi unless the learner says English.",
    "Prefer the KNOWN constructions below. Recast minor errors naturally; stop only when comprehension fails.",
    "",
    `CURRENT WORLD\n${state.world}${state.sutra ? `\nSutra: ${state.sutra}` : ""}`,
    "",
    "KNOWN CONSTRUCTIONS",
    known || "(none yet)",
    "",
    target,
    "",
    `KNOWN ACTIVE VOCAB ~${state.activeVocabCount} items.`,
    "TEACHING RULE: meaningful conversation first. One target structure max. Recast, don't lecture.",
  ].join("\n");
}

export interface VoiceProvider {
  readonly backend: TutorBackend;
  connect(config: TutorSessionConfig, prompt: string): Promise<void>;
  disconnect(): void;
  sendAudioChunk(pcm16k: ArrayBuffer): void;
  endUtterance(): void;
  onTranscript(cb: (t: TutorTurn) => void): void;
  onAudio(cb: (pcm24k: ArrayBuffer) => void): void;
  onToolCall(cb: (name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>): void;
  readonly connected: boolean;
}
