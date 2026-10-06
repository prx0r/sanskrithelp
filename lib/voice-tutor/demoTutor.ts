/**
 * Demo tutor brain: scripted Hindi teacher, zero keys.
 * Learner speech -> webkitSpeechRecognition (hi-IN) -> decompileHindi ->
 * recast + next prompt from installed machines -> Edge TTS reply.
 * Qwen Live replaces mic+voice; the pedagogy (recast/next/score) stays identical.
 */
import { decompileHindi } from "../memory/hindiDecompile";
import { scoreTurn } from "./recordTurn";

export interface DemoReply {
  say: string;
  score: ReturnType<typeof scoreTurn>;
}

const NEXT_QUESTIONS = [
  "चैतन्य और मन में क्या अंतर है?",
  "आप हर दिन कितना अभ्यास करते हैं?",
  "यहाँ चैतन्य का अर्थ क्या है?",
  "आप किस परंपरा से हैं?",
];

/**
 * One target structure max: every 3rd turn steers toward it in Devanagari.
 * Pass targetDev like "X क्योंकि Y" filled, e.g. "अभ्यास क्योंकि मन शांत होता है".
 */
export function demoTutorTurn(
  learnerText: string,
  turnIndex: number,
  targetDev?: string
): DemoReply {
  const score = scoreTurn({ learner_text: learnerText });
  const d = decompileHindi(learnerText);
  let say: string;
  if (!score.understood) {
    say = "फिर से कहिए। धीरे बोलिए।";
  } else if (targetDev && turnIndex % 3 === 2) {
    say = `अच्छा। ${targetDev} — अब आप कहिए।`;
  } else if (d.frameId === "ability" || d.frameId === "progressive") {
    say = `अच्छा। ${NEXT_QUESTIONS[turnIndex % NEXT_QUESTIONS.length]}`;
  } else {
    say = `ठीक है। ${NEXT_QUESTIONS[turnIndex % NEXT_QUESTIONS.length]}`;
  }
  return { say, score };
}
