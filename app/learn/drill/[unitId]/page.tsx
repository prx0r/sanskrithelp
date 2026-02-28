"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Volume2, MessageCircle, Send, Loader2, ChevronDown, ChevronUp, BookOpen, Grid3X3 } from "lucide-react";
import unitsData from "@/data/units.json";
import phonemesData from "@/data/phonemes.json";
import { PhonemeCard } from "@/components/PhonemeCard";
import { GuidedLesson } from "@/components/GuidedLesson";
import { playTTSAudio } from "@/lib/audio";
import { getCompletedPhonemesForUnit, markPhonemePassed, markUnitComplete } from "@/lib/lessonProgress";
import { cn } from "@/lib/utils";
import type { Phoneme } from "@/lib/types";

const units = unitsData as Array<{
  id: string;
  title: string;
  subtitle: string;
  overview?: string;
  phonemeIds: string[];
  order: number;
}>;
const phonemesList = phonemesData as Phoneme[];
const phonemeMap = new Map(phonemesList.map((p) => [p.id, p]));

export default function DrillPage() {
  const params = useParams();
  const unitId = params.unitId as string;
  const unit = units.find((u) => u.id === unitId);
  const phonemes = unit
    ? unit.phonemeIds
        .map((id) => phonemeMap.get(id))
        .filter((p): p is Phoneme => p != null)
    : [];

  const [overviewPlayed, setOverviewPlayed] = useState(false);
  const [mode, setMode] = useState<"guided" | "explore">("guided");
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => getCompletedPhonemesForUnit(unitId));
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handlePhonemePass = (phonemeId: string) => {
    markPhonemePassed(unitId, phonemeId, phonemes.length);
    setCompletedIds((s) => new Set([...s, phonemeId]));
  };

  const handleGuidedComplete = () => {
    markUnitComplete(unitId);
  };

  const playOverview = async () => {
    if (!unit?.overview) return;
    setOverviewPlayed(true);
    await playTTSAudio(unit.overview).catch(() => {});
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput("");
    const userMsg = { role: "user" as const, content: text };
    setChatMessages((m) => [...m, userMsg]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/unit-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId,
          messages: [...chatMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as { content?: string };
      const content = data.content ?? "I couldn't respond. Try again.";
      setChatMessages((m) => [...m, { role: "assistant", content }]);
      await playTTSAudio(content).catch(() => {});
    } catch {
      setChatMessages((m) => [...m, { role: "assistant", content: "Connection error. Try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!unit || phonemes.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Unit not found</p>
        <Link href="/learn/" className="text-primary hover:underline">
          ← Back to Learn
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/learn/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Units
        </Link>
        <h1 className="text-2xl font-bold mt-2">{unit.title}</h1>
        <p className="text-muted-foreground text-sm">{unit.subtitle}</p>
      </div>

      {unit.overview && (
        <div className="mb-8 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <button
              onClick={playOverview}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25"
            >
              <Volume2 className="w-4 h-4" />
              Overview
            </button>
            <p className="text-sm text-muted-foreground flex-1">{unit.overview}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("guided")}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
            mode === "guided" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          )}
        >
          <BookOpen className="w-4 h-4" />
          Guided
        </button>
        <button
          onClick={() => setMode("explore")}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
            mode === "explore" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
          )}
        >
          <Grid3X3 className="w-4 h-4" />
          Explore
        </button>
      </div>

      {mode === "guided" ? (
        <div className="rounded-2xl border border-border bg-card p-6 mb-8">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Play to hear each sound. Record to practice. Got it when you&apos;re ready for the next.
          </p>
          <GuidedLesson
            phonemes={phonemes}
            completedIds={completedIds}
            onPass={handlePhonemePass}
            onComplete={handleGuidedComplete}
          />
        </div>
      ) : (
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-4">
            Click Original to hear, Record to capture yours, You to play back. Letter shaded by articulation (lips = light, soft palate = dark).
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {phonemes.map((p) => (
              <PhonemeCard key={p.id} phoneme={p} />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setChatOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50"
        >
          <span className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Ask questions or say &quot;test me&quot;
          </span>
          {chatOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {chatOpen && (
          <div className="border-t border-border">
            <div className="max-h-64 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ask about pronunciation, articulation, or type &quot;test me&quot; for a drill.
                </p>
              )}
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === "user" ? "text-right" : "text-left"}
                >
                  <div
                    className={cn(
                      "inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking…</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
            <div className="flex gap-2 p-3 border-t border-border">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                placeholder="Ask or 'test me'…"
                className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
                disabled={chatLoading}
              />
              <button
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
