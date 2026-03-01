/**
 * Proxy to Sabdakrida draw/recognize — server-side TensorFlow, like TTS.
 * Uses our model_char.h5 from ml/dhcd/. No TF.js conversion needed.
 *
 * POST: FormData with image (File or Blob)
 * Returns: { predicted: string, score?: number } or { error, predicted: null }
 */
const SABDAKRIDA_URL = process.env.SABDAKRIDA_URL || "http://127.0.0.1:8010";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") ?? formData.get("file");
    if (!image || !(image instanceof Blob)) {
      return Response.json(
        { error: "Missing 'image' file in FormData", predicted: null },
        { status: 400 }
      );
    }

    const fd = new FormData();
    fd.append("image", image);

    const res = await fetch(`${SABDAKRIDA_URL}/draw/recognize`, {
      method: "POST",
      body: fd,
    });

    const data = (await res.json()) as { predicted?: string; score?: number; error?: string };
    if (!res.ok) {
      return Response.json(
        { error: data.error ?? `Recognition failed (${res.status})`, predicted: null },
        { status: res.status }
      );
    }
    return Response.json({ predicted: data.predicted ?? null, score: data.score });
  } catch (error) {
    console.error("Sabdakrida draw/recognize proxy error:", error);
    return Response.json(
      {
        error:
          "Recognition unavailable. Is Sabdakrida running? (python -m uvicorn sabdakrida.main:app --port 8010)",
        predicted: null,
      },
      { status: 503 }
    );
  }
}
