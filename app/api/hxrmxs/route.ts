import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";
import { jevDecide, type JevQuestion } from "@/lib/jev";
import { FUNCTION_IDS, voicePrompt } from "@/lib/hxrmxs";

// Full HXRMXS turn: Jev picks the move (function + loop/distress checks),
// the voice renderer speaks it. LLM never chooses, only verbalizes.

const MOVE_QUESTIONS: Record<string, JevQuestion> = {
  function_id: { type: "choice", options: [...FUNCTION_IDS] },
  loop_risk: { type: "noul" },
  distress: { type: "noul" },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const turns = (body?.turns ?? []) as Array<{ role: string; text: string }>;
    const lineage = (body?.lineage ?? "Therapeutic").trim();
    const register = Array.isArray(body?.register) ? body.register.map(String) : ["PR_02", "IN_02", "AT_02"];
    if (!Array.isArray(turns) || turns.length === 0) {
      return NextResponse.json({ error: "Missing turns array" }, { status: 400 });
    }

    const state = [
      `Teacher session${lineage ? ` (${lineage} lineage)` : ""}.`,
      "Last turns:",
      ...turns.slice(-6).map((t) => `${t.role}: ${t.text}`),
    ].join("\n");

    let functionId = "RM_03";
    let viaJev = false;
    let loopRisk = false;
    let distress = false;
    const decided = await jevDecide(state, MOVE_QUESTIONS);
    if (decided) {
      viaJev = true;
      functionId = (decided.function_id as { pick: string }).pick;
      loopRisk = (decided.loop_risk as { p: number }).p === 1;
      distress = (decided.distress as { p: number }).p === 1;
    }

    let system = voicePrompt({ function_id: functionId, lineage, register });
    if (distress) {
      system += "\nSafety override: respond with grounded kindness, suggest pausing. You are not a therapist; say so if advice is sought.";
    } else if (loopRisk) {
      system += "\nThe last turns circled the same ground — name that gently first, then make the move.";
    }

    const history = turns.map((t) => ({
      role: (t.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: t.text,
    }));
    const reply = await chatCompletion(
      [{ role: "system", content: system }, ...history],
      { temperature: 0.7, maxTokens: 300 }
    ).catch(() => "");

    return NextResponse.json({
      reply: reply || "Say that last part once more, slowly.",
      function_id: functionId,
      loopRisk,
      distress,
      viaJev,
    });
  } catch (error) {
    console.error("HXRMXS error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
