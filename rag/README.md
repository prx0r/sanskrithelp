# Sanskrit RAG — Whitney + Pāṇini + Dhātupāṭha + Vākyapadīya + MW + Abhinavagupta

Semantic search over Sanskrit grammar, philosophy, and lexicography. Embeddings via Chutes Qwen3-Embedding-0.6B (1024 dims), vector store in ChromaDB.

## Setup

```bash
# 1. Clone Pāṇini data (from project root)
git clone https://github.com/ashtadhyayi-com/data ./panini_data

# 2. Python deps
pip install -r rag/requirements.txt

# 3. Set API key (in .env.local or env)
CHUTES_API_KEY=your-key   # or CHUTES_API_TOKEN

# 4. Optional: ingest only (chunk → rag/output/chunks.json, no API calls)
python rag/build_sanskrit_rag.py --ingest

# 5. Build index (embed + Chroma). Uses cache; only new chunks call Chutes.
python rag/build_sanskrit_rag.py --build
```

**Confirm embedding dims** (1024 for 0.6B): `python scripts/check_embed_dims.py`

## Sources (included automatically if data present)

| Source | Location | Notes |
|--------|----------|-------|
| **Whitney** | Wikisource (scraped) | Sanskrit Grammar |
| **Pāṇini** | `panini_data/sutraani/` | Aṣṭādhyāyī sūtras |
| **Dhātupāṭha** | `panini_data/dhatu/data.txt` | Verb roots, gaṇa, meanings, commentary |
| **Vākyapadīya** | `panini_data/vakyapadeeyam/` | Bhartṛhari + Helārāja |
| **Monier-Williams** | `rag/data/mw/mw.xml` | Download mwxml.zip from Cologne |
| **Abhinavagupta** | `rag/data/abhinavagupta/*.txt` | Add .txt/.md for Parātrīśikā, Tantrāloka excerpts |

## Monier-Williams (optional)

1. Download: https://sanskrit-lexicon.uni-koeln.de/scans/MWScan/2020/downloads/mwxml.zip  
2. Extract `mw.xml` into `rag/data/mw/`

## Abhinavagupta (optional)

Place `.txt` or `.md` files in `rag/data/abhinavagupta/` with excerpts from:
- Parātrīśikāvivaraṇa
- Tantrāloka (mātṛkā / alphabet sections)
- Sources: sanskritdocuments.org, shaivism.net

## Run Chroma (for queries)

```bash
chroma run --path ./sanskrit_db
```

## Query

- **API**: `POST /api/rag-ask/` with `{ "question": "what does bhū mean?" }`
- **Next.js**: Ensure `CHROMA_URL` is set if Chroma runs elsewhere (default: `http://localhost:8000`)
