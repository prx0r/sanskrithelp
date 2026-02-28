/**
 * Proxy to Sabdakrida Mode 1 — pronunciation assessment.
 * POST: multipart form with audio (WAV), target_text, user_id
 */
const SABDAKRIDA_URL = process.env.SABDAKRIDA_URL || "http://127.0.0.1:8010";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    const target_text = (formData.get("target_text") as string)?.trim() ?? "";
    const user_id = (formData.get("user_id") as string) ?? "default";

    if (!audio || !(audio instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: "Missing 'audio' file" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!target_text) {
      return new Response(
        JSON.stringify({ error: "Missing 'target_text'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = new FormData();
    body.append("audio", audio, "recording.wav");
    body.append("target_text", target_text);
    body.append("user_id", user_id);

    const res = await fetch(`${SABDAKRIDA_URL}/session/mode1`, {
      method: "POST",
      body,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Sabdakrida session error:", err);
      return new Response(
        JSON.stringify({ error: `Assessment failed: ${err}` }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("Sabdakrida session proxy error:", error);
    return new Response(
      JSON.stringify({
        error: "Pronunciation tutor unavailable. Is the Sabdakrida backend running? (python -m uvicorn sabdakrida.main:app --port 8010)",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
