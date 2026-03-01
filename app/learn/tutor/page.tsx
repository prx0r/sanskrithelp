"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Loader2,
  CheckCircle,
  Play,
  ChevronDown,
  ChevronUp,
  Target,
  Send,
} from "lucide-react";
import { playSanskritTTS } from "@/lib/audio";
import {
  isZoneTutorUnlocked,
  ZONE_CONFIG,
  type ZoneId,
} from "@/lib/zoneProgress";
import { ZONE_CONSTRAINTS } from "@/lib/tutorPathwayFallback";
import { cn } from "@/lib/utils";

type SessionPhase = "select" | "active" | "result";

type TutorMessage = { role: "user" | "assistant"; content: string };
type PathwayLevel = { level: number; objectives: string[]; assessment_type?: string };
type Pathway = { zone_id: string; label: string; levels: PathwayLevel[] };
type Profile = { zone_levels: Record<string, number> };

const TUTOR_ZONES: { zone: ZoneId; levels: number[] }[] = [
  { zone: "compression", levels: [1, 2, 3, 4, 5] },
  { zone: "phonetics", levels: [1, 2, 3, 4, 5, 6, 7, 8] },
  { zone: "gradation", levels: [1, 2, 3, 4, 5] },
  { zone: "sandhi", levels: [1, 2, 3, 4, 5, 6] },
  { zone: "roots", levels: [1, 2, 3, 4, 5, 6, 7] },
  { zone: "words", levels: [1, 2, 3, 4, 5, 6, 7] },
  { zone: "suffixes", levels: [1, 2, 3, 4, 5, 6, 7, 8] },
  { zone: "karakas", levels: [1, 2, 3, 4, 5, 6, 7, 8] },
  { zone: "verbs", levels: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { zone: "compounds", levels: [1, 2, 3, 4, 5, 6, 7] },
  { zone: "reading", levels: [1, 2, 3, 4, 5] },
];

const TUTOR_SYSTEM = `You are a patient Sanskrit tutor. Guide the learner through a dialogue. Be conversational, not robotic.

RULES:
- One step at a time. Ask questions, give hints, acknowledge what they get right.
- Use IAST and Devanagari when discussing Sanskrit (e.g. अ, गच्छति, √गम्).
- If they're wrong, explain gently and give another chance. Don't just say "incorrect."
- When they demonstrate understanding, acknowledge and move to the next point.
- Keep responses concise. 2-4 sentences. No long lectures.
- Ask "Do you feel confident?" or "Want to try another?" to check in.`;

function TutorInner() {
  const searchParams = useSearchParams();
  const zoneParam = searchParams.get("zone") ?? undefined;

  const [phase, setPhase] = useState<SessionPhase>("select");
  const validZoneParam = zoneParam && TUTOR_ZONES.some((z) => z.zone === zoneParam) ? (zoneParam as ZoneId) : null;
  const initialLevel = validZoneParam ? (TUTOR_ZONES.find((z) => z.zone === validZoneParam)?.levels[0] ?? 1) : 1;
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(validZoneParam);
  const [selectedLevel, setSelectedLevel] = useState(initialLevel);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pathwayOpen, setPathwayOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    fetch(`/api/tutor/profile/default`)
      .then((r) => r.ok ? r.json() : null)
      .then((p) => p && setProfile(p))
      .catch(() => {});
  }, [phase]);

  useEffect(() => {
    if (!selectedZone) return;
    fetch(`/api/tutor/pathway/${selectedZone}`)
      .then((r) => r.ok ? r.json() : null)
      .then((p) => p && setPathway(p))
      .catch(() => {});
  }, [selectedZone]);

  const currentLevelSpec = pathway?.levels?.find((l) => l.level === selectedLevel);
  const objText = objectives.length > 0 ? objectives.join("; ") : currentLevelSpec?.objectives?.join("; ") ?? "";

  const handleStart = async (overrideLevel?: number) => {
    if (!selectedZone) return;
    const level = overrideLevel ?? selectedLevel;
    if (overrideLevel) setSelectedLevel(overrideLevel);

    const spec = pathway?.levels?.find((l) => l.level === level);
    const objs = spec?.objectives ?? [];
    setObjectives(objs);
    setLoading(true);
    setError(null);
    setMessages([]);
    setStreamingContent("");

    const zoneConstraint = selectedZone ? ZONE_CONSTRAINTS[selectedZone] ?? "" : "";
    const systemPrompt = `${TUTOR_SYSTEM}

${zoneConstraint}

CURRENT OBJECTIVES (Level ${level}): ${objs.join(". ")}

Start the dialogue. The learner is ready. Begin with your first question or instruction.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Start the dialogue. I'm ready." }],
          systemPrompt,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Failed to start");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        setError("No response");
        return;
      }

      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              full += delta;
              setStreamingContent(full);
            }
          } catch {
            // skip
          }
        }
      }
      setMessages([{ role: "assistant", content: full }]);
      setStreamingContent("");
      setPhase("active");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    setError(null);
    const userMsg: TutorMessage = { role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setStreamingContent("");
    setLoading(true);

    const chatMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
    const zoneConstraint = selectedZone ? ZONE_CONSTRAINTS[selectedZone] ?? "" : "";
    const systemPrompt = `${TUTOR_SYSTEM}

${zoneConstraint}

CURRENT OBJECTIVES: ${objText || "Guide the learner."}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages, systemPrompt }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Request failed");
        setMessages((m) => m.slice(0, -1));
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        setError("No response");
        return;
      }

      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              full += delta;
              setStreamingContent(full);
            }
          } catch {
            // skip
          }
        }
      }
      setMessages((m) => [...m, { role: "assistant", content: full }]);
      setStreamingContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async (text: string, id: string) => {
    if (!text || playingId) return;
    setPlayingId(id);
    try {
      if (/[\u0900-\u097F]/.test(text)) {
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

  const handleNewSession = () => {
    setPhase("select");
    setMessages([]);
    setStreamingContent("");
    setError(null);
    setInput("");
  };

  const unlockedZones = mounted ? TUTOR_ZONES.filter((z) => isZoneTutorUnlocked(z.zone)) : [];

  return (
    <div className="min-h-[80vh] py-8 max-w-2xl mx-auto px-4 space-y-6">
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ChevronLeft className="w-4 h-4" />
        Back to Learn
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Sanskrit Tutor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A dialogue guided by objectives. The tutor asks, you answer, it responds and guides.
        </p>
      </div>

      {selectedZone && pathway && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            type="button"
            onClick={() => setPathwayOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50"
          >
            <span className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              {pathway.label} — Pathway
            </span>
            {pathwayOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {pathwayOpen && (
            <div className="px-4 pb-4 space-y-2">
              {pathway.levels.map((lvl) => {
                const passed = (profile?.zone_levels?.[selectedZone] ?? 0) >= lvl.level;
                const current = lvl.level === selectedLevel;
                return (
                  <div
                    key={lvl.level}
                    className={cn(
                      "flex items-start gap-3 py-2 px-3 rounded-lg",
                      current && "bg-primary/10 border border-primary/30",
                      passed && !current && "opacity-80"
                    )}
                  >
                    <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                      {passed ? <CheckCircle className="w-5 h-5 text-green-500" /> : lvl.level}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Level {lvl.level}</p>
                      <p className="text-xs text-muted-foreground">{lvl.objectives?.join(" · ")}</p>
                    </div>
                    {!passed && (
                      <button
                        type="button"
                        onClick={() => { setSelectedLevel(lvl.level); setPhase("select"); }}
                        className="text-xs text-primary hover:underline shrink-0"
                      >
                        {current ? "Current" : "Start"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {phase === "select" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Choose module</h2>
            <div className="flex flex-wrap gap-2">
              {!mounted ? (
                <>
                  <div className="h-9 w-24 rounded-xl border border-border bg-muted/30 animate-pulse" />
                  <div className="h-9 w-28 rounded-xl border border-border bg-muted/30 animate-pulse" />
                  <div className="h-9 w-20 rounded-xl border border-border bg-muted/30 animate-pulse" />
                </>
              ) : unlockedZones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Complete phoneme units or zone intros to unlock.</p>
              ) : (
                unlockedZones.map(({ zone, levels }) => {
                  const cfg = ZONE_CONFIG[zone];
                  const label = cfg?.label ?? zone;
                  const passed = profile?.zone_levels?.[zone] ?? 0;
                  return (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => {
                        setSelectedZone(zone);
                        setSelectedLevel(levels.find((l) => l > passed) ?? levels[0] ?? 1);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-sm font-medium transition-colors",
                        selectedZone === zone ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent/50"
                      )}
                    >
                      {label}
                      {passed > 0 && <span className="ml-1 text-xs opacity-70">({passed}/{levels.length})</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {selectedZone && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-2">Level</h2>
              <div className="flex flex-wrap gap-2">
                {TUTOR_ZONES.find((z) => z.zone === selectedZone)?.levels.map((lvl) => {
                  const passed = (profile?.zone_levels?.[selectedZone] ?? 0) >= lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-sm font-medium transition-colors flex items-center gap-1",
                        selectedLevel === lvl ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent/50",
                        passed && "opacity-90"
                      )}
                    >
                      {passed && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                      Level {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedZone && (
            <button
              type="button"
              onClick={() => handleStart()}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Start dialogue
            </button>
          )}
        </div>
      )}

      {phase === "active" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {objText && (
            <div className="px-4 py-2 border-b border-border bg-muted/30 text-xs text-muted-foreground">
              Objectives: {objText}
            </div>
          )}
          <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
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
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <p
                      className="font-display leading-relaxed whitespace-pre-wrap"
                      style={/[\u0900-\u097F]/.test(m.content) ? { fontFamily: "var(--font-devanagari), sans-serif" } : undefined}
                    >
                      {m.content}
                    </p>
                    {m.role === "assistant" && (
                      <button
                        type="button"
                        onClick={() => playTTS(m.content, `msg-${i}`)}
                        disabled={playingId !== null}
                        className="shrink-0 p-1.5 rounded hover:bg-accent/50 disabled:opacity-50"
                        aria-label="Play"
                      >
                        {playingId === `msg-${i}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl px-4 py-2.5 bg-muted text-sm">
                  <p
                    className="font-display leading-relaxed whitespace-pre-wrap"
                    style={/[\u0900-\u097F]/.test(streamingContent) ? { fontFamily: "var(--font-devanagari), sans-serif" } : undefined}
                  >
                    {streamingContent}
                  </p>
                </div>
              </div>
            )}
            {loading && !streamingContent && (
              <div className="flex justify-start">
                <div className="rounded-xl px-4 py-2.5 bg-muted flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 p-4 border-t border-border"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Your answer…"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="touch-target px-4 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 shrink-0"
              aria-label="Send"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      )}

      {phase === "active" && (
        <button
          type="button"
          onClick={handleNewSession}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          End session
        </button>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-200">{error}</div>
      )}

      <p className="text-xs text-muted-foreground">
        Uses Chutes (Qwen) for dialogue. Ensure CHUTES_API_KEY is set.
      </p>
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center">Loading…</div>}>
      <TutorInner />
    </Suspense>
  );
}
