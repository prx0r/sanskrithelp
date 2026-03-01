/**
 * Devanagari handwriting recognition via Chutes vision models.
 * POST body: { image_base64: string, prompt?: string, mode?: "char" | "word" }
 * Returns: { predicted: string, error?: string, debug?: object }
 *
 * Uses dots.ocr first (document OCR); falls back to Qwen2.5-VL for single chars.
 * Set DEBUG_DRAW_RECOGNIZE=1 to see request/response in server logs.
 */

const CHUTES_URL = "https://llm.chutes.ai/v1/chat/completions";
const MODEL_OCR = "rednote-hilab/dots.ocr";
const MODEL_VISION = "Qwen/Qwen2.5-VL-72B-Instruct-TEE";

const CHAR_PROMPT =
  "This image shows a single handwritten Devanagari (Sanskrit) character on a white background. Reply with ONLY that one Devanagari character, nothing else. No explanation, no punctuation, no transliteration.";
const WORD_PROMPT =
  "This image shows handwritten Devanagari (Sanskrit) text — a word or phrase. Reply with ONLY the Devanagari text as written, nothing else. No explanation, no punctuation.";

const DEBUG = process.env.DEBUG_DRAW_RECOGNIZE === "1" || process.env.DEBUG_DRAW_RECOGNIZE === "true";

function extractDevanagari(text: string): string {
  const devanagari = text.replace(/[^\u0900-\u097F\u200C\u200D]/g, "").trim();
  return devanagari || "";
}

async function callChutes(
  apiKey: string,
  imageUrl: string,
  prompt: string,
  model: string
): Promise<{ raw: string; predicted: string | null }> {
  const body = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: prompt },
        ],
      },
    ],
    max_tokens: 10,
    temperature: 0,
  };

  if (DEBUG) {
    console.log("[draw-recognize] Request:", { model, promptLen: prompt.length, imageUrlLen: imageUrl.length });
  }

  const res = await fetch(CHUTES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  if (DEBUG) {
    console.log("[draw-recognize] Response:", res.status, rawText.slice(0, 500));
  }

  if (!res.ok) {
    console.error("[draw-recognize] Chutes error:", res.status, rawText);
    return { raw: rawText, predicted: null };
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = JSON.parse(rawText) as typeof data;
  } catch {
    return { raw: rawText, predicted: null };
  }

  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  const predicted = extractDevanagari(text) || null;
  return { raw: text, predicted };
}

export async function POST(req: Request) {
  const debugInfo: Record<string, unknown> = {};
  try {
    const body = await req.json();
    const imageBase64 = body?.image_base64 ?? body?.image;
    const mode = (body?.mode as "char" | "word") || "char";
    const customPrompt = body?.prompt as string | undefined;
    const prompt = customPrompt ?? (mode === "char" ? CHAR_PROMPT : WORD_PROMPT);

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
    debugInfo.imageBytes = Math.round((imageBase64.length * 3) / 4);
    debugInfo.mode = mode;

    // Try dots.ocr first (optimized for document OCR)
    let result = await callChutes(apiKey, imageUrl, prompt, MODEL_OCR);
    debugInfo.ocr = { model: MODEL_OCR, raw: result.raw.slice(0, 200), predicted: result.predicted };

    // Fallback to Qwen2.5-VL if dots.ocr returns empty (better for isolated handwriting)
    if (!result.predicted && mode === "char") {
      result = await callChutes(apiKey, imageUrl, prompt, MODEL_VISION);
      debugInfo.visionFallback = { model: MODEL_VISION, raw: result.raw.slice(0, 200), predicted: result.predicted };
    }

    const response: { predicted: string | null; error?: string; debug?: Record<string, unknown> } = {
      predicted: result.predicted,
    };
    if (DEBUG || !result.predicted) {
      response.debug = debugInfo;
    }
    if (!result.predicted) {
      response.error = "No Devanagari detected. Try drawing more clearly. Check server logs with DEBUG_DRAW_RECOGNIZE=1.";
    }

    return Response.json(response);
  } catch (e) {
    console.error("[draw-recognize] Error:", e);
    return Response.json(
      {
        error: e instanceof Error ? e.message : "Recognition failed",
        predicted: null,
        ...(DEBUG && { debug: debugInfo }),
      },
      { status: 500 }
    );
  }
}
