"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SandhiForgeGame = dynamic(
  () => import("@/components/games/SandhiForgeGame").then((m) => ({ default: m.SandhiForgeGame })),
  { ssr: false }
);

export default function SandhiForgePage() {
  return (
    <div className="py-4">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All games
      </Link>

      <SandhiForgeGame />

      <p className="mt-4 text-sm text-muted-foreground text-center">
        Watch phonemes collide. Answer reveals after 2s.
      </p>
    </div>
  );
}
