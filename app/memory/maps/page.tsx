"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MemoryMapsPage() {
  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/memory"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Memory
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Phoneme Body Maps</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Placement diagrams from verse-literal TĀ 15.117–120 and MV 3 (order verified
          TĀ 15.121–125). Arm-series loci follow the verse — hand/fingers/nails, hip
          (canonical v1); apparatus elbow/wrist/buttock recorded only, never mixed
          (see integrated Mātṛkā wheel).
          One primary map per night. Start with Mātṛkā · Night 1 = a + ā.
        </p>
      </div>

      <a
        href="/memory/body-diagram.html"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-base font-semibold"
      >
        Open full body diagrams →
      </a>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a href="/memory/nyasa" className="p-4 rounded-xl border border-border bg-card hover:border-primary">
          Nyāsa practice
        </a>
        <a href="/memory/audio/cycle_night1_a_aa.mp3" className="p-4 rounded-xl border border-border bg-card hover:border-primary">
          Night 1 audio cycle
        </a>
        <a href="/memory/bruno-wheels/index.html" className="p-4 rounded-xl border border-border bg-card hover:border-primary">
          Bruno wheels
        </a>
        <a href="/memory/canonical/TANTRALOKA_CANONICAL.md" className="p-4 rounded-xl border border-border bg-card hover:border-primary">
          Tantrāloka canonical
        </a>
      </div>
    </div>
  );
}
