import { NextResponse } from "next/server";
import { retrieve } from "@/lib/sanskritRag";

const CHUTES_CHAT_URL = "https://llm.chutes.ai/v1/chat/completions";
const MODEL = "XiaomiMiMo/MiMo-V2-Flash-TEE";

const SYSTEM = `You are a Sanskrit grammar tutor grounded in Pāṇini's Aṣṭādhyāyī and Whitney's Sanskrit Grammar.

Rules:
1. ONLY use the retrieved excerpts below. If the answer is not there, say so explicitly.
2. Always cite your source: "Whitney §X..." or "Pāṇini A.P.S (e.g. 6.1.77)..."
3. When both sources are present, lead with Pāṇini's rule, then Whitney's explanation.
4. Explain the underlying phonological or grammatical principle — not just the surface rule.
5. Be concise. One paragraph unless a step-by-step derivation is explicitly requested.`;

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing 'question'" }, { status: 400 });
    }

    const apiKey = process.env.CHUTES_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "CHUTES_API_KEY not configured" }, { status: 501 });
    }

    const chunks = await retrieve(question.trim(), 5);
    if (chunks.length === 0) {
      return NextResponse.json({
        content: "No relevant Sanskrit grammar passages were found. The RAG index may not be built yet (run `python rag/build_sanskrit_rag.py --build`) or Chroma may be down (`chroma run --path ./sanskrit_db`).",
      });
    }

    const context = chunks
      .map((c) => `[${c.meta.source.toUpperCase()} ${c.meta.ref}]\n${c.text}`)
      .join("\n\n");

    const res = await fetch(CHUTES_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Excerpts:\n${context}\n\nQuestion: ${question}` },
        ],
        temperature: 0.1,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("RAG ask error:", res.status, err);
      return NextResponse.json({ error: `Chat failed: ${res.status}` }, { status: res.status });
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ content });
  } catch (error) {
    console.error("RAG ask error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const isEmbed =
      msg.includes("Embedding") || msg.includes("No infrastructure") || msg.includes("500");
    return NextResponse.json(
      {
        error: "RAG query failed",
        detail: msg,
        hint: isEmbed
          ? "Chutes embedding may be cold. Retry or check chutes.ai for Qwen3-Embedding-8B endpoint."
          : msg.includes("fetch") || msg.includes("ECONNREFUSED")
            ? "Is Chroma running? Run: chroma run --path ./sanskrit_db"
            : undefined,
      },
      { status: 500 }
    );
  }
}
