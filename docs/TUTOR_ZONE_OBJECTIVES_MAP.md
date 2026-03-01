Sanskrit Learning Platform
Full Curriculum Design & Zone Specification
10 Zones • Progressive Mastery • Voice-Integrated Assessment



Curriculum Overview
This curriculum is structured as a progressive mastery system across 10 zones. Each zone builds directly on prerequisites defined in the DAG. No zone should be unlocked until its prerequisites are passed. The tutor AI operates strictly within each zone's constraint set and must never reference concepts from upstream zones.

Voice / TTS integration is available across all zones. Wherever a learner produces spoken Sanskrit — whether a single phoneme, a conjugated verb form, or a full sentence — the TTS system records, transcribes, and scores pronunciation against expected output. This is marked in each objective table below.

Prerequisite DAG
Zone
Prerequisites
1. Pratyāhāras (compression)
None
2. Phoneme Grid (phonetics)
None
3. Guṇa / Vṛddhi (gradation)
Phoneme Grid
4. Sandhi
Phoneme Grid + Gradation
5. Dhātus (roots)
Phoneme Grid + Gradation
6. Words
None (parallel entry)
7. Suffixes
Roots
8. Kārakas
Words
9. Verbs (conjugation)
Roots
10. Compounds (samāsa)
Sandhi + Kārakas


Zones 1 and 2 are entry points. A learner may begin either immediately. Zones 3–10 are gated. The recommended linear path is 1 → 2 → 3 → 5 → 9 → 4 → 7 → 8 → 6 → 10, but the DAG allows parallel work where prerequisites allow.



Zone 1: Pratyāhāras
Sound-class shorthand codes from Pāṇini's Śivasūtras


Zone Purpose
Pratyāhāras are Pāṇini's compressed notations for classes of phonemes (e.g., ac = all vowels, hal = all consonants). The learner must understand what they are, why they exist, and be able to recall and apply the most important ones. This zone is purely phonological abstraction — no verb forms, no roots.

Strict Constraints
•  DO: Pratyāhāras (ac, hal, iK, eN, aK, aN, yaṆ, etc.), Śivasūtras, sound-class logic
•  DO NOT: verb conjugation, dhātus, √gam, गच्छति, present tense, sandhi rules beyond sound-class membership

Objectives & Assessment
Lvl
Objective
Pass Criteria
TTS / Voice?
Assessment
1
Define pratyāhāra in own words. Explain why Pāṇini invented them.
Correct definition + motivation in 2 sentences
No
Free response → AI scores semantic content
2
Name the 14 Śivasūtras in order (at least first 5)
Recites first 5 with correct vowel/consonant labels
Yes
Voice input → TTS transcribes → compare to expected
3
Given a pratyāhāra (e.g. ac), list all phonemes it includes
Lists all vowels correctly for ac; all consonants for hal
No
Multiple select / typed list
4
Given a phoneme (e.g. i), name which pratyāhāras it belongs to
Identifies ≥3 correct pratyāhāras containing i
No
Free text → AI validates membership
5
Explain the iK pratyāhāra and its role in sandhi rules (conceptual only)
Correctly states iK = i, u, ṛ, ḷ without naming sandhi rules
No
Short answer → AI semantic check


Session Flow
•  Intro: Show the Śivasūtra table, explain the marker-letter (it) notation
•  Drill 1: Flash card — given pratyāhāra, identify phoneme set
•  Drill 2 (voice): Learner reads aloud the 14 Śivasūtras; TTS scores phoneme accuracy
•  Problem set: 5 membership questions (which pratyāhāra contains X?)
•  Exit check: Learner explains iK to the tutor; AI passes/fails based on criteria

System Prompt Constraints (for LLM)
You are a Sanskrit tutor operating STRICTLY in the Pratyāhāra zone.
NEVER mention: verb conjugation, dhātus, roots, √gam, गच्छति, present tense, sandhi transformations.
ONLY teach: the 14 Śivasūtras, pratyāhāra notation, sound-class membership (ac, hal, iK, eN, aK).
If the learner asks about verb forms or grammar, say: 'That belongs to the Roots zone.
We will get there after Phoneme Grid. For now, let us stay with sound classes.'
Keep examples to phoneme lists only. Never construct words or inflected forms.




Zone 2: Phoneme Grid
Places of articulation, vowel & consonant classification


