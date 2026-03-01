# Embedding Build Process — Sanskrit RAG

**Use this every time you rebuild the embeddings index.** Covers Chutes API, pipeline stages, caching, and model switching.

See also: [EMBEDDING_DESIGN_DECISIONS.md](./EMBEDDING_DESIGN_DECISIONS.md) for locked decisions (dims, difficulty, zones, prerequisites).

---

## Chutes Embedding API

### Endpoint

```
POST https://chutes-qwen-qwen3-embedding-0-6b.chutes.ai/v1/embeddings
```

### Request

```json
{
  "input": "example-string",
  "model": null
}
```

- **`input`**: string or array of strings (batch)
- **`model`**: optional, can be `null` (uses chute default)
- **`dimensions`**: optional, for models that support dimension reduction
- **`encoding_format`**: `"float"` (default) or `"base64"`
- **`truncate_prompt_tokens`**: optional

### Response

```json
{
  "id": "...",
  "data": [
    { "index": 0, "object": "embedding", "embedding": [0.021, -0.043, ...] }
  ],
  "model": "...",
  "usage": { "prompt_tokens": N, "total_tokens": N, "completion_tokens": 0 }
}
```

### Auth

```
Authorization: Bearer $CHUTES_API_TOKEN
```

### Curl Example

```bash
curl -X POST \
  https://chutes-qwen-qwen3-embedding-0-6b.chutes.ai/v1/embeddings \
  -H "Authorization: Bearer $CHUTES_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "example-string", "model": null}'
```

### Model Config (Dev vs Prod)

| Model | URL | Dims | Use |
|-------|-----|------|-----|
| Qwen3-Embedding-0.6B | `chutes-qwen-qwen3-embedding-0-6b.chutes.ai` | **1024** | Dev (faster builds) |
| Qwen3-Embedding-8B | `chutes-qwen-qwen3-embedding-8b.chutes.ai` | 4096 | Prod (slower) |

**Confirm dims:** Run `python scripts/check_embed_dims.py` before first build.

---

## Build Pipeline (Every Embeddings Build)

### 1. Ingest (no embeddings)

```
Sources → Parse → Chunk → Normalise (SLP1) → chunks.json
```

- Output: `rag/output/chunks.json` (or per-source files)
- Iterate on structure, sources, chunking without calling embed
- Add new sources (philosophy, DCS, etc.) here

### 2. Embed with Cache

```
chunks.json + embedding_cache.json → embed only NEW chunks → update cache → vectors
```

- Load `rag/output/embedding_cache.json` (chunk_id → embedding)
- For each chunk: if in cache, reuse; else call Chutes, save to cache
- Saves time and cost when rebuilding with small changes

### 3. Index

```
vectors + metadatas → ChromaDB add
```

- One collection or 11 zone collections
- Metadata: `zone`, `source`, `difficulty`, `ref`

### 4. Reset Profile Centroids (when model/dims change)

- If `EMBED_MODEL` or `EMBED_DIMS` changed, reset `weakness_centroid` and `strength_centroid` to zero
- Old centroids are in a different space

---

## Environment

```bash
# .env.local or export
CHUTES_API_TOKEN=your-key
EMBED_MODEL=Qwen/Qwen3-Embedding-0.6B   # or 8B for prod
EMBED_URL=https://chutes-qwen-qwen3-embedding-0-6b.chutes.ai
EMBED_DIMS=1024   # LOCKED — run scripts/check_embed_dims.py to verify
```

---

## Checklist Before Each Build

- [ ] Decide: dev (0.6B) or prod (8B)?
- [ ] Set `EMBED_MODEL`, `EMBED_URL`, `EMBED_DIMS`
- [ ] Run ingest → `chunks.json` updated
- [ ] Run embed with cache → only new/changed chunks
- [ ] Build Chroma index
- [ ] If model switched: reset user profile centroids
