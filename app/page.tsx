"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Volume2, Zap, BookOpen, ChevronRight, Gamepad2 } from "lucide-react";
import { getLessonProgress } from "@/lib/lessonProgress";
import { getAllCardStates } from "@/lib/storage";
import unitsData from "@/data/units.json";

const units = unitsData as Array<{ id: string; title: string; order: number }>;
const totalPhonemes = 52;

export default function HomePage() {
  const [stats, setStats] = useState({
    completedPhonemes: 0,
    completedUnits: 0,
    dueCount: 0,
  });
  useEffect(() => {
    const p = getLessonProgress();
    const cards = getAllCardStates();
    const due = cards.filter((s) => new Date(s.dueDate) <= new Date()).length;
    setStats({
      completedPhonemes: Object.values(p.completedPhonemes).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
      completedUnits: p.completedUnits.length,
      dueCount: due,
    });
  }, []);

  const totalUnits = units.length;

  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">
          Pāṇini
        </h1>
        <p className="text-muted-foreground text-sm">
          Sanskrit through its own grammar — pronunciation, roots, and rules
        </p>
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Your progress
          </h2>
          <span className="text-xs text-muted-foreground">Saved locally</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold">{stats.completedPhonemes}/{totalPhonemes}</p>
            <p className="text-xs text-muted-foreground">Phonemes learned</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold">{stats.completedUnits}/{totalUnits}</p>
            <p className="text-xs text-muted-foreground">Units done</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold">{stats.dueCount}</p>
            <p className="text-xs text-muted-foreground">Cards due</p>
          </div>
          <Link
            href="/learn/"
            className="rounded-xl border border-primary/50 bg-primary/10 p-4 flex items-center justify-between group hover:bg-primary/20"
          >
            <span className="text-sm font-medium">Continue</span>
            <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <Link
          href="/learn/"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold group-hover:text-primary">Pronunciation</h3>
            <p className="text-sm text-muted-foreground">
              Units, phoneme grid, guided lessons
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>

        <Link
          href="/drill"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold group-hover:text-primary">Drill</h3>
            <p className="text-sm text-muted-foreground">
              Anki-style practice · Learn → See → Hear
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>

        <Link
          href="/games"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold group-hover:text-primary">Śabdakrīḍā</h3>
            <p className="text-sm text-muted-foreground">
              Dhātu Dash, Sandhi Forge, Kāraka Web · Play to learn
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>

        <Link
          href="/learn/compression/"
          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold group-hover:text-primary">Grammar</h3>
            <p className="text-sm text-muted-foreground">
              Pratyāhāras, sandhi, roots, compounds
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </Link>
      </section>
    </div>
  );
}