Zone Purpose
The learner maps every Sanskrit phoneme to its articulatory position (kaṇṭha, tālu, mūrdhan, danta, oṣṭha) and class (stops, nasals, semivowels, sibilants, aspirates). This zone is the phonetic foundation for sandhi, gradation, and correct pronunciation. TTS is used heavily here.

Strict Constraints
•  DO: 5 places of articulation, vowel length (hrasva/dīrgha/pluta), consonant classes (sparśa, antaḥstha, ūṣman), devanāgarī pronunciation
•  DO NOT: sandhi rules, verb conjugation, roots, suffixes

Objectives & Assessment
Lvl
Objective
Pass Criteria
TTS / Voice?
Assessment
1
Name the 5 places of articulation in Sanskrit with one example each
All 5 correct: kaṇṭha (a), tālu (i), mūrdhan (ṭ), danta (t), oṣṭha (p)
Yes
Voice: pronounce each example; TTS scores placement accuracy
2
Pronounce all 16 vowels correctly (a ā i ī u ū ṛ ṝ ḷ e ai o au aṃ aḥ)
TTS score ≥ 80% on all 16 vowels
Yes
TTS phoneme-by-phoneme scoring
3
Classify any given consonant by place AND class
Correctly classifies ≥8/10 in a drill
No
Grid-placement drag-and-drop or typed classification
4
Distinguish short/long vowels by ear and in writing
Identifies hrasva vs dīrgha in 8/10 minimal pairs
Yes
Listen + label, or read aloud both forms
5
Pronounce a 5-phoneme Sanskrit sequence read cold
TTS score ≥ 75% on novel sequence
Yes
Cold reading scored by TTS


Session Flow
•  Intro: The varṇamālā (alphabet) with place-of-articulation annotations
•  Drill 1 (voice): Pronounce each row of the varṇamālā, TTS grades each
•  Drill 2: Classify 10 consonants on the 5×5 grid
•  Drill 3 (voice): Minimal pair pronunciation — 'a' vs 'ā', 'ta' vs 'ṭa'
•  Exit check: Cold-read a 5-phoneme sequence; TTS must pass ≥75%



Zone 3: Guṇa / Vṛddhi (Gradation)
Vowel strengthening rules: the engine of morphology


Zone Purpose
Guṇa and vṛddhi are systematic vowel-strengthening operations that underlie nearly every morphological process in Sanskrit — verb stems, nominal derivation, and sandhi. The learner must be able to apply both operations to any input vowel and identify them in word forms.

Strict Constraints
•  DO: Guṇa table (a→a, i→e, u→o, ṛ→ar), Vṛddhi table (a→ā, i→ai, u→au, ṛ→ār), application to given vowels
•  DO NOT: full sandhi rules, verb paradigms, case endings

Objectives & Assessment
Lvl
Objective
Pass Criteria
TTS / Voice?
Assessment
1
State the guṇa and vṛddhi of any of the 4 base vowels (i, u, ṛ, a)
All 4 pairs correct without prompting
No
Flashcard drill — typed answers
2
Identify guṇa or vṛddhi strengthening in a given word form
Correctly identifies operation in 5/5 examples
No
Multiple choice or highlight
3
Explain why guṇa applies in a specific grammatical context (e.g., present tense thematic vowel)
Correct context + vowel change stated
No
Short answer → AI validates
4
Given root √budh (u), derive its guṇa-grade stem
Produces 'bodh' correctly
Yes
Typed + voice pronunciation
5
Given 5 mixed forms, identify each as base / guṇa / vṛddhi grade
5/5 correct
No
Classification drill


Session Flow
•  Intro: The 3-grade vowel system — zero grade, guṇa, vṛddhi. Analogy: low/mid/high gear
•  Drill 1: Complete the guṇa/vṛddhi table (fill-in-blank)
•  Drill 2: Given 8 word forms, classify grade of the root vowel
•  Problem: Derive guṇa-grade stem from 3 roots
•  Exit check: Explain to tutor why bodha has 'o' instead of 'u'



Zone 4: Sandhi
Sound changes at word and morpheme boundaries


Zone Purpose
Sandhi is the set of rules governing phonological changes at boundaries. Without sandhi competency, the learner cannot read or produce fluent Sanskrit sentences. This zone covers the major external (word-boundary) and internal (morpheme-boundary) sandhi rules with production and analysis exercises.

