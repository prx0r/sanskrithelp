/**
 * Static pathway fallback when Sabdakrida backend is unavailable.
 * Keeps tutor working and ensures zone-specific objectives are correct.
 */

export type PathwayLevel = { level: number; objectives: string[] };
export type Pathway = { zone_id: string; label: string; levels: PathwayLevel[] };

const FALLBACKS: Record<string, Pathway> = {
  compression: {
    zone_id: "compression",
    label: "Pratyāhāras",
    levels: [
      { level: 1, objectives: ["Define pratyāhāra in own words", "Explain why Pāṇini invented them"] },
      { level: 2, objectives: ["Name the 14 Śivasūtras in order (at least first 5)"] },
      { level: 3, objectives: ["Given a pratyāhāra (e.g. ac), list all phonemes it includes"] },
      { level: 4, objectives: ["Given a phoneme (e.g. i), name which pratyāhāras it belongs to"] },
      { level: 5, objectives: ["Explain the iK pratyāhāra and its role in sandhi rules (conceptual only)"] },
    ],
  },
  phonetics: {
    zone_id: "phonetics",
    label: "Phoneme Grid",
    levels: [
      { level: 1, objectives: ["Name the 5 places of articulation in Sanskrit with one example each"] },
      { level: 2, objectives: ["Pronounce all 16 vowels correctly"] },
      { level: 3, objectives: ["Classify any given consonant by place AND class"] },
      { level: 4, objectives: ["Distinguish short/long vowels by ear and in writing"] },
      { level: 5, objectives: ["Pronounce a 5-phoneme Sanskrit sequence read cold"] },
      { level: 6, objectives: ["Identify and write individual Devanagari characters (vowels and consonants)"] },
      { level: 7, objectives: ["Write Sanskrit words in Devanagari from dictation or transcription"] },
      { level: 8, objectives: ["Write simple Sanskrit sentences in Devanagari from dictation"] },
    ],
  },
  gradation: {
    zone_id: "gradation",
    label: "Guṇa / Vṛddhi",
    levels: [
      { level: 1, objectives: ["State the guṇa and vṛddhi of any of the 4 base vowels (i, u, ṛ, a)"] },
      { level: 2, objectives: ["Identify guṇa or vṛddhi strengthening in a given word form"] },
      { level: 3, objectives: ["Explain why guṇa applies in a specific grammatical context"] },
      { level: 4, objectives: ["Given root √budh (u), derive its guṇa-grade stem"] },
      { level: 5, objectives: ["Given 5 mixed forms, identify each as base / guṇa / vṛddhi grade"] },
    ],
  },
  sandhi: {
    zone_id: "sandhi",
    label: "Sandhi",
    levels: [
      { level: 1, objectives: ["Apply savarṇa-dīrgha sandhi: ca + āgacchati → cāgacchati"] },
      { level: 2, objectives: ["Apply guṇa sandhi: upa + indra → upendra"] },
      { level: 3, objectives: ["Apply visarga sandhi in 3 different environments"] },
      { level: 4, objectives: ["Given a sandhi'd string, reverse-engineer the original two words (sandhi-viccheda)"] },
      { level: 5, objectives: ["Read aloud a 3-word Sanskrit phrase with correct sandhi pronunciation"] },
      { level: 6, objectives: ["Explain which pratyāhāra class determines a given sandhi rule"] },
    ],
  },
  roots: {
    zone_id: "roots",
    label: "Dhātus",
    levels: [
      { level: 1, objectives: ["Define dhātu in own words", "Give one root and one derived form"] },
      { level: 2, objectives: ["Identify the root in गच्छति (gacchati)", "Name the root"] },
      { level: 3, objectives: ["Produce all 3 persons of singular present tense of √gam (class 1)"] },
      { level: 4, objectives: ["Produce present tense 3rd person singular of √bhū, √vad, √pat"] },
      { level: 5, objectives: ["Produce 3 valid forms from √bhū across different persons/numbers"] },
      { level: 6, objectives: ["Identify the gaṇa (class) of 5 given roots from a mixed list"] },
      { level: 7, objectives: ["Produce 5 forms from √kṛ across present tense, all 3 persons singular"] },
    ],
  },
  words: {
    zone_id: "words",
    label: "Words",
    levels: [
      { level: 1, objectives: ["Give the Sanskrit word for 10 basic nouns (body: karaḥ, netraṃ, etc.)"] },
      { level: 2, objectives: ["Identify the stem class (a/ā/i/u-stem) of 8 given nouns"] },
      { level: 3, objectives: ["Give the gender of 10 common nouns"] },
      { level: 4, objectives: ["Translate 5 simple Sanskrit noun phrases (nominative only) into English"] },
      { level: 5, objectives: ["Recall 20 high-frequency words from spaced-repetition deck without hint"] },
      { level: 6, objectives: ["Decline basic consonant-stem nouns (dental and nasal stems)"] },
      { level: 7, objectives: ["Use Sanskrit numerals 1–100 in context"] },
    ],
  },
  suffixes: {
    zone_id: "suffixes",
    label: "Suffixes",
    levels: [
      { level: 1, objectives: ["Define kṛt and taddhita", "Give one example each"] },
      { level: 2, objectives: ["Given √gam, derive: agent (gamaka/gantṛ), action (gamana), gerundive (gantavya)"] },
      { level: 3, objectives: ["Given a kṛt-derived form (e.g. bodhana), identify the root and suffix"] },
      { level: 4, objectives: ["Derive abstract noun using tva and tā from 3 adjectives"] },
      { level: 5, objectives: ["Identify the suffix type (agent/action/adjective/abstract) for 8 derived forms"] },
      { level: 6, objectives: ["Identify and produce participles: present active (ant-), past passive (ta-), future passive (tavya/anīya)"] },
      { level: 7, objectives: ["Identify perfect active participles (ant- from liṭ)"] },
      { level: 8, objectives: ["Form and recognize desideratives (icchāya-pratyaya — want to V)"] },
    ],
  },
  karakas: {
    zone_id: "karakas",
    label: "Kārakas",
    levels: [
      { level: 1, objectives: ["Name all 6 kārakas and their approximate English equivalents"] },
      { level: 2, objectives: ["Given a simple Sanskrit sentence, identify the kartṛ and karman"] },
      { level: 3, objectives: ["Apply correct case ending for a-stem masculine noun in nominative, accusative, instrumental"] },
      { level: 4, objectives: ["Apply all 8 cases to a single a-stem masculine noun (rāma)"] },
      { level: 5, objectives: ["In a given sentence, identify the kāraka of every noun and justify the case used"] },
      { level: 6, objectives: ["Translate 3 simple sentences from English → Sanskrit using correct case endings"] },
    ],
  },
  verbs: {
    zone_id: "verbs",
    label: "Verbs",
    levels: [
      { level: 1, objectives: ["Conjugate √gam in full present tense (laṭ) — all 3 persons, 3 numbers"] },
      { level: 2, objectives: ["Produce imperfect (laṅ) 3rd person singular of √bhū, √gam, √kṛ"] },
      { level: 3, objectives: ["Produce imperative (loṭ) 2nd person singular of √vad, √gam"] },
      { level: 4, objectives: ["Distinguish parasmaipada vs ātmanepada for √labh, √yaj"] },
      { level: 5, objectives: ["Parse any given verb form: root / tense / person / number / voice"] },
      { level: 6, objectives: ["Produce a grammatical 5-word Sanskrit sentence using a conjugated verb"] },
      { level: 7, objectives: ["Produce 5 forms from √kṛ across different tenses/moods"] },
      { level: 8, objectives: ["Produce passive voice (karmaṇi prayoga) 3rd sg and 3rd pl forms"] },
      { level: 9, objectives: ["Produce aorist (luṅ) forms for √gam, √bhū"] },
    ],
  },
  compounds: {
    zone_id: "compounds",
    label: "Compounds",
    levels: [
      { level: 1, objectives: ["Name all 6 samāsa types with one example each"] },
      { level: 2, objectives: ["Given a tatpuruṣa compound, provide vigraha (resolution)"] },
      { level: 3, objectives: ["Identify the compound type of 6 mixed compounds"] },
      { level: 4, objectives: ["Form a dvandva from two given nouns with correct sandhi"] },
      { level: 5, objectives: ["Identify and resolve a bahuvrīhi compound in a sentence context"] },
      { level: 6, objectives: ["Construct a tatpuruṣa and a karmadhāraya from given elements, with vigraha"] },
      { level: 7, objectives: ["Analyse a 3-member compound: split all junctions, apply vigraha, state compound type"] },
    ],
  },
  reading: {
    zone_id: "reading",
    label: "Reading",
    levels: [
      { level: 1, objectives: ["Navigate a Sanskrit dictionary (Apte/Monier-Williams) to find words by root"] },
      { level: 2, objectives: ["Read an unseen Sanskrit passage with dictionary aid and identify key grammatical structures"] },
      { level: 3, objectives: ["Translate a short Epic passage (śloka) with dictionary aid"] },
      { level: 4, objectives: ["Read and comprehend a graded passage from Hitopadeśa or similar"] },
      { level: 5, objectives: ["Read a passage from Mahabharata or Bhagavad Gita with dictionary aid"] },
    ],
  },
};

