/** Fish voice casting for Hindi (free lane only: s2.1-pro-free, $0).
 *
 *  - conversation: normal NPC back-and-forth
 *  - slow: explanatory / easy-mode register (slower delivery + slower voice)
 *  - female: learner model lines (the voice YOU imitate)
 *
 *  Voice IDs are pinned here but overrideable via env (see .env.example).
 *  Levels map to voices in LEVEL_VOICE below so easy/normal/hard can each
 *  speak differently. Rendering must use the free model — never the metered
 *  lane (see voiceagent/adapters/fish_tts.py).
 */

export const FISH_MODEL_FREE = "s2.1-pro-free";

export type FishVoiceRole = "conversation" | "slow" | "female";

export const FISH_VOICES: Record<FishVoiceRole, { id: string; label: string; note: string }> = {
  conversation: {
    id: process.env.NEXT_PUBLIC_FISH_VOICE_CONVERSATION || "0de8162a9e384545a0106046b57488a7",
    label: "Normal conversation",
    note: "Narration hi male — default NPC",
  },
  slow: {
    id: process.env.NEXT_PUBLIC_FISH_VOICE_SLOW || "06134e9a49cb4a36997b75402c8a0621",
    label: "Slow explainer",
    // NOTE: community voice named for a real teacher; repo rule (GLOT §8) is
    // text-only quotes, never worn identity. Keep the "roleplay" speaker label
    // in scenarios; this voice is the slow register, not the person.
    note: "Slow explanatory register — easy mode",
  },
  female: {
    id: process.env.NEXT_PUBLIC_FISH_VOICE_FEMALE || "1021386b765a4c25bd3e167c1a552875",
    label: "Female model (anika)",
    note: "Learner model lines",
  },
};

/** Difficulty -> delivery voice. Easy gets the slow register; normal/hard
 *  stay in conversation voice. Learner-model lines always use `female`. */
export const LEVEL_VOICE = {
  easy: "slow",
  normal: "conversation",
  hard: "conversation",
} as const;

/** Which prerecorded-rate to render per level (ffmpeg atempos, not TTS rate). */
export const LEVEL_RATE: Record<"easy" | "normal" | "hard", number> = {
  easy: 0.85,
  normal: 1.0,
  hard: 1.1,
};
