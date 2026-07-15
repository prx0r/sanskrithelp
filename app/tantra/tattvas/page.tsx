"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import tattvasData from "@/data/tattvas.json";

const CATEGORIES = [
  { key: "pure", label: "Pure Path (Śuddha)", range: "1–5", color: "text-purple-300", bg: "bg-purple-950/20 border-purple-800/30" },
  { key: "threshold", label: "The Threshold (Māyā)", range: "6", color: "text-violet-300", bg: "bg-violet-950/20 border-violet-800/30" },
  { key: "kañcuka", label: "The Coverings (Kañcukas)", range: "7–11", color: "text-rose-300", bg: "bg-rose-950/20 border-rose-800/30" },
  { key: "mixed", label: "Pure-Impure (Śuddhāśuddha)", range: "12–16", color: "text-amber-300", bg: "bg-amber-950/20 border-amber-800/30" },
  { key: "sense", label: "Senses (Buddhindriyas)", range: "17–21", color: "text-cyan-300", bg: "bg-cyan-950/20 border-cyan-800/30" },
  { key: "action", label: "Actions (Karmendriyas)", range: "22–26", color: "text-orange-300", bg: "bg-orange-950/20 border-orange-800/30" },
  { key: "subtle", label: "Subtle Objects (Tanmātras)", range: "27–31", color: "text-pink-300", bg: "bg-pink-950/20 border-pink-800/30" },
  { key: "element", label: "Gross Elements (Mahābhūtas)", range: "32–36", color: "text-green-300", bg: "bg-green-950/20 border-green-800/30" },
];

const CAT_COLORS: Record<string, string> = {
  pure: "#a78bfa", threshold: "#a855f7", kañcuka: "#f43f5e",
  mixed: "#f59e0b", sense: "#22d3ee", action: "#f97316",
  subtle: "#ec4899", element: "#22c55e",
};

export default function TattvasPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!filterCat) return tattvasData;
    return tattvasData.filter((t: any) => t.category === filterCat);
  }, [filterCat]);

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    CATEGORIES.forEach(c => groups[c.key] = []);
    tattvasData.forEach((t: any) => {
      if (groups[t.category]) groups[t.category].push(t);
    });
    return groups;
  }, []);

  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/tantra"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tantra
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">36 Tattvas</h1>
        <p className="text-muted-foreground text-sm">
          The complete ladder of consciousness — from Śiva (pure awareness) to Pṛthivī (solid earth)
        </p>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterCat(null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            !filterCat ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          All
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setFilterCat(c.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              filterCat === c.key
                ? "border-primary bg-primary/20 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Compact category summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
        {CATEGORIES.map(c => (
          <div key={c.key} className={`rounded-lg border p-3 ${c.bg}`}>
            <div className={`text-xs font-semibold ${c.color}`}>{c.label}</div>
            <div className="text-xs text-muted-foreground/70">Tattvas {c.range}</div>
            <div className="text-xs text-muted-foreground/50 mt-1">
              {grouped[c.key]?.length || 0} principles
            </div>
          </div>
        ))}
      </div>

      {/* Tattva list */}
      <div className="space-y-2">
        {filtered.map((t: any) => {
          const cat = CATEGORIES.find(c => c.key === t.category);
          const isOpen = expanded === t.id;

          return (
            <div
              key={t.id}
              className={`rounded-xl border transition-all ${
                isOpen ? "border-primary/40 bg-card" : "border-border bg-card/50 hover:border-border/80"
              }`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : t.id)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: t.color + "30", color: t.color }}
                >
                  {t.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg" style={{ color: t.color }}>
                      {t.iast}
                    </span>
                    <span className="text-lg text-muted-foreground/60 font-devanagari">
                      {t.sanskrit}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">{t.english}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cat && <span className={`text-[10px] ${cat.color}`}>{cat.label.split(" ")[0]}</span>}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-border/50 mt-0">
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p className="leading-relaxed">{t.description}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                      {t.cakra !== "—" && t.cakra && (
                        <div className="rounded-lg bg-background p-2.5">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Cakra</div>
                          <div className="font-medium mt-0.5">{t.cakra}</div>
                        </div>
                      )}
                      {t.bodyLocation !== "—" && (
                        <div className="rounded-lg bg-background p-2.5">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Body</div>
                          <div className="font-medium mt-0.5">{t.bodyLocation}</div>
                        </div>
                      )}
                      {t.mātṛkāRow !== "—" && (
                        <div className="rounded-lg bg-background p-2.5">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Mātṛkā Row</div>
                          <div className="font-medium mt-0.5 text-emerald-400">{t.mātṛkāRow}</div>
                        </div>
                      )}
                      {t.bīja !== "—" && (
                        <div className="rounded-lg bg-background p-2.5">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Bīja</div>
                          <div className="font-medium mt-0.5 text-amber-400">{t.bīja}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
