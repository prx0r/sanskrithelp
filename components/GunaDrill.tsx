"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const VOWEL_GRADES: Record<string, { zero: string; guna: string; vrddhi: string }> = {
  i: { zero: "i", guna: "e", vrddhi: "ai" },
  u: { zero: "u", guna: "o", vrddhi: "au" },
  r: { zero: "ṛ", guna: "ar", vrddhi: "ār" },
};

const EXAMPLES = [
  { zero: "i", guna: "e", vrddhi: "ai", word: "√bhū → bhavati", dev: "√भू → भवति" },
  { zero: "u", guna: "o", vrddhi: "au", word: "√vac → vaktā", dev: "√वच् → वक्ता" },
  { zero: "ṛ", guna: "ar", vrddhi: "ār", word: "√kṛ → karoti", dev: "√कृ → करोति" },
];

interface GunaDrillProps {
  mode?: "zero-to-guna" | "guna-to-vrddhi" | "mixed";
  onCorrect?: () => void;
  onIncorrect?: () => void;
}

export function GunaDrill({ mode = "mixed", onCorrect, onIncorrect }: GunaDrillProps) {
  const [idx, setIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

  const ex = EXAMPLES[idx % EXAMPLES.length];
  const grades = VOWEL_GRADES[ex.zero.replace("ṛ", "r")] || VOWEL_GRADES[ex.zero];

  let prompt = "";
  let answer = "";
  if (mode === "zero-to-guna") {
    prompt = `Given zero-grade "${ex.zero}", produce guṇa`;
    answer = grades.guna;
  } else if (mode === "guna-to-vrddhi") {
    prompt = `Given guṇa "${grades.guna}", produce vṛddhi`;
    answer = grades.vrddhi;
  } else {
    const r = Math.random();
    if (r < 0.5) {
      prompt = `Zero "${ex.zero}" → guṇa?`;
      answer = grades.guna;
    } else {
      prompt = `Guṇa "${grades.guna}" → vṛddhi?`;
      answer = grades.vrddhi;
    }
  }

  const handleCheck = () => {
    const ok = userAnswer.trim().toLowerCase() === answer.toLowerCase();
    setFeedback(ok ? "correct" : "incorrect");
    if (ok) onCorrect?.();
    else onIncorrect?.();
  };

  const handleNext = () => {
    setIdx((i) => i + 1);
    setUserAnswer("");
    setFeedback(null);
  };

  return (
    <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
      <div className="text-sm text-muted-foreground">{prompt}</div>
      <div>
        <p className="text-lg text-primary font-mono">{ex.word}</p>
        <p className="text-xl mt-1" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{ex.dev}</p>
      </div>
      <input
        type="text"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCheck()}
        placeholder="Your answer"
        className="w-full px-4 py-3 rounded-lg border bg-background font-mono"
        disabled={feedback !== null}
      />
      {feedback === null && (
        <button
          onClick={handleCheck}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium"
        >
          Check
        </button>
      )}
      {feedback !== null && (
        <div className="space-y-2">
          <div
            className={cn(
              "p-3 rounded-lg",
              feedback === "correct"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            )}
          >
            {feedback === "correct"
              ? "Correct!"
              : `Answer: ${answer} (zero + a → guṇa, guṇa + ā → vṛddhi)`}
          </div>
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
