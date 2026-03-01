# Proactive Tutor Design — Full Spec

**Goal:** System guides the user through the embedding space. Not "user asks, tutor answers" — "system says you're here, do this." Daily custom exercises, objective-driven sessions, level gates, voice-optional assessment.

---

## Design Decisions (Locked)

| Decision | Choice | Reason |
|----------|--------|--------|
| Level count | Vary by zone | Phonetics 5, Sandhi 15, Dhātus 10, Reading 10 (graded texts). Simple zones feel arbitrary with 10. |
| Session length | Until objectives met, 15-min hard cap | Fixed time penalises fast/slow learners. Objectives-first is correct. Cap prevents grinding. |
| Retry policy | 3 attempts → remedial mode | Surface prereq material from 1–2 zones back, schedule different version next session. Don't hammer same level. |
| Voice | Optional, encouraged, never required | Train, speech impediment, bad day — don't lock out. Default UX = voice, clear "use text instead". Text production = "unverified pronunciation" flag. |
| Level specs | Hand-author structure, LLM generates content | Objectives, pass criteria, zone in spec. LLM generates questions/drills. Pass criteria must be deterministic. |
| Assessment | Separate modules, different confidence | Grammar = deterministic. Pronunciation = probabilistic + thresholds. Conceptual = LLM + rubric. Don't treat identically. |
| Navigator | Weekly arc, daily fills slot | Not generate from scratch daily. Navigator outputs weekly arc; daily brief fills today's slot. Cheaper, more coherent. |
| Conceptual checks | Rubric in spec, not vague LLM judge | `pass_criteria: ["mentions verbal root", "distinguishes from inflected form", "gives example"]`. LLM checks boxes, not vibes. |

---

## Assessment Modules (Separate)

### 1. Grammar Production (Deterministic)

- Validate against conjugation tables, declension tables, corpus.
- **Hard fail** — wrong form = wrong.
- No LLM. Pure lookup/validation.
- Used for: "Produce present 3rd sg of √gam", "What is the accusative of deva?"

### 2. Pronunciation (Probabilistic)

- Whisper transcribe → phoneme_diff → score.
- **Tolerance thresholds** — slightly off phoneme might be soft warning, not fail.
- Config: `strict_mode` (pronunciation gate) vs `lenient` (general practice).
- Flag: `unverified_pronunciation: true` when user submits text instead of voice.
- Used for: shadowing, minimal pairs, word production.

### 3. Conceptual Understanding (LLM + Rubric)

- **Rubric in session spec** — specific checkboxes.
- Example: `pass_criteria: ["mentions verbal root", "distinguishes from inflected form", "gives at least one example"]`
- LLM evaluates: "For each criterion, did the response satisfy it? Y/N."
- **70% right = pass** (configurable). Not binary "good enough" vibe check.
- Used for: "Explain what a dhātu is", "Why does a + a → ā?"

---

## Navigator: Weekly Arc, Daily Slot

### Weekly Arc

```
Input: profile (zone_levels, weakness_centroid, zone_scores, phoneme_errors)
Output: weekly_arc
  - goals: [{ zone, from_level, to_level, focus }]
  - daily_slots: [
      { day: 0, session_type, zone, level?, drill_recommendations },
      ...
    ]
```

- Generated once per week (or when user completes a level).
- Coherent: "This week: Dhātu level 3 → 5, with Sandhi Level 2 maintenance."
- Stored in profile or separate `weekly_plans` table.

### Daily Brief

```
Input: weekly_arc, today_index, profile
Output: daily_brief
  - today_slot: { session_type, zone, level, objectives }
  - drill_recommendations: ["dhatu_dash", "pronunciation_retroflex"]
  - free_chat_prompt: optional
```

- Fills today's slot from the arc.
- No full generation from scratch. Just render the slot + optional LLM polish on the message.

---

## Session Spec Schema

Hand-authored structure. LLM fills content.

```json
{
  "zone_id": "roots",
  "level": 1,
  "objectives": ["Define dhātu in own words", "Give one example"],
  "pass_criteria": {
    "conceptual": [
      "mentions verbal root or equivalent",
      "distinguishes root from inflected form",
      "gives at least one correct example"
    ],
    "production": null,
    "pronunciation": null
  },
  "assessment_type": "conceptual",
  "format": "chat",
  "max_duration_minutes": 15,
  "retrieval_context": { "zone": "roots", "difficulty": 1 },
  "remedial_on_fail": { "prerequisite_zones": ["phonetics"], "retry_variant": "level_1_v2" }
}
```

- `assessment_type`: `conceptual` | `production` | `pronunciation` | `mixed`
- `pass_criteria`: rubric for conceptual; null for production (validated by corpus); thresholds for pronunciation
- `remedial_on_fail`: after 3 attempts, use this

---

## Level Counts by Zone

| Zone | Levels | Notes |
|------|--------|-------|
| compression (Pratyāhāras) | 5 | Bounded |
| phonetics | 5 | Articulation points |
| gradation | 8 | Guṇa/Vṛddhi patterns |
| sandhi | 15 | Deep, many rules |
| roots (Dhātus) | 10 | Standard |
| words | 8 | Vocabulary + declension |
| suffixes | 10 | Kṛt, taddhita |
| karakas | 10 | Case relations |
| verbs | 12 | Conjugation depth |
| compounds | 10 | Samāsa types |
| reading | 10 | Graded texts, not discrete skills |
| philosophy | 8 | Gated behind reading + compounds |

---

## Profile Extension

```python
# Add to UserProfile
zone_levels: dict[str, int]        # {"roots": 3} = passed level 3
level_retry_counts: dict[str, int] # {"roots_3": 2} = 2 failed attempts at roots level 3
weekly_arc: dict | None            # current week's plan
last_arc_generated: datetime | None
unverified_pronunciation: set[str]  # chunk_ids or level_ids where user used text
```

---

## API Surface

Mounted at `/tutor` on sabdakrida (port 8010).

| Endpoint | Purpose |
|----------|---------|
| `GET /tutor/weekly-arc/{user_id}` | Return weekly arc (generate if missing or >7 days) |
| `GET /tutor/daily-brief/{user_id}` | Today's slot from arc |
| `GET /tutor/session/spec/{zone_id}/{level}` | Session spec for a level |
| `POST /tutor/session/start` | Form: user_id, zone_id, level. Returns first prompt |
| `POST /tutor/session/submit` | Form: user_id, zone_id, level, user_input. Optional: audio file. Returns pass/fail |

---

## File Layout

```
tutor/
  config/
    zones.json          # prerequisites, level counts
    session_specs/      # one file per zone or per level
      roots.json
      sandhi.json
      ...
  navigator.py          # weekly arc, daily brief
  assessment/
    grammar.py          # deterministic production check
    pronunciation.py    # Whisper + phoneme_diff, thresholds
    conceptual.py       # LLM + rubric
  conductor.py          # session runner
```
