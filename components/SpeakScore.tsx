"use client";

import { useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { loadEntries, saveEntries } from "@/lib/practiceLog";

function logHindiPractice(label: string, score: number) {
  try {
    const entries = loadEntries();
    entries.push({
      date: new Date().toISOString().split("T")[0],
      type: "hindi",
      label: `Scored ${score}: ${label.slice(0, 60)}`,
      duration: 1,
    });
    saveEntries(entries);
  } catch {}
}

type AssessResult = {
  correct: boolean;
  score: number;
  feedback: string;
  errors: string[];
};

/** Speak the target line, get it scored. Keyless path = browser SpeechRecognition (Chrome). */
export default function SpeakScore({ target }: { target: string }) {
  const [state, setState] = useState<"idle" | "listening" | "scoring">("idle");
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<AssessResult | null>(null);
  const [err, setErr] = useState("");

  function supported(): boolean {
    return typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  }

  async function score(transcript: string) {
    setState("scoring");
    try {
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, target }),
      });
      const j = await res.json();
      if (j.error && !j.feedback) {
        setErr(j.error);
      } else {
        setResult(j as AssessResult);
        if (typeof j.score === "number") logHindiPractice(target, j.score);
      }
    } catch {
      setErr("Assessment unreachable. Your attempt was heard — keep practicing.");
    }
    setState("idle");
  }

  function listen() {
    setErr("");
    setResult(null);
    if (!supported()) {
      setErr("Browser speech recognition needs Chrome + mic (or CHUTES_API_KEY for server transcription).");
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SR();
    rec.lang = "hi-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setState("listening");
    rec.onresult = (e: any) => {
      const t = e.results?.[0]?.[0]?.transcript ?? "";
      setHeard(t);
      rec.stop();
      if (t.trim()) score(t.trim());
      else {
        setState("idle");
        setErr("Heard nothing — check the mic and try again.");
      }
    };
    rec.onerror = () => {
      setState("idle");
      setErr("Mic blocked or unavailable — allow microphone access and retry.");
    };
    rec.onend = () => {
      if (state === "listening") setState("idle");
    };
    try {
      rec.start();
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={listen}
        disabled={state !== "idle"}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent disabled:opacity-50"
      >
        {state === "idle" ? <Mic className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
        {state === "listening" ? "Listening… speak now" : state === "scoring" ? "Scoring…" : "Say it — get scored"}
      </button>
      {heard ? <p className="text-xs text-muted-foreground mt-1">Heard: {heard}</p> : null}
      {err ? <p className="text-xs text-red-400 mt-1">{err}</p> : null}
      {result ? (
        <div className="text-xs mt-1 rounded-lg border border-border p-2">
          <strong className={result.correct ? "text-green-400" : "text-amber-400"}>
            {result.score}/100
          </strong>{" "}
          — {result.feedback}
          {result.errors.length > 0 ? <span className="text-muted-foreground"> · {result.errors.join("; ")}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
