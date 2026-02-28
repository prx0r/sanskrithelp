"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Pratyahara } from "@/lib/types";

interface PratyaharaDrillProps {
  pratyaharas: Pratyahara[];
  getDevanagari: (phonemeId: string) => string;
}

type DrillType = "decode" | "encode";

// Decode: "What does ac mean?" → pick correct description
// Encode: "Which pratyāhāra means 'all vowels'?" → pick ac

const DECODE_PROMPTS = [
  { id: "ac", prompt: "What does **ac** mean?" },
  { id: "ic", prompt: "What does **ic** mean?" },
  { id: "uc", prompt: "What does **uc** mean?" },
  { id: "ek", prompt: "What does **ek** mean?" },
  { id: "yam", prompt: "What does **yam** mean?" },
  { id: "aś", prompt: "What does **aś** mean?" },
];

export function PratyaharaDrill({ pratyaharas, getDevanagari }: PratyaharaDrillProps) {
  const [step, setStep] = useState(0);
  const [drillType, setDrillType] = useState<DrillType>("decode");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

  const decodeItems = DECODE_PROMPTS.filter((d) => pratyaharas.some((p) => p.id === d.id));
  const currentDecode = decodeItems[step % decodeItems.length];
  const correctPratyahara = currentDecode
    ? pratyaharas.find((p) => p.id === currentDecode.id)
    : null;

  // For decode: 1 correct + 2 wrong options
  const wrongOptions = correctPratyahara
    ? pratyaharas
        .filter((p) => p.id !== correctPratyahara.id && p.explanation !== correctPratyahara.explanation)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .map((p) => p.explanation)
    : [];
  const options = correctPratyahara
    ? [...wrongOptions, correctPratyahara.explanation].sort(() => Math.random() - 0.5)
    : [];

  const handleCheck = () => {
    if (!correctPratyahara) return;
    const ok = selectedAnswer === correctPratyahara.explanation;
    setFeedback(ok ? "correct" : "incorrect");
  };

  const handleNext = () => {
    setStep((s) => s + 1);
    setSelectedAnswer(null);
    setFeedback(null);
  };

  if (!correctPratyahara || options.length < 2) return null;

  return (
    <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setDrillType("decode");
            setSelectedAnswer(null);
            setFeedback(null);
          }}
          className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium",
            drillType === "decode" ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          Decode
        </button>
        <button
          onClick={() => {
            setDrillType("encode");
            setSelectedAnswer(null);
            setFeedback(null);
          }}
          className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium",
            drillType === "encode" ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          Encode
        </button>
      </div>

      {drillType === "decode" ? (
        <>
          <p className="text-sm text-muted-foreground">
            What does this pratyāhāra mean?
          </p>
          <p className="text-2xl font-mono font-bold">{currentDecode.id}</p>
          <div className="space-y-2">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => feedback === null && setSelectedAnswer(opt)}
                disabled={feedback !== null}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg border transition-colors",
                  selectedAnswer === opt
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent",
                  feedback === "correct" && selectedAnswer === opt && "border-green-500 bg-green-500/10",
                  feedback === "incorrect" && opt === correctPratyahara.explanation && "border-green-500 bg-green-500/10"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <EncodeDrill
          pratyaharas={pratyaharas}
          step={step}
          selectedAnswer={selectedAnswer}
          setSelectedAnswer={setSelectedAnswer}
          feedback={feedback}
          setFeedback={setFeedback}
          handleNext={handleNext}
        />
      )}

      {drillType === "decode" && (
        <>
          {feedback === null && (
            <button
              onClick={handleCheck}
              disabled={!selectedAnswer}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
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
                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-red-500/20 text-red-600 dark:text-red-400"
                )}
              >
                {feedback === "correct" ? (
                  "Correct!"
                ) : (
                  <>
                    <p>Answer: {correctPratyahara.explanation}</p>
                    <p className="text-sm mt-2 opacity-90">
                      Sounds: {correctPratyahara.result.map(getDevanagari).join(" ")}
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={handleNext}
                className="w-full py-2 rounded-lg border border-border hover:bg-accent"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EncodeDrill({
  pratyaharas,
  step,
  selectedAnswer,
  setSelectedAnswer,
  feedback,
  setFeedback,
  handleNext,
}: {
  pratyaharas: Pratyahara[];
  step: number;
  selectedAnswer: string | null;
  setSelectedAnswer: (s: string | null) => void;
  feedback: "correct" | "incorrect" | null;
  setFeedback: (f: "correct" | "incorrect" | null) => void;
  handleNext: () => void;
}) {
  const encodeTargets = [
    { id: "ac", q: "Which pratyāhāra means 'all vowels'?" },
    { id: "ic", q: "Which means 'vowels from i onward'?" },
    { id: "ek", q: "Which means 'guṇa vowels (e, o)'?" },
    { id: "yam", q: "Which means 'semivowels and anusvara'?" },
  ].filter((e) => pratyaharas.some((p) => p.id === e.id));

  const current = encodeTargets[step % encodeTargets.length];
  const correctId = current?.id;
  const wrongIds = pratyaharas
    .filter((p) => p.id !== correctId)
    .map((p) => p.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  const options = correctId ? [...wrongIds, correctId].sort(() => Math.random() - 0.5) : [];

  const handleCheck = () => {
    const ok = selectedAnswer === correctId;
    setFeedback(ok ? "correct" : "incorrect");
  };

  if (!current) return null;

  return (
    <>
      <p className="text-sm text-muted-foreground">{current.q}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((id) => (
          <button
            key={id}
            onClick={() => feedback === null && setSelectedAnswer(id)}
            disabled={feedback !== null}
            className={cn(
              "px-4 py-3 rounded-lg border font-mono font-medium transition-colors",
              selectedAnswer === id ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
              feedback === "correct" && selectedAnswer === id && "border-green-500 bg-green-500/10",
              feedback === "incorrect" && id === correctId && "border-green-500 bg-green-500/10"
            )}
          >
            {id}
          </button>
        ))}
      </div>
      {feedback === null && (
        <button
          onClick={handleCheck}
          disabled={!selectedAnswer}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
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
                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                : "bg-red-500/20 text-red-600 dark:text-red-400"
            )}
          >
            {feedback === "correct" ? "Correct!" : `Answer: ${correctId}`}
          </div>
          <button
            onClick={handleNext}
            className="w-full py-2 rounded-lg border border-border hover:bg-accent"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
