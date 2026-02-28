"use client";

import { useState } from "react";
import type { LinguisticNode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WordParse {
  word: string;
  root?: string;
  meaning?: string;
  derivation?: string;
}

interface ParseSentenceProps {
  sentence: string;
  words: WordParse[];
  onWordClick?: (word: WordParse) => void;
}

export function ParseSentence({ sentence, words, onWordClick }: ParseSentenceProps) {
  const [selected, setSelected] = useState<WordParse | null>(null);

  const tokens = sentence.split(/\s+/);
  const wordMap = new Map(
    words.map((w) => [w.word.toLowerCase(), w])
  );

  const handleWordClick = (token: string) => {
    const w = wordMap.get(token.toLowerCase());
    if (w) {
      setSelected(w);
      onWordClick?.(w);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-2xl md:text-3xl leading-relaxed flex flex-wrap gap-2">
        {tokens.map((t, i) => (
          <button
            key={i}
            onClick={() => handleWordClick(t)}
            className={cn(
              "font-sans text-primary hover:bg-accent rounded px-1 transition-colors",
              selected?.word === t && "bg-accent ring-2 ring-primary"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {selected && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-2">
          <div className="font-mono text-lg">{selected.word}</div>
          {selected.root && <div>Root: {selected.root}</div>}
          {selected.meaning && <div>Meaning: {selected.meaning}</div>}
          {selected.derivation && (
            <div className="text-sm text-muted-foreground">{selected.derivation}</div>
          )}
        </div>
      )}
    </div>
  );
}
