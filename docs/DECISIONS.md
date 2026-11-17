# DECISIONS — why each thing is the way it is

One line of justification per decision, newest last. If a decision below is
wrong, change the line *and* the code together.

## Engine and data

1. **Vidyut generates; nothing is typed.** Every surface and step is engine
   output. A derivation is a computation, never presented as scholarship.
2. **Dhātu identity is (upadeśa, gaṇa), primary stems only.** clean_text
   collides (`as` = to be / to sit) and derivatives share the upadeśa, so the
   index skips prefixed and sanādi (causative/desiderative/intensive) entries.
   Without this, `gam` derived as `gamayate`.
3. **Parasmaipada pinned** for ubhayapada roots (`karoti`, not `kurute`;
   Juhotyadi `dā` for `dadāti`). Teaching default; ātmanepada stays a gap.
4. **Gaṇa keys use Vidyut's own spellings** (`BvAdi`, `adAdi`). The enum
   names differ (`Bhvadi`); comparing naively matches nothing.
5. **Verb slots are `Prathama.Eka`-cased, nouns lowercase.** The single
   most expensive bug in this project was a case mismatch in one lookup.
6. **Sūtra text is padaccheda, committed.** Vidyut ships unspaced SLP1;
   the ashtadhyayi.com data release carries word division for all 3,983.
   Two codes have no text (`89` is internal; `6.4.148.1` is unlisted) and
   render empty rather than invented — both are allowlisted in tests.
7. **Cross-check 72/72 is a reproduction check, not truth.** It proves the
   machine reproduces the hand table, nothing more.

## Sentences (bank, not live generation)

8. **Bank over live generation.** One seeded, verified file both clients
   read. Live generation duplicated frame logic across JS/Python and hid
   English bugs until a user saw them.
9. **Subject stays singular (except nominative targets).** Third-person
   singular verbs agree by construction; number practice lives on the other
   slots. Plural subjects exist only where the verb lookup can agree.
10. **Proper names never pluralise; mass nouns never pluralise; no stem
    twice in one sentence.** Each rule fixed a real generated howler
    (`Rāmas go`, `the honeys`, `the son goes with the son`).
11. **Coverage is a gate, and it respects mass nouns.** Every stem is a
    target ≥2, except stems with only one possible key (mass nouns), which
    need 1. The first version demanded 2 of everything and could never pass.
12. **Words are written unjoined, labelled.** No verified joiner exists in
    the toolchain (Vidyut ships a splitter, not a joiner), so a joined
    toggle would be invented sandhi. Deferred with reason, not silently.
13. **English glosses are pedagogical, not translations.** `happy one`,
    mass/proper handling, irregular plurals. Gloss changes happen at the
    source (build_paradigms), never as UI patches.

## Quiz integrity

14. **No paradigm on screen while answering.** The grid was the deepest
    design failure: it turned recall into copying. It appears only after,
    labelled "you answered without it".
15. **Family prompt neutral until answered; Browse pauses during family
    questions.** Both leaked the answer (tinted stem, grouped list).
16. **Syncretism requires every analysis.** `devābhyām` needs three readings;
    partial credit does not exist. Distractors may themselves be valid —
    grading is against the analysis set, not a single pair.
17. **Wrong answers re-queue; confusion is diagnosed.** `got` vs `exp`
    across slots names the mix-up in feedback; Review asks confused pairs
    first.
18. **MCP drill withholds answers by default.** The first version returned
    the answer in-band (a leak). Grading happens via check/parse/verb_check;
    `reveal:true` exists for self-study only.

## Progression

19. **Stages unlock at 90% over 10+, matching the estate.** Modes suggest
    (first under 80%-over-6) but never force; the learner keeps the buttons.
20. **Review is a pseudo-stage, not a mode.** Due (SRS) then weak, confusion
    pairs first, stage scope ignored. Nothing special to learn, everything
    to maintain.
21. **x-stages mix verbs into noun practice at 35%.** Real sentences need
    both systems; the tracks stay separate for focused work.
22. **Surgery/hunt retry across slots.** A quarter of cells lack operation
    steps (affix-only derivations); the modes retry up to 12 slots, then
    fall back to Build rather than fail.

## Presentation

23. **Family tag stays visible in sentence tasks.** The tested skill is
    case→form; the family is context, like the verb. (Family *questions*
    hide everything — see 15.)
24. **Mobile grid blowout fixed with minmax(0,1fr).** `1fr` grows to fit
    the widest child; the family strip forced the whole page to 2317px.
25. **`[hidden]` needs `!important`.** Component `display` rules override
    the UA stylesheet; the trace showed through until this was set.
