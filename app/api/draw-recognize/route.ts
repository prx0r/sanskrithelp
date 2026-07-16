/**
 * Devanagari handwriting recognition hint via Tesseract.js.
 * Primary assessment is self-evaluation (user selects correct/close/wrong).
 * Tesseract result is just a hint shown alongside.
 */

import { NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
let workerLoading: Promise<void> | null = null;

async function getWorker() {
  if (worker) return worker;
  if (!workerLoading) {
    workerLoading = (async () => {
      const w = await createWorker();
      await w.reinitialize("san+hin");
      await w.setParameters({
        tessedit_char_whitelist: "अआइईउऊऋॠऌॡएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहािीुूृॄेैोौ्ँंः॒॑॥",
      });
      worker = w;
    })();
  }
  await workerLoading;
  return worker!;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const imageBase64 = body?.image_base64 ?? body?.image;
    if (!imageBase64) {
      return NextResponse.json({ predicted: null, error: "Missing image" });
    }

    const base64Data = imageBase64.split(",").pop() || imageBase64;
    const buffer = Buffer.from(base64Data, "base64");

    const w = await getWorker();
    const { data } = await w.recognize(buffer);
    const predicted = (data.text || "").replace(/[^\u0900-\u097F]/g, "").trim();

    return NextResponse.json({
      predicted: predicted || null,
      confidence: data.confidence || 0,
    });
  } catch (error) {
    console.error("Draw-recognize error:", error);
    return NextResponse.json({ predicted: null, confidence: 0 });
  }
}
