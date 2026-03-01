# Embedding & Curriculum Design Decisions (Locked)

**Status:** Resolved. Rebuild from scratch with these rules.

---

## 1. Embedding Dimensions

- **Qwen3-Embedding-0.6B:** **1024 dims** (confirmed)
- **Rebuild everything** with 0.6B — single embedding space for RAG, grammar profile, pronunciation weakness
- **No dual-space:** Do not maintain separate 4096 (8B) and 1024 (0.6B) spaces. Re-embed grammar profile centroids with 0.6B. One model, one dimension, everywhere

---

## 2. Difficulty (1–5 at Chunk Level)

- **Add explicitly at ingest** — do not infer from zone order
- Zone order = pedagogical sequence. Zone 4 (Sandhi) has both trivial vowel sandhi (diff 1) and nightmare consonant clusters (diff 5)
- **Heuristics per source:**
  - Whitney: introductory sections → 1–2, exception catalogues → 4–5, simple heuristic + manual review of edge cases
  - DCS corpus: sentence length + number of sandhi junctions as proxy
- Store as `metadata.difficulty` (integer 1–5)

---

## 3. Zone 12: Darśana / Philosophical Texts

- **New zone**, not mixed into Reading
- Philosophy has its own vocabulary, conceptual prerequisites (dense compound chains need Zone 10), and register
- **Gate:** completion of Reading zone at a certain threshold
- Tag all Abhinavagupta, Tantrāloka, Parātrīśikā, etc. with `zone: "philosophy"`

---

## 4. Prerequisites — DAG, Not Linear

Gate logic supports a **prerequisite DAG**:

```
Phonetics (02) ──┬──► Guṇa/Vṛddhi (03) ──► Sandhi (04)
                │
                └──► [parallel with Sandhi] ──► Dhātus (05)

Words (06) ──► Kārakas (08)
Sandhi (04) + Kārakas (08) ──► Compounds (10)
Sandhi (04) + Verbs (09) ──► Reading (11)
Reading (11) + Compounds (10) ──► Philosophy (12)
```

**Store in config, not hardcoded:**

```json
{
  "zone_01_compression": { "prerequisites": [] },
  "zone_02_phonetics": { "prerequisites": [] },
  "zone_03_gradation": { "prerequisites": ["zone_02"] },
  "zone_04_sandhi": { "prerequisites": ["zone_02", "zone_03"] },
  "zone_05_roots": { "prerequisites": ["zone_02", "zone_03"] },
  "zone_06_words": { "prerequisites": [] },
  "zone_07_suffixes": { "prerequisites": ["zone_05"] },
  "zone_08_karakas": { "prerequisites": ["zone_06"] },
  "zone_09_verbs": { "prerequisites": ["zone_05"] },
  "zone_10_compounds": { "prerequisites": ["zone_04", "zone_08"] },
  "zone_11_reading": { "prerequisites": ["zone_04", "zone_09"] },
  "zone_12_philosophy": { "prerequisites": ["zone_10", "zone_11"], "zone_11_threshold": 0.7 }
}
```

`zone_11_threshold` for Philosophy = Reading (zone_11) zone_score must be >= 0.7

---

## 5. Daily Drills — Weakness + Least Recently Seen

- **Weakness-only** → hammers same zone repeatedly, demoralising, pedagogically poor
- **Pure random** → ignores weakness centroid
- **Formula:** `score = weakness_similarity * recency_weight`
  - `recency_weight = 1 / (1 + days_since_seen)` (never seen → 1.0)
- Pick top-k by this combined score → spaced repetition behaviour without full SRS

**Concretely:**

```python
def daily_drill_score(chunk, profile, seen_dates):
    sim = cosine_similarity(chunk.embedding, profile.weakness_centroid)
    days = (today - seen_dates.get(chunk.id, epoch)).days
    recency = 1.0 / (1.0 + days)
    return sim * recency
```

---

## 6. Checklist Before Any Embeddings Build

- [ ] Run `python scripts/check_embed_dims.py` — confirm EMBED_DIMS
- [ ] Set EMBED_DIMS in config; ensure grammar profile uses same dims
- [ ] Ingest: tag every chunk with `zone`, `difficulty` (1–5)
- [ ] Prerequisites in `rag/config/zones.json` (or equivalent)
- [ ] Zone 12 added for philosophy
- [ ] Embedding cache enabled for incremental rebuilds
- [ ] Reset profile centroids if switching embedding model
