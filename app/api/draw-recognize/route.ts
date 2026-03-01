/**
 * Devanagari handwriting recognition via Chutes vision API.
 * POST body: { image_base64: string, prompt?: string, mode?: "char"|"word", candidates?: string[] }
 * Returns: { predicted: string, error?: string, debug?: object }
 *
 * Uses Qwen2.5-VL-32B for chars (vision model). When candidates provided, constrains to that set.
 * Set DEBUG_DRAW_RECOGNIZE=1 to see full request/response in server logs.
 */

const CHUTES_URL = "https://llm.chutes.ai/v1/chat/completions";
const MODEL_VISION = "Qwen/Qwen2.5-VL-32B-Instruct";
const MODEL_OCR = "rednote-hilab/dots.ocr";

const CHAR_PROMPT =
  "This image shows a single handwritten Devanagari (Sanskrit) character on a white background. Reply with ONLY that one Devanagari character, nothing else. No explanation, no punctuation, no transliteration.";
const CHAR_CONSTRAINED_PROMPT = (candidates: string[]) =>
  `This image shows a handwritten Devanagari character. The character is one of these: ${candidates.join(" ")}. Which one matches the drawing? Reply with ONLY that single character, nothing else.`;
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
): Promise<{ raw: string; predicted: string | null; status: number }> {
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
    max_tokens: 50,
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
    console.log("[draw-recognize] Response:", res.status, rawText);
  }

  if (!res.ok) {
    console.error("[draw-recognize] Chutes error:", res.status, rawText);
    return { raw: rawText, predicted: null, status: res.status };
  }

  let data: { choices?: Array<{ message?: { content?: string } }>; error?: unknown };
  try {
    data = JSON.parse(rawText) as typeof data;
  } catch {
    return { raw: rawText, predicted: null, status: res.status };
  }

  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  const predicted = extractDevanagari(text) || null;
  return { raw: text, predicted, status: res.status };
}

export async function POST(req: Request) {
  const debugInfo: Record<string, unknown> = {};
  try {
    const body = await req.json();
    const imageBase64 = body?.image_base64 ?? body?.image;
    const mode = (body?.mode as "char" | "word") || "char";
    const candidates = body?.candidates as string[] | undefined;
    const customPrompt = body?.prompt as string | undefined;

    let prompt: string;
    if (customPrompt) {
      prompt = customPrompt;
    } else if (mode === "char" && candidates && candidates.length > 0) {
      prompt = CHAR_CONSTRAINED_PROMPT(candidates);
    } else {
      prompt = mode === "char" ? CHAR_PROMPT : WORD_PROMPT;
    }

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return Response.json(
        {
          error: "Missing image_base64 in request body",
          predicted: null,
          debug: { step1_imageReceived: false, failure: "No image_base64 in body" },
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.CHUTES_API_KEY ?? process.env.CHUTES_API_TOKEN;
    if (!apiKey) {
      return Response.json(
        {
          error: "CHUTES_API_KEY not configured in .env.local",
          predicted: null,
          debug: { step1_imageReceived: true, step2_apiKeyPresent: false, failure: "CHUTES_API_KEY missing" },
        },
        { status: 501 }
      );
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;
    debugInfo.imageBytes = Math.round((imageBase64.length * 3) / 4);
    debugInfo.mode = mode;
    debugInfo.prompt = prompt;

    debugInfo.step1_imageReceived = true;
    debugInfo.step2_apiKeyPresent = !!apiKey;

    // Use Qwen2.5-VL as primary for chars (vision model, better for isolated handwriting)
    const model = mode === "char" ? MODEL_VISION : MODEL_OCR;
    let result = await callChutes(apiKey, imageUrl, prompt, model);
    debugInfo.step3_chutesCall = {
      model,
      status: result.status,
      rawResponse: result.raw,
      predicted: result.predicted,
      success: result.status === 200,
    };

    // Fallback to dots.ocr only if vision returns empty (e.g. model unavailable)
    if (!result.predicted && mode === "char") {
      result = await callChutes(apiKey, imageUrl, prompt, MODEL_OCR);
      debugInfo.step4_ocrFallback = {
        model: MODEL_OCR,
        status: result.status,
        rawResponse: result.raw,
        predicted: result.predicted,
      };
    }

    const clientWantsDebug = body?.debug === true;
    const response: { predicted: string | null; error?: string; debug?: Record<string, unknown> } = {
      predicted: result.predicted,
    };
    // Always return debug when client asks, or when prediction failed
    if (clientWantsDebug || !result.predicted) {
      response.debug = debugInfo;
    }
    if (!result.predicted) {
      response.error = "No Devanagari detected. Check server logs (DEBUG_DRAW_RECOGNIZE=1) for raw API response.";
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
