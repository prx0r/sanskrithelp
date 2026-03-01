/**
 * Sanskrit Q&A — direct Qwen3.5 via Chutes (no Chroma).
 * Env: CHUTES_API_KEY
 */

const CHUTES_CHAT_URL = "https://llm.chutes.ai/v1/chat/completions";
const DEFAULT_MODEL = "Qwen/Qwen3.5-397B-A17B-TEE";

export async function askSanskrit(
  userContent: string,
  options?: { systemPrompt?: string; model?: string }
): Promise<string> {
  const apiKey = process.env.CHUTES_API_KEY ?? process.env.CHUTES_API_TOKEN;
  if (!apiKey) throw new Error("CHUTES_API_KEY not configured");

  const system =
    options?.systemPrompt ??
    `You are a Sanskrit grammar tutor grounded in Pāṇini's Aṣṭādhyāyī and Whitney's Sanskrit Grammar.
Be concise. Cite sources when you know them (e.g. "Whitney §X", "Pāṇini 6.1.77").
If you're unsure, say so. One paragraph unless a step-by-step derivation is requested.`;

  const model = options?.model ?? process.env.RAG_MODEL ?? DEFAULT_MODEL;

  const res = await fetch(CHUTES_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 700,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chutes chat failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}
