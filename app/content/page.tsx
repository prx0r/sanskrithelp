"use client";

import Link from "next/link";
import { BookMarked, ArrowLeft, BookOpen, Headphones } from "lucide-react";

const CONTENT_ITEMS = [
  {
    href: "/content/readings",
    title: "Readings",
    subtitle: "Kashmir Shaivism texts",
    desc: "Pratyabhijñāhṛdayam, Śiva Sūtras, Vijñānabhairava, Spanda Kārikās — Sanskrit + English audio in three modes.",
    icon: Headphones,
  },
];

export default function ContentPage() {
  return (
    <div className="min-h-[80vh] py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pāṇini
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Content</h1>
        <p className="text-muted-foreground mb-4">
          Kashmir Shaivism texts with Sanskrit and English audio
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CONTENT_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <item.icon className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold group-hover:text-primary">
                {item.title}
                <span className="text-muted-foreground font-normal text-sm ml-1">
                  — {item.subtitle}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
