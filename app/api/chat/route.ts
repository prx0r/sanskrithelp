/**
 * Streaming chat via Chutes Qwen3.5-397B.
 * POST: { messages: [{ role, content }] }
 * Returns: ReadableStream (SSE)
 */
const CHUTES_URL = "https://llm.chutes.ai/v1/chat/completions";
const MODEL = process.env.TUTOR_MODEL || "Qwen/Qwen3.5-397B-A17B-TEE";

export async function POST(req: Request) {
  const apiKey = process.env.CHUTES_API_KEY || process.env.CHUTES_API_TOKEN;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "CHUTES_API_KEY not configured" }), {
      status: 501,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { messages, systemPrompt } = body as { messages?: Array<{ role: string; content: string }>; systemPrompt?: string };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing 'messages' array with at least one message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const defaultSystem = `You are the search/help function inside a Sanskrit learning app. Be direct and sharp. No fluff.

CONTEXT: You operate within a Sanskrit app. Most queries are Sanskrit-related: grammar, vocabulary, pronunciation, roots, sandhi, etc. Users expect quick, verified answers.

OUTPUT:
- Use IAST (e.g. gacchati, √gam) and Devanagari (e.g. गच्छति, √गम्) when discussing Sanskrit.
- Give correct, attested answers. Prefer canonical sources: Whitney's Sanskrit Grammar for grammar; standard pratyāhāras, dhātus, and declensions.
- Be concise. Answer the question, then stop. If they need more, they'll ask.
- For grammar: cite rule or pattern when helpful (e.g. Whitney §X, or "Pāṇini's system").
- If unsure, say so. Don't invent.`;

    const systemMsg = {
      role: "system" as const,
      content: typeof systemPrompt === "string" && systemPrompt.trim() ? systemPrompt.trim() : defaultSystem,
    };
    const allMessages = [systemMsg, ...messages];

    const res = await fetch(CHUTES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: allMessages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Chat API error:", res.status, err);
      return new Response(
        JSON.stringify({ error: `Chat failed: ${res.status}` }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
