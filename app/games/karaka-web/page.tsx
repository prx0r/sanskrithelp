"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const KarakaWebGame = dynamic(
  () => import("@/components/games/KarakaWebGame").then((m) => ({ default: m.KarakaWebGame })),
  { ssr: false }
);

export default function KarakaWebPage() {
  return (
    <div className="py-4">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All games
      </Link>

      <KarakaWebGame />

      <p className="mt-4 text-sm text-muted-foreground text-center">
        Drag words from the bottom into kāraka slots around the verb.
      </p>
    </div>
  );
}
