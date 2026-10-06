export type HindiSubject = {
  id: string;
  dev: string;
  en: string;
  gender: "m" | "f";
  numberStyle: "sg" | "pl";
  aux: "हूँ" | "हो" | "है" | "हैं";
  habitual: "ता" | "ती" | "ते";
  progressive: "रहा" | "रही" | "रहे";
  ability: "सकता" | "सकती" | "सकते";
  want: "चाहता" | "चाहती" | "चाहते";
  dative: string;
};

export type HindiVerb = {
  id: string;
  root: string;
  infinitive: string;
  en: string;
  en3sg: string;
  enGerund: string;
  complements: readonly HindiComplement[];
};

export type HindiComplement = {
  id: string;
  dev: string;
  en: string;
};

export type HindiFrame = {
  id: "habitual" | "progressive" | "ability" | "want";
  label: string;
  en: string;
  note: string;
};

export type HindiTime = {
  id: string;
  dev: string;
  en: string;
};

export type HindiSoundExtension = {
  id: string;
  dev: string;
  roman: string;
  ipa: string;
  baseId?: string;
  articulation: string;
  note: string;
  examples: readonly string[];
};

export type KumbhPhrase = {
  id: string;
  domain:
    | "intro"
    | "comprehension"
    | "practice"
    | "teacher"
    | "permission"
    | "logistics";
  dev: string;
  roman: string;
  en: string;
  note?: string;
};

export const HINDI_SUBJECTS: readonly HindiSubject[] = [
  {
    id: "main-m",
    dev: "मैं",
    en: "I (masc.)",
    gender: "m",
    numberStyle: "sg",
    aux: "हूँ",
    habitual: "ता",
    progressive: "रहा",
    ability: "सकता",
    want: "चाहता",
    dative: "मुझे",
  },
  {
    id: "main-f",
    dev: "मैं",
    en: "I (fem.)",
    gender: "f",
    numberStyle: "sg",
    aux: "हूँ",
    habitual: "ती",
    progressive: "रही",
    ability: "सकती",
    want: "चाहती",
    dative: "मुझे",
  },
  {
    id: "tum-m",
    dev: "तुम",
    en: "you (familiar, masc.)",
    gender: "m",
    numberStyle: "pl",
    aux: "हो",
    habitual: "ते",
    progressive: "रहे",
    ability: "सकते",
    want: "चाहते",
    dative: "तुम्हें",
  },
  {
    id: "tum-f",
    dev: "तुम",
    en: "you (familiar, fem.)",
    gender: "f",
    numberStyle: "pl",
    aux: "हो",
    habitual: "ती",
    progressive: "रही",
    ability: "सकती",
    want: "चाहती",
    dative: "तुम्हें",
  },
  {
    id: "aap-m",
    dev: "आप",
    en: "you (respectful, masc.)",
    gender: "m",
    numberStyle: "pl",
    aux: "हैं",
    habitual: "ते",
    progressive: "रहे",
    ability: "सकते",
    want: "चाहते",
    dative: "आपको",
  },
  {
    id: "aap-f",
    dev: "आप",
    en: "you (respectful, fem.)",
    gender: "f",
    numberStyle: "pl",
    aux: "हैं",
    habitual: "ती",
    progressive: "रही",
    ability: "सकती",
    want: "चाहती",
    dative: "आपको",
  },
  {
    id: "vah-m",
    dev: "वह",
    en: "he / that person (masc.)",
    gender: "m",
    numberStyle: "sg",
    aux: "है",
    habitual: "ता",
    progressive: "रहा",
    ability: "सकता",
    want: "चाहता",
    dative: "उसे",
  },
  {
    id: "vah-f",
    dev: "वह",
    en: "she / that person (fem.)",
    gender: "f",
    numberStyle: "sg",
    aux: "है",
    habitual: "ती",
    progressive: "रही",
    ability: "सकती",
    want: "चाहती",
    dative: "उसे",
  },
  {
    id: "ham-m",
    dev: "हम",
    en: "we (masc./mixed)",
    gender: "m",
    numberStyle: "pl",
    aux: "हैं",
    habitual: "ते",
    progressive: "रहे",
    ability: "सकते",
    want: "चाहते",
    dative: "हमें",
  },
  {
    id: "ham-f",
    dev: "हम",
    en: "we (fem.)",
    gender: "f",
    numberStyle: "pl",
    aux: "हैं",
    habitual: "ती",
    progressive: "रही",
    ability: "सकती",
    want: "चाहती",
    dative: "हमें",
  },
] as const;

