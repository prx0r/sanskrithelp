"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Mouth cross-section (source.txt): right=soft palate, left=lips. Devanagari shaded by articulation. */
type Place = "velar" | "palatal" | "retroflex" | "dental" | "labial" | "other";

// Greyscale: labial=lightest, velar=darkest
const PLACE_COLOR: Record<Place, string> = {
  labial: "#fafafa",
  dental: "#a3a3a3",
  retroflex: "#737373",
  palatal: "#404040",
  velar: "#171717",
  other: "#525252",
};

/** Sagittal mouth diagram - simplified vocal tract */
function MouthSection({ gradId }: { gradId: string }) {
  return (
    <svg viewBox="0 0 120 70" className="w-full" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fafafa" />
          <stop offset="25%" stopColor="#a3a3a3" />
          <stop offset="50%" stopColor="#737373" />
          <stop offset="75%" stopColor="#404040" />
          <stop offset="100%" stopColor="#171717" />
        </linearGradient>
      </defs>
      {/* Vocal tract outline - lips left, soft palate right */}
      <path
        d="M 10 35 Q 25 25 45 32 Q 70 38 95 35 Q 108 32 112 38 L 112 48 Q 108 58 90 58 Q 55 58 20 55 Q 8 52 10 42 Z"
        fill={`url(#${gradId})`}
        stroke="#525252"
        strokeWidth="1.5"
      />
      {/* Labels */}
      <text x="8" y="52" fontSize="8" fill="#737373">lips</text>
      <text x="100" y="42" fontSize="8" fill="#737373">soft palate</text>
    </svg>
  );
}

export function ArticulationDiagram({
  place,
  devanagari,
  className,
  size = 96,
}: {
  place: Place;
  devanagari?: string;
  className?: string;
  size?: number;
}) {
  const active = place !== "other";
  const fill = PLACE_COLOR[place];
  const uid = useId().replace(/\W/g, "");

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Devanagari shaded by articulation place */}
      {devanagari && (
        <div
          className="text-4xl font-serif flex items-center justify-center mb-1"
          style={{ color: fill }}
          aria-hidden
        >
          {devanagari}
        </div>
      )}
      {/* Mouth cross-section */}
      <div style={{ width: size, height: size * 0.6 }}>
        <MouthSection gradId={`mouth-grad-${uid}`} />
      </div>
      {active && (
        <span className="text-xs text-muted-foreground mt-1">{place}</span>
      )}
    </div>
  );
}
