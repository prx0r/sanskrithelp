import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";
import { decompileHindi } from "@/lib/memory/hindiDecompile";

// Ported from hindihelp /api/assess onto the free backend.
// Scores a spoken Hindi attempt against a target line. Never hard-fails:
// JSON-parse failure and LLM outage both degrade to honest fallback scores.

const ASSESS_PROMPT = `You are a Hindi pronunciation and grammar coach. Assess the user's spoken Hindi.

Given the user's spoken transcript and the target phrase they were trying to say, evaluate:
1. Accuracy — did they get the words right?
2. Grammar — any errors in verb conjugation, postpositions, gender agreement?
3. Pronunciation notes — common issues for learners

A deterministic pre-check is included (construction match). Trust a "match" signal;
distrust gracefully when it says "no-match" (the checker only knows a small grammar).

Return a JSON response:
{
  "correct": boolean,
  "score": number (0-100),
  "feedback": string (2-3 sentences of encouraging, specific feedback),
  "errors": string[] (list of specific errors, if any)
}

Be encouraging but honest. If they got it mostly right, say so.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const transcript = (body?.transcript ?? "").trim();
    const target = (body?.target ?? "").trim();
    if (!transcript || !target) {
      return NextResponse.json({ error: "Missing transcript or target" }, { status: 400 });
    }

    let precheck = "unavailable";
    try {
      const t = decompileHindi(transcript);
      const g = decompileHindi(target);
      precheck =
        t.constructionId && t.constructionId === g.constructionId
          ? `match (${t.constructionId})`
          : `no-match (heard: ${t.constructionId ?? t.frameId ?? "unknown"}, expected: ${
              g.constructionId ?? g.frameId ?? "unknown"
            })`;
    } catch {}

    const response = await chatCompletion(
      [
        { role: "system", content: ASSESS_PROMPT },
        {
          role: "user",
          content: `Target phrase: "${target}"\nUser said: "${transcript}"\nPre-check: ${precheck}\n\nEvaluate this attempt.`,
        },
      ],
      { temperature: 0.3, maxTokens: 512 }
    );

    const cleaned = response
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    try {
      const parsed =
        start !== -1 && end > start ? JSON.parse(cleaned.slice(start, end + 1)) : JSON.parse(cleaned);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({
        correct: false,
        score: 50,
        feedback: "I heard you. Keep practicing — try matching the exact words next time.",
        errors: ["Could not parse assessment"],
      });
    }
  } catch (error) {
    console.error("Assessment error:", error);
    return NextResponse.json(
      {
        correct: false,
        score: 0,
        feedback: "Assessment service unavailable. Keep practicing!",
        errors: [],
      },
      { status: 200 }
    );
  }
}
