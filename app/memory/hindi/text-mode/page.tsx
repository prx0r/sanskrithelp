"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2 } from "lucide-react";
import { decompileHindi } from "@/lib/memory/hindiDecompile";
import SpeakScore from "@/components/SpeakScore";

type Segment = {
  sutra: string;
  sanskrit: string;
  iast: string;
  hindi_simple: string;
  construction: string;
  unit_id: string;
};

export default function HindiTextModePage() {
  const [segs, setSegs] = useState<Segment[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/memory/hindi/osho-shiv-sutra-01.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then((j) => setSegs(j.segments ?? []))
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/memory/hindi"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Hindi Wheels
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-1">
          Text Mode — Śiva Sūtra via Osho Hindi
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          Dataset Zero: one Sanskrit nucleus → Osho&apos;s Hindi paraphrase →
          grammatical construction → you rebuild it. Osho teaches Hindi here, not
          Trika authority — doctrine stays with Lakshmanjoo/Abhinavagupta.
        </p>
        <p className="text-muted-foreground text-sm max-w-3xl mt-2">
          Audio: Talk 01 streams from Osho World (~40MB, range-capable). Local
          download: <code>python3 scripts/hindi/download_osho.py 01</code>{" "}
          (gitignored, never shipped). Full-transcript alignment is pending — below
          are verified anchors only.
        </p>
      </div>

      {err ? (
        <p className="text-sm text-red-400">Could not load anchors: {err}</p>
      ) : null}

      <div className="grid gap-4">
        {segs.map((s) => {
          const d = decompileHindi(s.hindi_simple);
          return (
            <div
              key={s.unit_id}
              className="p-5 rounded-xl border border-border bg-card"
            >
              <p className="text-xs text-muted-foreground mb-1">
                Śiva Sūtra {s.sutra} · {s.unit_id}
              </p>
              <p className="font-display text-3xl mb-1">{s.sanskrit}</p>
              <p className="text-sm text-muted-foreground mb-3">{s.iast}</p>
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 mb-3">
                <p className="text-lg">{s.hindi_simple}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Construction: <code>{s.construction}</code> · frame=
                  {d.frameId ?? "∅"} · verb={d.verbId ?? "∅"} · unknowns=
                  {d.unknown.length ? d.unknown.join(" / ") : "none"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <a
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-accent"
                  href="https://oshoworld.com/wp-content/uploads/2020/11/Hindi%20Audio/OSHO-Shiv_Sutra_01.mp3"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Volume2 className="w-4 h-4" /> Stream Talk 01
                </a>
                <Link
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground"
                  href="/memory/hindi"
                >
                  Decompile in wheels →
                </Link>
              </div>
              <SpeakScore target={s.hindi_simple} context={s.unit_id} />
            </div>
          );
        })}
      </div>

      <section className="mt-6 p-4 rounded-xl border border-border bg-card text-sm text-muted-foreground">
        <strong className="text-foreground">Rebuild drill:</strong> cover the Hindi,
        keep only <code>इस सूत्र का अर्थ है कि ___ ही ___ है।</code> — produce the
        sentence, then uncover and replay. That machine (
        <code>X-kaa-arth-hai-ki-Y</code>) is your first Osho island.
      </section>
    </div>
  );
}
