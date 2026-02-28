"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordButtonProps {
  onTranscription?: (text: string) => void;
  className?: string;
}

export function RecordButton({ onTranscription, className }: RecordButtonProps) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        const { blobToWavBase64, blobToBase64 } = await import("@/lib/audioUtils");
        const b64 = await blobToWavBase64(blob).catch(() => blobToBase64(blob));
        setLoading(true);
        setResult(null);
        try {
          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio_b64: b64 }),
          });
          const data = (await res.json()) as { text?: string };
          const text = data.text ?? "";
          setResult(text);
          onTranscription?.(text);
        } catch (e) {
          setResult("(transcription failed)");
        } finally {
          setLoading(false);
        }
      };

      mr.start();
      setRecording(true);
      setResult(null);
    } catch (e) {
      console.error("Mic access:", e);
      setResult("(mic access denied)");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={loading}
        className={cn(
          "touch-target rounded-full p-4 transition-colors",
          recording
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-primary/20 hover:bg-primary/30"
        )}
        aria-label={recording ? "Stop recording" : "Start recording"}
      >
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : recording ? (
          <Square className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>
      <span className="text-xs text-muted-foreground">
        {recording ? "Tap to stop" : "Tap to record"}
      </span>
      {result !== null && (
        <p className="text-sm font-mono text-center">Heard: {result}</p>
      )}
    </div>
  );
}
