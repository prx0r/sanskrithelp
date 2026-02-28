"use client";

import { useState, useRef } from "react";
import { Volume2, Mic, Square, Loader2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import type { Phoneme } from "@/lib/types";
import { playPhonemeAudio } from "@/lib/audio";
import { blobToWavBase64, blobToBase64 } from "@/lib/audioUtils";
import { cn } from "@/lib/utils";

const PHONETIC_HINTS: Record<string, string> = {
  a: "Like 'u' in 'but'. Tongue near soft palate.", aa: "Long 'a'. Held twice as long.",
  i: "Like 'i' in 'bit'. Middle tongue toward hard palate.", ii: "Long 'i'. Like 'ee' in 'beet'.",
  u: "Like 'u' in 'put'. Lips rounded.", uu: "Long 'u'. Like 'oo' in 'boot'.",
  r: "Retroflex. Tip of tongue near roof bump.", rr: "Long retroflex.",
  l: "Tip of tongue at base of teeth. Rare.", e: "Compound a+i. Like 'ay' in 'say'.",
  ai: "Compound a+e. Like 'i' in 'bite'.", o: "Compound a+u. Like 'o' in 'go'.",
  au: "Compound a+o. Like 'ow' in 'cow'.",
};

async function transcribe(blob: Blob): Promise<string> {
  const b64 = await blobToWavBase64(blob).catch(() => blobToBase64(blob));
  try {
    const res = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args: { audio_b64: b64 } }),
    });
    const data = (await res.json()) as { text?: string };
    return (data.text ?? "").trim();
  } catch { return ""; }
}

export function GuidedLesson({
  phonemes,
  onComplete,
  completedIds,
  onPass,
}: {
  phonemes: Phoneme[];
  onComplete?: () => void;
  completedIds: Set<string>;
  onPass: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [playing, setPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const phoneme = phonemes[index];

  const handlePlay = async () => {
    if (!phoneme) return;
    setPlaying(true);
    try {
      await playPhonemeAudio(phoneme);
    } finally {
      setPlaying(false);
    }
  };

  const handleRecord = async () => {
    if (recording) {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state !== "recording") return;
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        chunksRef.current = [];
        setRecording(false);
        mediaRecorderRef.current = null;
        setTranscribing(true);
        try {
          const t = await transcribe(blob);
          setTranscript(t || "(no speech detected)");
        } finally {
          setTranscribing(false);
        }
      };
      mr.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      setRecording(true);
      setTranscript(null);
    } catch (e) {
      console.error("Mic:", e);
    }
  };

  const handlePass = () => {
    if (!phoneme) return;
    onPass(phoneme.id);
    if (index >= phonemes.length - 1) {
      onComplete?.();
      return;
    }
    setIndex((i) => i + 1);
    setTranscript(null);
  };

  if (!phoneme) return null;

  const canPrev = index > 0;
  const canNext = index < phonemes.length - 1;

  const goPrev = () => {
    if (canPrev) {
      setIndex((i) => i - 1);
      setTranscript(null);
    }
  };
  const goNext = () => {
    if (canNext) {
      setIndex((i) => i + 1);
      setTranscript(null);
    }
  };

  return (
    <div className="flex flex-col items-center py-8">
      <div className="flex items-center justify-center gap-4 w-full max-w-sm mb-6">
        <button
          onClick={goPrev}
          disabled={!canPrev}
          className="touch-target p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-5xl font-bold">{phoneme.devanagari}</span>
        <button
          onClick={goNext}
          disabled={!canNext}
          className="touch-target p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
      <p className="font-mono text-lg text-muted-foreground mb-1">{phoneme.iast}</p>
      {PHONETIC_HINTS[phoneme.id] && (
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">{PHONETIC_HINTS[phoneme.id]}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <button
          onClick={handlePlay}
          disabled={playing}
          className="flex items-center gap-2 px-6 py-4 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 touch-target"
        >
          {playing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
          Play
        </button>
        <button
          onClick={handleRecord}
          disabled={transcribing}
          className={cn(
            "flex items-center gap-2 px-6 py-4 rounded-xl touch-target",
            recording ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
          )}
        >
          {recording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {recording ? "Stop" : "Record"}
        </button>
        <button
          onClick={handlePass}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 touch-target"
        >
          <Check className="w-5 h-5" />
          Got it
        </button>
      </div>

      {transcribing && <p className="text-sm text-muted-foreground mt-2">Checking…</p>}
      {transcript !== null && !transcribing && (
        <p className="text-sm mt-2">Heard: <span className="font-mono">{transcript}</span></p>
      )}

      <div className="mt-8 flex items-center gap-2">
        {phonemes.map((p, i) => (
          <span
            key={p.id}
            className={cn(
              "w-2 h-2 rounded-full",
              i < index ? "bg-emerald-500" : i === index ? "bg-primary" : "bg-muted"
            )}
            title={p.iast}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">{index + 1} of {phonemes.length}</p>
    </div>
  );
}
