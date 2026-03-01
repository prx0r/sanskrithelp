"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Logically grouped: Practice first, then Grammar in order
const PRACTICE_OPTIONS = [
  { href: "/learn/pronunciation", label: "Śabdakrīḍā", sub: "Speak Sanskrit, get AI feedback" },
  { href: "/learn/tutor", label: "Structured Tutor", sub: "Pathways with assessment" },
  { href: "/learn/", label: "Phoneme Drills", sub: "Unit-by-unit pronunciation" },
  { href: "/drill", label: "Daily Review", sub: "Spaced repetition (Anki-style)" },
];

const GRAMMAR_OPTIONS = [
  { href: "/learn/compression/", label: "1. Pratyāhāras", sub: "Sound-class codes" },
  { href: "/learn/phonetics/", label: "2. Phoneme Grid", sub: "Vowels & consonants" },
  { href: "/learn/gradation/", label: "3. Guṇa / Vṛddhi", sub: "Vowel gradation" },
  { href: "/learn/sandhi/", label: "4. Sandhi", sub: "Sound changes at boundaries" },
  { href: "/learn/roots/", label: "5. Dhātus", sub: "Verbal roots" },
  { href: "/learn/words/", label: "6. Words", sub: "Vocabulary" },
  { href: "/learn/suffixes/", label: "7. Suffixes", sub: "Kṛt & taddhita" },
  { href: "/learn/karakas/", label: "8. Kārakas", sub: "Semantic roles" },
  { href: "/learn/verbs/", label: "9. Verbs", sub: "Conjugation" },
  { href: "/learn/compounds/", label: "10. Compounds", sub: "Samāsa" },
  { href: "/learn/reading/", label: "11. Reading", sub: "Graded texts" },
];

interface LearnOverlayProps {
  open: boolean;
  onClose: () => void;
}

function OptionCard({
  opt,
  path,
  onClose,
}: {
  opt: { href: string; label: string; sub: string };
  path: string;
  onClose: () => void;
}) {
  const isLearnHub = opt.href === "/learn/";
  const isActive = isLearnHub
    ? path === "/learn" || path === "/learn/"
    : path === opt.href || (opt.href !== "/" && path.startsWith(opt.href));
  return (
    <Link
      href={opt.href}
      onClick={onClose}
      className={cn(
        "block p-4 rounded-xl border text-left transition-colors",
        isActive ? "border-primary bg-primary/10" : "border-border hover:bg-accent/50"
      )}
    >
      <span className="font-medium block">{opt.label}</span>
      <span className="text-xs text-muted-foreground">{opt.sub}</span>
    </Link>
  );
}

export function LearnOverlay({ open, onClose }: LearnOverlayProps) {
  const path = usePathname() ?? "/";

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] z-50 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold">Learn</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent touch-target"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Practice
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {PRACTICE_OPTIONS.map((opt) => (
                <OptionCard key={opt.href} opt={opt} path={path} onClose={onClose} />
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Grammar (in order)
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {GRAMMAR_OPTIONS.map((opt) => (
                <OptionCard key={opt.href} opt={opt} path={path} onClose={onClose} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
