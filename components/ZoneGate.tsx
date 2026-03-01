"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { isZoneTutorUnlocked, markZoneComplete } from "@/lib/zoneProgress";
import { cn } from "@/lib/utils";

interface ZoneGateProps {
  zoneId: string;
  className?: string;
}

/** Gate: show "Mark complete" if tutor locked, or link to tutor if unlocked. */
export function ZoneGate({ zoneId, className }: ZoneGateProps) {
  const [unlocked, setUnlocked] = useState(isZoneTutorUnlocked(zoneId));

  // Phonetics: unlock = complete all 9 phoneme units (lessonProgress), not "mark complete"
  if (zoneId === "phonetics") {
    if (unlocked) {
      return (
        <Link
          href={`/learn/tutor?zone=${zoneId}`}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors",
            className
          )}
        >
          <MessageCircle className="w-4 h-4" />
          Ask the AI tutor
        </Link>
      );
    }
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>
        Complete all 9 phoneme units to unlock tutor
      </span>
    );
  }

  if (unlocked) {
    return (
      <Link
        href={`/learn/tutor?zone=${zoneId}`}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors",
          className
        )}
      >
        <MessageCircle className="w-4 h-4" />
        Ask the AI tutor
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        markZoneComplete(zoneId);
        setUnlocked(true);
      }}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm",
        className
      )}
    >
      <CheckCircle2 className="w-4 h-4" />
      I&apos;ve read this — unlock tutor
    </button>
  );
}
