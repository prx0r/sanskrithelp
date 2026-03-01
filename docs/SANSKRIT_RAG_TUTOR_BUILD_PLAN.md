# Sanskrit RAG Tutor — Build Plan

**Goal:** Integrate the user-provided Sanskrit RAG Tutor Full Build Spec into the current codebase, expanding rather than replacing. Introductory sections become gates that must be completed before unlocking the AI tutor for each zone.

---

## Current State Summary

| Component | Location | Notes |
|-----------|----------|-------|
| **11 learn islands** | `app/learn/page.tsx` ISLANDS | Pratyāhāras → Reading (grammar topics) |
| **Phoneme units** | `data/units.json`, `lib/lessonProgress.ts` | 9 units, completion gates (isUnitUnlocked) |
| **RAG build** | `rag/build_sanskrit_rag.py` | Single Chroma collection "sanskrit", Whitney/Pāṇini/Dhātupāṭha/MW/Vākyapadīya |
| **RAG retrieval** | `lib/sanskritRag.ts` | Currently returns `[]` (disabled) |
| **rag-ask API** | `app/api/rag-ask/route.ts` | RAG + LLM, no zone routing, no profile |
| **Tutor API** | `app/api/tutor/route.ts` | LLM only, progress from tutor.ts, no RAG |
| **Games profile** | `games/user_profile.py` | weakness/strength centroids (4096), topic_mastery, chapter_progress |
| **Pronunciation profile** | `sabdakrida/db/profile.py` | phoneme_errors, pronunciation_scores |
| **Dhātu Dash** | `games/`, `sabdakrida/routers/games.py` | Uses profile for drill targeting |

---

## Design Principles

1. **Intro as gate** — Each learn island has static content. User must complete the intro (e.g. read the page, pass a short check, or mark "done") before the zone's AI tutor unlocks.
2. **Expand, don't replace** — Keep existing RAG sources. Add zone metadata and new sources incrementally.
3. **Single embedding model** — Use Qwen3-Embedding-0.6B (1024 dims) for dev; rebuild everything with one consistent space. See [EMBEDDING_DESIGN_DECISIONS.md](./EMBEDDING_DESIGN_DECISIONS.md).
4. **Backward compatible** — Existing `/api/rag-ask` and `/api/tutor` continue to work; new `/api/tutor/v2` or zone-aware endpoints are additive.

---

## Zone ↔ Island Mapping

| Zone ID | Learn Island | Intro Gate | New RAG Collection |
|---------|--------------|------------|--------------------|
| `compression` | Pratyāhāras | Complete intro section | zone_01_pratyaharas |
| `phonetics` | Phoneme Grid | Complete phoneme units (lessonProgress) | zone_02_phonetics |
| `gradation` | Guṇa / Vṛddhi | "Mark complete" or quiz | zone_03_gradation |
| `sandhi` | Sandhi | "Mark complete" or quiz | zone_04_sandhi |
| `roots` | Dhātus | "Mark complete" or quiz | zone_05_dhatus |
| `words` | Words | "Mark complete" or quiz | zone_06_words |
| `suffixes` | Suffixes | "Mark complete" or quiz | zone_07_suffixes |
| `karakas` | Kārakas | "Mark complete" or quiz | zone_08_karakas |
| `verbs` | Verbs | "Mark complete" or quiz | zone_09_verbs |
| `compounds` | Compounds | "Mark complete" or quiz | zone_10_compounds |
| `reading` | Reading | "Mark complete" or quiz | zone_11_reading |

**Phonetics is special:** Already has gates via `lessonProgress.completedUnits` (phoneme units). "Phonetics tutor unlocked" = all 9 phoneme units completed.

---

## Phase 1: Gate Infrastructure (Minimal Changes)

**Objective:** Track zone completion so we can show "Tutor unlocked" per zone.

### 1.1 Zone Progress Schema

Add to `lib/lessonProgress.ts` (or new `lib/zoneProgress.ts`):

```typescript
// Zone IDs from ISLANDS
export const ZONE_IDS = ["compression", "phonetics", "gradation", "sandhi", "roots", "words", "suffixes", "karakas", "verbs", "compounds", "reading"] as const;

export type ZoneId = (typeof ZONE_IDS)[number];

export interface ZoneProgress {
  completedZones: ZoneId[];  // zones where intro is done
}

export function isZoneTutorUnlocked(zoneId: ZoneId): boolean;
export function markZoneComplete(zoneId: ZoneId): void;
```

