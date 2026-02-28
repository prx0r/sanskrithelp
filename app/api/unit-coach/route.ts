import { NextResponse } from "next/server";
import unitsData from "@/data/units.json";
import phonemesData from "@/data/phonemes.json";
import drillsData from "@/data/drills.json";
import { searchSource } from "@/lib/rag";

const CHUTES_CHAT_URL = "https://llm.chutes.ai/v1/chat/completions";
const MODEL = "XiaomiMiMo/MiMo-V2-Flash-TEE";

const units = unitsData as Array<{ id: string; title: string; subtitle: string; overview?: string; phonemeIds: string[] }>;
const phonemes = phonemesData as Array<{ id: string; devanagari: string; iast: string }>;
const drills = drillsData as Record<string, { id: string; name: string; prompt: string; structure: string }>;
const phonemeMap = new Map(phonemes.map((p) => [p.id, p]));

export async function POST(req: Request) {
  try {
    const { unitId, messages } = await req.json();

    const apiKey = process.env.CHUTES_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "CHUTES_API_KEY not configured" }, { status: 501 });
    }

    const unit = units.find((u) => u.id === unitId);
    const unitPhonemes = unit
      ? unit.phonemeIds.map((id) => phonemeMap.get(id)).filter(Boolean) as typeof phonemes
      : [];
    const phonemeList = unitPhonemes.map((p) => `${p.devanagari} ${p.iast}`).join(", ");
    const drillList = Object.values(drills)
      .map((d) => `- ${d.id}: ${d.name} — ${d.prompt}`)
      .join("\n");

    const lastUserMsg = Array.isArray(messages) && messages.length > 0
      ? messages.filter((m: { role: string }) => m.role === "user").pop()?.content ?? ""
      : "";
    const ragChunks = lastUserMsg ? searchSource(lastUserMsg) : [];
    const ragContext = ragChunks.length > 0
      ? `REFERENCE (learnsanskrit.org):\n${ragChunks.join("\n\n---\n\n")}\n\n`
      : "";

    const systemPrompt = `You are a Sanskrit pronunciation coach for the unit "${unit?.title ?? "Unknown"}".
${ragContext ? `\n${ragContext}\n\nUse the reference above when relevant. Be concise.\n` : ""}

UNIT OVERVIEW: ${unit?.overview ?? "Practice these phonemes."}
PHONEMES IN THIS UNIT: ${phonemeList}

PREDEFINED DRILLS (use when they ask to "test me" or "drill me"):
${drillList}

RULES:
- Be concise. Output is spoken via TTS — use Devanagari for Sanskrit sounds, short sentences.
- Answer questions about pronunciation, articulation, or the phonemes.
- When testing: pick a drill, run it with phonemes from this unit. One round at a time.
- For "repeat after": say which phoneme to repeat, wait for their answer before continuing.
- For "listen and identify": say you'll play one (they use the app to hear), they respond.
- No (a) or (ā) after Devanagari in speech — TTS pronounces it wrong.`;

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...(Array.isArray(messages) ? messages : []),
    ];

    const response = await fetch(CHUTES_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: chatMessages,
        max_tokens: 300,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Unit coach error:", response.status, err);
      return NextResponse.json({ error: `Chat failed: ${response.status}` }, { status: response.status });
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Unit coach error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
