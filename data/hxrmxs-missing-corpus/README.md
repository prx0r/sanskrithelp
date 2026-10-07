# HXRMXS missing corpus (from UK folder)

Long multi-turn teacher/student conversations that were **not** in `data/hxrmxs-exemplars.json` or the short-form `uno.txt` set used to build the current exemplars.

**Source dump:** `/home/box/Documents/UK/` (local).  
**What is already loaded:** `data/hxrmxs-exemplars.json` (723 flat teacher-speech snippets, lineages: Therapeutic / Socratic / Advaita / Buddhist / Gurdjieffian / Realist).  
**What this folder adds:** full dialogues, longer arcs, missing lineages (ISTDP, Krishnamurti, Modern, Zen), and a separate Gold/Diamond enquiry series.

---

## How to read the schemas

Three shapes appear here. They are **not** interchangeable without conversion.

### A. PEDAGOGY messages format (best for `hxrmxs-exemplars.json`)

```json
{
  "episode_id": "...",
  "lineage": "Buddhist",
  "messages": [
    { "role": "system", "content": "USE_HXRMXS_TRAINING_PROMPT" },
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "[PEDAGOGY]\nlineage: ...\nfunction_id: UM_02\n...\n[/PEDAGOGY]\n\nTeacher words here" }
  ]
}
```

- Teacher text after `[/PEDAGOGY]` is **transmission** — quote verbatim, never paraphrase.
- Parse `function_id`, `phase`, `student_state`, `mechanism_shape`, `register`, `impact_predicted` from the `[PEDAGOGY]` block into exemplar fields.
- Normalize `META_0x` → `ME_0x` (see `lib/hxrmxs.ts` `normalizeFunction`).

### B. Transcript format (needs conversion)

```json
{
  "episode_id": "...",
  "lineage": "ISTDP" | "Zen" | "Krishnamurti" | ...,
  "transcript": [
    { "turn_index": 1, "speaker": "Th" | "Pt" | "Teacher" | "Student" | "Q" | "MENO" | ..., "text": "..." }
  ],
  "metadata": { "phases_present": [...], "dominant_phase": "...", "closure_type": "..." },
  "training_value": { "pedagogical_shape": "...", "what_model_should_learn": [...] }
}
```

- Alternate form uses `student_turns` / `teacher_turns` instead of a flat `transcript` (Milinda pass1, Krishnamurti pass1).
- Map speakers → `{role: "user"|"assistant", content: text}` before exemplar extraction.
- ISTDP speakers: `Th` = teacher, `Pt` = patient/student.
- Zen speakers: `Teacher` / `Student` / named monks.
- Krishnamurti: `Q` = questioner/student; teacher lines vary (`Visitor` is student in Commentaries On Living).

### C. Gold / Diamond enquiry format (different product surface)

```json
{
  "episode_id": "ep_001",
  "seed_question": "are souls real",
  "turns": [
    {
      "turn": 1,
      "intention": "DISSECTION",
      "user": "...",
      "hxrmxs": "Teacher voice answer...",
      "diamond": {
        "n1_compression": { "sharpened_question": "...", "assumptions": [...], "category_errors": [...] },
        "n2_truthcore": { "claim": "...", "mechanisms": [...], "evidence": {...} }
      }
    }
  ]
}
```

- 5-turn structured enquiry per episode (not HXRMXS phase/function taxonomy).
- `hxrmxs` field is the teacher voice string.
- Good for enquiry/teaching demos and Diamond pipeline; **not** drop-in for `retrieveExemplar` without a converter.

---

## Folder contents

### Batch 2 (added after first push)