/** Zone-specific constraints to keep the LLM on topic. Drift prevention: redirect out-of-zone questions. */
export const ZONE_CONSTRAINTS: Record<string, string> = {
  compression: `CRITICAL: You are a Sanskrit tutor operating STRICTLY in the Pratyāhāra zone.
- DO teach: pratyāhāras (ac, hal, iK, eN, aK, aN, yaṆ), Śivasūtras, sound-class logic.
- DO NOT teach: verb conjugation, dhātus, √gam, गच्छति, present tense, sandhi rules beyond sound-class membership.
If the learner asks about verb forms or grammar, say: "That belongs to the Roots zone. We will get there after Phoneme Grid. For now, let us stay with sound classes."`,
  phonetics: `CRITICAL: You are in the Phoneme Grid zone.
- DO teach: 5 places of articulation, vowel length (hrasva/dīrgha/pluta), consonant classes (sparśa, antaḥstha, ūṣman), devanāgarī pronunciation.
- DO NOT teach: sandhi rules, verb conjugation, roots, suffixes.`,
  gradation: `CRITICAL: You are in the Guṇa/Vṛddhi (gradation) zone.
- DO teach: Guṇa table (a→a, i→e, u→o, ṛ→ar), Vṛddhi table (a→ā, i→ai, u→au, ṛ→ār), application to given vowels.
- DO NOT teach: full sandhi rules, verb paradigms, case endings.`,
  sandhi: `CRITICAL: You are in the Sandhi zone.
- DO teach: vowel sandhi (savarṇa dīrgha, guṇa, vṛddhi, yāṇ, āyādi), visarga sandhi, consonant sandhi at word boundaries.
- DO NOT teach: full verb paradigms, compound analysis (that is Zone 10).`,
  roots: `CRITICAL: You are in the Dhātus (roots) zone.
- DO teach: dhātu definition, √gam, √bhū, √kṛ, √vad, √pat, present tense 3rd person forms, gaṇa (verb class), vikaraṇa (class suffix).
- DO NOT teach: sandhi rules (handle only if directly caused by verb derivation), kāraka analysis, compound splitting.`,
  words: `CRITICAL: You are in the Words (vocabulary) zone.
- DO teach: nominal stems (a/ā/i-stem), gender (liṅga), semantic fields, basic case concept (vibhakti) as label only.
- DO NOT teach: full case paradigms (requires Kārakas), sandhi across words, compound analysis.`,
  suffixes: `CRITICAL: You are in the Suffixes (Kṛt & Taddhita) zone.
- DO teach: kṛt suffixes (a, ana, tar, tṛ, ya, tavya, anīya, ta), taddhita (tva, tā, mat, vat), agent/action/adjective derivation.
- DO NOT teach: full sandhi during derivation, case analysis.`,
  karakas: `CRITICAL: You are in the Kārakas zone.
- DO teach: all 6 kārakas, sambandha (genitive), āmantrita (vocative), case ending tables for a-stem masculine/neuter and ā-stem feminine.
- DO NOT teach: compound splitting, secondary derivation, complex sandhi across case endings.`,
  verbs: `CRITICAL: You are in the Verbs (conjugation) zone.
- DO teach: laṭ (present), laṅ (imperfect), loṭ (imperative), vidhi-liṅ (optative), liṭ (perfect), all persons/numbers, parasmaipada/ātmanepada.
- DO NOT teach: taddhita suffixes, compound analysis.`,
  compounds: `CRITICAL: You are in the Compounds (samāsa) zone.
- DO teach: dvandva, tatpuruṣa, karmadhāraya, bahuvrīhi, avyayībhāva, dvigu, vigraha (compound resolution), sandhi at compound junctions.
- DO NOT teach: vedic compounds, completely novel grammar concepts.`,
  reading: `CRITICAL: You are in the Reading zone.
- DO teach: dictionary navigation (root-based lookup), passage analysis, translation strategies, vigraha and anvaya in commentary.
- DO NOT teach: new grammar concepts; assume learner has completed Zones 1–10. Focus on applying existing knowledge to real texts.`,
};

export function getPathwayFallback(zoneId: string): Pathway | null {
  return FALLBACKS[zoneId] ?? null;
}
