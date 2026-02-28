"use client";

import { useState, useRef } from "react";
import { Volume2, Mic, Square, Loader2 } from "lucide-react";
import type { Phoneme } from "@/lib/types";
import { playPhonemeAudio } from "@/lib/audio";
import { blobToBase64, blobToWavBase64 } from "@/lib/audioUtils";
import { ArticulationDiagram } from "@/components/ArticulationDiagram";
import { cn } from "@/lib/utils";

const PHONETIC_HINTS: Record<string, { hint: string; place: string }> = {
  a: { hint: "Like 'u' in 'but'. Tongue near soft palate.", place: "velar" },
  aa: { hint: "Long 'a'. Same place, held twice as long.", place: "velar" },
  i: { hint: "Like 'i' in 'bit'. Middle tongue toward hard palate.", place: "palatal" },
  ii: { hint: "Long 'i'. Like 'ee' in 'beet'.", place: "palatal" },
  u: { hint: "Like 'u' in 'put'. Lips rounded.", place: "labial" },
  uu: { hint: "Long 'u'. Like 'oo' in 'boot'.", place: "labial" },
  r: { hint: "Retroflex. Tip of tongue near roof bump.", place: "retroflex" },
  rr: { hint: "Long retroflex vowel.", place: "retroflex" },
  l: { hint: "Tip of tongue at base of teeth. Rare.", place: "dental" },
  e: { hint: "Compound: a + i. Like 'ay' in 'say'.", place: "palatal" },
  ai: { hint: "Compound: a + e. Like 'i' in 'bite'.", place: "palatal" },
  o: { hint: "Compound: a + u. Like 'o' in 'go'.", place: "labial" },
  au: { hint: "Compound: a + o. Like 'ow' in 'cow'.", place: "labial" },
  ka: { hint: "Unvoiced velar stop. Tongue base at soft palate.", place: "velar" },
  kha: { hint: "Aspirated ka. Extra breath.", place: "velar" },
  ga: { hint: "Voiced velar stop.", place: "velar" },
  gha: { hint: "Voiced aspirated velar.", place: "velar" },
  nga: { hint: "Velar nasal. Air through nose.", place: "velar" },
  pa: { hint: "Unvoiced labial. Lips together.", place: "labial" },
  ta: { hint: "Unvoiced dental. Tongue at teeth.", place: "dental" },
  "ta-retro": { hint: "Retroflex. Tongue tip at roof bump.", place: "retroflex" },
};

async function transcribeAudio(blob: Blob): Promise<string> {
  const b64 = await blobToWavBase64(blob).catch(() => blobToBase64(blob));
  try {
    const res = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_b64: b64 }),
    });
    const data = (await res.json()) as { text?: string };
    return (data.text ?? "").trim();
  } catch {
    return "";
  }
}

export function PhonemeCard({ phoneme }: { phoneme: Phoneme }) {
  const [myUrl, setMyUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState<"original" | "mine" | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const meta = PHONETIC_HINTS[phoneme.id] ?? { hint: "", place: phoneme.place };
  const place = (meta.place || phoneme.place) as "velar" | "palatal" | "retroflex" | "dental" | "labial" | "other";

  const playOriginal = async () => {
    setPlaying("original");
    try {
      await playPhonemeAudio(phoneme);
    } finally {
      setPlaying(null);
    }
  };

  const playMine = () => {
    if (!myUrl) return;
    setPlaying("mine");
    const a = new Audio(myUrl);
    a.onended = () => setPlaying(null);
    a.play();
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
        setMyUrl(URL.createObjectURL(blob));
        setTranscript(null);
        setRecording(false);
        mediaRecorderRef.current = null;
        setTranscribing(true);
        try {
          const t = await transcribeAudio(blob);
          setTranscript(t || "(compare by ear)");
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
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      setRecording(true);
    } catch (e) {
      console.error("Mic:", e);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <ArticulationDiagram place={place} devanagari={phoneme.devanagari} size={72} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm text-muted-foreground">{phoneme.iast}</p>
          {meta.hint && (
            <p className="text-xs text-muted-foreground mt-1 leading-tight">{meta.hint}</p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={playOriginal}
          disabled={playing !== null && playing !== "original"}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium",
            "bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25"
          )}
          title="Hear correct pronunciation"
        >
          {playing === "original" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
          Original
        </button>
        <button
          onClick={playMine}
          disabled={!myUrl || (playing !== null && playing !== "mine")}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium",
            myUrl ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground opacity-60"
          )}
          title="Play your recording"
        >
          {playing === "mine" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
          You
        </button>
        <button
          onClick={handleRecord}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium",
            recording ? "bg-red-500 text-white" : "bg-primary/15 text-primary hover:bg-primary/25"
          )}
          title="Record"
        >
          {recording ? <Square className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          {recording ? "Stop" : "Record"}
        </button>
      </div>
      {transcribing && <p className="text-xs text-muted-foreground mt-1">Transcribing…</p>}
      {transcript !== null && !transcribing && (
        <p className="text-xs text-muted-foreground mt-1">Heard: <span className="font-mono">{transcript}</span></p>
      )}
    </div>
  );
}
