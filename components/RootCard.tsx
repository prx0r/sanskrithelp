"use client";

import { cn } from "@/lib/utils";
import type { LinguisticNode } from "@/lib/types";
import type { DerivedForm } from "@/lib/types";
import { Sprout, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  verb: "border-amber-500/50 bg-amber-500/10 text-amber-200",
  "abstract noun": "border-violet-400/50 bg-violet-500/10 text-violet-200",
  participle: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200",
  gerundive: "border-rose-500/50 bg-rose-500/10 text-rose-200",
  "agent noun": "border-cyan-500/50 bg-cyan-500/10 text-cyan-200",
  adjective: "border-amber-400/50 bg-amber-400/10 text-amber-200",
};


interface RootCardProps {
  dhatu: LinguisticNode;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

/** Visual root shape - organic taproot with lateral roots */
function RootShape({ uniqueId }: { uniqueId: string }) {
  return (
    <svg
      viewBox="0 0 120 100"
      className="absolute bottom-0 left-0 right-0 h-[90px] text-amber-700/40"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id={`rootGrad-${uniqueId}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Taproot */}
      <path
        d="M 60 100 C 58 70 62 40 60 15"
        fill="none"
        stroke={`url(#rootGrad-${uniqueId})`}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Lateral roots - left */}
      <path
        d="M 60 75 Q 25 70 5 55"
        fill="none"
        stroke={`url(#rootGrad-${uniqueId})`}
        strokeWidth="2.5"
      />
      <path d="M 60 55 Q 20 48 8 28" fill="none" stroke={`url(#rootGrad-${uniqueId})`} strokeWidth="2" />
      <path d="M 60 35 Q 35 30 22 12" fill="none" stroke={`url(#rootGrad-${uniqueId})`} strokeWidth="1.5" />
      {/* Lateral roots - right */}
      <path
        d="M 60 75 Q 95 70 115 55"
        fill="none"
        stroke={`url(#rootGrad-${uniqueId})`}
        strokeWidth="2.5"
      />
      <path d="M 60 55 Q 100 48 112 28" fill="none" stroke={`url(#rootGrad-${uniqueId})`} strokeWidth="2" />
      <path d="M 60 35 Q 85 30 98 12" fill="none" stroke={`url(#rootGrad-${uniqueId})`} strokeWidth="1.5" />
    </svg>
  );
}

export function RootCard({ dhatu, expanded = false, onToggle, className }: RootCardProps) {
  const derivedForms = (dhatu.derivedForms ?? []) as DerivedForm[];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-violet-500/30 bg-violet-950/40 backdrop-blur-sm",
        "transition-all duration-300",
        expanded && "ring-2 ring-amber-500/40 shadow-xl shadow-violet-950/50",
        className
      )}
    >
      {/* Soil/earth base with root graphic */}
      <div className="relative min-h-[140px] px-6 py-6 flex flex-col">
        <div className="absolute bottom-0 left-0 right-0 opacity-40">
          <RootShape uniqueId={dhatu.id} />
        </div>

        {/* Root glyph - the literal root emerging from earth */}
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="font-display text-6xl text-amber-100 drop-shadow-[0_0_12px_rgba(232,181,74,0.3)]">
                {dhatu.devanagari}
              </span>
              <span className="font-mono text-sm text-amber-400/90 mt-1">√{dhatu.iast}</span>
            </div>
            <div>
              <p className="font-display text-lg text-violet-100">{dhatu.meaning}</p>
              <p className="text-sm text-violet-400/80 mt-1">Gaṇa {dhatu.gana}</p>
              {dhatu.ieCognates && dhatu.ieCognates.length > 0 && (
                <p className="text-xs text-violet-500/70 mt-2">
                  IE: {dhatu.ieCognates.slice(0, 2).join(", ")}
                </p>
              )}
            </div>
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-violet-500/20 text-amber-400/80 transition-colors touch-target"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Derived words - branches growing from the root */}
      {expanded && derivedForms.length > 0 && (
        <div className="relative border-t border-violet-500/20 bg-violet-950/60 px-6 py-5">
          <h4 className="flex items-center gap-2 text-sm font-medium text-amber-400/90 mb-4">
            <Sprout className="w-4 h-4" />
            Words from this root
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {derivedForms.map((df, i) => (
              <div
                key={df.form}
                className={cn(
                  "rounded-xl border p-4 transition-transform hover:scale-[1.02]",
                  CATEGORY_COLORS[df.category] ?? "border-violet-400/40 bg-violet-500/10 text-violet-200"
                )}
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-display text-2xl">{df.devanagari}</span>
                  <span className="font-mono text-sm opacity-80">{df.form}</span>
                </div>
                <p className="text-sm mt-2 opacity-90">{df.meaning}</p>
                <p className="text-xs mt-1 opacity-70 font-mono">{df.suffix}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
