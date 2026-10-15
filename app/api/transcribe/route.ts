import { NextResponse } from "next/server";

// Speech-to-text via Cloudflare Workers AI (Whisper) — with graceful fallback.
// Default model: whisper-large-v3-turbo. Override with CF_WHISPER_MODEL.
// Needs CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN (same pair as deploy).
// Without them the client falls back to browser SpeechRecognition (free).

const DEFAULT_MODEL = "@cf/openai/whisper-large-v3-turbo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let audioB64 = body?.audio_b64 ?? body?.args?.audio_b64 ?? body?.audio_base64 ?? body?.args?.audio_base64;

    if (!audioB64 || typeof audioB64 !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'audio_b64' in request body" },
        { status: 400 }
      );
    }
    audioB64 = audioB64.replace(/\s/g, "");

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) {
      return NextResponse.json({
        fallback: true,
        message: "Transcription server not configured. Use browser SpeechRecognition.",
      });
    }
    const model = process.env.CF_WHISPER_MODEL || DEFAULT_MODEL;

    const audioBytes = Buffer.from(audioB64, "base64");
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "audio/wav",
        },
        body: new Uint8Array(audioBytes),
      }
    );

    if (res.ok) {
      const data = (await res.json()) as {
        result?: { text?: string } | string;
      };
      const result = data?.result;
      const text = (typeof result === "string" ? result : result?.text ?? "").trim();
      return NextResponse.json({ text });
    }

    const lastErr = await res.text();
    console.error("Cloudflare Whisper error:", lastErr);
    return NextResponse.json({ error: `Transcription failed: ${lastErr}` }, { status: 400 });
  } catch (error) {
    console.error("Transcribe error:", error);
    return NextResponse.json({
      fallback: true,
      message: "Transcription unavailable. Use browser SpeechRecognition.",
    });
  }
}
