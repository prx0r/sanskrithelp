"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const VakyaBuilderGame = dynamic(
  () => import("@/components/games/VakyaBuilderGame").then((m) => ({ default: m.VakyaBuilderGame })),
  { ssr: false }
);

export default function VakyaBuilderPage() {
  return (
    <div className="py-4">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All games
      </Link>

      <VakyaBuilderGame />

      <p className="mt-4 text-sm text-muted-foreground text-center">
        Drag word-tokens into the slot to build the sentence.
      </p>
    </div>
  );
}
