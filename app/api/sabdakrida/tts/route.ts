/**
 * Proxy to Sabdakrida TTS — Sanskrit with Aryan voice (indic-parler-tts).
 * POST body: { text: string, style?: "narration" | "command" | "praise" }
 */
const SABDAKRIDA_URL = process.env.SABDAKRIDA_URL || "http://127.0.0.1:8010";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = (body?.text ?? "").trim();
    const style = body?.style ?? "narration";

    if (!text) {
      return new Response(JSON.stringify({ error: "Missing 'text'" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const form = new FormData();
    form.append("text", text);
    form.append("style", style);

    const res = await fetch(`${SABDAKRIDA_URL}/tts`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Sabdakrida TTS error:", err);
      return new Response(
        JSON.stringify({ error: `TTS failed: ${err}` }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { "Content-Type": res.headers.get("Content-Type") || "audio/wav" },
    });
  } catch (error) {
    console.error("Sabdakrida TTS proxy error:", error);
    return new Response(
      JSON.stringify({
        error: "Sanskrit TTS unavailable. Is the Sabdakrida backend running? (python -m uvicorn sabdakrida.main:app --port 8010)",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
