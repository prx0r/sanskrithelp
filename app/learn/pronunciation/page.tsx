"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Volume2, Mic, Square, Loader2, CheckCircle, XCircle, ChevronLeft } from "lucide-react";
import { playSanskritTTS } from "@/lib/audio";
import { blobToWavBlob } from "@/lib/audioUtils";
import { iastToDevanagari } from "@/lib/transliterate";
import { cn } from "@/lib/utils";

// Sanskrit drill words (IAST) — from sabdakrida DRILL_WORDS
const TTS_CACHE_MAX = 10;

const DRILL_WORDS = [
  "ṭīkā", "ḍambara", "naṭa", "nāṭya", "viṣṇu",
  "kāla", "nīla", "pūja", "āgama", "māla",
  "phala", "bhāva", "dharma",
  "śānti", "śabda", "viśva", "puruṣa", "śiva",
  "ṣaṭ", "niṣṭhā",
  "saṃskṛta", "śaṃkara", "aṃga",
  "namaḥ", "śāntiḥ", "puruṣaḥ",
];

type ErrorDetail = {
  type: string;
  word: string;
  syllable: string;
  vowel: string;
  message: string;
};

type SessionResult = {
  target: string;
  heard: string;
  heard_iast?: string;
  errors: [string, string][];
  error_types: string[];
  error_details?: ErrorDetail[];
  feedback_audio_key?: { text: string; style: string };
  correct: boolean;
  score?: number;
  feedback_english?: string;
} | null;

