export type PhonemePlace = 'velar' | 'palatal' | 'retroflex' | 'dental' | 'labial' | 'other';

export type PhonemeManner =
  | 'unvoiced_stop'
  | 'unvoiced_aspirate'
  | 'voiced_stop'
  | 'voiced_aspirate'
  | 'nasal'
  | 'semivowel'
  | 'sibilant'
  | 'vowel'
  | 'other';

export type VowelGrade = 'zero' | 'guna' | 'vrddhi';

export type LinguisticNodeType = 'phoneme' | 'dhatu' | 'pratyaya' | 'pada' | 'samasa' | 'sentence';

export type Gana = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type Voice = 'parasmaipada' | 'atmanepada' | 'ubhayapada';

export type SuffixType = 'krt' | 'taddhita' | 'vibhakti' | 'tin';

export type SandhiCategory = 'vowel' | 'visarga' | 'consonant' | 'aspiration';

export type DrillMode =
  | 'learn'
  | 'recognition'
  | 'listen'
  | 'see-pick'
  | 'see-reveal'
  | 'hear-pick'
  | 'draw'
  | 'production'
  | 'parse'
  | 'hear:easy'
  | 'hear:medium'
  | 'hear:hard'
  | 'say:easy'
  | 'say:medium'
  | 'say:hard'
  | 'draw:easy'
  | 'draw:medium'
  | 'draw:hard'
  | 'combined';

export interface Phoneme {
  id: string;
  devanagari: string;
  iast: string;
  audioFile: string;
  place: PhonemePlace;
  manner: PhonemeManner;
  vowelGrade?: VowelGrade;
  gunaPair?: string;
  vrddhiPair?: string;
  participatesInSandhi: string[];
  pratyaharas: string[];
}

export interface DerivedForm {
  form: string;
  devanagari: string;
  suffix: string;
  meaning: string;
  category: string;
}

export interface LinguisticNode {
  id: string;
  type: LinguisticNodeType;
  devanagari: string;
  iast: string;
  meaning: string;
  derivedFrom: string[];
  derivesTo: string[];
  derivedForms?: DerivedForm[];
  gana?: Gana;
  voice?: Voice;
  ieCognates?: string[];
  suffixType?: SuffixType;
  semanticRole?: string;
  sandhiRules?: string[];
}

export interface SandhiRule {
  id: string;
  name: string;
  paniniReference?: string;
  category: SandhiCategory;
  signature: string;
  mechanism: string;
  examples: Array<{
    input: [string, string];
    output: string;
    annotation: string;
  }>;
  dependsOn: string[];
  enables: string[];
}

export interface FSRSState {
  cardId: string;
  userId: string;
  mode: DrillMode;
  stability: number;
  difficulty: number;
  dueDate: Date;
  lastReview: Date;
  reps: number;
  lapses: number;
}

export interface DrillCard {
  id: string;
  type: LinguisticNodeType;
  data: LinguisticNode | Phoneme | SandhiRule;
  context?: Record<string, any>;
}

export interface Pratyahara {
  id: string;
  sura: number; // Which Shiva Sutra (1-14)
  marker: string;
  result: string[];
  explanation: string;
}
