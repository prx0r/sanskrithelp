import { streamChatCompletion, type ChatMessage } from "@/lib/ai";

const DEFAULT_SYSTEM = `You are the search/help function inside a Sanskrit learning app. Be direct and sharp. No fluff.

CONTEXT: You operate within a Sanskrit app. Most queries are Sanskrit-related: grammar, vocabulary, pronunciation, roots, sandhi, etc. Users expect quick, verified answers.

OUTPUT:
- Use IAST (e.g. gacchati, √gam) and Devanagari (e.g. गच्छति, √गम्) when discussing Sanskrit.
- Give correct, attested answers. Prefer canonical sources: Whitney's Sanskrit Grammar for grammar; standard pratyāhāras, dhātus, and declensions.
- Be concise. Answer the question, then stop. If they need more, they'll ask.
- For grammar: cite rule or pattern when helpful (e.g. Whitney §X, or "Pāṇini's system").
- If unsure, say so. Don't invent.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, systemPrompt } = body as { messages?: ChatMessage[]; systemPrompt?: string };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing 'messages' array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemMsg: ChatMessage = {
      role: "system",
      content: typeof systemPrompt === "string" && systemPrompt.trim() ? systemPrompt.trim() : DEFAULT_SYSTEM,
    };
    const allMessages = [systemMsg, ...messages];
    const stream = await streamChatCompletion(allMessages, { temperature: 0.7, maxTokens: 1024 });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