const C = {
  hindi: { id: "hindi", dev: "हिंदी", en: "Hindi" },
  sanskrit: { id: "sanskrit", dev: "संस्कृत", en: "Sanskrit" },
  thisText: { id: "this-text", dev: "यह ग्रंथ", en: "this text" },
  thisVerse: { id: "this-verse", dev: "यह श्लोक", en: "this verse" },
  thisMantra: { id: "this-mantra", dev: "यह मंत्र", en: "this mantra" },
  thisPractice: { id: "this-practice", dev: "यह अभ्यास", en: "this practice" },
  meditation: { id: "meditation", dev: "ध्यान", en: "meditation" },
  japa: { id: "japa", dev: "जप", en: "japa" },
  puja: { id: "puja", dev: "पूजा", en: "pūjā" },
  discourse: { id: "discourse", dev: "प्रवचन", en: "the discourse" },
  this: { id: "this", dev: "यह", en: "this" },
} as const;

export const HINDI_VERBS: readonly HindiVerb[] = [
  {
    id: "seekh",
    root: "सीख",
    infinitive: "सीखना",
    en: "learn",
    en3sg: "learns",
    enGerund: "learning",
    complements: [C.hindi, C.sanskrit, C.thisPractice, C.thisMantra],
  },
  {
    id: "padh",
    root: "पढ़",
    infinitive: "पढ़ना",
    en: "read / study",
    en3sg: "reads / studies",
    enGerund: "reading / studying",
    complements: [C.sanskrit, C.thisText, C.thisVerse, C.thisMantra],
  },
  {
    id: "samajh",
    root: "समझ",
    infinitive: "समझना",
    en: "understand",
    en3sg: "understands",
    enGerund: "understanding",
    complements: [C.hindi, C.sanskrit, C.this, C.thisVerse],
  },
  {
    id: "kar",
    root: "कर",
    infinitive: "करना",
    en: "do / practise",
    en3sg: "does / practises",
    enGerund: "doing / practising",
    complements: [C.thisPractice, C.meditation, C.japa, C.puja],
  },
  {
    id: "sun",
    root: "सुन",
    infinitive: "सुनना",
    en: "listen to / hear",
    en3sg: "listens to / hears",
    enGerund: "listening to / hearing",
    complements: [C.thisMantra, C.discourse, C.hindi, C.sanskrit],
  },
  {
    id: "bol",
    root: "बोल",
    infinitive: "बोलना",
    en: "speak",
    en3sg: "speaks",
    enGerund: "speaking",
    complements: [C.hindi, C.sanskrit],
  },
  {
    id: "dekh",
    root: "देख",
    infinitive: "देखना",
    en: "see / look at",
    en3sg: "sees / looks at",
    enGerund: "seeing / looking at",
    complements: [C.this, C.thisText, C.thisVerse],
  },
] as const;

export const HINDI_FRAMES: readonly HindiFrame[] = [
  {
    id: "habitual",
    label: "HABIT",
    en: "habitual / generally do",
    note: "root + ता/ती/ते + auxiliary",
  },
  {
    id: "progressive",
    label: "NOW",
    en: "progressive / doing now",
    note: "root + रहा/रही/रहे + auxiliary",
  },
  {
    id: "ability",
    label: "CAN",
    en: "ability",
    note: "root + सकता/सकती/सकते + auxiliary",
  },
  {
    id: "want",
    label: "WANT",
    en: "want to",
    note: "infinitive + चाहता/चाहती/चाहते + auxiliary",
  },
] as const;

export const HINDI_TIMES: readonly HindiTime[] = [
  { id: "none", dev: "", en: "" },
  { id: "now", dev: "अभी", en: "now" },
  { id: "daily", dev: "हर दिन", en: "every day" },
  { id: "morning", dev: "सुबह", en: "in the morning" },
  { id: "evening", dev: "शाम को", en: "in the evening" },
  { id: "here", dev: "यहाँ", en: "here" },
] as const;