**Phonetics:** `isZoneTutorUnlocked("phonetics")` = all 9 units in `lessonProgress.completedUnits` (or a dedicated phonetics-gate when phoneme grid is "done").

**Other zones:** Simple "Mark as done" button on each learn page. User clicks → `markZoneComplete(zoneId)` → localStorage.

### 1.2 UI: Lock/Unlock Tutor per Zone

On each learn island page (e.g. `app/learn/sandhi/page.tsx`):

- If `!isZoneTutorUnlocked("sandhi")`: Show "Complete this section to unlock the AI tutor" + intro content + "I've read this" / short quiz.
- If unlocked: Show "Ask the AI tutor" / chat link or inline chat.

On `app/learn/page.tsx`: Optionally show lock icon or "Tutor" badge per island.

**Files to touch:**
- `lib/zoneProgress.ts` (new)
- `app/learn/page.tsx` (add tutor-unlocked indicator per island)
- Each `app/learn/{compression,sandhi,roots,...}/page.tsx` (add gate + unlock button)

---

## Phase 2: Zone-Aware RAG (Evolve Existing)

**Objective:** Add zone metadata to ChromaDB without breaking current single-collection flow.

### 2.1 Option A: Metadata Filter on Existing Collection (Fastest)

Modify `rag/build_sanskrit_rag.py`:

1. Add `zone` to each chunk's `meta` based on `infer_topic()` or explicit mapping:
   - `sandhi` topic → zone `sandhi`
   - `dhatu` topic → zone `roots`
   - `phonology` topic → zone `phonetics` or `gradation`
   - etc.

2. Update `lib/sanskritRag.ts` `retrieve()`:
   - Accept optional `zone?: string`
   - If zone provided: `where: { zone: zone }`
   - If not: no filter (current behavior)

3. Add `infer_zone(message)` using ZONE_KEYWORDS from spec.

**No new collections.** Backward compatible. Retrieval gets `where` filter.

### 2.2 Option B: One Collection per Zone (Spec Recommendation)

Create 11 collections in `build_sanskrit_rag.py`:

```python
ZONE_COLLECTIONS = [
    "zone_01_pratyaharas", "zone_02_phonetics", "zone_03_gradation",
    "zone_04_sandhi", "zone_05_dhatus", "zone_06_words",
    "zone_07_suffixes", "zone_08_karakas", "zone_09_verbs",
    "zone_10_compounds", "zone_11_reading",
]
```

- Map existing chunks to zones via topic→zone mapping.
- New sources (DCS, C-SALT, Itihasa) go into appropriate zones.
- `retrieve(zone, query)` → select collection by zone.

**Migration path:** Start with Option A. After ingestion pipeline is stable, split into Option B.

### 2.3 Chunk → Zone Mapping (Existing Data)

From `build_sanskrit_rag.py` TOPIC_KEYWORDS and Whitney chapter mapping:

| Topic | Zone |
|-------|------|
| sandhi | sandhi |
| dhatu | roots |
| suffix | suffixes |
| karaka | karakas |
| compound | compounds |
| conjugation | verbs |
| declension | words |
| phonology | phonetics, gradation |
| general | reading (or spread) |

Whitney chapters: ch1–ch4 (phonology) → phonetics/gradation; ch5+ (roots, verbs) → roots/verbs; sandhi chapters → sandhi. Pāṇini sūtras map by gloss. Dhātupāṭha → roots. MW → words/dictionary.

---

## Phase 3: Tutor API v2 (Zone + RAG + Profile)

**Objective:** Single endpoint that routes by zone, retrieves RAG, injects profile, returns tutor response.

### 3.1 New Endpoint: `POST /api/tutor/chat`

```typescript
// Request
{ user_id?: string; message: string; zone?: string }

// Response
{ content: string; zone_inferred?: string; zone_unlocked?: boolean }
```

**Flow:**

