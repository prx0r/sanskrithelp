"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HindiWheelLab from "@/components/HindiWheelLab";

export default function HindiMemoryPage() {
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
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">
          Hindi Wheels
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          Active Hindi layer over the Sanskrit memory machine: Mātṛkā sound bridge,
          grammatical Bruno sentence compiler, and Kumbh/Rishikesh/Varanasi field
          language.
        </p>
        <p className="text-muted-foreground text-sm max-w-3xl mt-2">
          <strong className="text-foreground">Daily flow (canonical):</strong>{" "}
          Sanskrit installs the phonemes (Mātṛkā drill) → Hindi extends them the same
          day into live sentences and conversation. Substrate and production advance
          together; neither waits for the other. See{" "}
          <code>docs/visions/awesomevision.md</code>.
        </p>
        <p className="text-muted-foreground text-sm max-w-3xl mt-2">
          <strong className="text-foreground">Dataset Zero:</strong> Osho Hindi{" "}
          <em>Śiva Sūtra</em> 01–10 (~14h, direct MP3, free download) — Sanskrit
          nucleus + Hindi explanation side by side. Start in{" "}
          <Link className="text-primary underline" href="/memory/hindi/text-mode">
            Text Mode
          </Link>
          . Osho teaches Hindi here, not Trika authority.
        </p>
      </div>

      <HindiWheelLab />
    </div>
  );
}
