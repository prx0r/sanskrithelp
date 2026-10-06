import { NextResponse } from "next/server";
import { buildSSML } from "@/lib/hindi/ssml";

// Ported from prx0r/hindihelp app/api/tts (Edge TTS, hi-IN-SwaraNeural).
// Free, no key: token comes from the public edge-tts-server endpoint.
// Always degrades to { fallback: true } -> caller uses browser speechSynthesis.

const EDGE_TTS_URL = "https://speech.platform.bing.com/recognize";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = (body?.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ fallback: true, message: "Missing text" });
    }

    const ssml = buildSSML({ text, voice: body?.voice || "hi-IN-SwaraNeural", rate: body?.rate || 0.9 });

    try {
      const tokenRes = await fetch("https://edge-tts-server.com/token", {
        signal: AbortSignal.timeout(5000),
      });
      if (tokenRes.ok) {
        const { token } = await tokenRes.json();
        const audioRes = await fetch(EDGE_TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/ssml+xml",
            Authorization: `Bearer ${token}`,
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          },
          body: ssml,
          signal: AbortSignal.timeout(10000),
        });
        if (audioRes.ok) {
          const audioBuffer = await audioRes.arrayBuffer();
          return new Response(audioBuffer, {
            headers: { "Content-Type": "audio/mpeg" },
          });
        }
      }
    } catch {}

    return NextResponse.json({
      fallback: true,
      text,
      voice: "hi-IN",
      message: "Use browser speech synthesis.",
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json({ fallback: true, message: "TTS unavailable" });
  }
}
