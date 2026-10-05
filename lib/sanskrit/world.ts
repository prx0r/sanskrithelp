import type { Mode, VerseState } from "./types";
import { ASATO_MAM_ASATO } from "./panini";

/** Persistent Sanskrit world (session/localStorage friendly). */
export interface WorldPatch {
  id: string;
  verseId: string;
  addedMachines: string[];
  addedGates: string[];
  addedRoots: string[];
  activatedNodes: string[];
}

export interface SanskritWorld {
  verses: Record<string, VerseState>;
  patches: WorldPatch[];
  architecture: {
    ground: string[];
    arcade: string[];
    corridors: string[];
    doorways: string[];
  };
  mode: Mode;
  todaysActivated: string[];
}

export function defaultWorld(): SanskritWorld {
  return {
    verses: { [ASATO_MAM_ASATO.id]: ASATO_MAM_ASATO },
    patches: [],
    architecture: {
      ground: ["velar", "palatal", "retroflex", "dental", "labial"],
      arcade: ["ac", "ik", "yaṅ"],
      corridors: ["ṇic-condition", "voicing-before-voiced", "visarga-o"],
      doorways: ["sat+g", "ḥ+m"],
    },
    mode: "DECOMPILE",
    todaysActivated: [],
  };
}

export function installVerse(world: SanskritWorld, verse: VerseState): SanskritWorld {
  const prev = world.verses[verse.id];
  const machines = Array.from(
    new Set([...(prev?.installedMachines ?? []), ...verse.installedMachines])
  );
  const gates = Array.from(
    new Set([...(prev?.installedGates ?? []), ...verse.installedGates])
  );
  const roots = Array.from(
    new Set([...(prev?.knownRoots ?? []), ...verse.knownRoots])
  );

  const patch: WorldPatch = {
    id: `patch-${verse.id}-${Date.now()}`,
    verseId: verse.id,
    addedMachines: machines,
    addedGates: gates,
    addedRoots: roots,
    activatedNodes: [...verse.tokens, ...machines, ...roots],
  };

  const corridors = Array.from(
    new Set([...world.architecture.corridors, ...machines.map((m) => `${m}-condition`)])
  );
  const doorways = Array.from(new Set([...world.architecture.doorways, ...gates]));

  return {
    ...world,
    verses: { ...world.verses, [verse.id]: { ...verse, installedMachines: machines, installedGates: gates, knownRoots: roots } },
    patches: [...world.patches, patch],
    architecture: { ...world.architecture, corridors, doorways },
    todaysActivated: Array.from(new Set([...world.todaysActivated, ...patch.activatedNodes])),
  };
}

export function worldFromStorage(): SanskritWorld {
  if (typeof window === "undefined") return defaultWorld();
  try {
    const raw = window.localStorage.getItem("sanskrit-world-v2");
    if (!raw) return defaultWorld();
    return { ...defaultWorld(), ...JSON.parse(raw) };
  } catch {
    return defaultWorld();
  }
}

export function saveWorld(world: SanskritWorld) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("sanskrit-world-v2", JSON.stringify(world));
}
