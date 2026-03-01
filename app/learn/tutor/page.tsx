"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Mic,
  Square,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
} from "lucide-react";
import { playSanskritTTS } from "@/lib/audio";
import { blobToWavBlob } from "@/lib/audioUtils";
import {
  isZoneTutorUnlocked,
  ZONE_CONFIG,
  type ZoneId,
} from "@/lib/zoneProgress";
import { cn } from "@/lib/utils";

type SessionPhase = "select" | "active" | "result";

type StartResult = {
  session_id?: string;
  zone_id?: string;
  level?: number;
  prompt?: string;
  objectives?: string[];
  assessment_type?: string;
  requires_voice?: boolean;
  target_text?: string;
  remedial?: boolean;
  message?: string;
  prerequisite_zones?: string[];
  retry_variant?: string;
  error?: string;
};

type SubmitResult = {
  passed?: boolean;
  feedback?: string;
  retries_remaining?: number;
  remedial?: { prerequisite_zones?: string[] };
  zone_level?: number;
  error?: string;
};

type RemedialInfo = { prerequisite_zones?: string[]; retry_variant?: string };

// Zones with session specs (compression, phonetics, roots)
const TUTOR_ZONES: { zone: ZoneId; levels: number[] }[] = [
  { zone: "compression", levels: [1] },
  { zone: "phonetics", levels: [1, 2] },
  { zone: "roots", levels: [1, 2, 3, 4, 5] },
];

const USER_ID = "default";


