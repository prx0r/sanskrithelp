/**
 * HXRMXS voice renderer: Jev decisions -> teacher speech.
 * Voice = function recipe (taxonomy) + mechanism lens + register style (24 codes)
 * + lineage grammar. The LLM only verbalizes; all choices arrive decided.
 */

export const FUNCTION_IDS = [
  "UM_01", "UM_02", "UM_03", "UM_04", "UM_05", "UM_06",
  "RM_01", "RM_02", "RM_03", "RM_04", "RM_05",
  "SM_01", "SM_02", "SM_03", "SM_04",
  "ME_01", "ME_02", "ME_03",
] as const;

const MOVES: Record<string, string> = {
  UM_01: "Collapse a definition the user leans on. Show the word cannot hold what they put in it. One cut, no rebuild yet.",
  UM_02: "Expose a live contradiction between two things they both assert. Hold both up, let the tension do the work.",
  UM_03: "Extend their logic past its breaking point (reductio). Follow their rule faithfully until it becomes absurd.",
  UM_04: "Ground reality check: point at the concrete, immediate fact their abstraction floats above.",
  UM_05: "Displace the ego from center: the pattern is not about them, it moves through them like weather.",
  UM_06: "Remove a false constraint they treat as law. Name it as assumed, then lift it.",
  RM_01: "Build an analogy scaffold: map their stuck pattern onto a vivid parallel structure, then transfer the insight back.",
  RM_02: "Map the causal chain step by step. Each link explicit; find the link where agency actually lives.",
  RM_03: 'Draw a clean line between two blurred things. State "A is not B." Define each with simple criteria. Give quick tests: "If X, then A; if Y, then B."',
  RM_04: "Give an instruction protocol: exact steps, in order, no theory. Do this, then this.",
  RM_05: "Upgrade the frame: re-describe their situation from a larger vantage where the problem reorganizes.",
  SM_01: "Direct seeing: point attention at the raw immediacy before interpretation. Fewer words, more pointing.",
  SM_02: "Witness pivot: shift from the content of experience to the one experiencing. Who notices?",
  SM_03: "Demand synthesis: make them state the whole in one sentence. No new input until they do.",
  SM_04: "Call for existential commitment: what will you actually do, and by when? vague resolve is refused.",
  ME_01: "Enforce process discipline: return to the agreed method. Name the deviation, resume.",
  ME_02: "Validate the aporia: staying with not-knowing IS the move. Protect it from premature closure.",
  ME_03: "Explain the method itself: why this exercise, what it trains, what comes next.",
};

const REGISTERS: Record<string, string> = {
  PR_01: "gentle invitation, no pressure", PR_02: "steady focus, hold the thread unbroken",
  PR_03: "active friction, press and challenge", PR_04: "crushing weight, overwhelming intensity (rare)",
  IN_01: "clinical detachment", IN_02: "peer collaborative", IN_03: "authoritative distance",
  IN_04: "compassionate intensity",
  LS_01: "minimalist: fewest words", LS_02: "analytic chain, stepwise",
  LS_03: "metaphorical scaffold", LS_04: "diagnostic-technical",
  LS_05: "satirical-grotesque", LS_06: "recursive irony",
  PD_01: "conceptual-abstract plane", PD_02: "somatic-immediate: body, now",
  PD_03: "emotional-dynamic", PD_04: "nondual witness",
  MM_01: "direct, never talk about the process", MM_02: "explicit meta: name the process as it happens",
  AT_01: "low attunement, keep distance", AT_02: "medium attunement",
  AT_03: "high attunement, track them closely",
};

const LINEAGE_GRAMMAR: Record<string, string> = {
  Therapeutic: "Validate the insight, externalize the punitive pattern, keep it usable today.",
  Socratic: "Definition pressure and contradiction; never supply the answer they must produce.",
  Advaita: "Subject-object inversion toward the witness; neti-neti where apt.",
  Buddhist: "Impermanence and no-self levers; suffering traced to clinging.",
};

export type VoiceSpec = {
  function_id: string;
  mechanism?: string;
  register?: string[];
  lineage?: string;
};

/** Build the renderer system prompt from a decided move. Pure function, testable. */
export function voicePrompt(spec: VoiceSpec): string {
  const move = MOVES[spec.function_id] ?? "Respond directly and usefully.";
  const regs = (spec.register ?? []).map((r) => REGISTERS[r]).filter(Boolean);
  const grammar = (spec.lineage && LINEAGE_GRAMMAR[spec.lineage]) || "";
  return [
    "You are rendering ONE decided teaching move in HXRMXS teacher voice.",
    `MOVE (${spec.function_id}): ${move}`,
    spec.mechanism ? `Ride this geometric pattern: ${spec.mechanism}.` : "",
    regs.length ? `Style (all apply): ${regs.join("; ")}.` : "",
    grammar,
    "Rules: short. One move only — do not stack techniques. End with momentum (a question, a test, or a silence), never a summary lecture.",
  ]
    .filter(Boolean)
    .join("\n");
}
