"use client";

import { useState } from "react";
import type { FSRSState } from "@/lib/types";

/** Red = Hard, Yellow = Good, Green = Easy. No Again, no text. */
const RING_COLORS = [
  "bg-red-500 hover:bg-red-600",      // 2 = Hard
  "bg-yellow-500 hover:bg-yellow-600 text-neutral-900", // 3 = Good
  "bg-green-500 hover:bg-green-600",  // 4 = Easy
] as const;

interface DrillCardProps {
  front: React.ReactNode;
  back?: React.ReactNode;
  onRate: (rating: 2 | 3 | 4) => void;
  cardState?: FSRSState | null;
  flipped?: boolean;
  hideRevealButton?: boolean;
  /** Learn mode: no quiz, just "Next" to advance (no back content) */
  learnMode?: boolean;
  onNext?: () => void;
}

export function DrillCard({
  front,
  back,
  onRate,
  flipped: controlledFlipped,
  hideRevealButton,
  learnMode,
  onNext,
}: DrillCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const flipped = controlledFlipped ?? internalFlipped;

  return (
    <div className="w-full min-h-[200px]">
      {learnMode ? (
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center">
          {front}
          {onNext && (
            <button
              onClick={onNext}
              className="mt-6 py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium touch-target"
            >
              Next
            </button>
          )}
        </div>
      ) : !flipped ? (
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center">
          {front}
          {!hideRevealButton && (
            <button
              onClick={() => setInternalFlipped(true)}
              className="mt-4 py-2 px-4 rounded-lg bg-primary/20 hover:bg-primary/30 text-sm touch-target"
            >
              Reveal
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center">
          {back}
          <div className="mt-6 flex gap-4 justify-center">
            {([2, 3, 4] as const).map((r, i) => (
              <button
                key={r}
                onClick={() => onRate(r)}
                title={r === 2 ? "Hard" : r === 3 ? "Good" : "Easy"}
                className={`touch-target w-12 h-12 rounded-full ${RING_COLORS[i]}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