export function compileHindiSentence(
  subject: HindiSubject,
  frame: HindiFrame,
  verb: HindiVerb,
  complement: HindiComplement,
  time: HindiTime
) {
  const lead = [subject.dev, time.dev, complement.dev].filter(Boolean).join(" ");
  let predicate = "";

  switch (frame.id) {
    case "habitual":
      predicate = `${verb.root}${subject.habitual} ${subject.aux}`;
      break;
    case "progressive":
      predicate = `${verb.root} ${subject.progressive} ${subject.aux}`;
      break;
    case "ability":
      predicate = `${verb.root} ${subject.ability} ${subject.aux}`;
      break;
    case "want":
      predicate = `${verb.infinitive} ${subject.want} ${subject.aux}`;
      break;
  }

  const hindi = `${lead} ${predicate}।`.replace(/\s+/g, " ").trim();

  const subjectEn =
    subject.id.startsWith("main") ? "I" :
    subject.id.startsWith("tum") || subject.id.startsWith("aap") ? "you" :
    subject.id.startsWith("vah") ? (subject.gender === "m" ? "he" : "she") :
    "we";

  const timeEn = time.en ? ` ${time.en}` : "";
  let english = "";
  switch (frame.id) {
    case "habitual":
      english = `${subjectEn} ${
        subjectEn === "he" || subjectEn === "she" ? verb.en3sg : verb.en
      } ${complement.en}${timeEn}.`;
      break;
    case "progressive":
      english = `${subjectEn} ${
        subjectEn === "I" ? "am" : subjectEn === "he" || subjectEn === "she" ? "is" : "are"
      } ${verb.enGerund} ${complement.en}${timeEn}.`;
      break;
    case "ability":
      english = `${subjectEn} can ${verb.en} ${complement.en}${timeEn}.`;
      break;
    case "want":
      english = `${subjectEn} want${subjectEn === "he" || subjectEn === "she" ? "s" : ""} to ${verb.en} ${complement.en}${timeEn}.`;
      break;
  }

  return {
    hindi,
    english,
    formula:
      frame.id === "want"
        ? "SUBJECT + TIME + COMPLEMENT + INFINITIVE + WANT-AGREEMENT + AUX"
        : `SUBJECT + TIME + COMPLEMENT + ROOT + ${frame.label}-AGREEMENT + AUX`,
  };
}

export const HINDI_SOUND_EXTENSIONS: readonly HindiSoundExtension[] = [
  {
    id: "qa",
    dev: "क़",
    roman: "q",
    ipa: "/q/ ~ /k/",
    baseId: "ka",
    articulation: "uvular stop in careful Perso-Arabic loan pronunciation",
    note: "Commonly merges toward क /k/ in everyday Hindi. Treat as a Hindi extension, not a new Mātṛkā body locus.",
    examples: ["क़लम — qalam — pen", "क़रीब — qarīb — near"],
  },
  {
    id: "x",
    dev: "ख़",
    roman: "kh / x",
    ipa: "/x/",
    baseId: "kha",
    articulation: "voiceless velar/uvular fricative",
    note: "Often merges toward ख for speakers who do not maintain the contrast.",
    examples: ["ख़बर — khabar — news", "ख़ास — khās — special"],
  },
  {
    id: "ghayn",
    dev: "ग़",
    roman: "gh / ġ",
    ipa: "/ɣ/",
    baseId: "ga",
    articulation: "voiced velar/uvular fricative",
    note: "A loan-phoneme; often merges toward ग.",
    examples: ["ग़रीब — gharīb — poor", "ग़लत — ghalat — wrong"],
  },
  {
    id: "za",
    dev: "ज़",
    roman: "z",
    ipa: "/z/",
    baseId: "ja",
    articulation: "voiced sibilant",
    note: "Common in Perso-Arabic and English loans; many speakers preserve it clearly.",
    examples: ["ज़रा — zarā — a little", "ज़रूर — zarūr — certainly"],
  },
  {
    id: "fa",
    dev: "फ़",
    roman: "f",
    ipa: "/f/",
    baseId: "pha",
    articulation: "voiceless labiodental fricative",
    note: "Often contrasts with classical फ /pʰ/, though some speakers merge them.",
    examples: ["फ़र्क़ — farq — difference", "फ़िल्म — film — film"],
  },
  {
    id: "rra",
    dev: "ड़",
    roman: "ṛ / r",
    ipa: "/ɽ/",
    baseId: "dda",
    articulation: "retroflex flap",
    note: "Very important living Hindi sound. It is not simply Sanskrit ड.",
    examples: ["लड़का — laṛkā — boy", "बड़ा — baṛā — big"],
  },
  {
    id: "rrha",
    dev: "ढ़",
    roman: "ṛh",
    ipa: "/ɽʱ/",
    baseId: "ddha",
    articulation: "breathy/aspirated retroflex flap",
    note: "Hindi extension built historically from retroflex material; keep it outside the canonical Mātṛkā map.",
    examples: ["पढ़ना — paṛhnā — to read", "चढ़ना — caṛhnā — to climb"],
  },
] as const;