Strict Constraints
•  DO: Vowel sandhi (savarṇa dīrgha, guṇa, vṛddhi, yāṇ, āyādi), visarga sandhi, consonant sandhi at word boundaries
•  DO NOT: full verb paradigms, compound analysis (that is Zone 10)

Objectives & Assessment
Lvl
Objective
Pass Criteria
TTS / Voice?
Assessment
1
Apply savarṇa-dīrgha sandhi: ca + āgacchati → cāgacchati
Correct output + rule stated
Yes
Typed output + voice pronunciation of result
2
Apply guṇa sandhi: upa + indra → upendra
Correct output
Yes
Typed + voice
3
Apply visarga sandhi in 3 different environments
3/3 correct
No
Transformation drill
4
Given a sandhi'd string, reverse-engineer the original two words (sandhi-viccheda)
Correct separation in 4/5 cases
No
Typed analysis
5
Read aloud a 3-word Sanskrit phrase with correct sandhi pronunciation
TTS score ≥ 75% on sandhi junctions
Yes
Voice input at phrase boundaries
6
Explain which pratyāhāra class (from Zone 1) determines a given sandhi rule
Correctly links rule to sound class (e.g., iK → y before unlike vowel)
No
Short answer — cross-zone integration check


Session Flow
•  Intro: Why sandhi exists — Sanskrit is spoken continuously, boundaries dissolve
•  Drill 1: 8 vowel sandhi transformations (produce the joined form)
•  Drill 2: 5 sandhi-viccheda (split the joined form)
•  Drill 3 (voice): Read 3-word phrases; TTS grades junction accuracy
•  Exit check: Cross-zone question — which pratyāhāra class is involved in yāṇ sandhi?



Zone 5: Dhātus (Roots)
Verbal roots, stem formation, and early conjugation


Zone Purpose
This is the core grammar zone. The learner acquires verbal roots (dhātus), understands how stems are derived from them, and begins producing inflected forms. The present tense (laṭ lakāra) is taught here for class 1, 4, and 6 verbs. √gam, √bhū, √kṛ are the canonical examples.

Strict Constraints
•  DO: dhātu definition, √gam, √bhū, √kṛ, √vad, √pat, present tense 3rd person forms, gaṇa (verb class), vikaraṇa (class suffix)
•  DO NOT: sandhi rules (handle only if directly caused by verb derivation, and even then briefly), kāraka analysis, compound splitting

Objectives & Assessment
Lvl
Objective
Pass Criteria
TTS / Voice?
Assessment
1
Define dhātu in own words; give one root and one derived form
Correct definition + valid example
No
Free response → AI semantic check
2
Identify the root in गच्छति (gacchati). Name the root.
Identifies √gam; explains the stem change gam → gacch
No
Analysis drill
3
Produce all 3 persons of singular present tense of √gam (class 1)
gacchāmi / gacchasi / gacchati — all correct
Yes
Typed + voice TTS scores each form
4
Produce present tense 3rd person singular of √bhū, √vad, √pat
bhavati / vadati / patati — all correct
Yes
Typed + voice
5
Produce 3 valid forms from √bhū across different persons/numbers
Any 3 valid forms from the present paradigm
Yes
Open production + TTS voice
6
Identify the gaṇa (class) of 5 given roots from a mixed list
4/5 correct gaṇa identification
No
Classification drill
7
Produce 5 forms from √kṛ across present tense, all 3 persons singular
karomi / karoṣi / karoti — plus 2 additional valid forms
Yes
Production + TTS


Session Flow
•  Intro: What is a dhātu? Show Dhātupāṭha structure. The root as the minimal unit of meaning.
•  Drill 1: Root identification — given 6 word forms, find the root
•  Drill 2: Paradigm building — complete the present tense singular of √gam with the tutor
•  Drill 3 (voice): Produce each form aloud; TTS grades each
•  Problem: Derive present tense of √bhū and √kṛ independently
•  Exit check: Produce 5 forms of √kṛ across persons — voice + typed



Zone 6: Words (Vocabulary)
Core vocabulary, nominal stems, and semantic fields


