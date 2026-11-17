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

| Noun path (11) | Verb path (6) | Combined (3) |
|---|---|---|
| a-masc first cases → full grid → a-neut → ā-fem → i/u-masc → ī/ū-fem → ṛ-agents → -an/-in → ant/vant/as/c → go → cases across families | present singular → present full → past → future → imperative+optative → all tenses mixed | sentences I/II/III: cases inside real frames, verbs agreeing — unlocks after the foundations on both sides |

**Left rail — `Browse`**

Families expand to their stems. Click a stem and the centre becomes a **reference view**:
the full 8×3 paradigm (3×3 for verbs), Devanagari + IAST in every cell, the meaning of each
case, the other stems that follow the same pattern, and a *practise this family* button.
Tap any form to see its derivation in the right panel.

**Centre — `Learn`, then `Drill`**

A stage opens on its Learn card: the family's listed forms with each cell's `sup`
ending and operation code, one line per case (meaning, kāraka, sūtra, example),
one fully glossed example sentence, and real-text citations to spot the form in.
Only then does drilling start.

The drill shows **no paradigm** — recall, not copying. The grid appears after
answering, labelled "you answered without it".

**Modes** (scoped by the stage): `Family` name the class · `Form` meaning→form ·
`Read` form→meaning, tap 1 of 4 · `Parse` form→every analysis · `In a sentence`
fill the forced slot · `Surgery` name the firing rule · `Hunt` spot the smuggled
step · `Tense` name the tense · `Who` who acts.

Type in romanised IAST. `Enter` checks, `Enter` again advances. Exact → **Correct**;
right letters without diacritics → **Close**; otherwise the wrong letters are
struck through. Wrong answers re-queue; confusions are named ("'devāya' is
actually dative — compare the two jobs"). Spaced repetition surfaces due items
first; the Review row collects due + weak slots. A stage suggests its least-passed
mode; you keep the buttons.

## Data — all generated, nothing typed from memory

| File | Contents |
|---|---|
| `public/data/index.json` | 57 stems · 17 families (with colour) · 8 vibhaktis · 3 numbers · sūtra text |
| `public/data/fam/*.json` | 1,368 noun forms (57 × 8 × 3) with derivation steps |
| `public/data/verbs.json` | 675 verb forms (15 roots × 5 lakāras × 3 persons × 3 numbers) |
| `public/data/cases.json` | 6 kārakas (imported from svread's karaka wheel) |
| `public/data/sutras.json` | sūtra citation text, 3,983 rules |
| `public/data/curriculum.json` | the path: 20 stages, scopes, prerequisites, pass rule |
| `public/data/sentences.json` | 320+ constructed sentences, every word verified |
| `public/data/frames.json` | the 8 sentence frames both clients share |
| `public/data/attested.json` | real-text citations, build-time verified |

Every surface and every step comes from **Vidyut 0.4.0** (Ambuda, MIT).
`father` in the acc. pl. is not a fact in this repo; it is a derivation the engine ran.

**Honesty rules**

- `DERIVED ≠ truth` — a derivation is a computation, not a scholarly reading.
- `BLOCKED ≠ PASS` — an underivable slot renders as blocked, never as a guess.
- Cross-check: the hand-curated six-stem reference table agrees with the engine **72/72** slots.
  Disagreements are written into `public/data/index.json`, never silently resolved.

## MCP — for ChatGPT and other agents

Endpoint: `POST https://sanskrit.help/mcp` (protocol `2025-06-18`, JSON responses, no auth).

15 tools:

| Tool | Use |
|---|---|
| `harness` | one-fetch overview + the teach-before-test protocol |
| `teach` | the Learn card for a stage — call **before** any drill on it |
| `families` / `cases` / `tenses` | the vocabularies, each with its colour |
| `stems` / `paradigm` | list stems; full 8×3 of one stem |
| `form` / `check` | one noun form + steps; grade → `exact` / `close` / `wrong` |
| `verb` / `verb_check` | the same for verb forms |
| `parse` | grade a recognition answer against every valid analysis |
| `curriculum` | the staged path with scopes, prerequisites and the pass rule |
| `sentence` / `attested` | contextual and real-text questions, answers withheld |
| `drill` | produce a question (answer withheld; `reveal:true` for self-study) |

Connect in ChatGPT: Settings → Connectors → add `https://sanskrit.help/mcp`.
Suggested opening prompt:

> Fetch the Prakriyā curriculum, then for each stage call teach first and drill
> only what was taught. One question at a time, wait for my answer, grade with
> `check`, `parse` or `verb_check`, move on at 90%.

Note: the site sits behind Cloudflare bot protection, which rejects the literal
`Python-urllib/*` user agent. Every normal client (ChatGPT, curl, browsers, requests) passes.

## Rebuild

```sh
pip install vidyut==0.4.0
python3 -c "from vidyut import download_data; download_data('/root/vidyut-0.4.0')"

python3 tools/build_paradigms.py     # nouns   -> public/data/{index,fam/*}
python3 tools/build_verbs.py         # verbs   -> public/data/verbs.json
python3 tools/fetch_sutras.py        # sūtra text (cached; network once)
python3 tools/build_sentences.py     # bank    -> public/data/sentences.json
python3 tools/build_attested.py      # citations (needs SVREAD_DATA)
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