export const SCHWA_DRILLS = [
  {
    dev: "करना",
    careful: "ka-ra-nā",
    spoken: "karnā",
    note: "medial inherent schwa drops",
  },
  {
    dev: "भारत",
    careful: "bhā-ra-ta",
    spoken: "bhārat",
    note: "final inherent schwa drops",
  },
  {
    dev: "समझना",
    careful: "sa-ma-jha-nā",
    spoken: "samajhnā",
    note: "orthography is not a syllable-by-syllable pronunciation guide",
  },
  {
    dev: "लड़का",
    careful: "la-ṛa-kā",
    spoken: "laṛkā",
    note: "schwa deletion + Hindi retroflex flap",
  },
  {
    dev: "प्रवचन",
    careful: "pra-va-ca-na",
    spoken: "pravacan / pravachan",
    note: "listen to living speech; Sanskrit-derived spelling does not force Sanskrit recitation",
  },
] as const;

export const KUMBH_PHRASES: readonly KumbhPhrase[] = [
  {
    id: "intro-learning-hindi",
    domain: "intro",
    dev: "मैं हिंदी सीख रहा हूँ।",
    roman: "main hindī sīkh rahā hū̃.",
    en: "I am learning Hindi.",
  },
  {
    id: "intro-learning-sanskrit",
    domain: "intro",
    dev: "मैं संस्कृत पढ़ रहा हूँ।",
    roman: "main saṃskrit paṛh rahā hū̃.",
    en: "I am studying Sanskrit.",
  },
  {
    id: "intro-trika",
    domain: "intro",
    dev: "मैं त्रिक शैव दर्शन का अध्ययन कर रहा हूँ।",
    roman: "main trik śaiv darśan kā adhyayan kar rahā hū̃.",
    en: "I am studying Trika Śaiva philosophy.",
  },
  {
    id: "understand-no",
    domain: "comprehension",
    dev: "मुझे समझ नहीं आया।",
    roman: "mujhe samajh nahī̃ āyā.",
    en: "I didn’t understand.",
  },
  {
    id: "repeat",
    domain: "comprehension",
    dev: "कृपया फिर से कहिए।",
    roman: "kṛpayā phir se kahiye.",
    en: "Please say it again.",
  },
  {
    id: "slow",
    domain: "comprehension",
    dev: "कृपया थोड़ा धीरे बोलिए।",
    roman: "kṛpayā thoṛā dhīre boliye.",
    en: "Please speak a little more slowly.",
  },
  {
    id: "meaning",
    domain: "comprehension",
    dev: "इसका मतलब क्या है?",
    roman: "iskā matlab kyā hai?",
    en: "What does this mean?",
  },
  {
    id: "practice-what",
    domain: "practice",
    dev: "आप कौन-सी साधना करते हैं?",
    roman: "āp kaun-sī sādhanā karte hain?",
    en: "What practice do you do?",
  },
  {
    id: "practice-how",
    domain: "practice",
    dev: "यह अभ्यास कैसे किया जाता है?",
    roman: "yah abhyās kaise kiyā jātā hai?",
    en: "How is this practice done?",
  },
  {
    id: "practice-daily",
    domain: "practice",
    dev: "आप हर दिन कितना अभ्यास करते हैं?",
    roman: "āp har din kitnā abhyās karte hain?",
    en: "How much do you practise every day?",
  },
  {
    id: "lineage",
    domain: "teacher",
    dev: "आप किस परंपरा से हैं?",
    roman: "āp kis paramparā se hain?",
    en: "Which tradition/lineage are you from?",
  },
  {
    id: "guru",
    domain: "teacher",
    dev: "आपके गुरु कौन हैं?",
    roman: "āpke guru kaun hain?",
    en: "Who is your guru?",
  },
  {
    id: "teach-sanskrit",
    domain: "teacher",
    dev: "क्या आप संस्कृत पढ़ाते हैं?",
    roman: "kyā āp saṃskrit paṛhāte hain?",
    en: "Do you teach Sanskrit?",
  },
  {
    id: "teacher-text",
    domain: "teacher",
    dev: "क्या कोई मुझे यह ग्रंथ पढ़ने में मदद कर सकता है?",
    roman: "kyā koī mujhe yah granth paṛhne mẽ madad kar saktā hai?",
    en: "Can someone help me read this text?",
  },
  {
    id: "sit",
    domain: "permission",
    dev: "क्या मैं यहाँ बैठ सकता हूँ?",
    roman: "kyā main yahā̃ baiṭh saktā hū̃?",
    en: "May I sit here?",
  },
  {
    id: "listen",
    domain: "permission",
    dev: "क्या मैं यहाँ सुन सकता हूँ?",
    roman: "kyā main yahā̃ sun saktā hū̃?",
    en: "May I listen here?",
  },
  {
    id: "join-practice",
    domain: "permission",
    dev: "क्या मैं आपके साथ अभ्यास कर सकता हूँ?",
    roman: "kyā main āpke sāth abhyās kar saktā hū̃?",
    en: "May I practise with you?",
  },
  {
    id: "camp-where",
    domain: "logistics",
    dev: "अखाड़े का शिविर कहाँ है?",
    roman: "akhāṛe kā śivir kahā̃ hai?",
    en: "Where is the akhāṛā camp?",
  },
  {
    id: "discourse-when",
    domain: "logistics",
    dev: "आज प्रवचन कब है?",
    roman: "āj pravacan kab hai?",
    en: "When is the discourse today?",
  },
  {
    id: "ghat",
    domain: "logistics",
    dev: "घाट किस तरफ़ है?",
    roman: "ghāṭ kis taraf hai?",
    en: "Which way is the ghat?",
  },
  {
    id: "stay",
    domain: "logistics",
    dev: "यहाँ ठहरने की जगह है?",
    roman: "yahā̃ ṭhaharne kī jagah hai?",
    en: "Is there a place to stay here?",
  },
] as const;

