# Sanskrit RAG — Troubleshooting

## Issue 1: Chutes embedding returns 500 "No infrastructure available"

**Cause:** The Qwen3-Embedding chute may be cold, rate-limited, or temporarily unavailable.

**Fixes:**
- Retry the request (Chutes may spin up the chute on demand)
- Check [chutes.ai](https://chutes.ai/app) for the correct embedding endpoint URL — models can move
- Use a different Chutes embedding model if Qwen3-Embedding-0.6B is unavailable
- Verify `CHUTES_API_KEY` is set in `.env.local`

## Issue 2: 308 Permanent Redirect on POST /api/rag-ask

**Cause:** Next.js has `trailingSlash: true`. Requests to `/api/rag-ask` redirect to `/api/rag-ask/`. Some HTTP clients don’t resend the POST body on 308.

**Fix:** Call `/api/rag-ask/` (with trailing slash) instead of `/api/rag-ask`.

```bash
curl -X POST http://localhost:3001/api/rag-ask/ \
  -H "Content-Type: application/json" \
  -d '{"question":"what is guna?"}'
```

## Issue 4: Chroma "collection not found" or connection errors

**Cause:** Chroma server not running, or wrong API version.

**Fixes:**
1. Start Chroma: `chroma run --path ./sanskrit_db`
2. Ensure the index exists: `python rag/build_sanskrit_rag.py --build`
3. Default URL: `http://localhost:8000`. Override with `CHROMA_URL` in `.env.local` if needed.

## Issue 4: Chroma JS client vs Python server (v1 vs v2)

The npm `chromadb` package uses the v2 API. Python `chroma run` (1.4.x) supports both. If you see v1 deprecation warnings, the server is fine — it still serves v2.

## Test the pipeline

```bash
# 1. Start Chroma
chroma run --path ./sanskrit_db

# 2. Test embed + Chroma (standalone)
node scripts/test-rag.mjs "what is guna"

# 3. Start Next.js and call RAG API (use trailing slash!)
npm run dev
# Then: POST http://localhost:3000/api/rag-ask/  (or 3001 if 3000 is busy)
```
