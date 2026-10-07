# STONEDOORWAY TANTRA BODY — scope (FUTURE, not built)

> The wild one: a full tantra-focused Stonedoorway program — human body with
> mātṛkās floating over each part, selectable config, all theory sources
> feeding a structured training program + course. This doc scopes it so the
> build starts from frozen data, not vibes. Status: SCOPE ONLY.

## The experience (target)

A night-mode 3D-ish body (Stonedoorway runtime, headphones on):

* 50 mātṛkā glyphs float over verse-literal loci (shoulder `ka`, heart `ma`…).
* **Config selector**: Mātṛkā (emission) ↔ Mālinī (na→pha reconfiguration) ↔
  Śakti layer (Wheel II: phoneme × locus × presiding power, post-Sprint-1).
* Tap a glyph → hear it (human clip) → locus pulses → breath cue → silence.
* Programs run the curriculum: nightly pair (Audio 01 method) → sṛṣṭi/apyaya
  full-body runs → collective-field holds → uccāra dissolution.
* Progress = checkpoints 0–10 (awesomecurriculum.md); morning recall check
  back in sanskrithelp.

## Data contracts (already frozen — reuse, don't reinvent)

| Need | Source (sanskrithelp) | Status |
|---|---|---|
| 50 loci + verse sources + apparatus | `matrika-body-map-v2` | FROZEN |
| Mālinī order + body map | `malini_order.json` | on disk, partially verified |
| 47/50 human clips | `public/memory/clips/` | live |
| Wheel II schema (phoneme×locus×Śakti×iconography) | `docs/TRANSLATION_FRONTIER.md` § extra schema | spec'd, awaiting Sprint 1 data |
| 50 Śaktis + iconography | Sprint 1: Kularatnoddyota 5.84–101 (~18 verses) | NOT STARTED — first data dependency |
| Nightly method + checkpoints + Audio 00–19 map | `awesomecurriculum.md` + `audio-course-scope.md` | spec'd |
| Handoff in/out | `nightHandoff` (installed/recall/dream prompts) | live in Night page |

## Stonedoorway audio-bed targets (exist today)

* `matrika-night` preset — phoneme install bed.
* `routine-x-night-stack` — Laya 1:4:2 → Mātṛkā phonemes → astral body.
* `notoria-grammar-study` — grammar-first session shell.
* Worlds: `bruno-memory.json`, `understairs.json` (see `/root/stoned`).

## Build phases (in order — no skipping)

1. **Static body + Mātṛkā layer**: glyphs over v2 loci, tap-to-hear, config = Mātṛkā only.
2. **Nightly program engine**: pair rotation (25 pairs), sṛṣṭi/apyaya runs, gap engine from Audio 01 template.
3. **Mālinī config**: second map over same body (needs malini loci verified).
4. **Wheel II / Śakti layer**: NEEDS Sprint 1 translation data (KuRatnUdd 5.84–101 → 50 Śaktis). Blocked until then.
5. **Checkpoints + course**: 0–10 progression, morning recall API back to sanskrithelp.
6. **Geometry mutation** (awesomevision3 Phase 6): triangle/maṇḍala render; wheel becomes editor, not the world.

## Non-goals (explicit)

* No Hz-per-phoneme doctrine, no medical claims (both repos' policies stand).
* No synth phonemes in install path (human gold; EdgeSanskrit drafts only post-listen).
* No Mālinī/Śakti layers before their data exists — Mātṛkā-only ships first.
* Stonedoorway owns night runtime; sanskrithelp owns day install + text truth. Handoff JSON is the only coupling.

## First unblock

Sprint 1 translation (KuRatnUdd 5.84–101 → 50 phonemes/loci/Śaktis) + HF approval for chant v2
(recitation bed). Everything else builds on those two.
