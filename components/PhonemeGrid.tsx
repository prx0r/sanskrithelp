"use client";

import { useMemo } from "react";
import { AudioPlayer } from "./AudioPlayer";
import type { Phoneme } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PhonemeGridProps {
  phonemes: Phoneme[];
  onSelect?: (phoneme: Phoneme) => void;
  showAudio?: boolean;
}

const PLACE_ORDER = ["velar", "palatal", "retroflex", "dental", "labial"];
const MANNER_ORDER = [
  "unvoiced_stop",
  "unvoiced_aspirate",
  "voiced_stop",
  "voiced_aspirate",
  "nasal",
];

const VIRAMA = "\u094D"; // Devanagari virama (्) for consonant-only form

export function PhonemeGrid({ phonemes, onSelect, showAudio = true }: PhonemeGridProps) {
  const grid = useMemo(() => {
    const byPlace = new Map<string, Phoneme[]>();
    for (const p of phonemes) {
      if (p.manner !== "vowel" && p.manner !== "other" && p.place !== "other") {
        const key = p.place;
        if (!byPlace.has(key)) byPlace.set(key, []);
        byPlace.get(key)!.push(p);
      }
    }
    const rows: Phoneme[][] = [];
    for (const place of PLACE_ORDER) {
      const arr = byPlace.get(place) || [];
      arr.sort((a, b) => MANNER_ORDER.indexOf(a.manner) - MANNER_ORDER.indexOf(b.manner));
      if (arr.length) rows.push(arr);
    }
    return rows;
  }, [phonemes]);

  const vowels = useMemo(
    () => phonemes.filter((p) => p.manner === "vowel"),
    [phonemes]
  );

  const others = useMemo(
    () =>
      phonemes.filter(
        (p) =>
          p.manner === "semivowel" ||
          p.manner === "sibilant" ||
          (p.place === "other" && p.manner !== "vowel")
      ),
    [phonemes]
  );

  const PhonemeCell = ({ p, showHalfForm = false }: { p: Phoneme; showHalfForm?: boolean }) => (
    <button
      onClick={() => onSelect?.(p)}
      className={cn(
        "phoneme-cell flex flex-col items-center justify-center gap-0.5",
        "min-w-[4.5rem] min-h-[4.5rem] py-3 px-3 rounded-xl border border-border bg-card",
        "hover:bg-accent hover:border-primary/30 transition-colors touch-target"
      )}
    >
      <span className="text-4xl font-medium leading-none" style={{ fontFamily: "var(--font-devanagari), 'Noto Sans Devanagari', sans-serif" }}>
        {p.devanagari}
      </span>
      {showHalfForm && (
        <span className="text-lg text-muted-foreground/80" style={{ fontFamily: "var(--font-devanagari), 'Noto Sans Devanagari', sans-serif" }}>
          {p.devanagari}{VIRAMA}
        </span>
      )}
      <span className="text-xs font-mono text-muted-foreground">{p.iast}</span>
      {showAudio && (
        <AudioPlayer phoneme={p} className="mt-2 p-1.5 shrink-0" />
      )}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Consonant grid */}
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-xs text-muted-foreground font-medium">place / manner</th>
              {MANNER_ORDER.slice(0, 5).map((m) => (
                <th key={m} className="p-2 text-xs text-muted-foreground font-medium">
                  {m.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, i) => (
              <tr key={i}>
                <td className="p-2 text-xs text-muted-foreground align-middle">
                  {row[0]?.place}
                </td>
                {row.map((p) => (
                  <td key={p.id} className="p-2">
                    <PhonemeCell p={p} showHalfForm />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vowels */}
      <div>
        <h3 className="text-sm font-medium mb-3">Vowels</h3>
        <div className="flex flex-wrap gap-3">
          {vowels.map((p) => (
            <PhonemeCell key={p.id} p={p} />
          ))}
        </div>
      </div>

      {/* Semivowels / sibilants */}
      <div>
        <h3 className="text-sm font-medium mb-3">Semivowels & Sibilants</h3>
        <div className="flex flex-wrap gap-3">
          {others.map((p) => (
            <PhonemeCell key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
