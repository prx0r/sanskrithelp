"use client";

import { useState } from "react";
import { RATING_LABELS, RATING_COLORS, type Rating } from "@/lib/fsrs";
import type { FSRSState } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DrillCardProps {
  front: React.ReactNode;
  back?: React.ReactNode;
  onRate: (rating: Rating) => void;
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
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {([1, 2, 3, 4] as Rating[]).map((r) => (
              <button
                key={r}
                onClick={() => onRate(r)}
                className={cn(
                  "touch-target py-2 px-4 rounded-lg text-white font-medium text-sm",
                  RATING_COLORS[r]
                )}
              >
                {RATING_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
