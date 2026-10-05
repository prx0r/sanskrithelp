import type { PersonalBinding, StoneDoorwayMemoryWorld, WheelState } from "./brunoTypes";

export function buildStoneDoorwayExport(
  associations: PersonalBinding[],
  wheelStates: WheelState[],
): StoneDoorwayMemoryWorld {
  return {
    version: "0.1",
    kind: "sanskrit-memory-world",
    source: "sanskrithelp-bruno",
    generatedAt: new Date().toISOString(),
    associations,
    wheelStates,
    nightHandoff: {
      installed: associations.map((x) => x.primitiveId),
      recallPrompt: "Cold-reconstruct today's installed Sanskrit structures before looking.",
      dreamPrompt: "If useful, hold one unresolved Sanskrit relation lightly before sleep and record what appears without treating it as authoritative.",
      provenanceNote: "Personal colour/body/rhythm/image bindings are pedagogical inventions unless explicitly marked sourceAttested.",
    },
  };
}
