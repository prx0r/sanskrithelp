"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Headphones } from "lucide-react";

const TEXTS = [
  {
    slug: "pratyabhijna_hrdayam",
    title: "Pratyabhijñāhṛdayam",
    subtitle: "The Heart of Self-Recognition",
    sutras: 20,
    author: "Kṣemarāja",
  },
  {
    slug: "siva_sutras",
    title: "Śiva Sūtras",
    subtitle: "Aphorisms of Śiva",
    sutras: 77,
    author: "Vasugupta",
  },
  {
    slug: "vijnanabhairava",
    title: "Vijñānabhairava",
    subtitle: "Divine Consciousness — 112 types of Yoga",
    sutras: 112,
    author: "attributed to Śiva",
  },
  {
    slug: "spanda_karikas",
    title: "Spanda Kārikās",
    subtitle: "Vibratory Reality",
    sutras: 53,
    author: "Vasugupta / Kallata",
  },
];

export default function ReadingsPage() {
  return (
    <div className="min-h-[80vh] py-6">
      <Link
        href="/content"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Content
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Readings</h1>
        <p className="text-muted-foreground mb-4">
          Kashmir Shaivism texts — Sanskrit + English audio in three modes:
          Sanskrit only, Parallel (Sanskrit → pause → English), English only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEXTS.map((t) => (
          <Link
            key={t.slug}
            href={`/content/readings/${t.slug}`}
            className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold group-hover:text-primary">
                {t.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.subtitle} — {t.sutras} verses
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                {t.author}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
