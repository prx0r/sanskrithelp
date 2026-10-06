import type { TutorTurn } from "./provider";

/** Offline A/B scoring over session transcripts (no live model needed). */
export interface ABScore {
  turns: number;
  hindiRatio: number;
  adherenceFlags: number;
  targetIntroduced: boolean;
}

export function scoreSession(
  transcripts: TutorTurn[],
  knownForms: string[],
  targetForm?: string,
  targetRoman?: string
): ABScore {
  const tutorTurns = transcripts.filter((t) => t.role === "tutor");
  let deva = 0;
  let total = 0;
  let flags = 0;
  let targetSeen = false;
  const knownText = knownForms.join(" ");
  const markers = ["क्या", "सकता", "सकती", "चाहता", "चाहती", "रहा", "रही"];
  for (const t of tutorTurns) {
    const chars = [...t.textHindi];
    total += chars.length;
    deva += chars.filter((c) => /[\u0900-\u097F]/.test(c)).length;
    for (const m of markers) {
      if (t.textHindi.includes(m) && !knownText.includes(m) && !(targetForm && targetForm.includes(m))) {
        flags += 1;
      }
    }
    if (targetRoman && t.textHindi.includes(targetRoman)) targetSeen = true;
  }
  return {
    turns: tutorTurns.length,
    hindiRatio: total ? deva / total : 0,
    adherenceFlags: flags,
    targetIntroduced: targetSeen,
  };
}
