import { NextResponse } from "next/server";

// Chutes Whisper for speech-to-text (user pronunciation input)
// POST body: { audio_b64: string, language?: string }

const WHISPER_URL = "https://chutes-whisper-large-v3.chutes.ai/transcribe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let audioB64 = body?.audio_b64 ?? body?.args?.audio_b64 ?? body?.audio_base64 ?? body?.args?.audio_base64;
    const language = body?.language ?? body?.args?.language ?? null;

    if (!audioB64 || typeof audioB64 !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'audio_b64' in request body" },
        { status: 400 }
      );
    }
    audioB64 = audioB64.replace(/\s/g, "");

    const apiKey = process.env.CHUTES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "CHUTES_API_KEY not configured in .env.local" },
        { status: 501 }
      );
    }

    const payload = {
      args: {
        audio_b64: audioB64,
        ...(language ? { language } : {}),
      },
    };
    const res = await fetch(WHISPER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const contentType = res.headers.get("content-type") ?? "";
      let text = "";
      if (contentType.includes("text/plain")) {
        text = (await res.text()).trim();
      } else {
        const data = (await res.json()) as Record<string, unknown>;
        text = (data?.text as string) ?? (data?.args as Record<string, unknown>)?.text ?? "";
      }
      return NextResponse.json({ text });
    }
    const lastErr = await res.text();
    console.error("Whisper error:", lastErr);
    return NextResponse.json(
      { error: `Transcription failed: ${lastErr}` },
      { status: 400 }
    );

  } catch (error) {
    console.error("Transcribe API error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
