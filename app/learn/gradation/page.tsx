"use client";

import { useState } from "react";
import Link from "next/link";
import { GunaDrill } from "@/components/GunaDrill";
import { cn } from "@/lib/utils";

const GRADES = [
  { zero: "i", guna: "e", vrddhi: "ai", zeroDev: "इ", gunaDev: "ए", vrddhiDev: "ऐ", example: "√bhū → भवति" },
  { zero: "u", guna: "o", vrddhi: "au", zeroDev: "उ", gunaDev: "ओ", vrddhiDev: "औ", example: "√vac → वक्ता" },
  { zero: "ṛ", guna: "ar", vrddhi: "ār", zeroDev: "ऋ", gunaDev: "अर्", vrddhiDev: "आर्", example: "√kṛ → करोति" },
];

export default function GradationPage() {
  const [showDrill, setShowDrill] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vowel Grades (Guṇa/Vṛddhi)</h1>
        <p className="text-muted-foreground">
          Sanskrit vowels move in three levels of &quot;energy.&quot; Learn the scale, then practice.
        </p>
        {!showDrill && (
          <button
            onClick={() => setShowDrill(true)}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Skip to drills →
          </button>
        )}
      </div>

      {/* Explainer */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold">Understanding the three grades</h2>

          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Pāṇini&apos;s first two rules (Aṣṭādhyāyī 1.1.1–1.1.2) define this scale. Think of it like sing → sang → sung in English — Sanskrit made it explicit and regular.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium text-foreground mb-1">Zero (hrasva)</p>
                <p className="text-muted-foreground text-xs">Base form. i, u, ṛ.</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="font-medium text-primary mb-1">Guṇa</p>
                <p className="text-muted-foreground text-xs">Add short a. i + a → e, u + a → o.</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="font-medium text-primary mb-1">Vṛddhi</p>
                <p className="text-muted-foreground text-xs">Add long ā. i + ā → ai, u + ā → au.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-primary mb-3">The scale</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Zero</th>
                    <th className="text-left py-2 font-medium">Guṇa</th>
                    <th className="text-left py-2 font-medium">Vṛddhi</th>
                    <th className="text-left py-2 font-muted-foreground">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {GRADES.map((g) => (
                    <tr key={g.zero} className="border-b border-border/50">
                      <td className="py-3">
                        <span className="font-mono">{g.zero}</span>
                        <span className="ml-2 text-lg" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{g.zeroDev}</span>
                      </td>
                      <td className="py-3">
                        <span className="font-mono">{g.guna}</span>
                        <span className="ml-2 text-lg" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{g.gunaDev}</span>
                      </td>
                      <td className="py-3">
                        <span className="font-mono">{g.vrddhi}</span>
                        <span className="ml-2 text-lg" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{g.vrddhiDev}</span>
                      </td>
                      <td className="py-3 text-muted-foreground">{g.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm font-medium text-foreground mb-1">Where you&apos;ll see this</p>
            <p className="text-sm text-muted-foreground">
              When you add an affix to a root, the root vowel often becomes guṇa or vṛddhi. √bhū (भू) + -a- + -ti → भवति. The u became o (guṇa) because the affix demanded it.
            </p>
          </div>

          <GradationQuiz />
        </div>
      </div>

      {/* Drills */}
      {showDrill && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Practice</h2>
          <p className="text-muted-foreground text-sm">
            Given the zero-grade or guṇa, produce the next step. zero + a → guṇa, guṇa + ā → vṛddhi.
          </p>
          <GunaDrill mode="mixed" />
        </div>
      )}

      {!showDrill && (
        <div className="rounded-xl border border-primary p-6 bg-primary/5">
          <p className="text-sm text-muted-foreground mb-4">Ready to practice?</p>
          <button
            onClick={() => setShowDrill(true)}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            Practice with drills →
          </button>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Link href="/learn/phonetics/" className="text-primary hover:underline">
          ← Phonemes
        </Link>
        <Link href="/learn/sandhi/" className="text-primary hover:underline">
          Next: Sandhi →
        </Link>
      </div>
    </div>
  );
}

function GradationQuiz() {
  const [choice, setChoice] = useState<string | null>(null);
  const questions = [
    { q: "Guṇa of i?", correct: "e", options: ["a", "e", "ai", "ī"] },
    { q: "Vṛddhi of u?", correct: "au", options: ["o", "ū", "au", "u"] },
    { q: "Zero + a → ?", correct: "guṇa", options: ["zero", "guṇa", "vṛddhi"] },
  ];
  const [idx, setIdx] = useState(0);
  const current = questions[idx % questions.length];
  const isCorrect = choice === current.correct;

  return (
    <div className="p-4 rounded-lg border border-border bg-muted/30">
      <p className="text-sm font-medium mb-2">Quick check</p>
      <p className="text-sm text-muted-foreground mb-3">{current.q}</p>
      <div className="flex flex-wrap gap-2">
        {current.options.map((opt) => (
          <button
            key={opt}
            onClick={() => setChoice(opt)}
            className={cn(
              "px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
              choice === opt
                ? isCorrect
                  ? "border-green-500 bg-green-500/20"
                  : "border-red-500 bg-red-500/20"
                : "border-border hover:bg-accent"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {choice && (
        <p className={cn("mt-3 text-sm", isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600")}>
          {isCorrect ? "Correct!" : `Answer: ${current.correct}`}
        </p>
      )}
      {choice && (
        <button
          onClick={() => { setChoice(null); setIdx((i) => i + 1); }}
          className="mt-2 text-xs text-primary hover:underline"
        >
          Next question
        </button>
      )}
    </div>
  );
}
