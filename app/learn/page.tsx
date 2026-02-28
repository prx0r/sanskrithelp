"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Volume2, ChevronRight, Lock } from "lucide-react";
import unitsData from "@/data/units.json";
import { isUnitUnlocked } from "@/lib/lessonProgress";

const units = unitsData as Array<{
  id: string;
  title: string;
  subtitle: string;
  order: number;
}>;
const unitIds = [...units].sort((a, b) => a.order - b.order).map((u) => u.id);

const ISLANDS = [
  { id: "compression", num: 1, label: "Pratyāhāras", path: "/learn/compression/" },
  { id: "phonetics", num: 2, label: "Phoneme Grid", path: "/learn/phonetics/" },
  { id: "gradation", num: 3, label: "Guṇa / Vṛddhi", path: "/learn/gradation/" },
  { id: "sandhi", num: 4, label: "Sandhi", path: "/learn/sandhi/" },
  { id: "roots", num: 5, label: "Dhātus", path: "/learn/roots/" },
  { id: "words", num: 6, label: "Words", path: "/learn/words/" },
  { id: "suffixes", num: 7, label: "Suffixes", path: "/learn/suffixes/" },
  { id: "karakas", num: 8, label: "Kārakas", path: "/learn/karakas/" },
  { id: "verbs", num: 9, label: "Verbs", path: "/learn/verbs/" },
  { id: "compounds", num: 10, label: "Compounds", path: "/learn/compounds/" },
  { id: "reading", num: 11, label: "Reading", path: "/learn/reading/" },
];

export default function LearnPage() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learn Sanskrit</h1>
        <p className="text-muted-foreground">
          Practice pronunciation — hear the original, record yourself, compare side by side.
          Based on learnsanskrit.org and Pāṇini&apos;s system.
        </p>
      </div>

      <section className="mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Pronunciation Drills
          </h2>
          <Link
            href="/drill"
            className="text-sm font-medium text-primary hover:underline"
          >
            Daily Review (Anki-style) →
          </Link>
        </div>
        <Link
          href="/learn/pronunciation"
          className="block mb-4 p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all"
        >
          <h3 className="font-semibold text-primary">Śabdakrīḍā — AI Pronunciation Tutor</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Speak Sanskrit, get real-time feedback. Uses Aryan voice for target words.
          </p>
        </Link>
        <div className="grid gap-3 sm:grid-cols-2">
          {units
            .sort((a, b) => a.order - b.order)
            .map((unit) => {
              const unlocked = isUnitUnlocked(unit.id, unitIds);
              return unlocked ? (
                <Link
                  key={unit.id}
                  href={`/learn/drill/${unit.id}`}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-primary">{unit.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{unit.subtitle}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" />
                </Link>
              ) : (
                <div
                  key={unit.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/30 opacity-60 cursor-not-allowed"
                >
                  <Lock className="w-5 h-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-muted-foreground">{unit.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">Complete previous unit</p>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Grammar Topics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ISLANDS.map((island) => (
            <button
              key={island.id}
              onClick={() => router.push(island.path)}
              className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="text-xs text-muted-foreground">{island.num}</span>
              <h3 className="font-semibold mt-1">{island.label}</h3>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
