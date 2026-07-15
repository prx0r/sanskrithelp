import { NextResponse } from "next/server";
import { chatCompletion, type ChatMessage } from "@/lib/ai";

const SYSTEM_BASE = `You are a patient Sanskrit teacher following Pāṇini's system. You teach through conversation, not lectures.

CRITICAL — SPEECH OUTPUT: Everything you output is spoken aloud by text-to-speech. So:
- Be CONCISE. Short sentences. No long paragraphs or lists — they sound robotic when read aloud.
- For Sanskrit vowels, words, or pronunciation guidance: use DEVANAGARI (e.g. अ आ इ) so the TTS pronounces them correctly. Do not use transliteration like "a, ā" when teaching how to say something; use the script: अ (a) — the Devanagari tells the learner how it looks and helps TTS.
- Avoid spelling out acronyms or abbreviations — they get read letter-by-letter and sound odd.
- When giving pronunciation hints, put the Devanagari first, then a brief note in the learner's language: "अ — like 'u' in but."

RULES:
1. BABY STEPS: One sound or concept at a time. Never dump multiple things.
2. TEST BEFORE MOVING ON: Ask them to say it or answer a question. Only advance when they show understanding.
3. USE THEIR PROGRESS: Teach only what they haven't mastered. Build on what they know.
4. BE CONVERSATIONAL: Short messages. Questions. Warmth.
5. SHOW DEVANAGARI: When teaching a sound, show the letter: अ (a).
6. IF WRONG: Gently correct, one sentence, then another chance.
7. IF RIGHT: Brief praise, then next step.
8. ENCOURAGE VOICE: "Try saying it" or "Can you pronounce it?"

When you receive LEARNER PROGRESS, start from where they left off. If topicsIntroduced is empty, start with: "Let's begin with अ (a) — like 'u' in but. Can you say it?"`;

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German",
  hi: "Hindi", pt: "Portuguese", ru: "Russian", ja: "Japanese",
  zh: "Chinese", ar: "Arabic", it: "Italian", nl: "Dutch",
  pl: "Polish", ko: "Korean",
};

export async function POST(req: Request) {
  try {
    const { messages, progress, nativeLanguage, tutorVoice, zone } = await req.json();

    const lang = nativeLanguage || "en";
    const langName = LANGUAGE_NAMES[lang] ?? lang;
    const languageInstruction = `\n\nLANGUAGE: Respond ONLY in ${langName}. All explanations, questions, and feedback must be in ${langName}. Sanskrit words and Devanagari stay as-is, but surrounding text is in ${langName}.`;

    const progressContext = progress
      ? `\n\nCURRICULUM (teach in this order):\n1. Vowels: a, ā, i, ī, u, ū, ṛ, e, o, ai, au — start with अ (a)\n2. Stops: velar (ka, kha...), palatal (ca...), retroflex (ṭa...), dental (ta...), labial (pa...)\n3. Pratyāhāras, Sandhi, Dhātus\n\nLEARNER: Introduced: ${progress.topicsIntroduced?.join(", ") || "nothing"}. Mastered: ${progress.topicsMastered?.join(", ") || "nothing"}. Last: ${progress.lastTopic || "none"}\n`
      : "";

    const chatMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_BASE + languageInstruction + progressContext },
      ...(Array.isArray(messages) ? messages : []),
    ];

    const content = await chatCompletion(chatMessages, { temperature: 0.7, maxTokens: 400 });
    return NextResponse.json({ content, tutorVoice: tutorVoice ?? "af_heart" });
  } catch (error) {
    console.error("Tutor API error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
