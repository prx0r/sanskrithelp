# Prakriyā — sanskrit.help

A drill trainer for Sanskrit noun families and verb tenses.
Colour is the teaching device: **one colour per declension family**, **one colour per tense**.

- **Site:** https://sanskrit.help
- **MCP (ChatGPT):** `https://sanskrit.help/mcp` — Streamable HTTP, no auth

## The app

Fixed viewport, no page scroll. Three panels, two jobs for the rail.

**Left rail — `Path`**

The learning order, as 11 noun stages and 6 verb stages. Each stage names its scope
(e.g. *a-stem masculine · first cases*), says why it comes there, shows your accuracy,
and unlocks when the previous stage reaches **90% over 10+ attempts**.

| Noun path | Verb path |
|---|---|
| a-masc first cases → a-masc full grid → a-neut → ā-fem → i/u-masc → ī/ū-fem → ṛ-agents → -an/-in → ant/vant/as/c → go → cases across families | present singular → present full → past → future → imperative+optative → all tenses mixed |

**Left rail — `Browse`**

Families expand to their stems. Click a stem and the centre becomes a **reference view**:
the full 8×3 paradigm (3×3 for verbs), Devanagari + IAST in every cell, the meaning of each
case, the other stems that follow the same pattern, and a *practise this family* button.
Tap any form to see its derivation in the right panel.

**Centre — `Drill`**

The question, the live grid with the target cell marked `?` and every neighbour given,
and the input. Type, Enter to check, Enter to advance. Exact → **Correct**, right letters
without diacritics → **Close**, otherwise the wrong letters are struck through.

**Modes** (scoped by the stage): `Family` name the class · `Build` type the form ·
`Reverse` form → case/number (every reading required) · `Tense` name the tense.

Type in romanised IAST. `Enter` checks, `Enter` again advances. Diacritic toolbar under the input.
Exact match → **Correct**; right letters without diacritics → **Close**; otherwise the wrong letters are struck through.

## Data — all generated, nothing typed from memory

| File | Contents |
|---|---|
| `public/data/index.json` | 57 stems · 17 families (with colour) · 8 vibhaktis · 3 numbers · sūtra text |
| `public/data/fam/*.json` | 1,368 noun forms (57 × 8 × 3) with derivation steps |
| `public/data/verbs.json` | 675 verb forms (15 roots × 5 lakāras × 3 persons × 3 numbers) |
| `public/data/cases.json` | 6 kārakas (imported from svread's karaka wheel) |
| `public/data/sutras.json` | sūtra citation text, 3,983 rules |
| `public/data/curriculum.json` | the path: stages, scopes, prerequisites, pass rule |

Every surface and every step comes from **Vidyut 0.4.0** (Ambuda, MIT).
`father` in the acc. pl. is not a fact in this repo; it is a derivation the engine ran.

**Honesty rules**

- `DERIVED ≠ truth` — a derivation is a computation, not a scholarly reading.
- `BLOCKED ≠ PASS` — an underivable slot renders as blocked, never as a guess.
- Cross-check: the hand-curated six-stem reference table agrees with the engine **72/72** slots.
  Disagreements are written into `public/data/index.json`, never silently resolved.

## MCP — for ChatGPT and other agents

Endpoint: `POST https://sanskrit.help/mcp` (protocol `2025-06-18`, JSON responses, no auth).

12 tools:

| Tool | Use |
|---|---|
| `harness` | one-fetch overview: colour system, families, cases, tenses, how to teach |
| `families` / `cases` / `tenses` | the vocabularies, each with its colour |
| `stems` / `paradigm` | list stems; full 8×3 of one stem |
| `form` | one noun form + its sūtra steps |
| `check` | grade a learner's noun answer → `exact` / `close` / `wrong` |
| `verb` / `verb_check` | the same for verb forms |
| `curriculum` | the staged path with scopes, prerequisites and the pass rule |
| `drill` | produce a question (answer included — do not reveal it) |

Connect in ChatGPT: Settings → Connectors → add `https://sanskrit.help/mcp`.
Suggested opening prompt:

> Fetch the Prakriyā curriculum, start at the first stage, and drill me through it.
> One question at a time, wait for my answer, grade with `check` or `verb_check`,
> show the sūtra steps only after I answer, and move to the next stage at 90%.

Note: the site sits behind Cloudflare bot protection, which rejects the literal
`Python-urllib/*` user agent. Every normal client (ChatGPT, curl, browsers, requests) passes.

## Rebuild

```sh
pip install vidyut==0.4.0
python3 -c "from vidyut import download_data; download_data('/root/vidyut-0.4.0')"

python3 tools/build_paradigms.py     # nouns   -> public/data/{index,fam/*}
python3 tools/build_verbs.py         # verbs   -> public/data/verbs.json
python3 tools/fetch_sutras.py        # sūtra text (cached; network once)
python3 tools/verify_data.py         # what CI runs before deploy
```

Push to `main` → GitHub Action runs `verify_data.py` then `wrangler deploy`.
Worker name `sanskrithelp`; the custom domain stays bound to it.

## Reused from svread

- the kāraka/case relationships (`data/wheels/karaka.json`)
- the six-stem curated paradigm table (`data/wheels/declension.json`) as the cross-check
- the role→colour vocabulary (aṅga / gaṇa / pratyaya / saṃskāra / rūpa)
- the one-fetch `harness.json` pattern, here as the `harness` tool

## The previous site

The Next.js / OpenNext app that lived here before is preserved on branch
`archive/nextjs-2026-11-17` and in `/root/archive/sanskrithelp-nextjs-2026-11-17.tar.gz`.
