/**
 * Constructicon engine — language-neutral construction graph.
 *
 * A MACHINE is a conventional form↔meaning pairing (Construction Grammar):
 * fixed phrases, low-scope patterns (verb islands), productive templates.
 * Bruno wheels visualize machines; they are not the store.
 *
 * Layers per utterance (awesome2.md data model, trimmed to what we compute):
 * surface -> morphology -> slots/fillers -> machine -> island -> skill state.
 * Dependency/semantic-role layers arrive with UD/PropBank parsers; the schema
 * already has fields for them (ud, propbank) so nothing remodels later.
 */

export type Lang = "hindi" | "sanskrit";

export interface SlotDef {
  name: string;
  /** semantic constraint, e.g. "human", "action-compatible", "verb:transitive" */
  constraint: string;
  required: boolean;
}

export interface Filler {
  form: string;
  roman?: string;
  gloss: string;
  /** raw co-occurrence counts for collostructional scoring */
  countInMachine?: number;
  countOverall?: number;
  /** 0..1 personalization: target-world frequency × learner interest */
  personal?: number;
}

export interface MachineConnection {
  to: string;
  relation:
    | "negation"
    | "question-of"
    | "desire-of"
    | "request-of"
    | "past-of"
    | "generalization-of"
    | "instance-of"
    | "assembly-of";
}

export interface Machine {
  id: string;
  lang: Lang;
  /** island this machine belongs to (verb islands stay concrete first) */
  island: string;
  meaning: string;
  /** form template with [SLOT] markers, e.g. "क्या [ACTOR] [OBJECT] [ROOT] सक [AGR] [AUX]?" */
  form: string;
  slots: SlotDef[];
  features: Record<string, string | boolean>;
  examples: string[];
  connections: MachineConnection[];
  /** UCxn-compatible annotation when available (hi_hdtb v2.15+); else null */
  ucxn: string | null;
  /** UD parse stub: filled by Stanza/UD pipeline, null until then */
  ud: string | null;
  /** PropBank frame (predicate.argset), null until layered */
  propbank: string | null;
}

export interface Exemplar {
  id: string;
  surface: string;
  machineId: string;
  /** slot fill for this exemplar: SLOT -> filler form */
  fills: Record<string, string>;
  audioId?: string;
  world?: string;
}

export interface Island {
  id: string;
  lang: Lang;
  /** anchor predicate or chunk, e.g. "कर" or "फिर से कहिए" */
  anchor: string;
  machineIds: string[];
  /** expose abstract wheel only when exemplars >= this */
  abstractAt: number;
}

/** Association strength: log frequency ratio + personalization. */
export function assocScore(f: Filler): number {
  const inM = Math.max(f.countInMachine ?? 1, 1);
  const overall = Math.max(f.countOverall ?? 1, 1);
  const base = Math.log(inM / overall);
  return base + 2 * (f.personal ?? 0);
}

export function rankFillers(fill: Record<string, Filler>): Filler[] {
  return Object.values(fill).sort((a, b) => assocScore(b) - assocScore(a));
}

export interface CoverageWeights {
  frequency: number;
  productivity: number;
  usefulness: number;
  complexityPenalty: number;
}

export interface Coverable {
  id: string;
  /** exemplars in target corpus this machine unlocks */
  coverage: number;
  frequency: number;
  productivity: number;
  usefulness: number;
  complexity: number;
}

/**
 * Greedy marginal coverage: rank machines by what they unlock MINUS what
 * already-installed machines cover. `covered` = exemplar ids already readable.
 */
export function rankMachines(
  machines: Coverable[],
  exemplarMachine: Map<string, string>,
  covered: Set<string>,
  w: CoverageWeights = { frequency: 1, productivity: 1, usefulness: 2, complexityPenalty: 0.5 }
): { id: string; gain: number }[] {
  const byMachine = new Map<string, string[]>();
  for (const [exId, mId] of exemplarMachine) {
    if (!byMachine.has(mId)) byMachine.set(mId, []);
    byMachine.get(mId)!.push(exId);
  }
  return machines
    .map((m) => {
      const fresh = (byMachine.get(m.id) ?? []).filter((e) => !covered.has(e)).length;
      const gain =
        fresh * (w.frequency * m.frequency + w.productivity * m.productivity + w.usefulness * m.usefulness) -
        w.complexityPenalty * m.complexity;
      return { id: m.id, gain };
    })
    .sort((a, b) => b.gain - a.gain);
}
