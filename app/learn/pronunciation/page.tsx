"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Volume2, Mic, Square, Loader2, CheckCircle, XCircle, ChevronLeft } from "lucide-react";
import { playSanskritTTS } from "@/lib/audio";
import { blobToWavBlob } from "@/lib/audioUtils";
import { cn } from "@/lib/utils";

// Sanskrit drill words (IAST) — from sabdakrida DRILL_WORDS
const DRILL_WORDS = [
  "ṭīkā", "ḍambara", "naṭa", "nāṭya", "viṣṇu",
  "kāla", "nīla", "pūja", "āgama", "māla",
  "phala", "bhāva", "dharma",
  "śānti", "śabda", "viśva", "puruṣa", "śiva",
  "ṣaṭ", "niṣṭhā",
  "saṃskṛta", "śaṃkara", "aṃga",
  "namaḥ", "śāntiḥ", "puruṣaḥ",
];

type SessionResult = {
  target: string;
  heard: string;
  errors: [string, string][];
  error_types: string[];
  audio: string | null;
  correct: boolean;
} | null;

export default function PronunciationTutorPage() {
  const [targetWord, setTargetWord] = useState("");
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [result, setResult] = useState<SessionResult>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleListen = async () => {
    if (!targetWord) return;
    setListening(true);
    setBackendError(null);
    setResult(null);
    try {
      await playSanskritTTS(targetWord, { style: "narration" });
    } catch (e) {
      let msg = "Sanskrit TTS failed.";
      if (e instanceof Error) {
        if (e.name === "AbortError") {
          msg = "TTS timed out (90s). First load can take ~30s—try again.";
        } else {
          msg = e.message;
        }
      }
      setBackendError(msg + (msg.includes("8010") ? "" : " Is Sabdakrida running on port 8010?"));
    } finally {
      setListening(false);
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
        mediaRecorderRef.current = null;
        setRecording(false);

        if (!targetWord) return;
        setAssessing(true);
        setBackendError(null);
        setResult(null);
        try {
          const wavBlob = await blobToWavBlob(blob);
          const form = new FormData();
          form.append("audio", wavBlob, "recording.wav");
          form.append("target_text", targetWord);
          form.append("user_id", "default");

          const res = await fetch("/api/sabdakrida/session", {
            method: "POST",
            body: form,
          });
          const data = await res.json();
          if (!res.ok) {
            setBackendError(data?.error ?? "Assessment failed");
            return;
          }
          setResult(data);

          // Play feedback audio if present
          if (data.audio) {
            try {
              const bin = atob(data.audio);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              const feedbackBlob = new Blob([bytes], { type: "audio/wav" });
              const url = URL.createObjectURL(feedbackBlob);
              const audio = new Audio(url);
              await audio.play();
              audio.onended = () => URL.revokeObjectURL(url);
            } catch (e) {
              console.warn("Could not play feedback audio:", e);
            }
          }
        } catch (e) {
          setBackendError(
            e instanceof Error ? e.message : "Backend unavailable. Run: python -m uvicorn sabdakrida.main:app --port 8010"
          );
        } finally {
          setAssessing(false);
        }
      };
      mr.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
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
      setResult(null);
    } catch (e) {
      console.error("Microphone error:", e);
      setBackendError(
        "Microphone access denied or unavailable. Allow microphone permission and try again."
      );
    }
  };

  return (
    <div className="min-h-[80vh] py-8 max-w-2xl mx-auto px-4 space-y-8 bg-background">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Learn
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Śabdakrīḍā — Pronunciation Tutor</h1>
        <p className="text-muted-foreground">
          Tap a word below to select it, then Listen (Aryan voice) or Record. First use may take ~30s to load the model.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Requires Sabdakrida backend: <code className="bg-muted px-1 rounded">python -m uvicorn sabdakrida.main:app --port 8010</code>
        </p>
      </div>

      {/* Word picker */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-2">1. Tap a word to select</h2>
        <div className="flex flex-wrap gap-2">
          {DRILL_WORDS.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => {
                setTargetWord(word);
                setResult(null);
                setBackendError(null);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                targetWord === word
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {/* Practice area */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {targetWord ? (
          <>
            <div className="text-center">
              <p className="text-4xl font-sans mb-1" dir="ltr">
                {targetWord}
              </p>
              <p className="text-sm text-muted-foreground">Target (IAST)</p>
            </div>

            <h2 className="text-sm font-medium text-muted-foreground">2. Listen or Record</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={handleListen}
                disabled={listening}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10 disabled:opacity-50 cursor-pointer touch-manipulation"
              >
                {listening ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                    Generating… (first time ~30s)
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 text-amber-600" />
                    Listen (Aryan voice)
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleRecord}
                disabled={assessing}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl transition-colors cursor-pointer touch-manipulation",
                  recording
                    ? "bg-red-500 text-white"
                    : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                )}
              >
                {recording ? (
                  <>
                    <Square className="w-5 h-5" />
                    Stop & submit
                  </>
                ) : assessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Assessing…
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Record
                  </>
                )}
              </button>
            </div>

            {backendError && (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                {backendError}
              </div>
            )}

            {result && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                {result.correct ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    Correct! sādhu.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-amber-600 font-medium">
                      <XCircle className="w-5 h-5" />
                      Heard: <span className="font-mono">{result.heard || "(none)"}</span>
                    </div>
                    {result.error_types?.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Focus: {result.error_types.join(", ")}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-muted-foreground">Select a word above to start.</p>
        )}
      </div>
    </div>
  );
}
