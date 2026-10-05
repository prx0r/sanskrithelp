export type PersonalBinding = {
  primitiveId: string;
  colour?: string;
  emotion?: string;
  bodyLocation?: string;
  rhythm?: string;
  tone?: string;
  motion?: string;
  image?: string;
  notes?: string;
  sourceAttested?: boolean;
};

export type RingItem = { id: string; label: string; gloss?: string };
export type Ring = { id: string; label: string; items: readonly RingItem[] };
export type WheelPreset = {
  id: string;
  title: string;
  historicalBasis: string;
  mode: string;
  rings: readonly Ring[];
  rule: string;
};

export type WheelState = {
  wheelId: string;
  selections: Record<string, number>;
  timestamp: string;
};

export type StoneDoorwayMemoryWorld = {
  version: "0.1";
  kind: "sanskrit-memory-world";
  source: "sanskrithelp-bruno";
  generatedAt: string;
  associations: PersonalBinding[];
  wheelStates: WheelState[];
  nightHandoff?: {
    installed: string[];
    soundSequence?: string[];
    recallPrompt?: string;
    dreamPrompt?: string;
    provenanceNote: string;
  };
};