| Folder | What it is |
|--------|------------|
| `istdp/16 better.txt` | Extra ISTDP Th/Pt raw cuts (flat turn lists; parser groups them). |
| `istdp/16 cocreating change pass1.txt` | Co-Creating Change episodes with **student_turns + teacher_turns + episode_overview/insights** (~80 eps). Annotated pass1. |
| `stoic/` | Epictetus Discourses — `10 epictetus.txt` transcripts + `10 epictetus pass 1.txt` annotated. **Stoic lineage.** |
| `cynic/` | Diogenes Laërtius — `6diogenes.txt` + pass1. **Cynic lineage.** |
| `buddhist-extra/mn72.txt` | MN72 Aggi-Vacchagotta eternalism trap (long Buddha↔Vacchagotta). |
| `plato/` | Extra Plato: Apology, Symposium, Meno, Euthyphro, Gorgias (+ annotated pass1s). |
| `gurdjieff/` | Longer Gurdjieff Q/A (`5 gurdjeff.txt` max 14 msgs) + `5 gurdjeff pass1.txt` annotated. |
| `advaita/` | `7nisargadatta.txt` I Am That transcripts + `6 nisargaddata pass1.txt` annotated. |
| `krishnamurti/` | Extra batches: `8 krish.txt`, `14 krishnamurrrti.txt`, `14 krishnamurtiii.txt`. |
| `madhyamaka/` | `11 nagarjuna.txt` Realist↔Buddhist debate turns + `11 dispeller pass1.txt`. |
| `diary/diary training data.txt` | ~102 short `{messages:[...]}` training dialogues. |
| `diamond-numbered/` | Numbered Diamond/Truthcore series from `sanskritree/syntheses` (prana nadis → memory palace rag). Same schema as `gold-diamond/`. |

After batch 2 + `scripts/parse_missing_corpus.py` re-run: **731 normalized episodes**, lineages include Stoic, Cynic, Madhyamaka, ISTDP, Zen, plus diamond topics.

### `istdp/` — highest value missing line (batch 1)

| File | What it is |
|------|------------|
| `16 psycho.txt` | Co-Creating Change / ISTDP transcripts. ~500 episodes. Full Th↔Pt dialogues. Median ~9 messages, max 40 (`therapy1_t492_t538_long_spiral_consensus`). Pure pressure/focus/validation arcs — best source for multi-turn move learning. **Not in uno, not in exemplars.** |

Speakers: `Th` (therapist/teacher), `Pt` (patient/student). Lineage field often `ISTDP`; some nested Modern batches.

### `milinda/` — Buddhist full dialogues

| File | What it is |
|------|------------|
| `13 milinda.txt` | Milindapañha episodes as clean `transcript` (Nāgasena ↔ King Milinda). Chariot, lamp-baby, karma mango-thief, etc. Median ~10 messages. |
| `13 milinda pass1.txt` | Same dialogues with rich per-turn student annotation (`observable_student_behaviors`, `behavior_tags`, `inferred_state`). Best for state-label training. |
| `cxx.txt` | Buddhist episodes in **PEDAGOGY messages** format — Kalama Sutta + Milinda multi-turn with full `[PEDAGOGY]` blocks. Best drop-in for exemplar expansion. |
| `9 buddha.txt` | Same PEDAGOGY Buddhist set as `3 buddha.txt` / parts of finale (mn35/mn44/mn74 + milinda pedagogy). uno only has 6 Buddhist episodes; this is the long gap. |

### `krishnamurti/` — missing lineage

| File | What it is |
|------|------------|
| `14 krishnamurrrti.txt` | U.G. *Mind Is a Myth* + some As-It-Is batches. META/UNMAKING pressure style. Transcript schema. |
| `8 krishna pass1.txt` | Commentaries On Living Series 1 — long Visitor dialogues (`krishna_001_t01_t11_hopeless_ideal` …). Annotated student_turns format. |

**Zero Krishnamurti/Modern episodes in current exemplars.**

### `zen/` — missing lineage

| File | What it is |
|------|------------|
| `9 ZEN.txt` | Dropping Ashes on the Buddha — short shock-closure koans (transcript + metadata + training_value). e.g. cow-no-nostrils, dragon-snake. |
| `9 zen pass 1.txt` | Longer Zen pass variant. |

### `corpus/` — mixed long transcripts

