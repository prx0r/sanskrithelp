"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const DhatuShooterGame = dynamic(
  () => import("@/components/games/DhatuShooterGame").then((m) => ({ default: m.DhatuShooterGame })),
  { ssr: false }
);

export default function DhatuShooterPage() {
  return (
    <div className="py-4">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All games
      </Link>

      <DhatuShooterGame />

      <p className="mt-4 text-sm text-muted-foreground text-center">
        Click words that belong to √root. Root changes every 15s. Miss wrong words = lose a life.
      </p>
    </div>
  );
}
