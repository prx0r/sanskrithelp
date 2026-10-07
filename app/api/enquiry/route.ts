import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";
import { enquiryDecide, type JevAnswer } from "@/lib/jev";

// Self-enquiry partner turn: Jev decides the move, the free LLM speaks it.
// Jev absent → safe fallback (reflect, never push). Distress → grounding.

function briefFor(thread: string, depth: number): string {
  switch (thread) {
    case "deeper_into_same":
      return "Ask ONE pointed question that goes deeper into the SAME thread. No preamble, no advice.";
    case "adjacent_thread":
      return "Ask ONE bridge question into a directly adjacent thread. One sentence of bridge, then the question.";
    case "silence_invite":
      return "Offer a short silence: one line inviting 3 breaths of noticing, then stop. Under 20 words.";
    case "close_session":
      return "Close warmly in 2 sentences: name one thing noticed, suggest logging one line.";
    default:
      return "Reflect back what you heard in one sentence, then ask ONE open question. No advice, no interpretation.";
  }
}

const PARTNER_SYSTEM = `You are a self-enquiry partner in the Ramana tradition: noticing, gaps between thoughts, "who notices?".
Rules: one question per turn. Never lecture. Never diagnose. If loop_risk is high, name the loop kindly and return attention to breath.
Short replies. Plain language.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const turns = (body?.turns ?? []) as Array<{ role: string; text: string }>;
    const island = (body?.island ?? "").trim() || undefined;
    if (!Array.isArray(turns) || turns.length === 0) {
      return NextResponse.json({ error: "Missing turns array" }, { status: 400 });
    }

    const { answers, viaJev } = await enquiryDecide(turns, { island });
    const thread = (answers.thread as { pick: string }).pick;
    const depth = (answers.depth as { value: number }).value;
    const loopRisk = (answers.loop_risk as { p: number }).p === 1;
    const distress = (answers.distress as { p: number }).p === 1;

    let instruction = briefFor(thread, depth);
    if (distress) {
      instruction =
        "Respond with grounded kindness: acknowledge strain, suggest pausing and breathing, 2-3 sentences. You are not a therapist; say so if advice is sought.";
    } else if (loopRisk && thread !== "reflect_back") {
      instruction += " The last turns circled the same ground — name that gently first.";
    }

    const history = turns.map((t) => ({
      role: (t.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: t.text,
    }));
    const reply = await chatCompletion(
      [
        { role: "system", content: PARTNER_SYSTEM },
        ...history,
        { role: "user", content: `[partner instruction, follow it exactly: ${instruction}]` },
      ],
      { temperature: 0.7, maxTokens: 256 }
    ).catch(() => "");

    return NextResponse.json({
      reply: reply || "Noticed. Say a little more about what's most alive right now.",
      thread,
      depth,
      loopRisk,
      distress,
      viaJev,
    });
  } catch (error) {
    console.error("Enquiry error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export type { JevAnswer };
