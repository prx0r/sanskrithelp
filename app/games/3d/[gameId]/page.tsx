"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const DhatuDash3D = dynamic(
  () => import("@/components/games3d/DhatuDash3D").then((m) => ({ default: m.DhatuDash3D })),
  { ssr: false }
);
const DhatuShooter3D = dynamic(
  () => import("@/components/games3d/DhatuShooter3D").then((m) => ({ default: m.DhatuShooter3D })),
  { ssr: false }
);
const SandhiForge3D = dynamic(
  () => import("@/components/games3d/SandhiForge3D").then((m) => ({ default: m.SandhiForge3D })),
  { ssr: false }
);
const KarakaWeb3D = dynamic(
  () => import("@/components/games3d/KarakaWeb3D").then((m) => ({ default: m.KarakaWeb3D })),
  { ssr: false }
);
const VakyaBuilder3D = dynamic(
  () => import("@/components/games3d/VakyaBuilder3D").then((m) => ({ default: m.VakyaBuilder3D })),
  { ssr: false }
);
const PratyayaReactor3D = dynamic(
  () => import("@/components/games3d/PratyayaReactor3D").then((m) => ({ default: m.PratyayaReactor3D })),
  { ssr: false }
);
const SabdaChain3D = dynamic(
  () => import("@/components/games3d/SabdaChain3D").then((m) => ({ default: m.SabdaChain3D })),
  { ssr: false }
);

const GAMES: Record<string, { component: React.ComponentType; title: string }> = {
  "dhatu-dash": { component: DhatuDash3D, title: "Dhātu Dash 3D" },
  "dhatu-shooter": { component: DhatuShooter3D, title: "Dhātu Shooter 3D" },
  "sandhi-forge": { component: SandhiForge3D, title: "Sandhi Forge 3D" },
  "karaka-web": { component: KarakaWeb3D, title: "Kāraka Web 3D" },
  "vakya-builder": { component: VakyaBuilder3D, title: "Vākya Builder 3D" },
  "pratyaya-reactor": { component: PratyayaReactor3D, title: "Pratyaya Reactor 3D" },
  "sabda-chain": { component: SabdaChain3D, title: "Śabda Chain 3D" },
};

export default function Game3DPage() {
  const params = useParams();
  const gameId = (params?.gameId as string) || "";
  const game = GAMES[gameId];

  if (!game) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Game not found</p>
        <Link href="/games/3d" className="text-primary hover:underline">
          ← Back to 3D games
        </Link>
      </div>
    );
  }

  const GameComponent = game.component;

  return (
    <div className="min-h-[80vh] py-6">
      <Link
        href="/games/3d"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All 3D games
      </Link>

      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold">{game.title}</h1>
      </div>

      <div className="rounded-xl overflow-hidden">
        <GameComponent />
      </div>
    </div>
  );
}
