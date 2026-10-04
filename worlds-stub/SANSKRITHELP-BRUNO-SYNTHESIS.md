> Synthesis contract (canonical). Engine home: `bruno/sanskrit/SANSKRITHELP-BRUNO-SYNTHESIS.md`.

# SANSKRITHELP × BRUNO — synthesis contract (canonical)

> **Product decision (locked):** sanskrithelp = **daytime laptop app** (frontend).  
> Bruno = **memory/internalization engine** (wheels · Caelum · Notoria shell · world-model).  
> Stonedoorway = **night imaginal runtime** (audio beds · Journey · kernel protocols).  
> Grimoirer = grimoire practice surface. Ochema = when/faculty/diary.  
> **Do not merge repos — plug them.**

Date: 2026-10-04 · Companions: `CANONICAL-SANSKRIT-PATH-V1.md` · sanskrithelp `worlds-stub/FOUR-LAYER-PLAN.md` · `PANINI-PALACE-NOTORIA-TANTRALOKA.md`

---

## What each repo already is

### sanskrithelp (prx0r/sanskrithelp) — **the app**

| Already built | Where |
|---------------|--------|
| Next.js 15 PWA · FSRS · tutor DAG | `app/learn/*` · `tutor/` |
| **10 grammar zones** | pratyāhāra → phonetics → guṇa → sandhi → dhātus → words → suffixes → kārakas → verbs → compounds → reading |
| **Phoneme audio** (49 `.ogg`) | `public/audio/phonemes/` · `public/phenetics/` |
| **Data machine** | phonemes · pratyaharas · sandhi-rules · dhatus · endings CSV · tattvas |
| **VB + tantra practice** | `data/rag/vijnana-bhairava*` · `/tantra/practice` (1:4:2 · 5 voids) · mātṛkā · tattvas · practice-log types `vb`/`matrika`/`breath` |
| **Readings** | Śiva Sūtras 39 units · IPVV 20 · Spanda 5 · VB 5/112 (seed) |
| **Games engine + scenes** | Dhātu Dash · Sandhi Forge · Kāraka Web… (routes incomplete) |
| **Śabdakrīḍā** | pronunciation drills + draw recognition |
| **Worlds stubs** | `matrika-night.json` · `phoneme-object.json` · **FOUR-LAYER-PLAN.md** |

**Already perfect for:** Arguelles-style drills · chant shadowing with audio · sandhi/grammar · VB meditations *while* daily practice · dream/void breath work.

### bruno (prx0r/bruno) — **the engine**

| Already built | Where |
|---------------|--------|
| **BrunoEngine** | wheels · seals · lexicon · Caelum install |
| **Pāṇini runtime** | 3983 sūtras · pratyāhāra expand · guṇa · teaching √gam |
| **Notoria session CLI** | faculty → install row → contractio → panini → speak → log |
| **WorldIR + provenance** | sourceAttested vs pedagogical |
| **World packages** | matrika · laya · panini · memory-staged-tests (JSON manifests) |
| **Canonical path** | sound → verse → Trika 8-week syllabus |
| **Chant + world-model docs** | Abhinavagupta varṇa-uccāra · 7-layer architecture |

**CLI works today:**
```bash
cd /root/bruno/sanskrit/lab
python3 test_lab.py
python3 daily_runtime.py session --faculty memory --series dentals
python3 daily_runtime.py panini --pratyahara ac
python3 daily_runtime.py panini --derive gam
```

### Stonedoorway — **night engine**

| Piece | Status |
|-------|--------|
| Kernel worlds/protocols | matrika-night · laya-breath · astral-body · routine-x |
| Presets + Worlds UI | notoria-grammar-study · Routine X |
| ochema.co | faculty · sky · ritual timing |

---

## The synthesis (one diagram)

```text
┌─────────────────────────────────────────────────────────────┐
│  SANSKRITHELP  ·  DAYTIME LAPTOP APP                        │
│  (your primary surface)                                      │
│                                                             │
│  ARGUELLES LOOP (day)                                       │
│    shadow audio → Scriptorium copy → drill → generate       │
│                                                             │
│  ZONES 1–11 (already built)                                 │
│    pratyāhāra · phonemes · sandhi · dhātus · verbs · …      │
│                                                             │
│  TANTRA / VBT / DREAM (already built)                       │
│    /tantra/practice · mātṛkā · 5 voids · practice-log       │
│                                                             │
│  ★ NEW PLUG-IN: Bruno internalization layer                 │
│    Notoria faculty → Caelum install → wheel encode          │
│    → closed-book recall → predict → log                     │
│    day protocol = CANONICAL-SANSKRIT-PATH daily 60 min      │
└───────────────────────────┬─────────────────────────────────┘
                            │ end-of-day handoff
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BRUNO ENGINE  ·  memory OS (Python, linked not merged)      │
│  Caelum loci · wheels · Notoria shell · Pāṇini traces        │
│  world packages → stoneseed-ready JSON                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ night
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STONEDOORWAY  ·  imaginal runtime                           │
│  matrika-night · laya 1:4:2 · Focus 10 / 3D blackness        │
│  + ochema.co timing · Grimoirer cheatsheets                  │
└─────────────────────────────────────────────────────────────┘
```

**Day = install structure. Night = absorb + regenerate.**  
Games + Arguelles + Bruno wheels are **one loop**, not three apps.

---

## How sanskrithelp becomes the main frontend

### Already there (use it)