1. Resolve `zone`: from request, or `infer_zone(message)`.
2. Check `isZoneTutorUnlocked(zone)`. If not, return: "Complete the intro for [zone] first."
3. Load profile: `games.load_profile(user_id)` (or create default).
4. Retrieve: `retrieve(zone, augmentQuery(message, profile.weakness_centroid), 5)`.
5. Build prompt with: zone, weak topics, retrieved context, user message.
6. Call Chutes LLM. Return content.

**Profile integration:** Pass `weak_topics`, `current_chapter` (or zone_scores when added) into system prompt. No embedding centroid in prompt — that's used in retrieval augmentation (Phase 4).

### 3.2 Reuse Existing Tutor Prompt

Merge system prompt from `app/api/tutor/route.ts` (TTS-aware, Devanagari, baby steps) with RAG context from `rag-ask`. Add teaching principles from [TUTOR_TEACHING_PRINCIPLES.md](./TUTOR_TEACHING_PRINCIPLES.md) (source.txt / learnsanskrit.org). Keep TTS-safe rules.

---

## Phase 4: Profile Expansion (Zone Scores + Weakness in Retrieval)

**Objective:** Use weakness centroid and zone scores in retrieval and prompts.

### 4.1 Extend `games/user_profile.py`

Add to UserProfile:

```python
zone_scores: dict[str, float]  # {zone_id: 0.0-1.0}
zone_completed: set[str]       # zones where intro done (synced from frontend)
```

- `zone_scores`: Updated when user does drills/tutor in that zone (correct/incorrect).
- `zone_completed`: Set by frontend when `markZoneComplete`; sync to backend via `POST /profile/{user_id}/zones` or similar.

### 4.2 Retrieval Augmentation

In `retrieve(zone, query, profile)`:

- Option A: Add `profile.weak_topics()` as keywords to query.
- Option B: Use `profile.weakness_centroid` as secondary query — Chroma supports `query_embeddings=[centroid]` for "find similar to weakness region." Combine with text query via hybrid or reranking.

Start with Option A (simpler). Option B when games profile is populated with real centroid data.

### 4.3 Sync Pronunciation Profile

`sabdakrida/db/profile.py` has `phoneme_errors`, `pronunciation_scores`. When building tutor prompt for phonetics zone, include: "Phoneme errors: [list]. Focus on [top 2 error types]." No schema change required — just read in tutor handler.

---

## Phase 5: Ingestion Pipeline (New Sources)

**Objective:** Add DCS, C-SALT, Itihasa as per spec. Structure chunks with `zone`, `difficulty`, `source`.

### 5.1 Script Normalisation

Add SLP1 normalisation at ingest:

```python
from indic_transliteration import sanscript
text_slp1 = sanscript.transliterate(text, sanscript.DEVANAGARI, sanscript.SLP1)
```

Store both Devanagari and SLP1 in chunk metadata for search/display.

### 5.2 New Source Loaders (in `build_sanskrit_rag.py` or `rag/loaders/`)

| Source | Zone(s) | Notes |
|-------|---------|------|
| DCS | sandhi, roots, words, reading | GitHub: OliverHellwig/sanskrit, PyDCS |
| C-SALT API | roots, words | api.c-salt.uni-koeln.de/dicts/mw/restful |
| Emeneau Sandhi | sandhi | Internet Archive, student-friendly |
| Itihasa Parallel | reading | AI4Bharat indicnlp_catalog |
| Whitney structured (§§109–210) | sandhi | Rechunk existing Whitney by section |

### 5.3 Chunk Structure per Zone

Follow spec’s structured formats, e.g. Sandhi:

```python
{"rule_type": "vowel_sandhi", "context": "a/ā + a/ā", "result": "ā",
 "example_input": "tatra api", "result_form": "tatrāpi", "rule_ref": "Whitney §121"}
```

### 5.4 Ingestion Order

1. Extend Whitney scraper with zone + structured metadata.
2. Add DCS loader (sandhi-split sentences → reading + sandhi examples).
3. Add C-SALT client for MW/AP90 (roots, words).
4. Add Itihasa loader for reading zone.
5. Add Emeneau for sandhi exercises.

---

## Phase 6: Daily Brief + Drill Generation

**Objective:** Cron or on-session-start daily plan; optionally generate drill from RAG context.

### 6.1 Daily Brief

New endpoint: `GET /api/daily-brief/{user_id}`

