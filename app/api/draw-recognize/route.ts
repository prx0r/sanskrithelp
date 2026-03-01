/**
 * Devanagari handwriting recognition via Chutes dots.ocr.
 * POST body: { image_base64: string }
 * Returns: { predicted: string, error?: string }
 *
 * Uses CHUTES_API_KEY (same as Whisper, TTS, etc. in this app).
 */

const CHUTES_URL = "https://llm.chutes.ai/v1/chat/completions";
const MODEL = "rednote-hilab/dots.ocr";

const PROMPT =
  "This image shows a single handwritten Devanagari character. Reply with ONLY that one character, nothing else. No explanation, no punctuation.";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const imageBase64 = body?.image_base64 ?? body?.image;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return Response.json(
        { error: "Missing image_base64 in request body" },
        { status: 400 }
      );
    }

    const apiKey = process.env.CHUTES_API_KEY ?? process.env.CHUTES_API_TOKEN;
    if (!apiKey) {
      return Response.json(
        {
          error: "CHUTES_API_KEY not configured in .env.local",
          predicted: null,
        },
        { status: 501 }
      );
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;

    const res = await fetch(CHUTES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
              {
                type: "text",
                text: PROMPT,
              },
            ],
          },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Chutes dots.ocr error:", res.status, err);
      return Response.json(
        {
          error: `OCR failed: ${res.status}`,
          predicted: null,
        },
        { status: res.status >= 500 ? 502 : 400 }
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Extract first Devanagari character (handles extra whitespace or punctuation)
    const match = text.match(/[\u0900-\u097F]/)
    const predicted = match ? match[0] : (text.length === 1 ? text : null);

    return Response.json({ predicted: predicted ?? null });
  } catch (e) {
    console.error("Draw recognize error:", e);
    return Response.json(
      {
        error: e instanceof Error ? e.message : "Recognition failed",
        predicted: null,
      },
      { status: 500 }
    );
  }
}
