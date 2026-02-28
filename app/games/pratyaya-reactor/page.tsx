"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const PratyayaReactorGame = dynamic(
  () => import("@/components/games/PratyayaReactorGame").then((m) => ({ default: m.PratyayaReactorGame })),
  { ssr: false }
);

export default function PratyayaReactorPage() {
  return (
    <div className="py-4">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All games
      </Link>

      <PratyayaReactorGame />

      <p className="mt-4 text-sm text-muted-foreground text-center">
        See how root + suffix assembles into a word.
      </p>
    </div>
  );
}