Zone Purpose
Vocabulary acquisition structured around semantic fields: body, nature, time, action, relation. This zone teaches nominal stems (a-stem, ā-stem, i-stem), introduces the concept of vibhakti (case) at a definitional level only, and builds a working vocabulary of ~150 high-frequency Sanskrit words.

Strict Constraints
•  DO: nominal stems, gender (liṅga), semantic fields, basic case concept (vibhakti) as label only — no full declension
•  DO NOT: full case paradigms (that requires Kārakas), sandhi across words, compound analysis

Objectives & Assessment
Lvl
Objective
Pass Criteria
TTS / Voice?
Assessment
1
Give the Sanskrit word for 10 basic nouns (body: karaḥ, netraṃ, etc.)
8/10 correct with correct gender
Yes
Recall drill + voice pronunciation
2
Identify the stem class (a/ā/i/u-stem) of 8 given nouns
6/8 correct
No
Classification
3
Give the gender of 10 common nouns
8/10 correct
No
M/F/N tagging drill
4
Translate 5 simple Sanskrit noun phrases (nominative only) into English
4/5 correct meaning
Yes
Translation + voice read-aloud
5
Recall 20 high-frequency words from spaced-repetition deck without hint
16/20 correct within 30 seconds each
Yes
Timed flashcard + optional voice input


Session Flow
•  Intro: Nominal stems and the concept of liṅga. Why gender matters for agreement.
•  Semantic field drilling: body → nature → time → action → relation (5 sessions)
•  Spaced repetition deck: All 150 words enter SRS after first encounter
•  Voice drill: Pronounce each new word; TTS scores and flags incorrect stress/length
•  Exit check: 20-word cold recall from full deck, voice or typed



Zone 7: Suffixes (Kṛt & Taddhita)
Derivational morphology — building words from roots


Zone Purpose
Kṛt suffixes derive nominals directly from verbal roots (e.g., √gam + a → gama, going). Taddhita suffixes derive secondary nominals from nouns. This zone gives the learner productive morphology — the ability to coin and decode new words by recognizing suffix patterns.

