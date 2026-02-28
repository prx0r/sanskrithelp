"use client";

import { useState } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import type { Phoneme } from "@/lib/types";
import { playPhonemeAudio } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  phoneme?: Phoneme;
  text?: string;
  useTTS?: boolean;
  className?: string;
}

export function AudioPlayer({ phoneme, text, useTTS = false, className }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);

  const handlePlay = async () => {
    setPlaying(true);
    try {
      if (phoneme) {
        await playPhonemeAudio(phoneme);
      } else if (text && useTTS) {
        const { playTTSAudio } = await import("@/lib/audio");
        await playTTSAudio(text);
      }
    } catch (e) {
      console.warn("Audio playback failed:", e);
      // Fallback: use speech synthesis for phonemes
      if (phoneme) {
        const u = new SpeechSynthesisUtterance(phoneme.iast);
        u.rate = 0.7;
        speechSynthesis.speak(u);
      }
    } finally {
      setPlaying(false);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={playing}
      className={cn(
        "touch-target rounded-full p-2 bg-primary/20 hover:bg-primary/30 transition-colors disabled:opacity-70",
        className
      )}
      aria-label={phoneme ? `Play ${phoneme.iast}` : "Play audio"}
    >
      {playing ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <Volume2 className="w-6 h-6" />
      )}
    </button>
  );
}
