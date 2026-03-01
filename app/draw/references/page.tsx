"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { DrawCanvas, type DrawCanvasHandle } from "@/components/DrawCanvas";
import { setReference, getReferenceDrawings } from "@/lib/referenceDrawings";
import phonemesData from "@/data/phonemes.json";
import type { Phoneme } from "@/lib/types";

const phonemes = phonemesData as Phoneme[];

export default function ReferenceDrawingsPage() {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(() => new Set(Object.keys(getReferenceDrawings())));
  const drawRef = useRef<DrawCanvasHandle>(null);

  const current = phonemes[index];
  const hasRef = saved.has(current?.devanagari ?? "");

  useEffect(() => {
    drawRef.current?.clear();
  }, [index]);

  const handleSave = useCallback(() => {
    if (!current) return;
    const canvas = drawRef.current?.getCanvas?.();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    if (!base64) return;
    setReference(current.devanagari, base64);
    setSaved((s) => new Set([...s, current.devanagari]));
  }, [current]);

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <Link href="/draw" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block">
        ← Back to Draw
      </Link>
      <h1 className="text-2xl font-bold mb-2">Reference Drawings</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Draw each character in the form you want the drill to recognize. These replace font-rendered glyphs for pixel matching. Saves to localStorage.
      </p>

      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 text-sm"
        >
          ← Prev
        </button>
        <span className="text-sm text-muted-foreground">
          {index + 1} / {phonemes.length}
        </span>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(phonemes.length - 1, i + 1))}
          disabled={index === phonemes.length - 1}
          className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 text-sm"
        >
          Next →
        </button>
      </div>

      {current && (
        <div className="space-y-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-4xl mb-1" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>
              {current.devanagari}
            </p>
            <p className="text-lg font-mono text-muted-foreground">{current.iast}</p>
            {hasRef && <p className="text-xs text-green-600 mt-1">✓ Reference saved</p>}
          </div>

          <DrawCanvas ref={drawRef} onDrawChange={() => {}} />

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
          >
            Save as reference for {current.devanagari}
          </button>
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        {saved.size} references saved. Used by the drill when API fails or returns a character not in options.
      </p>
    </div>
  );
}
