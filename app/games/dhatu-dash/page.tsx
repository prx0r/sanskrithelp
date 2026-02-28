"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const DhatuDashGame = dynamic(
  () => import("@/components/games/DhatuDashGame").then((m) => ({ default: m.DhatuDashGame })),
  { ssr: false }
);

export default function DhatuDashPage() {
  return (
    <div className="py-4">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        All games
      </Link>

      <DhatuDashGame />

      <p className="mt-4 text-sm text-muted-foreground text-center">
        Tap platforms to hop. Large platforms = roots (switch realm). Small = derived forms.
      </p>
    </div>
  );
}
