"use client";

import { PhaserGame } from "@/components/PhaserGame";
import { PratyayaReactorScene } from "@/lib/games/scenes";

export function PratyayaReactorGame() {
  return (
    <PhaserGame
      config={{
        type: 0,
        width: 800,
        height: 400,
        scene: [PratyayaReactorScene],
        scale: { mode: 1, autoCenter: 1 },
      }}
      className="w-full max-w-4xl mx-auto aspect-[800/400] rounded-xl overflow-hidden border border-border"
    />
  );
}
