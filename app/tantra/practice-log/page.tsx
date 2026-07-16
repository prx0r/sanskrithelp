"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Flame, CalendarDays, BookOpen, Wind, CircleDot, MessageSquare } from "lucide-react";
import { loadEntries, saveEntries, getRecentPracticeSummary, type PracticeType, type Entry } from "@/lib/practiceLog";

const PRACTICE_TYPES: { type: PracticeType; label: string; icon: typeof BookOpen }[] = [
  { type: "matrika", label: "Mātṛkā Chanting", icon: CircleDot },
  { type: "breath", label: "Breath Practice", icon: Wind },
  { type: "vb", label: "Vijñāna Bhairava", icon: BookOpen },
  { type: "tattvas", label: "Tattvas Study", icon: BookOpen },
  { type: "meditation", label: "Silent Meditation", icon: MessageSquare },
];

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export default function PracticeLogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<PracticeType>("matrika");
  const [duration, setDuration] = useState(10);
  const [note, setNote] = useState("");

  useEffect(() => { setEntries(loadEntries()); }, []);

  const addEntry = useCallback(() => {
    const entry: Entry = { date: today(), type, label: PRACTICE_TYPES.find((p) => p.type === type)?.label || type, duration, note: note.trim() || undefined };
    const updated = [...entries, entry];
    setEntries(updated);
    saveEntries(updated);
    setShowForm(false);
    setNote("");
  }, [entries, type, duration, note]);

  const deleteEntry = useCallback((i: number) => {
    const updated = entries.filter((_, idx) => idx !== i);
    setEntries(updated);
    saveEntries(updated);
  }, [entries]);

  const grouped = entries.reduce<Record<string, Entry[]>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const streak = (() => {
    let count = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().split("T")[0];
      if (grouped[key]) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  })();

  const totalMin = entries.reduce((s, e) => s + e.duration, 0);

  return (
    <div className="min-h-[80vh] py-6 pb-28">
      <Link href="/tantra" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Tantra
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1">Practice Log</h1>
        <p className="text-sm text-muted-foreground">Track your daily tantra practice — the AI will see your recent sessions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Flame className="w-5 h-5 mx-auto mb-1" style={{ color: streak > 0 ? "#f97316" : "rgba(255,255,255,0.2)" }} />
          <div className="text-2xl font-bold">{streak}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Day streak</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <CalendarDays className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
          <div className="text-2xl font-bold">{entries.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total sessions</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{totalMin}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total minutes</div>
        </div>
      </div>

      {/* Add button / form */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="w-full mb-6 rounded-xl border-2 border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-all">
          + Log today&apos;s practice
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 mb-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {PRACTICE_TYPES.map((p) => (
              <button key={p.type} onClick={() => setType(p.type)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${type === p.type ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                <p.icon className="w-3 h-3" /> {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Duration:</span>
            {[5, 10, 15, 20, 30, 45].map((m) => (
              <button key={m} onClick={() => setDuration(m)} className={`text-xs px-3 py-1 rounded-full border transition-all ${duration === m ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}>
                {m}m
              </button>
            ))}
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional) — e.g. 'ka row, felt it at root'" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
          <div className="flex gap-2">
            <button onClick={addEntry} className="flex-1 rounded-lg bg-primary/20 text-primary text-sm py-2 hover:bg-primary/30 transition-all">Log</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-border text-muted-foreground text-sm px-4 py-2 hover:text-foreground transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* History */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No practice logged yet. Start with the Matrika grid or a breath practice.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="text-xs text-muted-foreground mb-2 font-medium">{date === today() ? "Today" : date}</div>
              <div className="space-y-2">
                {grouped[date].map((entry, idx) => {
                  const ptype = PRACTICE_TYPES.find((p) => p.type === entry.type);
                  const Icon = ptype?.icon || Check;
                  return (
                    <div key={`${date}-${idx}`} className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{entry.label}</div>
                        <div className="text-xs text-muted-foreground">{entry.duration} min{entry.note ? ` · ${entry.note}` : ""}</div>
                      </div>
                      <button onClick={() => deleteEntry(entries.indexOf(entry))} className="text-xs text-muted-foreground/50 hover:text-muted-foreground">✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
