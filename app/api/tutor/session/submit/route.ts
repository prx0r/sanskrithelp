/**
 * Proxy to Sabdakrida conductor — submit user response and assess.
 * POST: FormData with user_id?, zone_id, level, user_input, audio? (File for pronunciation)
 */
const SABDAKRIDA_URL = process.env.SABDAKRIDA_URL || "http://127.0.0.1:8010";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const user_id = (formData.get("user_id") as string) ?? "default";
    const zone_id = (formData.get("zone_id") as string)?.trim();
    const levelRaw = formData.get("level");
    const level =
      typeof levelRaw === "number"
        ? levelRaw
        : parseInt(String(levelRaw ?? "1"), 10);
    const user_input = (formData.get("user_input") as string) ?? "";
    const audio = formData.get("audio") as File | null;

    if (!zone_id) {
      return new Response(
        JSON.stringify({ error: "Missing 'zone_id'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = new FormData();
    body.append("user_id", user_id);
    body.append("zone_id", zone_id);
    body.append("level", String(level));
    body.append("user_input", user_input);
    if (audio && audio instanceof Blob && audio.size > 0) {
      body.append("audio", audio, "recording.wav");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    const res = await fetch(`${SABDAKRIDA_URL}/tutor/session/submit`, {
      method: "POST",
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      console.error("Tutor session submit error:", res.status, err);
      return new Response(
        JSON.stringify({ error: `Assessment failed: ${res.status}` }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("Tutor session submit proxy error:", error);
    return new Response(
      JSON.stringify({
        error:
          "Tutor unavailable. Is the Sabdakrida backend running? (python -m uvicorn sabdakrida.main:app --port 8010)",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
