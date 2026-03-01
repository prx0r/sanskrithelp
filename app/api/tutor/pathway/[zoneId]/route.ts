import { getPathwayFallback } from "@/lib/tutorPathwayFallback";

const SABDAKRIDA_URL = process.env.SABDAKRIDA_URL || "http://127.0.0.1:8010";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ zoneId: string }> }
) {
  const { zoneId } = await params;
  try {
    const res = await fetch(`${SABDAKRIDA_URL}/tutor/pathway/${zoneId}`);
    if (!res.ok) {
      const fallback = getPathwayFallback(zoneId);
      if (fallback) return Response.json(fallback);
      const err = await res.json().catch(() => ({}));
      return Response.json(err, { status: res.status });
    }
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("Tutor pathway error:", error);
    const fallback = getPathwayFallback(zoneId);
    if (fallback) return Response.json(fallback);
    return Response.json(
      { error: "Tutor unavailable. Is Sabdakrida running?" },
      { status: 503 }
    );
  }
}
