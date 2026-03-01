/**
 * Proxy to Sabdakrida conductor — start a structured session.
 * POST: { user_id?, zone_id, level }
 */
const SABDAKRIDA_URL = process.env.SABDAKRIDA_URL || "http://127.0.0.1:8010";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user_id = (body?.user_id as string) ?? "default";
    const zone_id = (body?.zone_id as string)?.trim();
    const level = typeof body?.level === "number" ? body.level : parseInt(String(body?.level ?? "1"), 10);

    if (!zone_id) {
      return new Response(
        JSON.stringify({ error: "Missing 'zone_id'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const form = new FormData();
    form.append("user_id", user_id);
    form.append("zone_id", zone_id);
    form.append("level", String(level));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch(`${SABDAKRIDA_URL}/tutor/session/start`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      console.error("Tutor session start error:", res.status, err);
      return new Response(
        JSON.stringify({ error: `Session start failed: ${res.status}` }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("Tutor session start proxy error:", error);
    return new Response(
      JSON.stringify({
        error:
          "Tutor unavailable. Is the Sabdakrida backend running? (python -m uvicorn sabdakrida.main:app --port 8010)",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
