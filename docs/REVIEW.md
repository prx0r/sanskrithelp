# Review — similar systems, their methods, and what this site took from each

Date: 2026-11-17. Status: working notes, not a claim about anyone else's product.

## 1. The systems

### Saṃskṛt Workshop (ayi.info) — the closest model for recognition
Curated paradigm tables (Whitney-based, ~76 noun tables plus pronouns and
Vedic variants, each with a stated learning-target count), and the core game
is **matching forms to translations**. Verbs are taught the same way
("match forms with their translations and compare how they are formed").
Method: recognition-before-production, curated tables, no invented forms.
Stated unit: one table at a time ("a-stem · deva (m.), 24 learning targets").

### learnsanskrit.org — the case-first curriculum
Organised **by case, not by table**. Each case page: what the case means,
one row of one model paradigm, then exercises in real sentences (twenty Gītā
verses across the Nouns unit). Early chapters produce English→Sanskrit;
later chapters flip to **recognition only** (Sanskrit→English), on the
explicit grounds that production gets too hard. Acquisition-vs-study split is
their stated philosophy (VanPatten/Gass): rules are studied, fluency is
acquired through content. Direct method first (meaning through examples),
the rule named afterwards.

### Sanskrit Heritage (Inria/UoH, Huet–Kulkarni) — reading as the drill
Colour = part of speech (blue subanta, red tiṅanta, purple avyaya, green
vocative). Click a segment → its morphology, linked to the lexicon and to the
generators. The course teaches by **reading one story end to end**
(Vikramacarita) with the tool, assigning kāraka roles per segment, in the
Khaṇḍānvaya/Daṇdānvaya tradition. The engine warns on garbage input and
labels doubt instead of guessing ("Gender anomaly report").

### Vidyut / Vidyullekha (Ambuda) — the generator, not a pedagogy
2,000+ Aṣṭādhyāyī rules as code, derivation traces, openly acknowledged
limits. This site's engine. No teaching claims; that restraint is the point.

### SanskritPlayground / samshodhanamandiram / games.sanskrit.dev
Word-builders with dials (root+prefix+suffix), points, streaks, sandhi
solvers, samāsa and kṛt/taddhita workshops. Game layer only: score, streak,
challenges. Good at motivation, thin on sequencing or correctness proof.

### Classroom research (REET/B.Ed. summaries, Nation & Newton lineage)
The working sequence: **comprehension before production, meaning before
form, graded support**. Direct method (meaning through action) →
structural-situational frames (one sentence frame, changing slot) →
the rule surfaced last → conversation. Prompts fade as confidence grows
(Vygotsky ZPD).

## 2. What this site took from each

| Source | Taken | Deliberately not taken |
|---|---|---|
| Workshop | tables-as-units; form↔translation matching (= our Read mode); honest source notes (Whitney) | hand curation only — we generate, then cross-check |
| learnsanskrit | case spotlight; recognition emphasis; sentences as the exercise; rule-after-meaning | their Gītā corpus and acquisition track (we have no graded readers yet) |
| Heritage | colour-as-grammar; click-for-morphology; kāraka↔vibhakti; doubt labelled, never guessed | reading real literature as the drill (our corpus link is citations-only so far) |
| Vidyut | everything computable: forms, traces, 2,000+ rules | any teaching claim on its behalf |
| Games sites | streak, accuracy, points-less progress bars | timers, leaderboards, coins |
| Research | one frame + changing slot; prompts fade; retry-until-right | spoken production, dialogues |

## 3. svread logic: kept vs dropped

Kept: closed world (only generated surfaces render; blocked slots show as
blocked), deterministic emitters with `--check`, honesty labels
(DERIVED≠truth, BLOCKED≠PASS, disagreements recorded), the reference table
as cross-check (72/72), the one-fetch harness shape (now the `harness` tool),
colour roles, verify-before-deploy.

Dropped, with reasons:
- **Lean certificates / trace receipts.** Right call for an app: the traces
  are shown but unpinned. If Vidyut regenerates differently, `verify_data`
  won't catch semantic drift, only build failures. Accept and state it.
- **Blind benchmark + gates.** Lane-owned evaluation infra; not needed to
  teach declension.
- **MCP answer discipline.** svread's harness separates verify-index from
  answers; our first `drill` returned the answer in-band (a leak). Fixed:
  answers are withheld by default, graded via `check`/`parse`/`verb_check`.
- **Teach-before-test guard.** svread's SESSION-PROTOCOL; our MCP relies on
  tool descriptions. Weaker, acceptable for now.

## 4. Honest gaps (in priority order)

1. **No real reading.** Sentences are constructed; the 5 citations are
   spot-the-form in hard text. The bridge to literature (svread reader
   bundles + claim pages) is one link deep, not a drill. Next: attested
   sentence drills once a Sanskritist vets a graded set.
2. **Production outweighs recognition.** Read mode exists but is one option
   among four; the research and learnsanskrit both say recognition should
   dominate later. Next: make Read the default after a stage's first pass.
3. **No spaced repetition.** Retry is within-session only. Per-slot stats
   exist and are the right key for it — unwired.
4. **Confusion drills unused.** Per-slot error data is recorded but never
   mined for "you mix -āya and -āyāḥ" stages.
5. **No external sandhi.** Sentences are written unjoined and labelled.
   Correct as far as it goes; a joined toggle is the honest upgrade.
6. **Tense×case integration missing.** Nouns and verbs drill on separate
   tracks; real sentences need both. The sentence frames already combine
   them — the stages should follow.
7. **No speech channel.** Labs show pronunciation and listening matter;
   out of scope for this surface.
