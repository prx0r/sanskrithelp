# TEACHING — the learning model this app implements

## The loop

```
OBSERVE → RULE → PRODUCE → TRANSFER → DISCRIMINATE → INTERLEAVE → REVIEW → APPLY
```

1. **Observe.** The Learn card shows one family's forms with each cell's
   `sup` ending and operation code, plus a case spotlight (meaning, kāraka,
   sūtra, example) and one fully glossed sentence. Nothing is asked yet.
2. **Rule.** One line per family (`7.1.12` turns ṭā/ṅasi/ṅas into
   ina/āt/sya for -a stems). The rule is read off the engine output, not
   asserted.
3. **Produce.** Blocked practice: the same slot across three stems, no
   paradigm on screen, typed IAST. The grid appears only *after* answering,
   labelled "you answered without it".
4. **Transfer.** Same slot, new stem in the family (rāma after deva). If it
   works, the pattern — not the word — was learned.
5. **Discriminate.** Syncretic forms must list *every* analysis
   (devābhyām needs three). Recognition mode mixes same-stem neighbours.
6. **Interleave.** Mixed stages and the Mix mode; noun×verb sentence stages
   force both systems at once.
7. **Review.** SM-2-lite per slot (details below); due items surface first;
   confusion pairs surface before isolated weak slots.
8. **Apply.** Sentence frames (one changing slot, role forces the case),
   then spot-the-form in real verses.

This order is the research consensus (comprehension before production,
meaning before form, fading support) and mirrors learnsanskrit's
case-first tables and Heritage's read-with-roles method.

## Decision tree (what the app asks next)

```
new question
├─ wrong answers pending? → re-ask the same case (55%)
├─ review stage? → confusion pairs → due → weak → anything
├─ due items in scope? → 60% ask one (varied stem, same slot)
├─ x-stage with verbs? → 35% ask a verb instead
└─ else fresh question in the stage scope
    └─ surgery/hunt: retry up to 12 slots (¼ of cells lack operations)
```

Mode order inside a stage is suggested, not forced: the first mode under
80%-over-6 is preselected; the learner can always override. Unlock is
90% over 10+ attempts, matching the estate rule.

## Spaced repetition (SM-2-lite)

Per slot `{e, i, due}` starting at easiness 2.5, interval 0, due now.
Correct: `e = min(2.5, e+0.1)`; interval 1 → 3 → `round(i·e)` days.
Wrong: `e = max(1.3, e−0.2)`, interval reset, due immediately (re-queued
in-session and first in Review). Old `{t,r}` records migrate lazily.

## Confusion

Every wrong answer stores what was typed (`got`) and the right answer
(`exp`) on the slot. If `got` equals another slot's `exp`, the two slots
are a confusion pair: Review asks them first, and feedback names the
mix-up ("‘devāya’ is actually dative — compare the two jobs").

## Colour contract

- Nouns: colour = stem family (17, all distinct, stored in data).
- Verbs: colour = tense (5).
- The family prompt stays neutral until answered; Browse pauses during
  family questions. Both were leaks; both are now rules.
- Roles inside traces keep the svread vocabulary (stem/class/affix/
  operation/sound/surface) but the drill UI never depends on it.

## What this model does NOT cover

Speech, free composition, sandhi joining (no verified joiner exists in
the toolchain — see DECISIONS.md), or graded readers. Recognition should
outweigh production after first pass; the mode suggestion currently only
nudges. Both are recorded as gaps in REVIEW.md.