| File | What it is |
|------|------------|
| `corpusss.txt` | Large mixed dump (~677 parseable episodes): Socratic, Gurdjieffian, Buddhist, Advaita, Stoic, Modern, Zen. Contains long Krishna/Milinda arcs also present elsewhere. Prefer primary files above for clean lineage pulls; use this when hunting by episode_id. |
| `cum.txt` | Smaller sibling dump of the same family (Socratic/Buddhist/Krishnamurti). Overlaps `corpusss.txt`. |

### `gold-diamond/` — Diamond/Truthcore enquiry series

One file ≈ one 5-turn enquiry with `hxrmxs` voice + `diamond.n1/n2` structure.

| Files | Topics (examples) |
|-------|-------------------|
| `gold standard 1.txt`, `gold standard 2 who am i.txt` | souls; who am I |
| `gold 4`–`gold 23` | quantum encryption, AGI, picatrix, god, jesus, archon sim, hoffman agents, quantum hype, AI crypto, information spirits, quantum crypto, many worlds, quantum interpretations, crypto career, mitochondria quantum, coding language, breatharian, disruptive domains, tantric practices, kabbalah neuro |
| `golden 3 death.txt` | death |
| `goldilocksv5.3*.txt` | earlier goldilocks draft |

Plus numbered theory files that live in the UK root (not all copied here if they duplicate gold schema): taoist physics, machines consciousness, dzogchen, phowa, madhyamaka, etc. Full list of unique long missing ids: `analysis/uk_missing_long_unique.tsv`.

### `analysis/` — diff vs uno / exemplars

| File | What it is |
|------|------------|
| `uk_missing_long_unique.tsv` | 137 unique long episodes (≥4 user turns or ≥7 msgs) **not** in uno.txt, with best source file. |
| `uk_missing_long_episodes.jsonl` | Full JSON of those missing long episodes (best version per id), with `_source_file` / `_user_turns` metadata. |
| `uk_missing_from_uno.tsv` | All missing-long instances including duplicate copies across files. |
| `uk_missing_ids.txt` | All missing episode_ids (by id compare to uno). |

**Coverage note:** uno.txt = Socratic 60, Therapeutic 58, Gurdjieffian 56, Realist 54, Advaita 40, Buddhist 6. Missing long by lineage: Buddhist 35, ISTDP 18, Modern 14, Krishnamurti 9, Zen 5, + ~40 diamond/gold topics.

---

## How to ingest (suggested next steps)

1. **PEDAGOGY files first** (`milinda/cxx.txt`, `milinda/9 buddha.txt`):  
   Parse `[PEDAGOGY]` blocks → append to `data/hxrmxs-exemplars.json` `exemplars[]` with fields  
   `id`, `function_id`, `lineage`, `phase`, `student_state`, `mechanism`, `register` (PR/IN/AT/LS/PD/MM), `impact`, `text` (post-`[/PEDAGOGY]` only).

2. **ISTDP transcripts** (`istdp/16 psycho.txt`):  
   Convert Th/Pt → user/assistant; either (a) human/LLM annotate function_id per turn for exemplars, or (b) keep as multi-turn context for Jev trajectory tests (`loop_risk`, `distress`).

3. **Krishnamurti / Zen**: same transcript→messages conversion; Zen may stay as `training_value` episodes for method teaching (ME_02 validate aporia).

4. **Gold series**: keep separate from HXRMXS exemplars; wire to enquiry path if/when Diamond layers ship.

5. After any exemplar growth: run `tests/hxrmxs.test.ts` — transmission guarantees require verbatim teacher text.

---

## Not copied here

- `uno.txt`, `finale.txt`, `budda.txt` — largely duplicate of current exemplar source set (Buddhist extras only).
- Raw `milinda.txt` source prose (not episodes).
- Already-covered short-form `9 therapy/socratic/gurdjeff/realist/nisarga` (in uno/exemplars).
- Huge non-corpus UK noise (installers, screenshots, unrelated notes).

## Provenance

- Packed for `prx0r/sanskrithelp` from local UK hxrmxs research dump.
- Diff date: 2026-10-07.
- Do not invent episode ids; use ids already present in the files.
