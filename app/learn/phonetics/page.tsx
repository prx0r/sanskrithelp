"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import phonemesData from "@/data/phonemes.json";
import { PhonemeGrid } from "@/components/PhonemeGrid";
import { PronunciationDrill } from "@/components/PronunciationDrill";
import type { Phoneme } from "@/lib/types";

const phonemes = phonemesData as Phoneme[];

const PLACE_DESC: Record<string, { name: string; desc: string }> = {
  velar: { name: "Soft palate", desc: "Stop air at the soft palate (back of mouth) using the base of the tongue." },
  palatal: { name: "Hard palate", desc: "Stop air at the hard palate (bony region) using the middle of the tongue." },
  retroflex: { name: "Retroflex", desc: "Stop air behind the bony bump on the roof of the mouth. Tip of tongue bends backward." },
  dental: { name: "Teeth", desc: "Stop air at the base of the top teeth using the tip of the tongue." },
  labial: { name: "Lips", desc: "Stop air with the lips. No tongue involved." },
};

const MANNER_DESC: Record<string, { name: string; desc: string }> = {
  unvoiced_stop: { name: "Unvoiced stop", desc: "Block airflow completely, then release. No vocal-cord vibration. Like 'p' in 'pin' or 'k' in 'kick'." },
  unvoiced_aspirate: { name: "Unvoiced aspirate", desc: "Same as unvoiced stop, but with a strong burst of breath (aspiration) on release. Like 'ph' in 'uphill' or Sanskrit ख (kha)." },
  voiced_stop: { name: "Voiced stop", desc: "Block airflow, then release. Vocal cords vibrate. Like 'b' in 'bin' or 'g' in 'give'." },
  voiced_aspirate: { name: "Voiced aspirate", desc: "Voiced stop plus a burst of breath. Like 'bh' in 'abhorrent' or Sanskrit घ (gha)." },
  nasal: { name: "Nasal", desc: "Block the mouth, let air escape through the nose. Like 'm', 'n', or Sanskrit ङ (ṅa)." },
};

export default function PhoneticsPage() {
  const [selected, setSelected] = useState<Phoneme | null>(null);
  const pd = selected?.place && PLACE_DESC[selected.place] ? PLACE_DESC[selected.place] : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Stops and Nasals</h1>
        <p className="text-muted-foreground">
          Tap any cell to hear it. Select one to practice: hear original, record yourself, compare side by side.
        </p>
      </div>

      {/* Explainer: Place & Manner */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold">Understanding Place & Manner</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-primary mb-2">Place (where)</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Five points of pronunciation, back → front:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><span className="text-rose-600/80 font-medium">Soft palate</span> — fleshy region at the very back</li>
                <li><span className="text-amber-600/80 font-medium">Hard palate</span> — bony region on top</li>
                <li><span className="text-yellow-500/80 font-medium">Retroflex</span> — behind the hard bump (alveolar ridge)</li>
                <li><span className="text-emerald-600/80 font-medium">Teeth</span> — base of the upper teeth</li>
                <li><span className="text-sky-600/80 font-medium">Lips</span> — outer boundary of the mouth</li>
              </ul>
            </div>
            <div>
              <div className="relative aspect-[4/3] max-h-56 overflow-hidden">
                <Image
                  src="/images/pronunciation-points.png"
                  alt="Sagittal view of mouth and throat showing five articulation points: pharynx (red), soft palate (orange), hard palate (gold), alveolar ridge (green), lips (blue)."
                  fill
                  className="object-contain object-top"
                  unoptimized
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-primary mb-2">Manner (how)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              For each place, Sanskrit has four stops and one nasal:
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
              {(["unvoiced_stop", "unvoiced_aspirate", "voiced_stop", "voiced_aspirate", "nasal"] as const).map((m) => (
                <div key={m} className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-foreground">{MANNER_DESC[m].name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{MANNER_DESC[m].desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PhonemeGrid phonemes={phonemes} onSelect={setSelected} showAudio />

      {selected && (
        <div className="rounded-xl border border-primary p-6 bg-primary/5">
          <h3 className="font-semibold mb-2">Practice: {selected.devanagari}</h3>
          {pd && <p className="text-sm text-muted-foreground mb-4">{pd.desc}</p>}
          <PronunciationDrill phonemes={[selected]} />
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Link href="/learn/compression/" className="text-primary hover:underline">
          ← Pratyāhāras
        </Link>
        <Link href="/learn/gradation/" className="text-primary hover:underline">
          Next: Guṇa/Vṛddhi →
        </Link>
      </div>
    </div>
  );
}
