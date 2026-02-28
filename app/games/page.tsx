"use client";

import Link from "next/link";
import {
  Zap,
  Crosshair,
  Flame,
  Network,
  Cog,
  LayoutList,
  Link2,
  ArrowLeft,
  Box,
} from "lucide-react";

const GAMES = [
  {
    href: "/games/3d/dhatu-dash",
    title: "Dhātu Dash",
    subtitle: "3D Platform Hopper",
    desc: "Hop between word platforms. Spring physics, particle bursts, drifting ambient field. Build intuition through play.",
    icon: Zap,
  },
  {
    href: "/games/dhatu-shooter",
    title: "Dhātu Shooter",
    subtitle: "Root + Shoot",
    desc: "Root flashes at top. Shoot the words that belong to it as they fly across the screen.",
    icon: Crosshair,
  },
  {
    href: "/games/sandhi-forge",
    title: "Sandhi Forge",
    subtitle: "Junction prediction",
    desc: "Phonemes collide. Predict the output. deva + indra = ?",
    icon: Flame,
  },
  {
    href: "/games/karaka-web",
    title: "Kāraka Web",
    subtitle: "Semantic slots",
    desc: "Drag nominals to kāraka slots. Meaning before morphology.",
    icon: Network,
  },
  {
    href: "/games/pratyaya-reactor",
    title: "Pratyaya Reactor",
    subtitle: "Word assembly",
    desc: "Root + suffix → word. Assemble or disassemble.",
    icon: Cog,
  },
  {
    href: "/games/vakya-builder",
    title: "Vākya Builder",
    subtitle: "Sentence builder",
    desc: "Arrange word-tokens into grammatically complete sentences.",
    icon: LayoutList,
  },
  {
    href: "/games/sabda-chain",
    title: "Śabda Chain",
    subtitle: "Word network",
    desc: "Connect words by shared root, suffix, or prefix. Build the chain.",
    icon: Link2,
  },
];

export default function GamesHubPage() {
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
        <h1 className="font-display text-3xl font-bold mb-1">Śabdakrīḍā</h1>
        <p className="text-muted-foreground mb-4">
          Sanskrit games — one generative rule, explored through play
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/games/3d/dhatu-dash"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-500/50 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 transition-colors font-medium"
          >
            <Zap className="w-4 h-4" />
            Play Dhātu Dash — 3D (alive!)
          </Link>
          <Link
            href="/games/3d"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors"
          >
            <Box className="w-4 h-4" />
            All 3D games
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <g.icon className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold group-hover:text-primary">
                {g.title}
                <span className="text-muted-foreground font-normal text-sm ml-1">
                  — {g.subtitle}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{g.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
