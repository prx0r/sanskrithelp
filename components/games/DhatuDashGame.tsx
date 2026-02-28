"use client";

import { PhaserGame } from "@/components/PhaserGame";
import { DhatuDashPlatformScene } from "@/lib/games/scenes";

export function DhatuDashGame() {
  return (
    <PhaserGame
      config={{
        type: 0,
        width: 800,
        height: 500,
        scene: [DhatuDashPlatformScene],
        scale: { mode: 1, autoCenter: 1 },
      }}
      className="w-full max-w-4xl mx-auto aspect-[800/500] rounded-xl overflow-hidden border border-border"
    />
  );
}
