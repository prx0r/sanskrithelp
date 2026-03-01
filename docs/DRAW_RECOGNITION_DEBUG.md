# Draw Recognition — Debugging & Architecture

## Flow

1. **Client** (drill `/drill`, draw page `/draw`) → canvas `toDataURL("image/png")` → base64
2. **POST** `/api/draw-recognize` with `{ image_base64, prompt, mode: "char"|"word" }`
3. **API** sends image + prompt to Chutes vision API:
   - **Primary:** `rednote-hilab/dots.ocr` — document OCR, 100+ languages
   - **Fallback (char only):** `Qwen/Qwen2.5-VL-72B-Instruct-TEE` — vision-language model for isolated handwriting
4. **Response** parsed: extract Devanagari (U+0900–U+097F) from model output

## Image Format

- **Drill:** `DrawCanvas` 200×200 px, black strokes on white
- **Draw page:** 200×200 (char) or 400×120 (word)
- Sent as `data:image/png;base64,...` (OpenAI vision format)

## Debugging

### 1. Enable server logs

Add to `.env.local`:

```
DEBUG_DRAW_RECOGNIZE=1
```

Restart dev server. You'll see in the terminal:

- `[draw-recognize] Request:` — model, prompt length, image size
- `[draw-recognize] Response:` — raw Chutes response (first 500 chars)
- `[draw-recognize] Chutes error:` — when API returns non-200

### 2. Browser console

When recognition fails, the client logs:

```
[drawAssessment] API returned no prediction: { ocr: {...}, visionFallback?: {...} }
```

### 3. API response with debug

When prediction is null, the API returns `debug` in the response:

```json
{
  "predicted": null,
  "error": "No Devanagari detected...",
  "debug": {
    "imageBytes": 12345,
    "mode": "char",
    "ocr": { "model": "rednote-hilab/dots.ocr", "raw": "...", "predicted": null },
    "visionFallback": { "model": "Qwen/Qwen2.5-VL-72B-Instruct-TEE", "raw": "...", "predicted": null }
  }
}
```

## Model Notes

| Model | Use case | Cost |
|-------|----------|------|
| dots.ocr | Document OCR, multilingual | $0.01/1M tokens |
| Qwen2.5-VL-72B | Isolated handwriting, single chars | $0.15/1M in, $0.60/1M out |

- **dots.ocr** is tuned for documents (PDFs, scans). Single chars on white may work better with Qwen2.5-VL.
- **Qwen2.5-VL** fallback runs only when dots.ocr returns empty and `mode === "char"`.

## Word Mode

Word mode uses the same flow with `WORD_PROMPT`:

> "This image shows handwritten Devanagari (Sanskrit) text — a word or phrase. Reply with ONLY the Devanagari text as written, nothing else."

No Qwen2.5-VL fallback for words (cost/size). If dots.ocr fails on words, consider:
- Larger canvas (e.g. 400×200)
- Clearer handwriting
- Or add vision fallback for words too (env flag)

## Alternative OCR Ideas

1. **Sabdakrida local model** — `model_char.h5` (DHCD) for chars; requires TensorFlow on server
2. **Google Cloud Vision** — Document AI or Vision API (paid)
3. **Tesseract** — Free, add `deva` training data for handwriting
4. **Fine-tuned dots.ocr** — If Chutes supports custom models
