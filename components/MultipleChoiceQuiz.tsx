"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface MCQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface MultipleChoiceQuizProps {
  questions: MCQuestion[];
  title?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showProgress?: boolean;
  onComplete?: (correct: number, total: number) => void;
}

export function MultipleChoiceQuiz({
  questions,
  title = "Quiz",
  shuffleQuestions = true,
  shuffleOptions = true,
  showProgress = true,
  onComplete,
}: MultipleChoiceQuizProps) {
  const orderedQuestions = useMemo(() => {
    const q = [...questions];
    if (shuffleQuestions) {
      for (let i = q.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j], q[i]];
      }
    }
    return q;
  }, [questions, shuffleQuestions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const current = orderedQuestions[currentIndex];
  const options = useMemo(() => {
    if (!current) return [];
    const opts = current.options.map((o, i) => ({ text: o, index: i }));
    if (shuffleOptions) {
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
      }
    }
    return opts;
  }, [current, shuffleOptions]);

  const totalCount = questions.length;
  const isLast = currentIndex === orderedQuestions.length - 1;

  const handleSelect = (optionIndex: number) => {
    if (feedback !== null) return;
    setSelectedIndex(optionIndex);
  };

  const handleCheck = () => {
    if (selectedIndex === null || !current) return;
    const correct = options[selectedIndex]?.index === current.correctIndex;
    setFeedback(correct ? "correct" : "incorrect");
    if (correct) setCorrectCount((c) => c + 1);
  };

  const handleNext = () => {
    if (isLast) {
      const finalCorrect = feedback === "correct" ? correctCount + 1 : correctCount;
      onComplete?.(finalCorrect, totalCount);
      setShowResults(true);
      return;
    }
    setCurrentIndex((i) => Math.min(i + 1, orderedQuestions.length - 1));
    setSelectedIndex(null);
    setFeedback(null);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setFeedback(null);
    setCorrectCount(0);
    setShowResults(false);
  };

  if (showResults) {
    const lastCorrect = feedback === "correct" && selectedIndex !== null && current && options[selectedIndex]?.index === current.correctIndex;
    const finalCorrect = correctCount + (lastCorrect ? 1 : 0);
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Quiz complete</h3>
          <p className="text-2xl font-bold text-primary">
            {finalCorrect} / {totalCount}
          </p>
          <p className="text-muted-foreground text-sm">correct</p>
          <button
            onClick={handleRestart}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const correctOptionText = current.options[current.correctIndex];
  const isCorrect = feedback !== null && selectedIndex !== null && options[selectedIndex]?.index === current.correctIndex;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {(title || showProgress) && (
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          {title && <h3 className="font-semibold">{title}</h3>}
          {showProgress && (
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {orderedQuestions.length}
            </span>
          )}
        </div>
      )}
      <div className="p-6 space-y-6">
        <p className="text-lg font-medium">{current.question}</p>

        <div className="space-y-2">
          {options.map((opt, i) => {
            const isSelected = selectedIndex === i;
            const isCorrectOpt = opt.index === current.correctIndex;
            const showCorrect = feedback !== null && isCorrectOpt;
            const showWrong = feedback === "incorrect" && isSelected && !isCorrectOpt;

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={feedback !== null}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg border transition-colors",
                  "disabled:cursor-default",
                  isSelected && feedback === null && "border-primary bg-primary/10",
                  showCorrect && "border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                  showWrong && "border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400"
                )}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {feedback === null && (
          <button
            onClick={handleCheck}
            disabled={selectedIndex === null}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check
          </button>
        )}

        {feedback !== null && (
          <div className="space-y-3">
            <div
              className={cn(
                "p-4 rounded-lg",
                isCorrect ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              )}
            >
              <p className="font-medium">{isCorrect ? "Correct!" : "Incorrect."}</p>
              {!isCorrect && (
                <p className="text-sm mt-1 opacity-90">Answer: {correctOptionText}</p>
              )}
              {current.explanation && (
                <p className="text-sm mt-2 opacity-90">{current.explanation}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleNext}
                className="flex-1 py-2 rounded-lg border border-border hover:bg-accent font-medium"
              >
                {isLast ? "See results" : "Next"}
              </button>
              {isLast && (
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-sm"
                >
                  Restart
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
