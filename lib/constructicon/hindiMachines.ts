import type { Exemplar, Island, Machine } from "./types";

/** Hindi constructicon v0: our 4 frames + 2 chunk templates as machines.
 *  Slots reference the compiler's lexicon (hindiPresets); the machine is the
 *  linguistic object, the wheel its visualization. Ergative/perfective machines
 *  do not exist yet — by design (see README-HINDI-WHEELS §6).
 */
export const HINDI_MACHINES: Machine[] = [
  {
    id: "ability-question",
    lang: "hindi",
    island: "kar-island",
    meaning: "ask whether actor has permission/ability to perform action",
    form: "क्या [ACTOR] [OBJECT] [ROOT] सक [AGR] [AUX]?",
    slots: [
      { name: "ACTOR", constraint: "human", required: true },
      { name: "OBJECT", constraint: "action-compatible", required: false },
      { name: "ROOT", constraint: "verb:infinitive-capable", required: true },
    ],
    features: { interrogative: true, modality: "ability", "gender-agreement": true, politeness: "derived-from-actor" },
    examples: ["क्या मैं यहाँ बैठ सकता हूँ?", "क्या मैं आपके साथ अभ्यास कर सकता हूँ?"],
    connections: [
      { to: "desire", relation: "desire-of" },
      { to: "kiske-origin", relation: "generalization-of" },
    ],
    ucxn: null,
    ud: null,
    propbank: null,
  },
  {
    id: "progressive",
    lang: "hindi",
    island: "sikh-island",
    meaning: "actor is performing action now",
    form: "[ACTOR] [TIME] [OBJECT] [ROOT] रह [AGR] [AUX]",
    slots: [
      { name: "ACTOR", constraint: "human", required: true },
      { name: "OBJECT", constraint: "action-compatible", required: false },
      { name: "ROOT", constraint: "verb", required: true },
    ],
    features: { interrogative: false, aspect: "progressive", "gender-agreement": true },
    examples: ["मैं हिंदी सीख रहा हूँ।", "मैं संस्कृत पढ़ रहा हूँ।"],
    connections: [{ to: "habitual", relation: "generalization-of" }],
    ucxn: null,
    ud: null,
    propbank: null,
  },
  {
    id: "habitual",
    lang: "hindi",
    island: "kar-island",
    meaning: "actor generally performs action",
    form: "[ACTOR] [TIME] [OBJECT] [ROOT] त [AGR] [AUX]",
    slots: [
      { name: "ACTOR", constraint: "human", required: true },
      { name: "OBJECT", constraint: "action-compatible", required: false },
      { name: "ROOT", constraint: "verb", required: true },
    ],
    features: { interrogative: false, aspect: "habitual", "gender-agreement": true },
    examples: ["मैं हर दिन संस्कृत पढ़ता हूँ।"],
    connections: [{ to: "progressive", relation: "generalization-of" }],
    ucxn: null,
    ud: null,
    propbank: null,
  },
  {
    id: "desire",
    lang: "hindi",
    island: "kar-island",
    meaning: "actor wants to perform action",
    form: "[ACTOR] [OBJECT] [INFINITIVE] चाह [AGR] [AUX]",
    slots: [
      { name: "ACTOR", constraint: "human", required: true },
      { name: "OBJECT", constraint: "action-compatible", required: false },
      { name: "INFINITIVE", constraint: "verb:infinitive", required: true },
    ],
    features: { interrogative: false, modality: "desire", "gender-agreement": true },
    examples: ["मैं यह अभ्यास करना चाहता हूँ।"],
    connections: [{ to: "ability-question", relation: "request-of" }],
    ucxn: null,
    ud: null,
    propbank: null,
  },
  {
    id: "kiske-origin",
    lang: "hindi",
    island: "chunk-island",
    meaning: "ask someone's origin-group",
    form: "आप किस [GROUP] से हैं?",
    slots: [{ name: "GROUP", constraint: "origin-group", required: true }],
    features: { interrogative: true, politeness: "respectful" },
    examples: ["आप किस परंपरा से हैं?"],
    connections: [{ to: "ability-question", relation: "instance-of" }],
    ucxn: null,
    ud: null,
    propbank: null,
  },
  {
    id: "phirse-request",
    lang: "hindi",
    island: "chunk-island",
    meaning: "request repetition (fixed chunk, no slots)",
    form: "कृपया फिर से कहिए।",
    slots: [],
    features: { interrogative: false, politeness: "respectful", fixed: true },
    examples: ["कृपया फिर से कहिए।"],
    connections: [],
    ucxn: null,
    ud: null,
    propbank: null,
  },
];

export const HINDI_ISLANDS: Island[] = [
  { id: "kar-island", lang: "hindi", anchor: "कर", machineIds: ["ability-question", "habitual", "desire"], abstractAt: 8 },
  { id: "sikh-island", lang: "hindi", anchor: "सीख", machineIds: ["progressive"], abstractAt: 5 },
  { id: "chunk-island", lang: "hindi", anchor: "फिर से कहिए", machineIds: ["kiske-origin", "phirse-request"], abstractAt: 4 },
];

export const HINDI_EXEMPLARS: Exemplar[] = [
  { id: "ex-sit", surface: "क्या मैं यहाँ बैठ सकता हूँ?", machineId: "ability-question", fills: { ACTOR: "मैं", ROOT: "बैठ" }, world: "permission" },
  { id: "ex-practice", surface: "क्या मैं आपके साथ अभ्यास कर सकता हूँ?", machineId: "ability-question", fills: { ACTOR: "मैं", OBJECT: "अभ्यास", ROOT: "कर" }, world: "permission" },
  { id: "ex-learn", surface: "मैं हिंदी सीख रहा हूँ।", machineId: "progressive", fills: { ACTOR: "मैं", OBJECT: "हिंदी", ROOT: "सीख" }, world: "intro" },
  { id: "ex-read", surface: "मैं हर दिन संस्कृत पढ़ता हूँ।", machineId: "habitual", fills: { ACTOR: "मैं", OBJECT: "संस्कृत", ROOT: "पढ़" }, world: "intro" },
  { id: "ex-want", surface: "मैं यह अभ्यास करना चाहता हूँ।", machineId: "desire", fills: { ACTOR: "मैं", OBJECT: "यह अभ्यास", INFINITIVE: "करना" }, world: "permission" },
  { id: "ex-lineage", surface: "आप किस परंपरा से हैं?", machineId: "kiske-origin", fills: { GROUP: "परंपरा" }, world: "teacher" },
  { id: "ex-repeat", surface: "कृपया फिर से कहिए।", machineId: "phirse-request", fills: {}, world: "comprehension" },
];
