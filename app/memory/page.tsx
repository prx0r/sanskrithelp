"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  BookMarked,
  Boxes,
  Ear,
  Compass,
  Hash,
  Heart,
  Map as MapIcon,
  Volume2,
  ExternalLink,
} from "lucide-react";

const SECTIONS = [
  {
    href: "/memory/simulator",
    title: "Sanskrit Simulator",
    subtitle: "v2 · state → operator → world",
    desc: "Cognitive machine: live objects, global operators, Pāṇini as physics, sandhi collision, derivation wheel. Four modes: INHABIT · DECOMPILE · GENERATE · PLAY.",
    icon: Boxes,
  },
  {
    href: "/memory/panini/PATH.md",
    title: "Pāṇini Path (Bruno)",
    subtitle: "Aṣṭādhyāyī · compile structure",
    desc: "3983 sūtras already on disk. Don't flashcard them. Laghu-Kaumudī construction order + Bruno operators + simulator physics. Strategy doc.",
    icon: Hash,
  },
  {
    href: "/memory/nyasa",
    title: "Nyāsa Practice",
    subtitle: "Phoneme → body locus",
    desc: "2 phonemes a night. Play the cycle, say the sound, touch the locus, try yourself in the gap. Sound + articulation + touch first — visualization later.",
    icon: Ear,
  },
  {
    href: "/memory/canonical/TANTRALOKA_CANONICAL.md",
    title: "Tantrāloka Canonical",
    subtitle: "Volume corpus · locked spine",
    desc: "Dyczkowski volume Tantrāloka = canonical practice spine. MV = root scripture. 37 āhnika files + 11 vols on attached disk. Practice loci: TĀ 15 nyāsa · TĀ 4.91 breath.",
    icon: BookMarked,
  },
  {
    href: "/memory/body-diagram.html",
    title: "Full Body Diagram",
    subtitle: "Mātṛkā · Mālinī · variations",
    desc: "Interactive full human body with phoneme loci. Toggle Mātṛkā limb map vs Mālinī MV 3.37–41. Deepdive: which map to start with.",
    icon: MapIcon,
  },
  {
    href: "/memory/maps",
    title: "Phoneme Body Maps",
    subtitle: "Mātṛkā · Mālinī · Varṇamālā",
    desc: "Accurate placement diagrams from Tantrāloka 15 and Mālinīvijayottaratantra 3. SVG body + mermaid flows. Not a chakra chart — tradition-specific practice coordinates.",
    icon: MapIcon,
  },
  {
    href: "/memory/bruno",
    title: "Bruno Memory Wheels",
    subtitle: "Dual-coordinate encoding",
    desc: "Glyph + articulation + production locus + tantric locus + imaginal signature. Combinatorial memory machinery — the image must teach the phonetic property.",
    icon: Compass,
  },
  {
    href: "/memory/hindi",
    title: "Hindi Wheels",
    subtitle: "Mātṛkā bridge · sentence compiler · Kumbh field Hindi",
    desc: "Keep the Sanskrit sound/body substrate; add living Hindi phonology, grammatical production wheels, and field phrases for Rishikesh, Haridwar and Varanasi.",
    icon: Compass,
  },
  {
    href: "/memory/panini",
    title: "Pāṇini Machine",
    subtitle: "Pratyāhāra · varga · sandhi",
    desc: "Memorise the Sanskrit system with Pāṇini’s own compression: pratyāhāra expanders, 5×5 varga wheels, sandhi as felt transformation — not rule cards.",
    icon: Hash,
  },
  {
    href: "/memory/canonical/MATRIKA-SYLLABUS.md",
    title: "Mātṛkā Syllabus",
    subtitle: "Texts-only · nothing invented",
    desc: "Karanyāsa → 50-locus traversal → compressed formula → mind-alone → Mālinī. Every step cited; [REC] marks arrangement; §7 lists what the texts don't say.",
    icon: BookMarked,
  },
  {
    href: "/memory/canonical/GRACE-AND-THE-NEOPHYTE.md",
    title: "Grace & the Neophyte",
    subtitle: "TĀ reader · śaktipāta · teacher · obstacles",
    desc: "What Abhinavagupta actually says about grace, the beginner, true/false teachers, devotion, and what goes wrong. Short extracts, exact volume pointers.",
    icon: Heart,
  },
  {
    href: "/memory/audio",
    title: "Guided Audio",
    subtitle: "Clip → locus → gap",
    desc: "Reference cycles from sanskrithelp phoneme clips + locus TTS. Replay the file; you do the work in the gap.",
    icon: Volume2,
  },
  {
    href: "/memory/bruno-wheels/",
    title: "Bruno Wheels (R2 pack)",
    subtitle: "Varṇa · five-ring · dhātu · kāraka · verse",
    desc: "Standalone wheel lab from stallshark pack. Personal bindings in localStorage. Sound → binding → manipulation → Pāṇinian validation.",
    icon: Compass,
  },
  {
    href: "/memory/matrka-wheel/integrated.html",
    title: "Mātṛkā Wheel + Body + Sound",
    subtitle: "VARṆA × ARTICULATION × NYĀSA × DHVANI × IMAGO → locus → clip",
    desc: "Wheel drives a body marker (50 loci) + press-and-hold plays the clip (26/50 cut). Align to acquire, scramble rings to reconstruct. Provenance note inside.",
    icon: Compass,
  },
  {
    href: "/memory/world-compiler/",
    title: "World Compiler",
    subtitle: "Verse → world JSON",
    desc: "Compile Sanskrit passages (asato ma · citih svatantra) into world IR for StoneDoorway / Memory.",
    icon: Hash,
  },
  {
    href: "/learn/bruno",
    title: "Bruno Wheel Lab (app)",
    subtitle: "/learn/bruno",
    desc: "In-app overlay component from the R2 pack — five wheels, no new npm deps.",
    icon: Compass,
  },
];

