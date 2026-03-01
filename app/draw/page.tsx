"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import type { CharResult, WordResult } from "@/lib/recognize";
import { recognizeDrawing } from "@/lib/drawAssessment";

/** Draw canvas for char (square) or word (wide). */
function DrawArea({
  mode,
  onRecognize,
  onError,
  disabled,
}: {
  mode: "char" | "word";
  onRecognize: (result: CharResult | WordResult) => void;
  onError?: (err: string) => void;
  disabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const w = mode === "char" ? 200 : 400;
  const h = mode === "char" ? 200 : 120;

  const getCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ("touches" in e) {
        const t = e.touches[0];
        return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
      }
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    },
    []
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing.current || disabled) return;
      const coords = getCoords(e);
      if (!coords) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    },
    [getCoords, disabled]
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      const coords = getCoords(e);
      if (!coords) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      isDrawing.current = true;
    },
    [getCoords, disabled]
  );

  const endDraw = useCallback(() => {
    isDrawing.current = false;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleRecognize = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { result, error } = await recognizeDrawing(canvas, mode);
    if (result) {
      if (mode === "char") {
        onRecognize({ char: result.predicted, confidence: result.confidence, classIndex: 0 } as CharResult);
      } else {
        onRecognize({ text: result.predicted, confidence: result.confidence } as WordResult);
      }
      return;
    }
    onError?.(error ?? "Recognition failed. No Devanagari detected — try drawing more clearly or check server logs.");
  }, [mode, onRecognize, onError]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        className="touch-none rounded-xl border-2 border-border bg-white cursor-crosshair"
        style={{ maxWidth: "100%" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-sm"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleRecognize}
          disabled={disabled}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          Recognize
        </button>
      </div>
    </div>
  );
}

export default function DrawPage() {
  const [mode, setMode] = useState<"char" | "word">("char");
  const [result, setResult] = useState<CharResult | WordResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecognize = useCallback((r: CharResult | WordResult) => {
    setResult(r);
    setError(null);
  }, []);

  const handleError = useCallback((err: string) => {
    setError(err);
  }, []);

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="flex gap-4 mb-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <Link href="/draw/references" className="text-sm text-primary hover:underline">
          Draw reference characters
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-2">Devanagari Recognition</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Draw a character or word. Uses Chutes vision API — no local models. Requires{" "}
        <code className="bg-muted px-1 rounded">CHUTES_API_KEY</code> in .env.local.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("char")}
          className={`px-3 py-1.5 rounded-lg text-sm ${mode === "char" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          Character
        </button>
        <button
          onClick={() => setMode("word")}
          className={`px-3 py-1.5 rounded-lg text-sm ${mode === "word" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          Word
        </button>
      </div>

      <DrawArea mode={mode} onRecognize={handleRecognize} onError={handleError} disabled={false} />

      {result && (
        <div className="mt-6 p-4 rounded-lg bg-muted">
          {"char" in result ? (
            <>
              <p className="text-3xl font-bold mb-1">{(result as CharResult).char}</p>
              <p className="text-sm text-muted-foreground">
                Confidence: {((result as CharResult).confidence * 100).toFixed(1)}%
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold mb-1">{(result as WordResult).text || "(empty)"}</p>
              <p className="text-sm text-muted-foreground">
                Confidence: {((result as WordResult).confidence * 100).toFixed(1)}%
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
