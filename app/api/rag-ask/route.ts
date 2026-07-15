import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing 'question'" }, { status: 400 });
    }

    const content = await chatCompletion([
      {
        role: "system",
        content: `You are a Sanskrit grammar tutor grounded in Pāṇini's Aṣṭādhyāyī and Whitney's Sanskrit Grammar. Be concise. Cite sources when you know them (e.g. "Whitney §X", "Pāṇini 6.1.77"). If you're unsure, say so. One paragraph unless a step-by-step derivation is requested.`,
      },
      { role: "user", content: question.trim() },
    ], { temperature: 0.1, maxTokens: 700 });

    return NextResponse.json({ content });
  } catch (error) {
    console.error("RAG ask error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Query failed", detail: msg }, { status: 500 });
  }
}
