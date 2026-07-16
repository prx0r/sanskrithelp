"use client";

import Link from "next/link";
import { ArrowLeft, Layers, CircleDot, Wind, BookMarked, MessageSquare, Flame } from "lucide-react";

const SECTIONS = [
  {
    href: "/tantra/tattvas",
    title: "36 Tattvas Explorer",
    subtitle: "The complete ladder of consciousness",
    desc: "Explore all 36 principles of manifestation from Śiva to Earth — with colors, body locations, cakra mappings, and Mātṛkā correspondences.",
    icon: Layers,
  },
  {
    href: "/tantra/matrika",
    title: "Mātṛkā → Cakra Grid",
    subtitle: "Sounding the 50 phonemes through the body",
    desc: "Chant each row of the Mātṛkā at its corresponding cakra. The dental row (ta tha da dha na) is the green core — the heart center.",
    icon: CircleDot,
  },
  {
    href: "/tantra/practice",
    title: "Layayoga Breath Practice",
    subtitle: "Nāḍī Śodhana, 1:4:2 ratio, and the 5 voids",
    desc: "Breath techniques from the Tantraloka tradition — balance iḍā and piṅgalā, enter suṣumṇā, and dissolve through the tattvas.",
    icon: Wind,
  },
  {
    href: "/tantra/practice-log",
    title: "Practice Log",
    subtitle: "Track your daily sadhana",
    desc: "Log Mātṛkā chanting, breath practice, VB sessions, or meditation. The AI tutor sees your recent practice and adapts its guidance.",
    icon: Flame,
    external: false,
  },
  {
    href: "/tantra/chat",
    title: "Tantra Chat",
    subtitle: "Ask anything about Kashmir Shaivism",
    desc: "Ask about the Tantraloka, 36 tattvas, Mātṛkā phonemes, Layayoga, or Vijñāna Bhairava — answers with Sanskrit terms and textual references.",
    icon: MessageSquare,
    external: false,
  },
  {
    href: "https://prx0r.github.io/meditate/layayoga_meditate.html",
    title: "Layayoga Breath Companion",
    subtitle: "Standalone Layayoga practice timer",
    desc: "Animated breath visualizer with Nāḍī Śodhana, bīja mantra timer, the 5 voids, and complete practice sequence — ring visualization, instructions, and timer in one page.",
    icon: BookMarked,
    external: true,
  },
];

export default function TantraPage() {
  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pāṇini
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">Tantra Practice</h1>
        <p className="text-muted-foreground text-sm">
          Kashmir Shaivism practice tools — the 36 tattvas, Mātṛkā chanting, and Layayoga breath work
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((item) => {
          const content = (
            <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group h-full">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground/80 mt-0.5 font-medium">
                  {item.subtitle}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.desc}
                </p>
              </div>
            </div>
          );

          if (item.external) {
            return <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">{content}</a>;
          }
          return <Link key={item.href} href={item.href}>{content}</Link>;
        })}
      </div>

      <div className="mt-12 rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-6">
        <h2 className="text-lg font-semibold text-emerald-300 mb-2 flex items-center gap-2">
          <span>🜍</span> The Green Core
        </h2>
        <p className="text-sm text-emerald-200/70 leading-relaxed">
          The center of the tetrahedron — Anāhata cakra at 550 nm — is the heart center where all frequencies balance.
          The dental row of the Mātṛkā (ta tha da dha na) vibrates at this center. When lost, return here.
          This IS the practice: find the contraction, chant the row, let the sound dissolve it.
        </p>
      </div>
    </div>
  );
}
