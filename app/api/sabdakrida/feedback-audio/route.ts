/**
 * Proxy to Sabdakrida feedback-audio — TTS for assessment feedback.
 * Called after session returns so assessment is Whisper-only (~30s).
 */
const SABDAKRIDA_URL = process.env.SABDAKRIDA_URL || "http://127.0.0.1:8010";

export async function POST(req: Request) {
  try {
    const { text, style = "command" } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'text'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const res = await fetch(`${SABDAKRIDA_URL}/feedback-audio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, style }),
    });
    if (!res.ok) {
      const err = await res.text();
      return new Response(
        JSON.stringify({ error: err || "Feedback TTS failed" }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }
    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { "Content-Type": res.headers.get("Content-Type") || "audio/wav" },
    });
  } catch (error) {
    console.error("Feedback audio proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Feedback audio unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
