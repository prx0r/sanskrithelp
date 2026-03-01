# Embedding & RAG Quickstart

## What’s Implemented

- **Build pipeline**: Ingest → chunks.json → embed (with cache) → ChromaDB index
- **Model**: Qwen3-Embedding-0.6B (1024 dims) via Chutes
- **Zone + difficulty**: Per-chunk metadata (zone 1–12, difficulty 1–5)
- **RAG retrieval**: lib/sanskritRag retrieves from Chroma; rag-ask API serves Whitney/Pāṇini Q&A
- **User profile**: games/user_profile.py and games/rag_client.py use 1024 dims

## Build the Index

```bash
# 1. Verify embedding dims (should print 1024)
python scripts/check_embed_dims.py

# 2. Optional: ingest only (no API calls)
python rag/build_sanskrit_rag.py --ingest

# 3. Full build (embed + Chroma). Cache at rag/output/embedding_cache.json
python rag/build_sanskrit_rag.py --build
```

## Run Chroma for Queries

```bash
chroma run --path ./sanskrit_db
```

## Environment

- `CHUTES_API_KEY` or `CHUTES_API_TOKEN` — for Chutes embedding API
- `CHROMA_URL` — optional, default `http://localhost:8000`

## Data Requirements

- **panini_data**: `git clone https://github.com/ashtadhyayi-com/data ./panini_data`
- **Monier-Williams**: mw.xml in `xml/` or `rag/data/mw/`
- **Abhinavagupta**: .txt/.md in `rag/data/abhinavagupta/`
