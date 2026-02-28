import { NextResponse } from "next/server";

// Chutes Kokoro TTS - Hindi voice for Sanskrit
// POST body: { text: string, speed?: number, voice?: string }

const CHUTES_URL = "https://chutes-kokoro.chutes.ai/speak";
const DEFAULT_VOICE = "hf_alpha";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = (body?.text ?? body?.args?.text ?? "").trim();
    const speed = Math.max(0.5, Math.min(1.5, body?.speed ?? body?.args?.speed ?? 0.85));
    const voice = body?.voice ?? body?.args?.voice ?? DEFAULT_VOICE;

    if (!text) {
      return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
    }

    const apiKey = process.env.CHUTES_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "CHUTES_API_KEY not configured" }, { status: 501 });
    }
    const payloads = [
      { text, voice: voice || "hf_alpha", speed },
      { args: { text, voice: voice || "hf_alpha", speed } },
    ];
    let lastErr = "";
    for (const payload of payloads) {
      const res = await fetch(CHUTES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new Response(audioBuffer, {
          headers: { "Content-Type": res.headers.get("Content-Type") || "audio/wav" },
        });
      }
      lastErr = await res.text();
    }
    console.error("Kokoro TTS error:", lastErr);
    return NextResponse.json(
      { error: `TTS failed: ${lastErr}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "TTS synthesis failed" },
      { status: 500 }
    );
  }
}
