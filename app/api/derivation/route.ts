import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { word } = await req.json();

    if (!word || typeof word !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'word'" }, { status: 400 });
    }

    const content = await chatCompletion([
      {
        role: "system",
        content: `Parse Sanskrit words. Output JSON only: {"root": "...", "suffixes": [], "sandhi_applied": [], "meaning": "..."}`,
      },
      { role: "user", content: `Parse: ${word}` },
    ], { temperature: 0.1, maxTokens: 400 });

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        root: null,
        suffixes: [],
        sandhi_applied: [],
        meaning: content,
      });
    }
  } catch (error) {
    console.error("Derivation error:", error);
    return NextResponse.json({
      root: null,
      suffixes: [],
      sandhi_applied: [],
      meaning: "Parse failed",
    }, { status: 500 });
  }
}
