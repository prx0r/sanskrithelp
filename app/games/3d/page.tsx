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

const GAMES_3D = [
  { id: "dhatu-dash", href: "/games/3d/dhatu-dash", title: "Dhātu Dash", subtitle: "3D Platform Hopper", icon: Zap },
  { id: "dhatu-shooter", href: "/games/3d/dhatu-shooter", title: "Dhātu Shooter", subtitle: "3D Word Shooter", icon: Crosshair },
  { id: "sandhi-forge", href: "/games/3d/sandhi-forge", title: "Sandhi Forge", subtitle: "3D Junction Fusion", icon: Flame },
  { id: "karaka-web", href: "/games/3d/karaka-web", title: "Kāraka Web", subtitle: "3D Semantic Web", icon: Network },
  { id: "pratyaya-reactor", href: "/games/3d/pratyaya-reactor", title: "Pratyaya Reactor", subtitle: "3D Word Assembly", icon: Cog },
  { id: "vakya-builder", href: "/games/3d/vakya-builder", title: "Vākya Builder", subtitle: "3D Sentence Builder", icon: LayoutList },
  { id: "sabda-chain", href: "/games/3d/sabda-chain", title: "Śabda Chain", subtitle: "3D Word Chain", icon: Link2 },
];

export default function Games3DHubPage() {
  return (
    <div className="min-h-[80vh] py-6">
      <Link
        href="/games"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to 2D games
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Box className="w-8 h-8 text-amber-400" />
          <h1 className="font-display text-3xl font-bold">Śabdakrīḍā 3D</h1>
        </div>
        <p className="text-muted-foreground">
          Full 3D Sanskrit games — Three.js / React Three Fiber. Orbit, zoom, explore.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES_3D.map((g) => (
          <Link
            key={g.id}
            href={g.href}
            className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <g.icon className="w-6 h-6 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold group-hover:text-amber-200">
                {g.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{g.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