export const KUMBH_DOMAINS = [
  { id: "intro", label: "INTRO" },
  { id: "comprehension", label: "UNDERSTAND" },
  { id: "practice", label: "PRACTICE" },
  { id: "teacher", label: "TEACHER" },
  { id: "permission", label: "PERMISSION" },
  { id: "logistics", label: "LOGISTICS" },
] as const;

// ---------- AwesomeVision v2 additions (Metivier / Wyner / Doner / chunks) ----------

export type MinimalPair = {
  id: string;
  a: { dev: string; roman: string; coord: string };
  b: { dev: string; roman: string; coord: string };
  note: string;
};

export const MINIMAL_PAIRS: readonly MinimalPair[] = [
  { id: "tta-ta", a: { dev: "ट", roman: "ṭa", coord: "RETROFLEX · voiceless · unaspirated" }, b: { dev: "त", roman: "ta", coord: "DENTAL · voiceless · unaspirated" }, note: "Same manner, different place. The core Hindi ear test." },
  { id: "ttha-tha", a: { dev: "ठ", roman: "ṭha", coord: "RETROFLEX · voiceless · aspirated" }, b: { dev: "थ", roman: "tha", coord: "DENTAL · voiceless · aspirated" }, note: "Aspirated pair across the same place boundary." },
  { id: "dda-da", a: { dev: "ड", roman: "ḍa", coord: "RETROFLEX · voiced · unaspirated stop" }, b: { dev: "द", roman: "da", coord: "DENTAL · voiced · unaspirated stop" }, note: "Voiced unaspirated across the boundary." },
  { id: "ddha-dha", a: { dev: "ढ", roman: "ḍha", coord: "RETROFLEX · voiced · aspirated stop" }, b: { dev: "ध", roman: "dha", coord: "DENTAL · voiced · aspirated stop" }, note: "Voiced aspirated across the boundary." },
  { id: "rra-dda", a: { dev: "ड़", roman: "ṛa", coord: "RETROFLEX · voiced · flap" }, b: { dev: "ड", roman: "ḍa", coord: "RETROFLEX · voiced · unaspirated stop" }, note: "Flap vs stop at the same place. लड़का lives or dies here." },
  { id: "kha-x", a: { dev: "ख", roman: "kha", coord: "VELAR · voiceless · aspirated stop" }, b: { dev: "ख़", roman: "xa", coord: "VELAR/UVULAR · voiceless · fricative" }, note: "Stop burst vs continuous friction." },
  { id: "pha-fa", a: { dev: "फ", roman: "pha", coord: "BILABIAL · voiceless · aspirated stop" }, b: { dev: "फ़", roman: "fa", coord: "LABIODENTAL · voiceless · fricative" }, note: "Both lips vs teeth-on-lip." },
  { id: "ja-za", a: { dev: "ज", roman: "ja", coord: "PALATAL · voiced · affricate" }, b: { dev: "ज़", roman: "za", coord: "voiced · sibilant" }, note: "Affricate edge vs pure buzz." },
] as const;