- Reads profile (zone_scores, dedication, phoneme_errors).
- Prompt: "Generate 3–5 sentence daily plan. Weakest zones: X. Streak: Y."
- Return text. Optionally TTS.

### 6.2 Drill Generation

New endpoint: `POST /api/drill/generate`

- Input: zone, user_id.
- Retrieve with weakness. LLM generates one drill (JSON: question, answer, hint, explanation).
- Return drill. Frontend renders; on submit, call `POST /api/drill/grade` → update profile.

---

## Phase 7: TTS + Voice (Existing)

- `sabdakrida` already has indic-parler TTS.
- `app/api/tts` uses Chutes Kokoro.
- Tutor response can be spoken via existing flows. No new work for Phase 7 beyond wiring tutor → TTS when requested.

---

## Implementation Order Summary

| Phase | Scope | Est. Effort | Dependencies |
|-------|-------|-------------|--------------|
| **1** | Zone gates (lib/zoneProgress, UI) | 1–2 days | None |
| **2** | Zone metadata in RAG + retrieve(zone) | 1–2 days | Phase 1 for UI |
| **3** | POST /api/tutor/chat (zone, RAG, profile) | 1–2 days | Phase 1, 2 |
| **4** | Profile zone_scores, retrieval augmentation | 1 day | Phase 3 |
| **5** | New sources (DCS, C-SALT, Itihasa) | 3–5 days | Phase 2 |
| **6** | Daily brief, drill generate/grade | 1–2 days | Phase 4 |
| **7** | TTS wiring | 0.5 day | Phase 3 |

---

## File Checklist

### New Files

- `lib/zoneProgress.ts` — zone completion, tutor unlock
- `app/api/tutor/chat/route.ts` — zone-aware tutor (or extend `tutor/route.ts`)
- `app/api/daily-brief/route.ts` — daily plan
- `app/api/drill/generate/route.ts` — drill generation
- `app/api/drill/grade/route.ts` — drill grading, profile update
- `rag/loaders/dcs.py`, `rag/loaders/csalt.py`, `rag/loaders/itihasa.py` (optional, can live in build script)

### Modified Files

- `app/learn/page.tsx` — tutor unlocked indicator
- `app/learn/{compression,sandhi,roots,...}/page.tsx` — gate + unlock button
- `lib/lessonProgress.ts` — optionally integrate zone progress for phonetics
- `rag/build_sanskrit_rag.py` — zone metadata, new loaders, optional 11 collections
- `lib/sanskritRag.ts` — retrieve(zone, query, profile?), enable Chroma
- `games/user_profile.py` — zone_scores, zone_completed

### Unchanged (Keep Working)

- `app/api/tutor/route.ts` — existing tutor (can redirect or deprecate later)
- `app/api/rag-ask/route.ts` — existing RAG Q&A
- `sabdakrida/` — pronunciation, mode1, games router
- `games/` — Dhātu Dash, engine

---

## Key URLs (from Spec)

- **DCS**: http://sanskrit-linguistics.org/dcs/ | GitHub: OliverHellwig/sanskrit
- **C-SALT API**: https://api.c-salt.uni-koeln.de/dicts/mw/restful
- **GRETIL**: http://gretil.sub.uni-goettingen.de
- **Whitney Grammar**: archive.org/details/sanskritgrammar00whitgoog
- **Itihasa Corpus**: github.com/AI4Bharat/indicnlp_catalog

---

## Embedding Model Decision

**Locked:** Qwen3-Embedding-0.6B (1024 dims). Rebuild RAG, grammar profile, and pronunciation weakness with one consistent embedding space. See [EMBEDDING_BUILD_PROCESS.md](./EMBEDDING_BUILD_PROCESS.md).

---

## Proactive Tutor (Implemented)

See [PROACTIVE_TUTOR_DESIGN.md](./PROACTIVE_TUTOR_DESIGN.md) and `tutor/` package. APIs at `/tutor/*` on sabdakrida (8010).

- Weekly arc, daily brief
- Session conductor with level gates
- Assessment: grammar (deterministic), pronunciation (probabilistic), conceptual (LLM+rubric)
- 3 retries → remedial; 15-min cap; voice optional

## What to Defer

- Voice input (add after text tutor is solid)
- Agentic multi-step retrieval
- Fine-tuning embedding model
- Vedic Sanskrit
