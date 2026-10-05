"use client";

import Link from "next/link";
import { ArrowLeft, Play, Ear, Hand, Eye, BrainCircuit, ScrollText } from "lucide-react";

const NIGHTS = [
  { night: 1, pair: ["a", "ā"], loci: ["forehead", "mouth and face"], audio: "/memory/audio/cycle_night1_a_aa.mp3" },
  { night: 2, pair: ["i", "ī"], loci: ["right eye", "left eye"] },
  { night: 3, pair: ["u", "ū"], loci: ["right ear", "left ear"] },
  { night: 4, pair: ["ṛ", "ṝ"], loci: ["right nostril", "left nostril"] },
  { night: 5, pair: ["ḷ", "ḹ"], loci: ["right cheek", "left cheek"] },
  { night: 6, pair: ["e", "ai"], loci: ["lower teeth", "upper teeth"] },
  { night: 7, pair: ["o", "au"], loci: ["lower lip", "upper lip"] },
  { night: 8, pair: ["aṃ", "aḥ"], loci: ["crown", "tongue"] },
  { night: 9, pair: ["ka", "kha"], loci: ["right shoulder", "right arm"] },
  { night: 10, pair: ["ga", "gha"], loci: ["right elbow", "right wrist"] },
];

const LADDER = [
  { icon: Ear, title: "1 · Hear / say", text: "Clean articulation in the mouth. Attention on breath. No touch yet." },
  { icon: Hand, title: "2 · Touch + say", text: "Hand on locus while chanting. Nyāsa = install, not anatomy." },
  { icon: Eye, title: "3 · Feel without touch", text: "Sound alone makes the locus obvious." },
  { icon: BrainCircuit, title: "4 · Internal", text: "Think the phoneme — locus salient. No mouth movement." },
  { icon: ScrollText, title: "5 · Glyph", text: "Only after 2–4 are stable: see अ / आ with the sound." },
];

export default function MemoryNyasaPage() {
  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/memory"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Memory
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Nyāsa Practice</h1>
        <p className="text-muted-foreground text-sm">
          <strong>2 phonemes a night.</strong> Play the reference cycle → say the phoneme →
          touch the locus → use the gap to try yourself → replay the file.
        </p>
      </div>

      <section className="mb-6 rounded-xl border border-primary/40 bg-primary/5 p-4">
        <h2 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
          <Play className="w-4 h-4" /> Night 1 — start here
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          <code className="text-primary">a</code> → forehead · gap ·{" "}
          <code className="text-primary">ā</code> → mouth and face · gap
        </p>
        <audio controls className="w-full" src="/memory/audio/cycle_night1_a_aa.mp3" />
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <a className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent" href="/memory/audio/cycle_vowels.mp3">
            Vowels cycle
          </a>
          <a className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent" href="/memory/audio/cycle_consonants.mp3">
            Consonants cycle
          </a>
          <a className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent" href="/memory/audio/cycle_full_starter.mp3">
            Full starter
          </a>
          <a className="px-3 py-1.5 rounded-lg border border-border hover:bg-accent" href="/memory/audio/night1_guided_circuit.mp3">
            Guided circuit (optional)
          </a>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">The ladder (per phoneme)</h2>
        <div className="grid gap-3">
          {LADDER.map((step) => (
            <div key={step.title} className="flex gap-3 p-3 rounded-xl border border-border bg-card">
              <step.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Common confusion</h2>
        <p className="text-sm text-muted-foreground">
          Chanting <code>a</code> while attending the forehead naturally stretches into{" "}
          <code>ā</code>. Expected.
        </p>
        <p className="text-sm text-primary mt-2 font-medium">
          Mouth decides how it sounds. Locus decides where it is installed.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <code>a</code> and <code>ā</code> are the same open mouth quality — difference is{" "}
          <strong>duration</strong> (short tap vs held). Pull the sound back when you mean{" "}
          <code>a</code>.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Night calendar</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-3 py-2">Night</th>
                <th className="px-3 py-2">Pair</th>
                <th className="px-3 py-2">Loci</th>
              </tr>
            </thead>
            <tbody>
              {NIGHTS.map((n) => (
                <tr key={n.night} className="border-t border-border">
                  <td className="px-3 py-2">{n.night}</td>
                  <td className="px-3 py-2 font-medium text-primary">
                    {n.pair.join(" · ")}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{n.loci.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Our training calendar — two phonemes a sitting is modern pacing, not Abhinavagupta's
          instruction (the texts set no schedule). Nights 1–8 = vowels. 9–10 = first
          consonant contrasts. Loci follow the TĀ 15 apparatus tables; the verse reads
          hand/fingers/nails where the tables give elbow/wrist/fingers — never mix maps
          in one sitting (see integrated Mātṛkā wheel).
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Sources</h2>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>Mālinīvijayottaratantra 2.21 = TĀ 1.170, verified on volume (uccāra · karaṇa · dhyāna · varṇa · sthāna-prakalpanā — the āṇava method)</li>
          <li>MV 3.36–41 via TĀ 15/121–125ab (verified on volume) — Mālinī nyāsa for śākta-śarīra</li>
          <li>Tantrāloka 15 — Mātṛkā / Mālinī body maps</li>
          <li>Tantrāloka 4.91 — don’t torment the body with prāṇāyāma</li>
          <li>Flood, <em>The Tantric Body</em> — entextualisation</li>
          <li>deitybody repo + Stonedoorway reference pages</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Practice scaffold · not medical · no Hz-per-phoneme doctrine · stop always available.
        </p>
      </section>
    </div>
  );
}