export type Neighbourhood = {
  id: string;
  shape: string;
  note: string;
  words: readonly { dev: string; roman: string; en: string }[];
};

export const NEIGHBOURHOODS: readonly Neighbourhood[] = [
  {
    id: "arna",
    shape: "___arna",
    note: "Doner-style sound family: one cues the neighbours. Store each in a distinct scene so they don't collapse (Metivier ghosting rule).",
    words: [
      { dev: "करना", roman: "karnā", en: "to do" },
      { dev: "भरना", roman: "bharnā", en: "to fill" },
      { dev: "मरना", roman: "marnā", en: "to die" },
      { dev: "डरना", roman: "ḍarnā", en: "to fear" },
    ],
  },
  {
    id: "ana",
    shape: "___ाना",
    note: "Motion and intake verbs share one acoustic handle.",
    words: [
      { dev: "आना", roman: "ānā", en: "to come" },
      { dev: "जाना", roman: "jānā", en: "to go" },
      { dev: "खाना", roman: "khānā", en: "to eat" },
      { dev: "पाना", roman: "pānā", en: "to get" },
    ],
  },
  {
    id: "ona",
    shape: "___ोना",
    note: "Body-state verbs: one shape, four states.",
    words: [
      { dev: "सोना", roman: "sonā", en: "to sleep" },
      { dev: "रोना", roman: "ronā", en: "to cry" },
      { dev: "धोना", roman: "dhonā", en: "to wash" },
      { dev: "होना", roman: "honā", en: "to be" },
    ],
  },
] as const;

export type ChunkTemplate = {
  id: string;
  frame: string;
  en: string;
  note: string;
  fillers: readonly { dev: string; roman: string; en: string }[];
};

export const CHUNKS: readonly ChunkTemplate[] = [
  {
    id: "kiske",
    frame: "आप किस ____ से हैं?",
    en: "Which ___ are you from?",
    note: "Memorize the Lego, not the brick: the frame is the unit.",
    fillers: [
      { dev: "परंपरा", roman: "paramparā", en: "tradition" },
      { dev: "शहर", roman: "śahar", en: "city" },
      { dev: "देश", roman: "deś", en: "country" },
      { dev: "आश्रम", roman: "āśram", en: "āśram" },
    ],
  },
  {
    id: "kaisak",
    frame: "क्या मैं ____ सकता हूँ?",
    en: "May I ____?",
    note: "Masculine speaker default; feminine swaps सकता → सकती.",
    fillers: [
      { dev: "यहाँ बैठ", roman: "yahā̃ baiṭh", en: "sit here" },
      { dev: "सुन", roman: "sun", en: "listen" },
      { dev: "आपके साथ अभ्यास कर", roman: "āpke sāth abhyās kar", en: "practise with you" },
    ],
  },
  {
    id: "phirse",
    frame: "कृपया फिर से कहिए।",
    en: "Please say it again.",
    note: "Fixed chunk — no slot. Install whole.",
    fillers: [],
  },
] as const;

