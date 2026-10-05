/** Sanskrit simulator — shared types (peer review v2). */

export type OpKind =
  | "aspiration"
  | "voicing"
  | "nasalization"
  | "devoicing"
  | "causative"
  | "kta"
  | "ktva"
  | "tumun"
  | "present"
  | "root_swap";

export interface PhonemeBit {
  place:
    | "kaṇṭhya"
    | "tālavya"
    | "mūrdhanya"
    | "dantya"
    | "oṣṭhya"
    | "vowel";
  voice: 0 | 1;
  aspirate: 0 | 1;
  nasal: 0 | 1;
  iast: string;
  devanagari: string;
}

export interface MorphBit {
  root: string;
  operator: string;
  person?: string;
  tense?: string;
  surfaceHint?: string;
}

export interface VerseState {
  id: string;
  surface: string;
  tokens: string[];
  morph: MorphBit[];
  semantic: string[];
  boundaries: string[];
  installedMachines: string[];
  installedGates: string[];
  knownRoots: string[];
}

export type ValidationKind = "valid" | "conditional" | "invalid";

export interface ValidationOutcome {
  kind: ValidationKind;
  message: string;
  ruleHint?: string;
  worldChange?: string;
}

export interface OperatorDef {
  id: OpKind;
  label: string;
  brunoImage: string;
  kind: "phon" | "morph";
}

export interface LearnerObjectState {
  id: string;
  recognition: number;
  production: number;
  reverseParse: number;
  operatorTransfer: number;
  errors: number;
  lastWrong?: string;
  confusions: string[];
  brunoStrengthened: boolean;
}

export type Mode = "INHABIT" | "DECOMPILE" | "GENERATE" | "PLAY";
