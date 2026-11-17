# RESEARCH — is this useful, what is paper-worthy, and what blocks it

## 1. Verdict: useful, with the evidence on our side

**Colour coding works.** Not as decoration — as input enhancement for
grammatical categories. Kohler (2009, n=148): +16% / +13% over monochrome,
retained at 4 weeks. Arzt & Kost (2016): the colour group held its gains on
the delayed test while the control decayed. Aljehani (2022, n=82, ANOVA
p=0.00): significant advantage retained after one month. A 2025 three-level
meta-analysis on textual enhancement (bolding/colour/underlining) exists and
points the same way. Our design choice — colour = the *category being
learned* (family, tense), not decoration — is exactly what the literature
tests.

**The method matches the field.** Kulkarni et al. (IIT-KGP/UoH) argue for
*load sharing*: the machine carries forms, sandhi and paradigm tables; the
human carries meaning, context and judgement (ākṣāṅkā/yogyatā/sannidhi).
10–15 hour domain capsules built this way got readers into real Vedānta
texts. Our Learn card → drill → sentence → spot-the-form chain is that
capsule shape, per family instead of per text.

**The gap we fill is real.** START/Samsādhanī (ISCLS 2024) report their own
limits from classroom use: not mobile-friendly, and *too many machine
answers* — "readers would like to see only one output rather than many, in
the beginning." Our closed world (one form per slot, blocked slots stated)
is a direct answer to a published complaint. Nobody in the surveyed field
combines generated paradigms + staged unlocking + confusion diagnosis +
withheld-answer tutoring in one surface.

## 2. Paper-worthy contributions (ranked)

1. **Confusion mining from production errors without labelled data.**
   Matching a wrong typed answer against other slots' right answers
   (`got` vs `exp`) diagnoses the confusion pair for free, and Review asks
   the pair first. No confusion matrix to hand-build, no labels needed.
   This is, as far as we can tell, novel in CALL literature.
2. **Verified generation as a pedagogy primitive.** 72/72 machine-vs-hand
   agreement, build-time gates that refuse to emit on mismatch, and a UI
   that cannot display an unverified form. A replicable pattern for any
   low-resource inflected language, not just Sanskrit.
3. **Withheld-answer tutoring protocol over MCP.** Teach-before-test
   enforced by API shape (answers only via grading endpoints), so any
   tutor model inherits the discipline. `teach` → `drill` → `check/parse`
   is a machine-checkable lesson contract.

Candidate venues: ICON (NLP in India), WSSANLP-style Sanskrit workshops,
ISCLS, or a CALL journal for the colour/confusion study — the last needs
a user study we have not run (see §4).

## 3. Flaws and obstacles (honest list)

- **No efficacy data of our own.** Everything above is borrowed evidence.
  We log accuracy per slot but have never run even an n=20 pre/post test.
  Any paper claiming learning gains is blocked on this.
- **Constructed sentences, not a corpus.** 320 frames-sentences are
  grammatical but inauthentic; the 16 citations are authentic but hard.
  The middle — graded real reading — does not exist.
- **Recognition is still the minority.** Read/Parse exist, but stage orders
  lead with production and nothing forces the flip. The literature says
  flip it.
- **SRS is SM-2-lite, not FSRS.** Fine for v1; FSRS (Ye et al. 2022+) fits
  better and is published, parameterised work we could adopt and cite.
- **No speech.** Labs evidence says pronunciation/listening matter;
  we have zero audio.
- **Sandhi dodged.** Unjoined words are labelled, but real text joins.
  Vidyut ships a splitter, not a joiner — no verified path exists yet.
- **MCP discipline is advisory.** A rogue tutor can call `reveal:true`
  or ignore `teach`. Enforcement would need sessions; the Worker is
  stateless by design.
- **Small paradigm corners untested by humans.** ubhayapada pinning,
  `pati`'s irregular genitive, and neuter syncretisms are machine output
  no Sanskritist has signed.

## 4. Research direction

Short term (no new data): run the pre/post study on ourselves — even
within-team n=5 with the per-slot logs we already keep. Publish the
method + logs as a demo paper.

Medium term: graded attested sentences (a Sanskritist vets 100 simple
ones; the build gate already supports them), FSRS scheduling, and the
recognition flip.

Long term: the same engine + method for a second inflected language
(Greek or Latin share the machinery: stems × endings × agreement), which
tests whether the contribution is Sanskrit-specific or general.
