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

      <div className="mb-4">
        <h1 className="font-display text-3xl font-bold mb-1">Phoneme Body Maps</h1>
        <p className="text-muted-foreground text-sm">
          Mātṛkā (ordered) · Mālinī (bhinna-yoni) · varṇamālā 5×5.
          Accuracy: tradition-specific practice coordinates — not biomedical anatomy, not a universal chakra chart.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <iframe
          src="/memory/phoneme-maps.html"
          title="Phoneme body maps"
          className="w-full h-[70vh] min-h-[480px] bg-background"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a
          href="/memory/phoneme-maps.html"
          target="_blank"
          rel="noreferrer"
          className="p-4 rounded-xl border border-border bg-card hover:border-primary text-sm"
        >
          Open maps full page →
        </a>
        <a
          href="https://stonedoorway.com/reference/phoneme-maps"
          target="_blank"
          rel="noreferrer"
          className="p-4 rounded-xl border border-border bg-card hover:border-primary text-sm"
        >
          Stonedoorway maps ↗
        </a>
        <a
          href="/memory/data/matrika_body_map.json"
          target="_blank"
          rel="noreferrer"
          className="p-4 rounded-xl border border-border bg-card hover:border-primary text-sm"
        >
          matrika_body_map.json →
        </a>
        <a
          href="/memory/data/malini_order.json"
          target="_blank"
          rel="noreferrer"
          className="p-4 rounded-xl border border-border bg-card hover:border-primary text-sm"
        >
          malini_order.json →
        </a>
      </div>
    </div>
  );
}
