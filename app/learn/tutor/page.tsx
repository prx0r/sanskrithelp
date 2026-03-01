"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Send,
  Loader2,
  Volume2,
  Settings,
} from "lucide-react";
import {
  getTutorPreferences,
  saveTutorPreferences,
  NATIVE_LANGUAGES,
  KOKORO_VOICES,
  type TutorPreferences,
} from "@/lib/tutorPreferences";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

function TutorChatInner() {
  const searchParams = useSearchParams();
  const zone = searchParams.get("zone") ?? undefined;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<TutorPreferences>(() => getTutorPreferences());
  const [showSettings, setShowSettings] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPrefs(getTutorPreferences());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    setError(null);

    try {
      const chatMessages = [
        ...messages,
        { role: "user" as const, content: text },
      ].map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          progress: {},
          nativeLanguage: prefs.nativeLanguage,
          tutorVoice: prefs.tutorVoice,
          zone: zone || undefined,
        }),
      });

      const data = (await res.json()) as {
        content?: string;
        tutorVoice?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong");
        return;
      }

      const content = data.content ?? "";
      setMessages((m) => [...m, { role: "assistant", content }]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Network error. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async (content: string, id: string) => {
    if (playingId) return;
    setPlayingId(id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: content,
          voice: prefs.tutorVoice,
          speed: 0.9,
        }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setPlayingId(null);
      };
    } catch {
      setPlayingId(null);
    }
  };

  const updatePref = (p: Partial<TutorPreferences>) => {
    const next = { ...prefs, ...p };
    setPrefs(next);
    saveTutorPreferences(next);
  };

  return (
    <div className="min-h-[80vh] py-8 max-w-2xl mx-auto px-4 space-y-6">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Learn
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sanskrit Tutor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chat with Qwen — replies in your language, voice via Kokoro. Sanskrit stays in Devanagari.
            {zone && <span className="block mt-0.5 text-primary">Context: {zone}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent/50 transition-colors",
            showSettings && "bg-accent/30"
          )}
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
          <ChevronDown
            className={cn("w-4 h-4 transition-transform", showSettings && "rotate-180")}
          />
        </button>
      </div>

      {showSettings && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <h3 className="text-sm font-semibold">Tutor preferences</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Your language (Qwen responds in this)
              </label>
              <select
                value={prefs.nativeLanguage}
                onChange={(e) =>
                  updatePref({
                    nativeLanguage: e.target.value as TutorPreferences["nativeLanguage"],
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                {NATIVE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Tutor voice (Kokoro)
              </label>
              <select
                value={prefs.tutorVoice}
                onChange={(e) =>
                  updatePref({
                    tutorVoice: e.target.value as TutorPreferences["tutorVoice"],
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                {KOKORO_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card min-h-[200px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[50vh]">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Type a message to start. Try: &ldquo;Teach me अ (a)&rdquo;
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="font-display leading-relaxed whitespace-pre-wrap"
                    style={
                      m.content.includes("अ") ||
                      m.content.includes("आ") ||
                      /[\u0900-\u097F]/.test(m.content)
                        ? { fontFamily: "var(--font-devanagari), sans-serif" }
                        : undefined
                    }
                  >
                    {m.content}
                  </div>
                  {m.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => playTTS(m.content, `msg-${i}`)}
                      disabled={playingId !== null}
                      className="shrink-0 p-1.5 rounded hover:bg-accent/50 disabled:opacity-50"
                      aria-label="Play"
                    >
                      {playingId === `msg-${i}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="rounded-xl px-4 py-2.5 bg-muted flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 p-4 border-t border-border shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask or type your answer…"
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="touch-target px-4 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 shrink-0"
            aria-label="Send"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {error && (
        <div
          className="rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default function TutorChatPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center">Loading…</div>}>
      <TutorChatInner />
    </Suspense>
  );
}
