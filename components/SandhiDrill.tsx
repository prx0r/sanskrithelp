"use client";

import { useState } from "react";
import { applySandhi } from "@/lib/sandhi";
import type { SandhiRule } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SandhiDrillProps {
  rules: SandhiRule[];
  onCorrect?: () => void;
  onIncorrect?: () => void;
}

export function SandhiDrill({ rules, onCorrect, onIncorrect }: SandhiDrillProps) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const allExamples = rules.flatMap((r) =>
    r.examples.map((ex) => ({ rule: r, ...ex }))
  );
  const current = allExamples[exampleIndex % allExamples.length];

  if (!current) return null;

  const correct = current.output.replace(/\s+/g, "");
  const userClean = userAnswer.replace(/\s+/g, "").toLowerCase();
  const isCorrect = userClean === correct.replace(/\s+/g, "").toLowerCase();

  const handleCheck = () => {
    setShowFeedback(true);
    if (isCorrect) onCorrect?.();
    else onIncorrect?.();
  };

  const handleNext = () => {
    setExampleIndex((i) => i + 1);
    setUserAnswer("");
    setShowFeedback(false);
  };

  return (
    <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
      <div className="text-sm text-muted-foreground">Produce the combined form:</div>
      <div className="flex flex-wrap items-center gap-2 text-xl">
        <span className="font-mono bg-muted px-2 py-1 rounded">{current.input[0]}</span>
        <span>+</span>
        <span className="font-mono bg-muted px-2 py-1 rounded">{current.input[1]}</span>
        <span>→</span>
      </div>
      <input
        type="text"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCheck()}
        placeholder="Type combined form..."
        className="w-full px-4 py-3 rounded-lg border bg-background font-mono text-lg"
        disabled={showFeedback}
      />
      {!showFeedback && (
        <button
          onClick={handleCheck}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium"
        >
          Check
        </button>
      )}
      {showFeedback && (
        <div className="space-y-2">
          <div
            className={cn(
              "p-3 rounded-lg",
              isCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            )}
          >
            {isCorrect ? "Correct!" : `Correct answer: ${current.output}`}
          </div>
          <p className="text-sm text-muted-foreground">{current.annotation}</p>
          <button
            onClick={handleNext}
            className="w-full py-2 rounded-lg border border-border hover:bg-accent"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
