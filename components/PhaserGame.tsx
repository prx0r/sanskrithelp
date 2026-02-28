"use client";

import { useEffect, useRef } from "react";
import type { Types } from "phaser";

interface PhaserGameProps {
  config: Types.Core.GameConfig;
  className?: string;
}

export function PhaserGame({ config, className }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let game: Phaser.Game | null = null;

    const init = async () => {
      const PhaserMod = await import("phaser");
      const parent = containerRef.current;
      if (!parent) return;

      const gameConfig: Types.Core.GameConfig = {
        ...config,
        parent,
        backgroundColor: "#1a1225",
      };

      const Phaser = (PhaserMod as { default?: typeof import("phaser") }).default ?? PhaserMod;
      game = new Phaser.Game(gameConfig);
    };

    init();

    return () => {
      if (game) {
        game.destroy(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className ?? "w-full aspect-video rounded-xl overflow-hidden border border-border"}
    />
  );
}
