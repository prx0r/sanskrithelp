import { loadEntries } from "@/lib/practiceLog";

/**
 * Jev client (TypeSafe System One) via OpenRouter Decisions API.
 * State in -> typed decisions out. No text generation, no parse failures.
 * Endpoint: POST https://openrouter.ai/api/alpha/decisions
 * Model pinned: typesafe/jev-1.13 (docs: pin for stable thresholds).
 * Key: OPENROUTER_API_KEY (optional). Without a key every call returns null
 * and callers use safe defaults — the partner works (dumber), never errors.
 *
 * NOTE: typesafe/jev-router is a DIFFERENT product (picks a chat model and
 * returns prose). Do not use it here.
 */

const JEV_URL = "https://openrouter.ai/api/alpha/decisions";
const JEV_MODEL = "typesafe/jev-1.13";

export type JevQuestion =
  | { type: "choice"; options: string[]; instructions?: string; criteria?: Record<string, string> }
  | { type: "score"; levels: number; instructions?: string; criteria?: string[] }
  | { type: "noul"; instructions?: string; criteria?: { true: string; false: string } };

export type JevAnswer =
  | { kind: "choice"; pick: string; probs: Record<string, number>; confidence: number }
  | { kind: "score"; value: number; confidence: number }
  | { kind: "noul"; p: number; confidence: number };

function getKey(): string | null {
  return process.env.OPENROUTER_API_KEY || null;
}

function toDecisionsQuestions(
  questions: Record<string, JevQuestion>
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, q] of Object.entries(questions)) {
    if (q.type === "choice") {
      const criteria: Record<string, string> = {};
      for (const o of q.options) criteria[o] = q.criteria?.[o] ?? o;
      out[k] = {
        type: "choice",
        instructions: q.instructions ?? `Pick one: ${q.options.join(" | ")}`,
        criteria,
      };
    } else if (q.type === "score") {
      const criteria =
        q.criteria ?? Array.from({ length: q.levels }, (_, i) => `level ${i + 1} of ${q.levels}`);
      out[k] = {
        type: "score",
        instructions: q.instructions ?? `Rate 1-${q.levels}.`,
        criteria,
      };
    } else {
      out[k] = {
        type: "noul",
        instructions: q.instructions ?? k.replace(/_/g, " ") + "?",
        ...(q.criteria ? { criteria: q.criteria } : {}),
      };
    }
  }
  return out;
}

function parseDecisionsAnswer(key: string, q: JevQuestion, answers: any): JevAnswer | null {
  const a = answers?.[key];
  if (!a || a.type !== q.type) return null;
  if (q.type === "choice" && typeof a.choice === "string" && q.options.includes(a.choice)) {
    const probs: Record<string, number> = {};
    for (const [o, p] of Object.entries(a.probabilities ?? {})) probs[o] = Number(p);
    return { kind: "choice", pick: a.choice, probs, confidence: Number(a.confidence ?? 0.5) };
  }
  if (q.type === "score" && typeof a.score === "number") {
    return { kind: "score", value: a.score, confidence: Number(a.confidence ?? 0.5) };
  }
  if (q.type === "noul" && typeof a.noul === "number") {
    return { kind: "noul", p: a.noul, confidence: Number(a.confidence ?? 0.5) };
  }
  return null;
}
export async function jevDecide(
  state: string,
  questions: Record<string, JevQuestion>,
  opts?: { model?: string }
): Promise<Record<string, JevAnswer> | null> {
  const key = getKey();
  if (!key) return null;
  try {
    const res = await fetch(JEV_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://sanskrit.help",
        "X-Title": "sanskrithelp",
      },
      body: JSON.stringify({
        model: opts?.model || JEV_MODEL,
        state,
        questions: toDecisionsQuestions(questions),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const answers = data?.answers;
    if (!answers) return null;
    const out: Record<string, JevAnswer> = {};
    for (const [k, q] of Object.entries(questions)) {
      const a = parseDecisionsAnswer(k, q, answers);
      if (!a) return null;
      out[k] = a;
    }
    return out;
  } catch {
    return null;
  }
}

// ── Self-enquiry partner: the decision set ──────────────────────────────

export const ENQUIRY_THREADS = [
  "deeper_into_same",
  "adjacent_thread",
  "reflect_back",
  "silence_invite",
  "close_session",
] as const;

export function enquiryState(
  turns: Array<{ role: string; text: string }>,
  context?: { island?: string; recentScores?: string }
): string {
  const last = turns.slice(-6).map((t) => `${t.role}: ${t.text}`).join("\n");
  return [
    "Self-enquiry session (Ramana-style noticing: who notices? gaps between thoughts).",
    context?.island ? `Active island: ${context.island}.` : "",
    context?.recentScores ? `Recent practice: ${context.recentScores}.` : "",
    "Last turns:",
    last,
  ].filter(Boolean).join("\n");
}

export const ENQUIRY_QUESTIONS: Record<string, JevQuestion> = {
  thread: {
    type: "choice",
    instructions: "Which single move should the self-enquiry partner make next?",
    criteria: {
      deeper_into_same: "Press further into the current thread with one pointed question.",
      adjacent_thread: "Bridge to a directly related thread with one question.",
      reflect_back: "Mirror what was heard in one sentence, then one open question.",
      silence_invite: "Offer a short silence (breaths of noticing), under 20 words.",
      close_session: "The session is complete or stuck; close warmly.",
    },
    options: [...ENQUIRY_THREADS],
  },
  depth: {
    type: "score",
    instructions: "How deep is the enquiry right now?",
    criteria: ["surface chatter", "naming content", "noticing patterns", "feeling it directly",
      "staying with it", "questioning the story", "resting as awareness", "wordless knowing",
      "seer seen through", "silence"],
    levels: 10,
  },
  loop_risk: {
    type: "noul",
    instructions: "Are the last turns circling the same ground without movement?",
    criteria: { true: "Repetition of same content/feel with no new seeing.", false: "Fresh material or deepening." },
  },
  distress: {
    type: "noul",
    instructions: "Is the speaker showing strain that needs grounding rather than enquiry?",
    criteria: { true: "Overwhelm, shutdown, or plea for help.", false: "Engaged, resourced enquiry." },
  },
  ready_for_harder: {
    type: "noul",
    instructions: "Is the speaker resourced enough for a harder question?",
    criteria: { true: "Stable, curious, meeting the work.", false: "Fragile, tired, or skimming." },
  },
};

/** Safe defaults when Jev is unreachable: reflect, never push. */
export function enquiryFallback(): Record<string, JevAnswer> {
  return {
    thread: { kind: "choice", pick: "reflect_back", probs: {}, confidence: 0 },
    depth: { kind: "score", value: 5, confidence: 0 },
    loop_risk: { kind: "noul", p: 0, confidence: 0 },
    distress: { kind: "noul", p: 0, confidence: 0 },
    ready_for_harder: { kind: "noul", p: 0, confidence: 0 },
  };
}

export async function enquiryDecide(
  turns: Array<{ role: string; text: string }>,
  context?: { island?: string }
): Promise<{ answers: Record<string, JevAnswer>; viaJev: boolean }> {
  let recent = "";
  try {
    recent = loadEntries()
      .filter((e) => e.type === "hindi" || e.type === "meditation")
      .slice(-5)
      .map((e) => e.label)
      .join("; ");
  } catch {}
  const out = await jevDecide(enquiryState(turns, { island: context?.island, recentScores: recent }), ENQUIRY_QUESTIONS);
  if (!out) return { answers: enquiryFallback(), viaJev: false };
  return { answers: out, viaJev: true };
}
