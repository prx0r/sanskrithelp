"use client";

import Link from "next/link";
import { ArrowLeft, Volume2, Volume1, Languages } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const TEXT_META: Record<
  string,
  { title: string; subtitle: string; slug: string }
> = {
  pratyabhijna_hrdayam: {
    title: "Pratyabhijñāhṛdayam",
    subtitle: "The Heart of Self-Recognition",
    slug: "pratyabhijna_hrdayam",
  },
  siva_sutras: {
    title: "Śiva Sūtras",
    subtitle: "Aphorisms of Śiva",
    slug: "siva_sutras",
  },
  vijnanabhairava: {
    title: "Vijñānabhairava",
    subtitle: "Divine Consciousness",
    slug: "vijnanabhairava",
  },
  spanda_karikas: {
    title: "Spanda Kārikās",
    subtitle: "Vibratory Reality",
    slug: "spanda_karikas",
  },
};

type Unit = {
  id: string;
  sequence: number;
  devanagari: string;
  iast: string;
  english: string;
  source?: string;
};

function UnitCard({
  unit,
  slug,
  baseUrl,
}: {
  unit: Unit;
  slug: string;
  baseUrl: string;
}) {
  const audioBase = `${baseUrl}/${slug}/audio`;
  const [playing, setPlaying] = useState<string | null>(null);

  const play = (mode: string) => {
    const src = `${audioBase}/${unit.id}_${mode}.mp3`;
    const audio = new Audio(src);
    setPlaying(mode);
    audio.play();
    audio.onended = () => setPlaying(null);
    audio.onerror = () => setPlaying(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground mb-1">
            Sūtra {unit.sequence}
          </p>
          <p
            className="text-xl font-devanagari mb-2"
            style={{ fontFamily: "var(--font-devanagari), serif" }}
          >
            {unit.devanagari}
          </p>
          <p className="text-sm text-muted-foreground italic">{unit.iast}</p>
          <p className="text-sm mt-2 text-foreground">{unit.english}</p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => play("sa")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent text-sm"
            title="Sanskrit only"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">Skt</span>
          </button>
          <button
            onClick={() => play("parallel")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary bg-primary/10 hover:bg-primary/20 text-sm"
            title="Sanskrit → English"
          >
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">Both</span>
          </button>
          <button
            onClick={() => play("en")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent text-sm"
            title="English only"
          >
            <Volume1 className="w-4 h-4" />
            <span className="hidden sm:inline">En</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReadingTextPage() {
  const params = useParams();
  const slug = (params?.slug as string) ?? "";
  const meta = slug ? TEXT_META[slug] : null;
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meta) return;
    const url = `/content/readings/${meta.slug}/units.json`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not found"))))
      .then(setUnits)
      .catch((e) => setError(e.message));
  }, [meta?.slug]);

  if (!meta) {
    return (
      <div className="py-6">
        <p>Text not found.</p>
        <Link href="/content/readings" className="text-primary underline">
          Back to Readings
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-6">
      <Link
        href="/content/readings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Readings
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-1">{meta.title}</h1>
        <p className="text-muted-foreground">{meta.subtitle}</p>
      </div>

      {error && (
        <p className="text-amber-600 dark:text-amber-400 mb-4">
          Units not loaded: {error}. Run{" "}
          <code className="bg-muted px-1 rounded">
            python scripts/readings/fetch_pratyabhijna.py
          </code>{" "}
          for Pratyabhijñāhṛdayam.
        </p>
      )}

      {units && units.length > 0 ? (
        <div className="space-y-4">
          {units.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              slug={meta.slug}
              baseUrl="/content/readings"
            />
          ))}
        </div>
      ) : units?.length === 0 ? (
        <p className="text-muted-foreground">No units yet.</p>
      ) : (
        <p className="text-muted-foreground">Loading units…</p>
      )}

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-2">Audio modes</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            <strong className="text-foreground">Skt</strong> — Sanskrit only
            (indic-parler)
          </li>
          <li>
            <strong className="text-foreground">Both</strong> — Sanskrit → 1.2s
            pause → English (parallel)
          </li>
          <li>
            <strong className="text-foreground">En</strong> — English only
            (Kokoro)
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          Generate audio with{" "}
          <code className="bg-muted px-1 rounded">
            python scripts/readings/generate_audio.py --text {meta.slug}
          </code>
        </p>
      </div>
    </div>
  );
}
