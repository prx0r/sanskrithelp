# How Embeddings Connect to Teaching — Design Notes

**Question:** How does the AI use the embedding space to teach? Don't we need to map the vector space to a learning path (like a key to unlock content)?

**Short answer:** The embedding space finds *relevant* content. The learning path (what's unlocked, in what order) lives in **metadata + gates**, not in the vectors.

---

## What the Embedding Space Does

Embeddings are for **similarity search**, not curriculum logic.

| Step | What happens |
|------|--------------|
| 1. Index | Chunk "Whitney §121: a + a → ā" → embed → store in Chroma with metadata `{zone: "sandhi", source: "whitney", ref: "§121"}` |
| 2. Query | User asks "how do two vowels combine?" → embed question → Chroma finds nearest chunks |
| 3. Result | Top 5 chunks returned, e.g. Whitney §121, §122, Pāṇini 6.1.77 |
| 4. LLM | Those chunks go into the prompt as context. LLM explains using that content. |

The vector space clusters *semantically similar* content. "a + a sandhi" and "vowel junction rules" end up near each other. So when the user asks in natural language, we find the right rule.

---

## What the Learning Path Does

The learning path is **separate** — it controls what the user is *allowed* to access.

| Mechanism | Where it lives | Purpose |
|-----------|----------------|---------|
| Zone gates | `isZoneTutorUnlocked(zone)` | Must complete intro before AI tutor for that zone |
| Phoneme units | `lessonProgress.completedUnits` | Must finish vowels before velars, etc. |
| Difficulty filter | `metadata.difficulty` | Only show chunks at or just above user level |
| Zone filter | `metadata.zone` | Only retrieve from zones the user has unlocked |

**Unlock flow:** User completes intro for Sandhi → `markZoneComplete("sandhi")` → tutor for Sandhi unlocks. The embedding doesn't unlock anything; the gate does.

---

## Combined Flow: Retrieval + Gates

```
User: "I don't understand ā + i sandhi"
         │
         ▼
┌─────────────────────────────────────────┐
│ 1. Check gate: is sandhi tutor unlocked? │  ← Learning path
│    No → "Complete Sandhi intro first"     │
│    Yes → continue                         │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ 2. Embed query + optionally weakness    │  ← Embedding space
│    centroid (if we have one)              │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ 3. Chroma.query(                         │  ← Metadata = learning path filter
│      query_embeddings=[vec],              │
│      where={"zone": "sandhi",             │
│             "difficulty": {"$lte": 3}}   │
│    )                                     │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ 4. Top 5 chunks → prompt → LLM          │  ← Teaching
│    "Here's Whitney §122... [explains]"   │
└─────────────────────────────────────────┘
```

So:
- **Embedding space** = "what content is relevant to this question/weakness?"
- **Metadata + gates** = "is the user allowed to see it, and at what level?"

---

## Weakness Centroid (Optional Enhancement)

When the user gets drills wrong, we update `weakness_centroid` = EMA of embeddings of failed chunks.

**Use:** Instead of (or in addition to) embedding the user's *question*, we can query with the *weakness centroid*:
- "What's near where they consistently fail?" → those chunks are good drill targets.
- We still filter by zone, difficulty, etc.

The centroid doesn't unlock content. It *points* to where to focus retrieval. Gates still control access.

---

## Do We Need to "Map" Vector Space to Curriculum?

**No explicit geometric map.** The curriculum is:
- Zone order (Pratyāhāras → Reading)
- Prerequisites per zone (e.g. phonetics before sandhi)
- Difficulty per chunk

We *could* try to encode curriculum in the embedding space (e.g. dimension 0 = difficulty, dimensions 1–5 = zone), but that's fragile. Better: keep curriculum in metadata, use embeddings only for semantic similarity.

**The "key" is:** `zone` + `difficulty` + `prerequisite_zones` in metadata. Retrieval = vector similarity **filtered** by those. Unlock = gates (completedZones, completedUnits).

---

## Design Decisions (Resolved)

See [EMBEDDING_DESIGN_DECISIONS.md](./EMBEDDING_DESIGN_DECISIONS.md) for:

- Difficulty 1–5 at chunk level (explicit, not inferred)
- Zone 12 Philosophy (new zone, gated behind Reading + Compounds)
- Prerequisite DAG (Phonetics → Gradation → Sandhi; Dhātus parallel; etc.)
- Daily drills: weakness × recency_weight
- Embed dims: run `scripts/check_embed_dims.py` to confirm
