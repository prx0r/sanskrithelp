/**
 * Devanagari handwriting recognition.
 * Tries: Hugging Face free inference → Chutes vision → fallback hint.
 * The client-side TFJS model at public/dhcd/ handles most cases locally.
 */

import { NextResponse } from "next/server";

const CHUTES_URL = "https://llm.chutes.ai/v1/chat/completions";
const HF_URL = "https://api-inference.huggingface.co/models";

// Free Hugging Face models for Devanagari OCR
const HF_MODELS = [
  "microsoft/trocr-base-handwritten",
  "facebook/nougat-base",
];

const CHAR_PROMPT = "This image shows a single handwritten Devanagari character. Reply with ONLY that one Devanagari character, nothing else.";
const WORD_PROMPT = "This image shows handwritten Devanagari text. Reply with ONLY the Devanagari text as written, nothing else.";

function extractDevanagari(text: string): string {
  return text.replace(/[^\u0900-\u097F\u200C\u200D]/g, "").trim();
}

async function tryHF(imageBase64: string): Promise<string | null> {
  const imageBuffer = Buffer.from(imageBase64.split(",").pop() || imageBase64, "base64");
  for (const model of HF_MODELS) {
    try {
      const res = await fetch(`${HF_URL}/${model}`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: imageBuffer,
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = typeof data === "string" ? data : data?.generated_text || "";
      if (text) return extractDevanagari(text);
    } catch {
      continue;
    }
  }
  return null;
}

async function tryChutes(imageBase64: string, prompt: string, apiKey: string): Promise<string | null> {
  const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`;
  const models = ["rednote-hilab/dots.ocr", "Qwen/Qwen2.5-VL-72B-Instruct-TEE"];
  for (const model of models) {
    try {
      const res = await fetch(CHUTES_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: imageUrl } }, { type: "text", text: prompt }] }],
          max_tokens: 50,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      const predicted = extractDevanagari(text);
      if (predicted) return predicted;
    } catch { continue; }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const imageBase64 = body?.image_base64 ?? body?.image;
    const mode = (body?.mode as "char" | "word") || "char";
    const prompt = body?.prompt || (mode === "char" ? CHAR_PROMPT : WORD_PROMPT);

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "Missing image_base64", predicted: null });
    }

    // Try Hugging Face (free, no key needed)
    const hfResult = await tryHF(imageBase64);
    if (hfResult) {
      return NextResponse.json({ predicted: hfResult, source: "hf", mode });
    }

    // Try Chutes (if API key available)
    const apiKey = process.env.CHUTES_API_KEY;
    if (apiKey) {
      const chutesResult = await tryChutes(imageBase64, prompt, apiKey);
      if (chutesResult) {
        return NextResponse.json({ predicted: chutesResult, source: "chutes", mode });
      }
    }

    // Fallback: return hint to use client-side TFJS model
    return NextResponse.json({
      predicted: null,
      source: "none",
      hint: "Use client-side TF.js model at public/dhcd/ for character recognition.",
      mode,
    });
  } catch (error) {
    console.error("Draw-recognize error:", error);
    return NextResponse.json({
      predicted: null,
      error: "Recognition failed",
      hint: "Use client-side TF.js model at public/dhcd/.",
    });
  }
}