export default function PronunciationTutorPage() {
  const [targetWord, setTargetWord] = useState("");
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [result, setResult] = useState<SessionResult>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  const [targetAudioCache, setTargetAudioCache] = useState<Record<string, string>>({});
  const [feedbackAudioUrl, setFeedbackAudioUrl] = useState<string | null>(null);
  const [replaying, setReplaying] = useState<"target" | "recording" | "feedback" | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const cacheRef = useRef<Record<string, string>>({});
  const recordingUrlRef = useRef<string | null>(null);
  const feedbackUrlRef = useRef<string | null>(null);
  cacheRef.current = targetAudioCache;
  recordingUrlRef.current = lastRecordingUrl;
  feedbackUrlRef.current = feedbackAudioUrl;

  useEffect(() => {
    return () => {
      recordingUrlRef.current && URL.revokeObjectURL(recordingUrlRef.current);
      feedbackUrlRef.current && URL.revokeObjectURL(feedbackUrlRef.current);
      Object.values(cacheRef.current).forEach(URL.revokeObjectURL);
    };
  }, []);

  // Waveform while recording (reuse PronunciationDrill pattern)
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

  /** Single play-target handler: from cache if available, else generate & cache. Does not clear feedback. */
  const handlePlayTarget = async () => {
    if (!targetWord) return;
    const cached = targetAudioCache[targetWord];
    if (cached) {
      setReplaying("target");
      const a = new Audio(cached);
      a.onended = () => setReplaying(null);
      a.play().catch(() => setReplaying(null));
      return;
    }
    setListening(true);
    setBackendError(null);
    try {
      await playSanskritTTS(targetWord, {
        style: "narration",
        onGenerated: (url) =>
          setTargetAudioCache((prev) => {
            const next = { ...prev, [targetWord]: url };
            const keys = Object.keys(next);
            if (keys.length > TTS_CACHE_MAX) {
              const drop = keys[0];
              if (next[drop]) URL.revokeObjectURL(next[drop]);
              const { [drop]: _, ...rest } = next;
              return rest;
            }
            return next;
          }),
      });
    } catch (e) {
      let msg = "Sanskrit TTS failed.";
      if (e instanceof Error) {
        if (e.name === "AbortError") {
          msg = "TTS timed out. First load can take 1–2 min—try again.";
        } else {
          msg = e.message;
        }
      }
      setBackendError(msg + (msg.includes("8010") ? "" : " Is Sabdakrida running on port 8010?"));
    } finally {
      setListening(false);
    }
  };

  const handleReplayRecording = () => {
    if (!lastRecordingUrl) return;
    setReplaying("recording");
    const a = new Audio(lastRecordingUrl);
    a.onended = () => setReplaying(null);
    a.play().catch(() => setReplaying(null));
  };

  const handleReplayFeedback = () => {
    if (!feedbackAudioUrl) return;
    setReplaying("feedback");
    const a = new Audio(feedbackAudioUrl);
    a.onended = () => setReplaying(null);
    a.play().catch(() => setReplaying(null));
  };

  const handleRecord = async () => {
    if (recording) {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state !== "recording") return;
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        analyserRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        setRecording(false);

        const url = URL.createObjectURL(blob);
        setLastRecordingUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });

        if (!targetWord) return;
        setAssessing(true);
        setBackendError(null);
        setResult(null);
        setFeedbackAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
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

          // Fetch and play feedback audio async (assessment already returned)
          if (data.feedback_audio_key?.text) {
            const { text, style } = data.feedback_audio_key;
            fetch("/api/sabdakrida/feedback-audio", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, style }),
            })
              .then((r) => (r.ok ? r.blob() : null))
              .then((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  setFeedbackAudioUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                  });
                  const audio = new Audio(url);
                  audio.play().catch(() => {});
                }
              })
              .catch(() => {});
          } else {
            setFeedbackAudioUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return null;
            });
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
          Tap a word below to select it, then Listen (Aryan voice) or Record. First Listen may take 1–2 minutes to load the model; later requests are faster.
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
                // Clear previous recording when switching words — it belonged to the old word
                setLastRecordingUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
                setFeedbackAudioUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
                setBackendError(null);
                setFeedbackAudioUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-baseline gap-1.5",
                targetWord === word
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <span style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{iastToDevanagari(word)}</span>
              <span className="font-mono text-muted-foreground">{word}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Practice area */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {targetWord ? (
          <>
            <div className="text-center">
              <p className="text-4xl mb-1" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>
                {iastToDevanagari(targetWord)}
              </p>
              <p className="text-2xl font-mono text-muted-foreground">{targetWord}</p>
              <p className="text-xs text-muted-foreground mt-1">Target (Devanagari & IAST)</p>
            </div>

            <h2 className="text-sm font-medium text-muted-foreground">2. Play target, record, or replay</h2>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={handlePlayTarget}
                disabled={listening || (replaying !== null && replaying !== "target")}
                title={targetAudioCache[targetWord] ? "Play Aryan voice (cached)" : "Play Aryan voice (first time 1–2 min)"}
                className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-xl border-2 transition-colors cursor-pointer touch-manipulation",
                  targetAudioCache[targetWord]
                    ? "border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/20"
                    : "border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/10",
                  "disabled:opacity-50"
                )}
              >
                {listening ? (
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                ) : (
                  <Volume2 className="w-5 h-5 text-amber-600" />
                )}
              </button>
              <button
                type="button"
                onClick={handleRecord}
                disabled={assessing}
                className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-xl transition-colors cursor-pointer touch-manipulation",
                  recording
                    ? "bg-red-500 text-white"
                    : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                )}
                title={recording ? "Stop & submit" : "Record"}
              >
                {recording ? (
                  <Square className="w-5 h-5" />
                ) : assessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
              {lastRecordingUrl && (
                <button
                  type="button"
                  onClick={handleReplayRecording}
                  disabled={replaying === "recording"}
                  title="Replay your recording"
                  className="flex items-center justify-center w-11 h-11 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 disabled:opacity-50 cursor-pointer touch-manipulation"
                >
                  {replaying === "recording" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-emerald-600" />
                  )}
                </button>
              )}
            </div>
            {recording && (
              <div className="flex flex-col items-center gap-1">
                <canvas
                  ref={waveformRef}
                  width={280}
                  height={48}
                  className="rounded-lg bg-slate-800"
                />
                <p className="text-xs text-muted-foreground">Live input — tap Stop to submit</p>
              </div>
            )}

            {backendError && (
              <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
                {backendError}
              </div>
            )}

            {result && (
              <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                {typeof result.score === "number" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Score</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          result.score >= 0.9
                            ? "bg-green-500"
                            : result.score >= 0.6
                              ? "bg-amber-500"
                              : "bg-red-500/70"
                        )}
                        style={{ width: `${Math.round(result.score * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono tabular-nums w-10 text-right">
                      {(result.score * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {result.correct ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle className="w-5 h-5" />
                      Correct! साधु (sādhu).
                    </div>
                    {result.feedback_english && (
                      <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In English</p>
                        <p className="text-sm text-foreground">{result.feedback_english}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-amber-600 font-medium">
                      <XCircle className="w-5 h-5" />
                      Heard:{" "}
                      <span style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{result.heard || "—"}</span>
                      <span className="font-mono text-muted-foreground">({result.heard_iast || result.heard || "—"})</span>
                    </div>
                    {result.feedback_english && (
                      <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">In English (what the voice said)</p>
                        <p className="text-sm text-foreground">{result.feedback_english}</p>
                      </div>
                    )}
                    {result.error_types?.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Focus: {result.error_types.join(", ")}
                      </p>
                    )}
                  </>
                )}
                {feedbackAudioUrl && (
                  <button
                    type="button"
                    onClick={handleReplayFeedback}
                    disabled={replaying === "feedback"}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-sm"
                  >
                    {replaying === "feedback" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    Replay feedback
                  </button>
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
