/**
 * Proxy to Sabdakrida drill priorities.
 * GET: /api/sabdakrida/drills?user_id=...
 */
const SABDAKRIDA_URL = process.env.SABDAKRIDA_URL || "http://127.0.0.1:8010";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id") ?? "default";

    const res = await fetch(`${SABDAKRIDA_URL}/profile/${user_id}/drills`);
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "Drills unavailable" }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("Sabdakrida drills proxy error:", error);
    return Response.json(
      { drills: [] },
      { status: 200 }
    );
  }
}
