"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Volume2, Play } from "lucide-react";
import phonemesData from "@/data/phonemes.json";
import type { Phoneme } from "@/lib/types";

const AUDIO_BASE = "/audio/phonemes";

const ROWS = [
  { name: "Guttural (kaṇṭhya)", row: ["ka", "kha", "ga", "gha", "ṅa"], cakra: "Mūlādhāra", color: "#ef4444", location: "Root (perineum)", label: "Red — Root" },
  { name: "Palatal (tālavya)", row: ["ca", "cha", "ja", "jha", "ña"], cakra: "Svādhiṣṭhāna", color: "#f97316", location: "Sacrum (lower belly)", label: "Orange — Sacral" },
  { name: "Retroflex (mūrdhanya)", row: ["ṭa", "ṭha", "ḍa", "ḍha", "ṇa"], cakra: "Maṇipūra", color: "#eab308", location: "Solar plexus (upper belly)", label: "Yellow — Solar Plexus" },
  { name: "Dental (dantya)", row: ["ta", "tha", "da", "dha", "na"], cakra: "Anāhata", color: "#22c55e", location: "Heart (center of chest)", label: "GREEN — Heart Core" },
  { name: "Labial (oṣṭhya)", row: ["pa", "pha", "ba", "bha", "ma"], cakra: "Viśuddha", color: "#3b82f6", location: "Throat (base of throat)", label: "Blue — Throat" },
];

const SEMIVOWELS = { name: "Semivowels", row: ["ya", "ra", "la", "va"], cakra: "Ājñā", color: "#8b5cf6", location: "Third eye (between brows)", label: "Indigo — Third Eye" };
const SIBILANTS = { name: "Sibilants & ha", row: ["śa", "ṣa", "sa", "ha"], cakra: "Sahasrāra", color: "#a855f7", location: "Crown (top of head)", label: "Violet — Crown" };

export default function MatrikaPage() {
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [playingRow, setPlayingRow] = useState<string | null>(null);
  const [playingIdx, setPlayingIdx] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const phonemeMap = new Map(
    (phonemesData as Phoneme[]).map((p) => [p.id, p])
  );

  const allRows = [...ROWS, SEMIVOWELS, SIBILANTS];

  const playAudio = useCallback((id: string) => {
    try {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      const audio = new Audio(`${AUDIO_BASE}/${id}.ogg`);
      audioRef.current = audio;
      audio.play().catch(() => {
        // Fallback: browser TTS
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(id);
        u.lang = "sa"; u.rate = 0.7;
        speechSynthesis.speak(u);
      });
    } catch {}
  }, []);

  const playRow = useCallback(async (section: typeof ROWS[0], rowIdx: number) => {
    const name = section.name;
    setPlayingRow(name);
    setPlayingIdx(0);

    for (let i = 0; i < section.row.length; i++) {
      setPlayingIdx(i);
      await new Promise<void>((resolve) => {
        playAudio(section.row[i]);
        setTimeout(resolve, 800);
      });
    }
    setPlayingRow(null);
    setPlayingIdx(-1);
  }, [playAudio]);

  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link href="/tantra" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Tantra
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Mātṛkā → Cakra Grid</h1>
        <p className="text-muted-foreground text-sm">
          Chant each row at its cakra — feel the vibration at that body location
        </p>
      </div>

      {/* The Green Core */}
      <div className="mb-6 rounded-xl border border-emerald-700/40 bg-emerald-950/20 p-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-emerald-400 shrink-0" />
          <div>
            <h2 className="font-semibold text-emerald-300 text-sm">The Green Core</h2>
            <p className="text-xs text-emerald-200/60 mt-0.5">
              Row 4 — ta tha da dha na — vibrates at Anāhata (heart center), 550 nm.
              The balance point of the tetrahedron. When lost, return here.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {allRows.map((section, rowIdx) => {
          const isActive = activeRow === section.name;
          const isGreen = section.name.includes("Dental");
          const isPlaying = playingRow === section.name;

          return (
            <div
              key={section.name}
              className={`rounded-xl border transition-all ${
                isActive || isPlaying
                  ? isGreen ? "border-emerald-500/50 bg-emerald-950/10" : "border-primary/40 bg-card"
                  : isGreen ? "border-emerald-800/30 bg-card/50" : "border-border bg-card/50"
              }`}
            >
              <button onClick={() => setActiveRow(isActive ? null : section.name)} className="w-full p-4 flex items-center gap-4">
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: section.color }} />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isGreen ? "text-emerald-300" : ""}`}>{section.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isGreen ? "bg-emerald-900/40 text-emerald-300" : "bg-primary/10 text-muted-foreground"}`}>
                      {section.cakra}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{section.location}</div>
                </div>
                <div className="text-lg font-semibold font-devanagari flex gap-1.5" style={{ color: section.color }}>
                  {section.row.map((id, ci) => {
                    const p = phonemeMap.get(id);
                    return (
                      <span
                        key={id}
                        className={`cursor-pointer hover:scale-110 transition-transform ${isPlaying && ci === playingIdx ? "animate-pulse" : ""}`}
                        onClick={(e) => { e.stopPropagation(); playAudio(id); }}
                        title={id}
                      >
                        {p?.devanagari || id}
                      </span>
                    );
                  })}
                </div>
              </button>

              {isActive && (
                <div className="px-4 pb-4 pt-0 border-t border-border/50">
                  <div className="mt-3 space-y-3">
                    {/* Play Row button */}
                    <button
                      onClick={() => { if (!isPlaying) playRow(section, rowIdx); }}
                      disabled={isPlaying}
                      className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-40"
                    >
                      <Play className="w-4 h-4" />
                      {isPlaying ? `Playing ${section.row[Math.max(0, playingIdx)]}...` : "Chant this row"}
                    </button>

                    {/* Phoneme cards */}
                    <div className="grid grid-cols-5 gap-2">
                      {section.row.map((id, ci) => {
                        const p = phonemeMap.get(id);
                        const isCurrent = isPlaying && ci === playingIdx;
                        return (
                          <div
                            key={id}
                            className={`rounded-lg bg-background p-3 text-center cursor-pointer hover:bg-primary/10 transition-all ${isCurrent ? "ring-2 ring-offset-2 ring-offset-background" : ""}`}
                            style={isCurrent ? { boxShadow: `0 0 0 2px ${section.color}` } : {}}
                            onClick={() => playAudio(id)}
                          >
                            <div className="text-2xl font-devanagari" style={{ color: section.color }}>
                              {p?.devanagari || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{id}</div>
                            <div className="flex justify-center mt-2">
                              <Volume2 className="w-3 h-3 text-muted-foreground/50" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Daily practice */}
      <div className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-2">Daily Mātṛkā Practice</h2>
        <ol className="text-sm text-muted-foreground space-y-2">
          <li><span className="text-emerald-400 font-medium">1.</span> Sit, balance the breath (2 min)</li>
          <li><span className="text-emerald-400 font-medium">2.</span> Open a row — tap each phoneme to hear it, chant along</li>
          <li><span className="text-emerald-400 font-medium">3.</span> Press <Play className="w-3 h-3 inline" /> to hear the full row in sequence</li>
          <li><span className="text-emerald-400 font-medium">4.</span> Pause especially long at the <span className="text-emerald-400">green core</span> (dental row — heart)</li>
          <li><span className="text-emerald-400 font-medium">5.</span> Let the sound dissolve into silence</li>
        </ol>
      </div>
    </div>
  );
}