export default function MemoryHubPage() {
  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-1 flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          Memory
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Install Sanskrit as a playable body-map — not flashcards.
          <strong className="text-foreground"> Bruno</strong> supplies combinatorial wheels.
          <strong className="text-foreground"> Pāṇini</strong> supplies the compression machine.
          <strong className="text-foreground"> Abhinavagupta/Trika</strong> supplies why the body takes the text (nyāsa).
        </p>
        <p className="text-muted-foreground text-xs mt-2">
          Research repo: <code className="text-primary">/root/deitybody</code> ·
          companion: <a className="text-primary" href="https://stonedoorway.com/reference/deitybody-nyasa" target="_blank" rel="noreferrer">Stonedoorway technique</a>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all group h-full">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold group-hover:text-primary">{item.title}</h3>
                <p className="text-xs text-primary/80 mb-1">{item.subtitle}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-2">
          How to use Memory
        </h2>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-5">
          <li>
            <strong className="text-foreground">Start with Nyāsa</strong> — Night 1 ={" "}
            <code>a</code> forehead + <code>ā</code> mouth/face. 2 phonemes a night.
          </li>
          <li>
            <strong className="text-foreground">Open Body Maps</strong> when you want the full placement picture.
          </li>
          <li>
            <strong className="text-foreground">Bruno wheels</strong> once a phoneme’s dual coordinates feel dull — add an imaginal signature that teaches the feature.
          </li>
          <li>
            <strong className="text-foreground">Pāṇini machine</strong> for pratyāhāra, varga logic, and sandhi — compress the system with its own grammar.
          </li>
          <li>
            <strong className="text-foreground">Audio cycles</strong> — play, try yourself in the gap, replay.
          </li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/memory/nyasa"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
          >
            Start Night 1
          </Link>
          <a
            href="/memory/audio/cycle_night1_a_aa.mp3"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            <Volume2 className="w-4 h-4" /> Play cycle
          </a>
          <a
            href="https://stonedoorway.com/reference/phoneme-maps"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            External maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Rule:</strong> mouth decides how a sound is made.
          Locus decides where it is installed.{" "}
          <code>a</code> and <code>ā</code> are the same open quality — difference is duration.
          If attending the forehead stretches <code>a</code> into <code>ā</code>, pull it back.
        </p>
      </section>
    </div>
  );
}
