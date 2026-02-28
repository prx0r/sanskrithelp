"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Volume2, Loader2, ChevronRight, ChevronLeft } from "lucide-react";
import type { Phoneme } from "@/lib/types";
import { playPhonemeAudio } from "@/lib/audio";
import { blobToBase64, blobToWavBase64 } from "@/lib/audioUtils";
import { cn } from "@/lib/utils";

interface PronunciationDrillProps {
  phonemes: Phoneme[];
  onProgress?: (practiced: number, total: number) => void;
}

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

export function PronunciationDrill({ phonemes, onProgress }: PronunciationDrillProps) {
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [myRecordingUrl, setMyRecordingUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [playing, setPlaying] = useState<"original" | "mine" | null>(null);

  const waveformRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);

  const phoneme = phonemes[index];

  useEffect(() => {
    onProgress?.(index, phonemes.length);
  }, [index, phonemes.length, onProgress]);

  // Waveform while recording
  useEffect(() => {
    if (!recording || !analyserRef.current || !waveformRef.current) return;
    const canvas = waveformRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
    if (!ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(data);
      ctx.fillStyle = "rgb(30 41 59)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(59 130 246)";
      ctx.beginPath();
      const sliceW = canvas.width / data.length;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = (v * canvas.height) / 2 + canvas.height / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceW;
      }
      ctx.stroke();
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [recording]);

  const handleRecord = async () => {
    if (recording) {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state !== "recording") return;
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        chunksRef.current = [];
        const url = URL.createObjectURL(blob);
        setMyRecordingUrl(url);
        setTranscript(null);
        setRecording(false);
        mediaRecorderRef.current = null;

        setTranscribing(true);
        try {
          const text = await transcribeAudio(blob);
          setTranscript(text || "(no speech detected)");
        } catch {
          setTranscript("(transcription unavailable)");
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
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start(100);
      setRecording(true);
      setMyRecordingUrl(null);
      setTranscript(null);
    } catch (e) {
      console.error("Mic:", e);
    }
  };

  const playOriginal = async () => {
    if (!phoneme) return;
    setPlaying("original");
    try {
      await playPhonemeAudio(phoneme);
    } finally {
      setPlaying(null);
    }
  };

  const playMine = () => {
    if (!myRecordingUrl) return;
    setPlaying("mine");
    const a = new Audio(myRecordingUrl);
    a.onended = () => setPlaying(null);
    a.play();
  };

  if (!phoneme) return null;

  return (
    <div className="flex flex-col items-center min-h-[320px]">
      <div className="text-6xl mb-6 font-sans" dir="ltr">
        {phoneme.devanagari}
      </div>
      <p className="text-muted-foreground text-sm mb-2">{phoneme.iast}</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
        <button
          onClick={playOriginal}
          disabled={playing !== null && playing !== "original"}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors",
            "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10"
          )}
        >
          {playing === "original" ? (
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          ) : (
            <Volume2 className="w-6 h-6 text-amber-600" />
          )}
          <span className="text-xs font-medium">Original</span>
        </button>
        <button
          onClick={playMine}
          disabled={!myRecordingUrl || (playing !== null && playing !== "mine")}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors",
            myRecordingUrl
              ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10"
              : "border-muted bg-muted/20 opacity-60"
          )}
        >
          {playing === "mine" ? (
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          ) : (
            <Volume2 className="w-6 h-6 text-emerald-600" />
          )}
          <span className="text-xs font-medium">You</span>
        </button>
      </div>

      {transcript !== null && (
        <p className="text-sm text-muted-foreground mb-2 text-center">
          Heard: <span className="font-mono text-foreground">{transcript || "(compare by ear)"}</span>
        </p>
      )}

      <button
        onClick={handleRecord}
        className={cn(
          "rounded-full p-5 transition-colors touch-target",
          recording ? "bg-red-500 text-white" : "bg-primary text-primary-foreground hover:opacity-90"
        )}
        aria-label={recording ? "Stop" : "Record"}
      >
        {recording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
      </button>
      {recording && (
        <div className="mt-2">
          <canvas
            ref={waveformRef}
            width={200}
            height={40}
            className="rounded bg-slate-800"
          />
          <p className="text-xs text-muted-foreground mt-1">Press to stop</p>
        </div>
      )}
      {transcribing && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Transcribing…
        </p>
      )}

      <div className="flex items-center gap-4 mt-8">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="p-2 rounded-lg disabled:opacity-30"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm text-muted-foreground">
          {index + 1} / {phonemes.length}
        </span>
        <button
          onClick={() => {
            setIndex((i) => Math.min(phonemes.length - 1, i + 1));
            setMyRecordingUrl(null);
            setTranscript(null);
          }}
          disabled={index === phonemes.length - 1}
          className="p-2 rounded-lg disabled:opacity-30"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
