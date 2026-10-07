import { loadEntries } from "@/lib/practiceLog";

/**
 * Jev client (TypeSafe System One) via OpenRouter.
 * State in -> typed decisions out. No text generation, no parse failures.
 * Model: typesafe/jev-router. Key: OPENROUTER_API_KEY (optional).
 * Without a key every call returns null and callers use safe defaults —
 * the partner works (dumber), never errors.
 */

const JEV_URL = "https://openrouter.ai/api/v1/chat/completions";
const JEV_MODEL = "typesafe/jev-router";

export type JevQuestion =
  | { type: "choice"; options: string[] }
  | { type: "score"; levels: number }
  | { type: "noul" };

export type JevAnswer =
  | { kind: "choice"; pick: string; probs: Record<string, number>; confidence: number }
  | { kind: "score"; value: number; confidence: number }
  | { kind: "noul"; p: number; confidence: number };

function getKey(): string | null {
  return process.env.OPENROUTER_API_KEY || null;
}

function toSystemOnePrompt(state: string, questions: Record<string, JevQuestion>): string {
  const lines = Object.entries(questions).map(([k, q]) => {
    if (q.type === "choice") return `- ${k}: CHOICE one of [${q.options.join(" | ")}]`;
    if (q.type === "score") return `- ${k}: SCORE 1-${q.levels}`;
    return `- ${k}: YES/NO with probability`;
  });
  return [
    "You are a System One decision module. Given STATE, answer each QUESTION with ONLY a JSON object.",
    "No prose. No explanation. Format: {\"answers\": {\"<key>\": <value>}} where choice = exact option string,",
    "score = integer, yes/no = true/false. Also include \"confidence\" 0-1 per answer as \"<key>_confidence\".",
    "STATE:",
    state,
    "QUESTIONS:",
    ...lines,
  ].join("\n");
}

function parseAnswer(key: string, q: JevQuestion, data: any): JevAnswer | null {
  const v = data?.answers?.[key];
  const conf = Number(data?.answers?.[`${key}_confidence`] ?? 0.5);
  if (q.type === "choice" && typeof v === "string" && q.options.includes(v)) {
    return { kind: "choice", pick: v, probs: {}, confidence: conf };
  }
  if (q.type === "score" && Number.isInteger(v) && v >= 1 && v <= q.levels) {
    return { kind: "score", value: v, confidence: conf };
  }
  if (q.type === "noul" && typeof v === "boolean") {
    return { kind: "noul", p: v ? 1 : 0, confidence: conf };
  }
  return null;
}

/** One round trip: many typed questions, answered in parallel. Null = no key / failure. */
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
        messages: [{ role: "user", content: toSystemOnePrompt(state, questions) }],
        temperature: 0,
        max_tokens: 512,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    let text: string = data?.choices?.[0]?.message?.content ?? "";
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s === -1 || e <= s) return null;
    const parsed = JSON.parse(text.slice(s, e + 1));
    const out: Record<string, JevAnswer> = {};
    for (const [k, q] of Object.entries(questions)) {
      const a = parseAnswer(k, q, parsed.answers ? parsed : { answers: parsed });
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
  thread: { type: "choice", options: [...ENQUIRY_THREADS] },
  depth: { type: "score", levels: 10 },
  loop_risk: { type: "noul" },
  distress: { type: "noul" },
  ready_for_harder: { type: "noul" },
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
