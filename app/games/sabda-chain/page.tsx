"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SabdaChainGame = dynamic(
  () => import("@/components/games/SabdaChainGame").then((m) => ({ default: m.SabdaChainGame })),
  { ssr: false }
);

export default function SabdaChainPage() {
  return (
    <div className="py-4">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All games
      </Link>

      <SabdaChainGame />

      <p className="mt-4 text-sm text-muted-foreground text-center">
        Build a chain of words connected by root, suffix, or prefix. 10 seconds.
      </p>
    </div>
  );
}