function TutorInner() {
  const searchParams = useSearchParams();
  const zoneParam = searchParams.get("zone") ?? undefined;

  const [phase, setPhase] = useState<SessionPhase>("select");
  const validZoneParam = zoneParam && TUTOR_ZONES.some((z) => z.zone === zoneParam) ? (zoneParam as ZoneId) : null;
  const initialLevel = validZoneParam ? (TUTOR_ZONES.find((z) => z.zone === validZoneParam)?.levels[0] ?? 1) : 1;
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(validZoneParam);
  const [selectedLevel, setSelectedLevel] = useState(initialLevel);
  const [prompt, setPrompt] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [assessmentType, setAssessmentType] = useState<string>("conceptual");
  const [needsVoice, setNeedsVoice] = useState(false);
  const [targetText, setTargetText] = useState<string>("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [remedial, setRemedial] = useState<RemedialInfo | null>(null);

  const [recording, setRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [phase, result]);

  const handleStart = async () => {
    if (!selectedZone) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setRemedial(null);
    try {
      const res = await fetch("/api/tutor/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          zone_id: selectedZone,
          level: selectedLevel,
        }),
      });
      const data: StartResult = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Failed to start session");
        return;
      }

      if (data.remedial) {
        setRemedial({
          prerequisite_zones: data.prerequisite_zones ?? [],
          retry_variant: data.retry_variant,
        });
        setPrompt(data.message ?? "Review prerequisites first.");
        setPhase("result");
        return;
      }

      setPrompt(data.prompt ?? "");
      setObjectives(data.objectives ?? []);
      setAssessmentType(data.assessment_type ?? "conceptual");
      setSessionId(data.session_id ?? null);
      setNeedsVoice(data.requires_voice ?? false);
      setTargetText(data.target_text ?? data.prompt?.match(/[\u0900-\u097F]+/)?.[0] ?? "अ");

      setPhase("active");
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const playPromptTTS = async () => {
    if (!prompt || playingId) return;
    setPlayingId("prompt");
    try {
      const hasDevanagari = /[\u0900-\u097F]/.test(prompt);
      if (hasDevanagari) {
        await playSanskritTTS(prompt);
      } else {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: prompt, speed: 0.9 }),
        });
        if (!res.ok) throw new Error("TTS failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await audio.play();
        audio.onended = () => URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    } finally {
      setPlayingId(null);
    }
  };

  const handleSubmit = async (audioBlob?: Blob) => {
    if (!selectedZone) return;
    if (needsVoice && !audioBlob) {
      setError("Use voice input for pronunciation assessment.");
      return;
    }
    if (!needsVoice && !input.trim()) {
      setError("Enter your answer.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("user_id", USER_ID);
      form.append("zone_id", selectedZone);
      form.append("level", String(selectedLevel));
      form.append("user_input", input.trim());

      if (audioBlob) {
        const wavBlob = await blobToWavBlob(audioBlob);
        form.append("audio", wavBlob, "recording.wav");
      }

      const res = await fetch("/api/tutor/session/submit", {
        method: "POST",
        body: form,
      });
      const data: SubmitResult = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Assessment failed");
        return;
      }

      setResult(data);
      if (data.remedial) {
        setRemedial(data.remedial);
      }
      setPhase("result");
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

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
      setError(null);
    } catch (e) {
      setError("Microphone access denied. Allow microphone and try again.");
    }
  };

  const stopRecordingAndSubmit = async () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;

    mr.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;

      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      await handleSubmit(blob);
    };
    mr.stop();
    setRecording(false);
  };

  const playFeedbackTTS = async (text: string) => {
    if (!text || playingId) return;
    setPlayingId("feedback");
    try {
      const hasDevanagari = /[\u0900-\u097F]/.test(text);
      if (hasDevanagari) {
        await playSanskritTTS(text);
      } else {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, speed: 0.9 }),
        });
        if (!res.ok) throw new Error("TTS failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await audio.play();
        audio.onended = () => URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    } finally {
      setPlayingId(null);
    }
  };

  const handleRetry = () => {
    setPhase("active");
    setResult(null);
    setError(null);
    setInput("");
  };

  const handleNewSession = () => {
    setPhase("select");
    setResult(null);
    setRemedial(null);
    setError(null);
    setPrompt("");
    setInput("");
  };

  const unlockedZones = TUTOR_ZONES.filter((z) => isZoneTutorUnlocked(z.zone));

  return (
    <div className="min-h-[80vh] py-8 max-w-2xl mx-auto px-4 space-y-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Learn
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Structured Sanskrit Tutor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Qwen-powered pathways with assessment. Sanskrit spoken via Aryan voice.
        </p>
      </div>

      {phase === "select" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">1. Choose zone</h2>
            <div className="flex flex-wrap gap-2">
              {unlockedZones.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Complete phoneme units or zone intros to unlock the tutor.
                </p>
              ) : (
                unlockedZones.map(({ zone, levels }) => {
                  const cfg = ZONE_CONFIG[zone];
                  const label = cfg?.label ?? zone;
                  return (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => {
                        setSelectedZone(zone);
                        setSelectedLevel(levels[0] ?? 1);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
                        selectedZone === zone
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-accent/50"
                      )}
                    >
                      {label}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {selectedZone && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">2. Choose level</h2>
              <div className="flex flex-wrap gap-2">
                {TUTOR_ZONES.find((z) => z.zone === selectedZone)?.levels.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
                      selectedLevel === lvl
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-accent/50"
                    )}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedZone && (
            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Start session
            </button>
          )}
        </div>
      )}

      {phase === "active" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Task</h2>
            <p
              className="font-display leading-relaxed whitespace-pre-wrap"
              style={
                prompt.includes("अ") || /[\u0900-\u097F]/.test(prompt)
                  ? { fontFamily: "var(--font-devanagari), sans-serif" }
                  : undefined
              }
            >
              {prompt}
            </p>
            <button
              type="button"
              onClick={playPromptTTS}
              disabled={playingId !== null}
              className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
            >
              {playingId === "prompt" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              Play aloud
            </button>
          </div>

          {objectives.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Objectives: {objectives.join("; ")}
            </div>
          )}

          {needsVoice ? (
            <div className="space-y-6">
              {targetText && (
                <button
                  type="button"
                  onClick={async () => {
                    if (playingId) return;
                    setPlayingId("target");
                    try {
                      await playSanskritTTS(targetText);
                    } finally {
                      setPlayingId(null);
                    }
                  }}
                  disabled={playingId !== null}
                  className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {playingId === "target" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  Listen to target: <span style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{targetText}</span>
                </button>
              )}
              <p className="text-sm text-muted-foreground">
                Pronounce the target. Use voice input for assessment.
              </p>
              {recording ? (
                <button
                  type="button"
                  onClick={stopRecordingAndSubmit}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/20 text-red-600 hover:bg-red-500/30"
                >
                  <Square className="w-5 h-5" />
                  Stop & submit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
                >
                  <Mic className="w-5 h-5" />
                  Record pronunciation
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Your answer</label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your answer…"
                  disabled={loading}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Submit
              </button>
            </form>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
      )}

      {phase === "result" && result && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            {result.passed ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-amber-500" />
            )}
            <div>
              <h2 className="font-semibold">
                {result.passed ? "Passed!" : "Try again"}
              </h2>
              {result.retries_remaining !== undefined && !result.passed && (
                <p className="text-sm text-muted-foreground">
                  {result.retries_remaining} retries remaining
                </p>
              )}
            </div>
          </div>

          {result.feedback && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Feedback</p>
              <p
                className="font-display leading-relaxed"
                style={
                  result.feedback.includes("अ") || /[\u0900-\u097F]/.test(result.feedback)
                    ? { fontFamily: "var(--font-devanagari), sans-serif" }
                    : undefined
                }
              >
                {result.feedback}
              </p>
              <button
                type="button"
                onClick={() => playFeedbackTTS(result.feedback!)}
                disabled={playingId !== null}
                className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50"
              >
                {playingId === "feedback" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                Play feedback
              </button>
            </div>
          )}

          {remedial?.prerequisite_zones && remedial.prerequisite_zones.length > 0 && (
            <div className="rounded-lg bg-amber-500/20 border border-amber-500/50 p-3 text-sm">
              <p>Review prerequisites: {remedial.prerequisite_zones.join(", ")}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!result.passed && result.retries_remaining !== undefined && result.retries_remaining > 0 && (
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-accent/50"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={handleNewSession}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground"
            >
              {result.passed ? "Next session" : "New session"}
            </button>
          </div>
        </div>
      )}

      {phase === "result" && remedial && !result && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-amber-500" />
            <h2 className="font-semibold">Review prerequisites</h2>
          </div>
          <p className="text-sm text-muted-foreground">{prompt}</p>
          {remedial.prerequisite_zones && remedial.prerequisite_zones.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {remedial.prerequisite_zones.map((z) => (
                <Link
                  key={z}
                  href={`/learn/${z}/`}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-accent/50 text-sm"
                >
                  {ZONE_CONFIG[z]?.label ?? z}
                </Link>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleNewSession}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground"
          >
            Back to session selection
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Requires Sabdakrida backend:{" "}
        <code className="bg-muted px-1 rounded">python -m uvicorn sabdakrida.main:app --port 8010</code>
      </p>

      <div ref={scrollRef} />
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center">Loading…</div>
      }
    >
      <TutorInner />
    </Suspense>
  );
}
