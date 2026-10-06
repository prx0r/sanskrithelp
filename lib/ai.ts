/**
 * AI client using opencode.ai OpenAI-compatible endpoint.
 * Shared across all API routes — server-side only.
 *
 * Economics (owner is broke): default model is the FREE LongCat preview
 * (`longcat-2.5-preview-free`, same endpoint shape). Paid Go models 500 with
 * "Insufficient account funds" on an empty balance — never enable balance
 * drawdown. Upstream also requires `x-opencode-session` per conversation
 * plus a non-generic User-Agent, or requests are rejected at routing.
 */

const OPENCODE_URL = "https://opencode.ai/zen/go/v1/chat/completions";
const OPENCODE_MODEL = "longcat-2.5-preview-free";
const FALLBACK_KEY = "sk-SDjjQ8NtTdpM2OmWl3GXDrPlhcQiLvZln60mSVVcJQ3rkg7trYHQoLKshcKSeg0Y";
const USER_AGENT = "sanskrithelp/1.0";

function getKey(): string {
  return process.env.DEEPSEEK_API_KEY || FALLBACK_KEY;
}

/** Stable session id per conversation (routing + prompt caching). */
export function sessionIdFor(messages: ChatMessage[], salt = ""): string {
  const first = messages.find((m) => m.role === "user")?.content ?? messages[0]?.content ?? "";
  let h = 5381;
  const s = `${salt}|${first}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return `sanskrithelp-${h.toString(16)}`;
}

function headers(sessionId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getKey()}`,
    "x-opencode-session": sessionId,
    "User-Agent": USER_AGENT,
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number; model?: string; sessionId?: string },
) {
  const res = await fetch(OPENCODE_URL, {
    method: "POST",
    headers: headers(opts?.sessionId ?? sessionIdFor(messages)),
    body: JSON.stringify({
      model: opts?.model || OPENCODE_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.4,
      max_tokens: opts?.maxTokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenCode AI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  // DeepSeek models may return content in reasoning_content
  return msg?.content || msg?.reasoning_content || "";
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number; model?: string; sessionId?: string },
) {
  const res = await fetch(OPENCODE_URL, {
    method: "POST",
    headers: headers(opts?.sessionId ?? sessionIdFor(messages)),
    body: JSON.stringify({
      model: opts?.model || OPENCODE_MODEL,
      messages,
      temperature: opts?.temperature ?? 0.4,
      max_tokens: opts?.maxTokens ?? 2048,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenCode AI error ${res.status}: ${err}`);
  }

  return res.body;
}
