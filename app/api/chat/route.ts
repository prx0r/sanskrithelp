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
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing 'messages' array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemMsg = {
      role: "system" as const,
      content:
        "You are a helpful Sanskrit and grammar assistant. Answer concisely. Use Devanagari (e.g. अ आ) when discussing Sanskrit sounds or words. Be warm and clear.",
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
