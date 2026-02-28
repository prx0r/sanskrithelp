import { NextResponse } from "next/server";

// Chutes MiMo chat for contextual explanations
// POST: llm.chutes.ai/v1/chat/completions

const CHUTES_CHAT_URL = "https://llm.chutes.ai/v1/chat/completions";
const MODEL = "XiaomiMiMo/MiMo-V2-Flash-TEE";

export async function POST(req: Request) {
  try {
    const { cardId, cardType, userAnswer, correctAnswer, context } = await req.json();

    const apiKey = process.env.CHUTES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { explanation: "AI feedback not configured. Add CHUTES_API_KEY to .env.local" },
        { status: 200 }
      );
    }

    const systemPrompt = `You are a Sanskrit grammar teacher following Pāṇini's system.
Your explanations always:
1. Name the phonological law or rule operating (e.g., "Grassmann's Law", "guṇa strengthening")
2. Trace the derivation step by step
3. Connect to something the learner has already seen (anuvṛtti — carry forward)
4. End with one forward pointer: "This same principle will appear when you encounter [X]"
Keep responses under 120 words.`;

    const userPrompt = `Card type: ${cardType}
User answer: ${userAnswer}
Correct answer: ${correctAnswer}
Context: ${JSON.stringify(context || {})}
Please explain what went wrong and how the correct form is derived.`;

    const response = await fetch(CHUTES_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Chutes chat error:", response.status, err);
      throw new Error(`Chutes API error: ${response.status}`);
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const explanation = data.choices?.[0]?.message?.content ?? "Unable to generate explanation.";

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { explanation: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
