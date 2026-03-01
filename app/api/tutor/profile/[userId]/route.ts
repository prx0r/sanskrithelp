const SABDAKRIDA_URL = process.env.SABDAKRIDA_URL || "http://127.0.0.1:8010";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const res = await fetch(`${SABDAKRIDA_URL}/tutor/profile/${userId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return Response.json(err, { status: res.status });
    }
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("Tutor profile error:", error);
    return Response.json(
      { error: "Tutor unavailable. Is Sabdakrida running?" },
      { status: 503 }
    );
  }
}
