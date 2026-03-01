"use client";

import { useRef, useCallback, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { cn } from "@/lib/utils";

const CANVAS_SIZE = 200;
const OUTPUT_SIZE = 32;
const STROKE_WIDTH = 8;

export interface DrawCanvasHandle {
  exportImage: () => string | null;
  clear: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

interface DrawCanvasProps {
  className?: string;
  disabled?: boolean;
  onDrawChange?: (hasDrawn: boolean) => void;
}

/** Canvas for drawing Devanagari. Exports 32x32 grayscale PNG for recognition models. */
export const DrawCanvas = forwardRef<DrawCanvasHandle, DrawCanvasProps>(
  function DrawCanvas({ className, disabled = false, onDrawChange }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ("touches" in e) {
        const t = e.touches[0];
        return {
          x: (t.clientX - rect.left) * scaleX,
          y: (t.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled) return;
      const coords = getCoords(e);
      if (!coords) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setHasDrawn(true);
    },
    [isDrawing, disabled, getCoords]
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
      setHasDrawn(true);
      setIsDrawing(true);
    },
    [getCoords, disabled]
  );

  const endDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onDrawChange?.(false);
  }, [onDrawChange]);

  /** Export canvas as 32x32 grayscale PNG base64 for recognition API. */
  const exportImage = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const offscreen = document.createElement("canvas");
    offscreen.width = OUTPUT_SIZE;
    offscreen.height = OUTPUT_SIZE;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(canvas, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const imgData = ctx.getImageData(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = Math.round(gray);
    }
    ctx.putImageData(imgData, 0, 0);

    return offscreen.toDataURL("image/png").split(",")[1] ?? null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    onDrawChange?.(hasDrawn);
  }, [hasDrawn, onDrawChange]);

  useImperativeHandle(ref, () => ({
    exportImage,
    clear,
    getCanvas: () => canvasRef.current,
  }), [exportImage, clear]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className={cn(
          "touch-none rounded-xl border-2 border-border bg-white cursor-crosshair",
          disabled && "opacity-50 pointer-events-none"
        )}
        style={{ maxWidth: "100%", aspectRatio: "1" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <button
        type="button"
        onClick={clear}
        disabled={disabled}
        className="text-sm text-muted-foreground hover:text-foreground px-3 py-1 rounded-lg hover:bg-muted transition-colors"
      >
        Clear
      </button>
    </div>
  );
});
