import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { cardId, cardType, userAnswer, correctAnswer, context } = await req.json();

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

    const explanation = await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], { temperature: 0.3, maxTokens: 300 });

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ explanation: "Something went wrong. Please try again." }, { status: 500 });
  }
}