export type PalaceWorld = {
  id: string;
  name: string;
  place: string;
  rule: string;
  stations: readonly { anchor: string; anchorEn: string; phraseId: string }[];
};

export const PALACE_WORLDS: readonly PalaceWorld[] = [
  {
    id: "ashram", name: "Āśram House", place: "your old house",
    rule: "Max 3 stations. Anchor the hard word only — grammar reconstructs the rest.",
    stations: [
      { anchor: "परंपरा", anchorEn: "tradition", phraseId: "lineage" },
      { anchor: "अभ्यास", anchorEn: "practice", phraseId: "join-practice" },
      { anchor: "शिविर", anchorEn: "camp", phraseId: "camp-where" },
    ],
  },
  {
    id: "guru", name: "Guru Room", place: "the teaching seat",
    rule: "One teacher, one seat, one question at a time.",
    stations: [
      { anchor: "गुरु", anchorEn: "teacher", phraseId: "guru" },
      { anchor: "संस्कृत", anchorEn: "Sanskrit", phraseId: "teach-sanskrit" },
      { anchor: "साधना", anchorEn: "practice", phraseId: "practice-what" },
    ],
  },
  {
    id: "kumbh", name: "Kumbh Ghāt", place: "the river steps",
    rule: "Logistics live here, nowhere else.",
    stations: [
      { anchor: "घाट", anchorEn: "ghat", phraseId: "ghat" },
      { anchor: "प्रवचन", anchorEn: "discourse", phraseId: "discourse-when" },
      { anchor: "ठहरना", anchorEn: "staying", phraseId: "stay" },
    ],
  },
  {
    id: "ear", name: "Ear Cell", place: "a quiet corner",
    rule: "Comprehension failures are installed, not hidden.",
    stations: [
      { anchor: "समझ", anchorEn: "understanding", phraseId: "understand-no" },
      { anchor: "फिर", anchorEn: "again", phraseId: "repeat" },
      { anchor: "धीरे", anchorEn: "slowly", phraseId: "slow" },
    ],
  },
] as const;

export type PIItem = {
  id: string;
  audio: string;
  question: string;
  options: readonly [string, string];
  answer: 0 | 1;
  cue: string;
};

/** Processing Instruction: the answer lives INSIDE the morphology. No repeats asked. */
export const PI_ITEMS: readonly PIItem[] = [
  { id: "pi-fem", audio: "वह संस्कृत पढ़ती है।", question: "Man or woman?", options: ["Man", "Woman"], answer: 1, cue: "पढ़ती — the feminine ending carries the answer" },
  { id: "pi-resp", audio: "आप कहाँ जा रहे हैं?", question: "Respectful or familiar?", options: ["Respectful", "Familiar"], answer: 0, cue: "आप + रहे + हैं" },
  { id: "pi-he", audio: "वह हिंदी सीख रहा है।", question: "He or she?", options: ["He", "She"], answer: 0, cue: "रहा" },
  { id: "pi-fam", audio: "तुम कहाँ जा रहे हो?", question: "Respectful or familiar?", options: ["Respectful", "Familiar"], answer: 1, cue: "तुम + हो" },
  { id: "pi-masc", audio: "मैं हर दिन संस्कृत पढ़ता हूँ।", question: "Man or woman?", options: ["Man", "Woman"], answer: 0, cue: "पढ़ता" },
  { id: "pi-can-f", audio: "क्या मैं यहाँ बैठ सकती हूँ?", question: "Man or woman?", options: ["Man", "Woman"], answer: 1, cue: "सकती" },
] as const;