Strict Constraints
•  DO: kṛt suffixes (a, ana, tar, tṛ, ya, tavya, anīya, ta), taddhita (tva, tā, mat, vat), agent/action/adjective derivation
•  DO NOT: full sandhi during derivation (state the rule but don't drill it here), case analysis

Objectives & Assessment
Lvl
Objective
Pass Criteria
TTS / Voice?
Assessment
1
Define kṛt and taddhita. Give one example each.
Correct definitions + valid examples
No
Free response
2
Given √gam, derive: agent (gamaka/gantṛ), action (gamana), gerundive (gantavya)
All 3 correct with suffix identified
Yes
Derivation drill + voice
3
Given a kṛt-derived form (e.g. bodhana), identify the root and suffix
Root + suffix both correct in 4/5 cases
No
Morphological analysis
4
Derive abstract noun using tva and tā from 3 adjectives
3/3 correct (e.g. sundara → sundara-tva)
No
Typed derivation
5
Identify the suffix type (agent/action/adjective/abstract) for 8 derived forms
6/8 correct
No
Classification drill


Session Flow
•  Intro: How Sanskrit builds vocabulary from roots + suffixes. Generative power.
•  Drill 1: Suffix table — match suffix to meaning type
•  Drill 2: Given 5 roots, derive agent + action nouns using kṛt suffixes
•  Drill 3: Decompose 5 derived forms back to root + suffix
•  Exit check: Derive 3 forms from √bhū independently, voice + typed



Zone 8: Kārakas
Semantic roles and case endings — the grammar of meaning


Zone Purpose
Kārakas are Pāṇini's semantic role system: kartṛ (agent), karman (object), karaṇa (instrument), sampradāna (recipient), apādāna (source), adhikaraṇa (locus). Each maps to one or more vibhakti (case endings). The learner must be able to identify the kāraka role of a noun in a sentence and apply the correct case ending.

Strict Constraints
•  DO: All 6 kārakas + sambandha (genitive relation) + āmantrita (vocative), case ending tables for a-stem masculine/neuter and ā-stem feminine
•  DO NOT: compound splitting, secondary derivation, complex sandhi across case endings

Objectives & Assessment
Lvl
Objective
Pass Criteria
TTS / Voice?
Assessment
1
Name all 6 kārakas and their approximate English equivalents
All 6 correct
No
Recall drill
2
Given a simple Sanskrit sentence, identify the kartṛ and karman
Both correct in 3/3 sentences
No
Role labelling
3
Apply correct case ending for a-stem masculine noun in nominative, accusative, instrumental
3/3 forms correct (rāmaḥ / rāmam / rāmeṇa)
Yes
Production + voice TTS
4
Apply all 8 cases to a single a-stem masculine noun (rāma)
7/8 correct (sambandha allowed one error)
Yes
Full paradigm recitation, voice + typed
5
In a given sentence, identify the kāraka of every noun and justify the case used
All nouns correctly labelled with justification
No
AI evaluates justification quality
6
Translate 3 simple sentences from English → Sanskrit using correct case endings
All 3 grammatically correct (case accuracy primary metric)
Yes
Translation + voice pronunciation of output


Session Flow
•  Intro: What is a kāraka? Distinction between semantic role (kāraka) and formal case (vibhakti).
•  Drill 1: Role identification in 6 sample sentences
•  Drill 2: Case ending table — complete a-stem masculine declension
•  Drill 3 (voice): Recite full rāma paradigm aloud; TTS grades endings
•  Problem: Translate 3 English sentences → Sanskrit
•  Exit check: Annotate a 5-word Sanskrit sentence with kāraka roles and case justifications



Zone 9: Verbs (Conjugation)
Full verbal system: tenses, moods, voices, and persons


Zone Purpose
Building directly on Zone 5 (Roots), this zone completes the verbal system: all 10 lakāras (tenses and moods), parasmaipada vs ātmanepada voice, and the ability to produce and parse any first-year verb form. The learner moves from isolated verb forms to producing grammatical sentences.

Strict Constraints
•  DO: laṭ (present), laṅ (imperfect), loṭ (imperative), vidhi-liṅ (optative), liṭ (perfect), all persons and numbers, parasmaipada/ātmanepada distinction
•  DO NOT: taddhita suffixes, compound analysis

Objectives & Assessment
Lvl
Objective
Pass Criteria
TTS / Voice?
Assessment
1
Conjugate √gam in full present tense (laṭ) — all 3 persons, 3 numbers
All 9 forms correct
Yes
Full paradigm recitation, voice + typed
2
Produce imperfect (laṅ) 3rd person singular of √bhū, √gam, √kṛ
abhavat / agacchat / akarot — all correct
Yes
Production + voice
3
Produce imperative (loṭ) 2nd person singular of √vad, √gam
vada / gaccha — correct
Yes
Command drill + voice
4
Distinguish parasmaipada vs ātmanepada for √labh, √yaj
Correctly assigns voice + produces 3rd sg form
No
Classification + derivation
5
Parse any given verb form: root / tense / person / number / voice
All 5 categories correct in 4/5 examples
No
Full morphological parse
6
Produce a grammatical 5-word Sanskrit sentence using a conjugated verb
Correct verb agreement + kāraka case on subject/object
Yes
Production + TTS voice scoring
7
Produce 5 forms from √kṛ across different tenses/moods
5 valid forms from ≥3 different lakāras
Yes
Open production, voice + typed


Session Flow
•  Intro: The 10 lakāras and their semantic meanings. Present vs past vs optative.
•  Drill 1: Full laṭ paradigm of √gam — typed then voice
•  Drill 2: Tense transformation — convert present to imperfect for 5 verbs
•  Drill 3: Parse 5 verb forms back to root + morphology
•  Problem: Produce a complete sentence — 'Rāma goes to the forest'
•  Exit check: 5 forms of √kṛ across 3 tenses, voice + typed



Zone 10: Compounds (Samāsa)
Multi-member word formation and analysis


Zone Purpose
Sanskrit compounds (samāsas) are multi-member nominal constructions that behave as single words. This zone teaches the 6 major compound types, how to split them (vigraha), and how sandhi operates at compound boundaries. This is the capstone zone — it integrates sandhi (Zone 4), vocabulary (Zone 6), and kārakas (Zone 8).

Strict Constraints
•  DO: dvandva, tatpuruṣa, karmadhāraya, bahuvrīhi, avyayībhāva, dvigu; vigraha (compound resolution); sandhi at compound junctions
•  DO NOT: vedic compounds, completely novel grammar concepts

Objectives & Assessment
Lvl
Objective
Pass Criteria
TTS / Voice?
Assessment
1
Name all 6 samāsa types with one example each
All 6 correct with valid examples
No
Recall + classification
2
Given a tatpuruṣa compound, provide vigraha (resolution)
Correct vigraha for 3/3 examples
No
Analysis drill
3
Identify the compound type of 6 mixed compounds
5/6 correct
No
Classification
4
Form a dvandva from two given nouns with correct sandhi
Correct compound + correct sandhi at junction
Yes
Formation + voice pronunciation
5
Identify and resolve a bahuvrīhi compound in a sentence context
Correct identification + accurate semantic resolution
No
Contextual analysis
6
Construct a tatpuruṣa and a karmadhāraya from given elements, with vigraha
Both correct — compound form + vigraha
Yes
Production + voice
7
Analyse a 3-member compound: split all junctions, apply vigraha, state compound type
All junctions + type correct
No
Full compound analysis


Session Flow
•  Intro: Why Sanskrit uses compounds — economy of expression, poetic density
•  Drill 1: Compound type recognition — 8 examples, classify each
•  Drill 2: Vigraha practice — resolve 5 tatpuruṣa and karmadhāraya compounds
•  Drill 3 (voice): Read compound aloud; TTS grades sandhi junctions
•  Problem: Build 3 compounds from given noun pairs
•  Exit check: Full analysis of a 3-member compound — type, vigraha, sandhi



Cross-Zone Integration & Progression Logic

Unlocking Conditions
Each zone has a hard pass threshold before the next locked zone opens. The tutor must surface the relevant unlock criteria to the learner at the start of each zone.

Zone
Unlock Condition
Gradation (3)
Phoneme Grid: Level 3 passed (consonant classification)
Sandhi (4)
Gradation: Level 3 passed + Phoneme Grid complete
Roots (5)
Gradation: Level 3 passed + Phoneme Grid complete
Suffixes (7)
Roots: Level 5 passed (3 forms from √bhū)
Kārakas (8)
Words: Level 3 passed (gender classification)
Verbs (9)
Roots: Level 4 passed (gam/bhū/vad/pat present 3rd sg)
Compounds (10)
Sandhi: Level 4 passed + Kārakas: Level 5 passed


TTS Voice Assessment — Usage Matrix
The following summarises how TTS is used across zones. Voice input is optional but earns bonus assessment credit and unlocks a 'pronunciation mastery' badge per zone.

Zone
Primary TTS Use
1. Pratyāhāras
Reading the 14 Śivasūtras aloud — phoneme accuracy scoring
2. Phoneme Grid
Vowel pronunciation, minimal pairs, cold reading
3. Gradation
Pronunciation of guṇa/vṛddhi grade forms
4. Sandhi
Reading sandhi-joined phrases at junctions
5. Roots (Dhātus)
Producing verb forms aloud — each form scored individually
6. Words
New word pronunciation + 20-word cold recall
7. Suffixes
Reading derived forms — suffix vowel length accuracy
8. Kārakas
Full case paradigm recitation + sentence production
9. Verbs
Full tense paradigms + complete sentence production
10. Compounds
Reading full compounds with correct sandhi junctions


Drift Prevention — Prompt Engineering Principles
The problem documented in this spec (LLM teaching present-tense verbs inside the Pratyāhāra zone) is solved by three mechanisms:

•  1. Hard DO/DO NOT constraint lists per zone injected into every system prompt (see each zone above)
•  2. Redirect phrase: when a learner asks an out-of-zone question, the tutor says exactly: 'That belongs to [Zone N]. Once you pass [prerequisite], we can go there. For now, let us focus on [current zone topic].'
•  3. Few-shot examples in the system prompt: provide one example of a correct in-zone response and one example of an incorrect drift response, so the model learns the boundary by example rather than rule alone
◦  Example correct (Zone 1): 'ac includes all vowels: a, ā, i, ī, u, ū, ṛ, ṝ, ḷ, e, ai, o, au'
◦  Example incorrect (Zone 1): 'The vowel i becomes e in the present tense of class 1 verbs...' ← NEVER in Zone 1

Recommended Learning Path
For a learner starting from zero with a goal of reading classical Sanskrit within 12–18 months:

•  Month 1–2: Zones 1 + 2 in parallel (Pratyāhāras + Phoneme Grid) — heavy TTS
•  Month 3: Zone 3 (Gradation) + begin Zone 6 (Words) in parallel
•  Month 4–5: Zone 5 (Roots) — most time-intensive zone
•  Month 6: Zone 9 (Verbs) — builds directly on Roots
•  Month 7: Zone 4 (Sandhi) — apply to real reading material
•  Month 8: Zones 7 + 8 in parallel (Suffixes + Kārakas)
•  Month 9–10: Zone 10 (Compounds) — capstone
•  Month 11+: Reading practice (Hitopadeśa, Kathāsaritsāgara) — all zones active simultaneously



---

## Implementation — Where This Lives in the Codebase

| Concept | Location |
|---------|----------|
| Zone definitions, prerequisites, level_count | `tutor/config/zones.json` |
| Per-zone objectives, pass criteria, TTS flags | `tutor/config/session_specs/*.json` |
| Zone unlock logic, prerequisites DAG | `lib/zoneProgress.ts` |
| Pathway fallback (objectives per level) | `lib/tutorPathwayFallback.ts` |
| Zone constraints (DO/DO NOT) for LLM | `lib/tutorPathwayFallback.ts` → `ZONE_CONSTRAINTS` |
| Tutor API pathway endpoint | `app/api/tutor/pathway/[zoneId]/route.ts` |
| Tutor UI with zone/level selection | `app/learn/tutor/page.tsx` |
| Voice / TTS stack | `docs/VOICE_AND_TTS_STACK.md` |

---

## Institutional Benchmark & Gap Analysis

**Sources**: Columbia, Harvard, Toronto, Cambridge Introduction to Sanskrit, Indian NEP 2020

This section maps published learning objectives from five authoritative programs against our 10-zone curriculum. It identifies zone matches, gaps, and prioritised actions to reach Year 1 institutional equivalence.

### Columbia University — MDES UN1401/1402/1404/1405/GU4810/4812

| Level | Stated Objective | Type | Zone Match |
|-------|------------------|------|------------|
| Elementary | Learn to read and write the Devanagari script | Script | Zone 2 |
| Elementary | Develop basic listening comprehension via in-class story-telling | Listening | No zone |
| Elementary | Develop basic reading comprehension via exercise and story translation | Reading | Partial Z6 |
| Elementary | Obtain a working vocabulary of the most essential words and roots (~500) | Vocabulary | Zone 6 |
| Elementary | Formulate and respond to basic class-related questions with proper pronunciation | Speaking | TTS only |
| Elementary | Master the fundamentals of Sanskrit grammar and syntax through focused usage | Grammar | Z1–Z9 |
| Elementary | Recognize and perform the various types of euphonic combination (sandhi) | Phonology | Zone 4 |
| Elementary | Become proficient in analyzing basic compounds and derivations | Morphology | Z7 + Z10 |
| Elementary | Become proficient in navigating a Sanskrit dictionary organized by root | Reference | No zone |
| Elementary | Learn the elements of Sanskrit prosody — the śloka and its recitation | Prosody | No zone |
| Elementary | Translate extended passages of Epic with the aid of a dictionary | Reading | No zone |

### Harvard University — SANSKRIT 101A/101B + 102BR

| Level | Stated Objective | Type | Zone Match |
|-------|------------------|------|------------|
| Year 1 end | Mastery of the Devanagari writing system | Script | Zone 2 |
| Year 1 end | Correct pronunciation of all Sanskrit sounds | Phonology | Zone 2 |
| Year 1 end | All fundamental topics of Sanskrit grammar | Grammar | Zones 1–9 |
| Year 1 end | Basic writing in Sanskrit | Writing | Partial |
| Year 1 end | Basic speaking in Sanskrit | Speaking | TTS only |
| Year 1 end | Ready to read the Mahabharata / Bhagavad Gita with dictionary aid | Reading | Zone 11 |
| Intermediate | Read from one of the great Sanskrit epics | Reading | Zone 11 |

### Cambridge Introduction to Sanskrit (Ruppel) — Ch 1–40

Key chapter → zone mapping: Ch 1–2 (Script/Phonology → Z2), Ch 3–4 (Roots, present tense → Z5), Ch 5–6 (Case, a-stems → Z8, Z6), Ch 7 (Guṇa/vṛddhi → Z3), Ch 8 (Participles, ta- → Z7), Ch 11 (External sandhi → Z4), Ch 12 (Imperfect, optative → Z9), Ch 14 (Compounds → Z10), Ch 20–23 (Pronouns → Z8), Ch 21 (Passive voice → Z9), Ch 36 (Absolute constructions → Z8/Z9), Ch 37 (Numerals → Z6), Ch 38 (Aorist → Z9).

### University of Toronto — RLG260/263 + SAN392

RLG260 (Fall): Zones 1–6. RLG263 (Winter): Zones 7–10. SAN392: Meta-linguistic (Z1 Pāṇini), reading variety of genres (Zone 11).

### Indian NEP 2020 — Sanskrit Honours

Declensions, conjugations, sandhi, kāraka-vibhakti (Z8, Z9, Z4, Z7). Language proficiency (Z1–2). Grammar and syntax in depth (Z8–9).

---

### Consolidated Gap Analysis

| Institution Standard | Gap / Status | Action |
|----------------------|--------------|--------|
| Devanagari script — reading and writing (all 5 sources) | Zone 2 covers pronunciation but NO explicit Devanagari writing | Add Zone 2 levels: identify, write characters, write words, write sentences |
| Dictionary navigation — finding words by root | No zone | New Zone 11 or Zone 6 extension |
| Pronoun paradigms (tad-, ayam-, aham-, tvam-, kim-, yad-) | Zones 8–9 include some pronoun use but no systematic objectives | Add to Zone 8 |
| Participles — present, future, perfect, passive ta- | Zone 7 covers kṛt suffixes but participles as a class not explicit | Extend Zone 7 |
| Prosody — śloka metre, heavy/light syllables | No prosody zone | New micro-zone or Zone 2 ext. |
| Extended text reading with dictionary — Epic Sanskrit | No reading zone | Zone 11: Reading |
| Absolute constructions — locative/genitive absolute | Key syntactic construction absent | Add to Zone 8 or Zone 9 |
| Passive voice (Cambridge Ch 21, Indian NEP) | Zone 9 covers parasmaipada/ātmanepada but not passive | Add to Zone 9 |
| Aorist tense (Cambridge Ch 38) | Zone 9 mentions 10 lakāras but aorist (luṅ) not in objectives | Add to Zone 9 Level 8+ |
| Consonant-stem noun declension | Zone 6 focuses on a/ā/i/u-stems | Extend Zone 6 |
| Desideratives (Cambridge Ch 33) | Not in any zone | Add to Zone 7 or Zone 9 |
| Numerals (Cambridge Ch 37) | Not in any zone | Add to Zone 6 vocabulary |

---

### Prioritised Actions (Institutional Benchmark)

| Priority | Action |
|----------|--------|
| **P1 — Critical** | Add explicit Devanagari script writing objectives to Zone 2 (Levels 1–3: identify, write characters; Level 4: write words; Level 5: write sentences from dictation) |
| **P1 — Critical** | Add pronoun paradigms to Zone 8 (tad-, ayam-, aham-, tvam-, kim-, yad-) |
| **P1 — Critical** | Add participle objectives to Zone 7: present active (ant-), past passive (ta-), future passive (ya/tavya/anīya), perfect active |
| **P1 — Critical** | Add passive voice objectives to Zone 9 (karmaṇi prayoga — 3rd sg, 3rd pl) |
| **P1 — Critical** | Add Zone 11: Reading — dictionary navigation + unseen passage reading with dictionary aid |
| **P2 — High** | Add absolute constructions to Zone 8 or Zone 9 (locative absolute) |
| **P2 — High** | Extend Zone 6 to include consonant-stem nouns (dental and nasal stems) |
| **P2 — High** | Add aorist tense (luṅ) to Zone 9 |
| **P3 — Medium** | Add śloka prosody to Zone 2 (heavy/light syllables, 16-syllable line) |
| **P3 — Medium** | Add desideratives to Zone 7 or Zone 9 |
| **P3 — Medium** | Add Sanskrit numerals (1–100) to Zone 6 vocabulary |
| **P4 — Nice to have** | Optional cultural/literary Zone 0 (Gita 2.47, Hitopadesha excerpts) |
| **P4 — Nice to have** | Listening comprehension mode: TTS narrates story, learner answers questions |
