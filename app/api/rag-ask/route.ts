import { NextResponse } from "next/server";
import { askSanskrit } from "@/lib/sanskritRag";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing 'question'" }, { status: 400 });
    }

    const content = await askSanskrit(question.trim());
    return NextResponse.json({ content });
  } catch (error) {
    console.error("RAG ask error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Query failed",
        detail: msg,
        hint: msg.includes("CHUTES_API_KEY") ? "Set CHUTES_API_KEY in environment." : undefined,
      },
      { status: 500 }
    );
  }
}
