import { NextResponse } from "next/server";

// Derivation query endpoint - takes a Sanskrit word and returns parse info
// Can use Chutes.ai for full parse when configured

export async function POST(req: Request) {
  try {
    const { word } = await req.json();

    if (!word || typeof word !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'word' in request body" },
        { status: 400 }
      );
    }

    // For v1, return a stub. Full implementation would:
    // 1. Look up word in dhatus/derived forms
    // 2. Or call Chutes.ai to parse: { root, suffixes[], sandhi_applied[], meaning }
    const stub = {
      root: null as string | null,
      suffixes: [] as string[],
      sandhi_applied: [] as string[],
      meaning: "Parse coming in v2",
    };

    if (process.env.CHUTES_API_KEY) {
      const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CHUTES_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "XiaomiMiMo/MiMo-V2-Flash-TEE",
          messages: [
            {
              role: "system",
              content: `Parse Sanskrit words. Output JSON only: {"root": "...", "suffixes": [], "sandhi_applied": [], "meaning": "..."}`,
            },
            { role: "user", content: `Parse: ${word}` },
          ],
          max_tokens: 200,
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content ?? "";
        try {
          const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
          return NextResponse.json(parsed);
        } catch {
          // fall through to stub
        }
      }
    }

    return NextResponse.json(stub);
  } catch (error) {
    console.error("Derivation API error:", error);
    return NextResponse.json(
      { error: "Derivation query failed" },
      { status: 500 }
    );
  }
}