| You want | Open |
|----------|------|
| Shadow chant audio | phonetics / readings + `.ogg` |
| Grammar zones + FSRS | `/learn/*` · `/drill` |
| Sandhi / dhātus / verbs | zones 4–9 |
| VB meditation *with* practice | `/tantra/practice` + practice-log `vb` |
| Mātṛkā + tattvas | `/tantra/matrika` · `/tantra/tattvas` |
| Pronunciation games | `/learn/pronunciation` (Śabdakrīḍā) |

### Plug in next (Bruno layer in the app)

| New surface | Engine call |
|-------------|-------------|
| **Day Protocol** page | Notoria faculty + 60-min block from CANONICAL path |
| **Caelum install** | encode current zone object (phoneme row / dhātu / sūtra) |
| **Bruno wheel** | agent × action × object (or root × tense × person) from zone data |
| **Closed-book recall** | score against phonemes.json / dhatus.json |
| **Predict game** | change operator; user predicts form; compare to sandhi/derivation |
| **Handoff card** | “Tonight: matrika-night + this locus set” → Stonedoorway |

`worlds-stub/phoneme-object.json` + `matrika-night.json` are **already the contracts**.

---

## Day protocol (inside sanskrithelp)

Mirror `CANONICAL-SANSKRIT-PATH-V1` daily pattern:

| Min | Block | App surface |
|-----|-------|-------------|
| 10 | Phoneme drills (one family) | `/learn/phonetics` + audio |
| 10 | Māheśvara / pratyāhāra | `/learn/compression` + Bruno wheel |
| 15 | Verse sound-only | readings or manual chant + log type `vb`/`matrika` |
| 20 | Decompile + zone drill | sandhi/roots + **Bruno predict** |
| 10 | Closed-book reconstruction | Bruno recall score |
| 5 | Generation game | predict one transform |
| — | Night handoff card | → Stonedoorway Routine X |

**Arguelles scriptorium** (missing today — build as simple module):

```text
read line aloud → write while pronouncing → reread → Bruno simulate
  (agents? operator? case relations? sandhi boundary?)
```

---

## Night plug-in (already almost wired)

| Step | Source |
|------|--------|
| Faculty + timing | ochema.co |
| Chant install | matrika-night protocol + local `.ogg` |
| Breath | laya-142-nadi (1:4:2) |
| Absorption | astral-body Focus 10 / 3D blackness |
| Assets | Grimoirer downloads/notoria |
| Log | ochema diary / sanskrithelp practice-log |

**Handoff payload (day → night):**

```json
{
  "date": "YYYY-MM-DD",
  "faculty": "memory|understanding|eloquence|perseverance",
  "installed": ["row:dentals", "dhātu:√gam", "sūtra:asato..."],
  "recall_scores": {...},
  "night_protocol": "matrika-night + laya + optional astral",
  "notoria_preset": "notoria-grammar-study"
}
```

---

## Build order (practical)

| Phase | Do | Effort |
|-------|----|--------|
| **0** | Lock this contract; push worlds-stub + palace docs to sanskrithelp | done this session |
| **1** | **Day Protocol page** in sanskrithelp — faculty + timer + links to existing zones | small |
| **2** | **Scriptorium module** — read/write/reread + one Bruno simulate step | small |
| **3** | **Bruno wheel UI** — load from `dhatus.json` / `verb-endings.csv` / phonemes | medium |
| **4** | **Caelum persistence** — JSON export/import palace state across days | medium |
| **5** | **Recall scoring** — closed-book against zone data | small |
| **6** | **Predict game** — operator change → user form → check sandhi/derivation | medium |
| **7** | **Handoff card** → Routine X / matrika-night | small |
| **8** | Wire game routes (scenes already exist) | medium |
| **9** | Night: optional local player for `matrika-night.json` beds | later (stoned kernel already has presets) |

**Minimum lovable day app (you can use this week):**  
Phase 1–2–5–7 on top of **existing** sanskrithelp zones + audio + tantra practice.

---

## Boundaries (don’t break)

| Rule | Meaning |
|------|---------|
| sanskrithelp = frontend | No parallel Bruno UI app |
| Bruno = engine home | Architecture docs + Python lab live in bruno |
| Stonedoorway = night | Audio/Journey — not the Sanskrit OS |
| Provenance | SOURCE_ATTESTED vs PEDAGOGICAL on every install |
| No Hz doctrine | Audio = context; voice = install |
| No merge | Link APIs/JSON contracts; keep git repos separate |

---

## Files to keep open

| Path | Role |
|------|------|
| `bruno/sanskrit/CANONICAL-SANSKRIT-PATH-V1.md` | Syllabus + resources |
| `bruno/sanskrit/ABHINAVAGUPTA-MATRIKA-CHANTING.md` | Chant method |
| `bruno/sanskrit/sanskrit-world-model-layers.md` | 7-layer model |
| `bruno/sanskrit/lab/daily_runtime.py` | Day engine CLI |
| `sanskrithelp/worlds-stub/FOUR-LAYER-PLAN.md` | Prior synthesis plan |
| `sanskrithelp/worlds-stub/matrika-night.json` | Night doorway stub |
| `sanskrithelp/worlds-stub/phoneme-object.json` | Multi-layer phoneme schema |
| `sanskrithelp/docs/PANINI-PALACE-NOTORIA-TANTRALOKA.md` | Palace zone map |
| `sanskrithelp/data/*` | Grammar machine data |
| `stoned/docs/memory/*` | Shell syntheses + protocol status |
