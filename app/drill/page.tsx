"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import phonemesData from "@/data/phonemes.json";
import { DrillCard } from "@/components/DrillCard";
import {
  createEmptyFSRSState,
  scheduleCard,
  type Rating,
} from "@/lib/fsrs";
import {
  saveCardState,
  getAllCardStates,
  markDrillLevelCompleted,
  isDrillLevelUnlocked,
  type DrillLevelKey,
} from "@/lib/storage";
import { playPhonemeAudio } from "@/lib/audio";
import {
  getMixedOptions,
  getSameGroupRomanOptions,
} from "@/lib/drillUtils";
import { blobToWavBlob } from "@/lib/audioUtils";
import { matchByPixels } from "@/lib/drawRecognize";
import { DrawCanvas, type DrawCanvasHandle } from "@/components/DrawCanvas";
import { Volume2, Loader2, Ear, Mic, Pencil, Sparkles, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import type { Phoneme, DrillMode } from "@/lib/types";

const phonemes = phonemesData as Phoneme[];
const USER_ID = "local";

const GROUPS = [
  { id: "hear", label: "Hear", icon: Ear },
  { id: "say", label: "Say", icon: Mic },
  { id: "draw", label: "Draw", icon: Pencil },
] as const;

const DIFFICULTIES = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];
type DifficultyId = (typeof DIFFICULTIES)[number]["id"];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Need score: higher = more in need of practice (difficult, low stability, lapses). */
function getNeedScore(
  phoneme: Phoneme,
  mode: string,
  cardStates: Record<string, { difficulty?: number; stability?: number; lapses?: number }>
): number {
  const key = `${phoneme.id}:${mode}`;
  const state = cardStates[key];
  if (!state) return 5; // New cards: medium priority
  const d = state.difficulty ?? 5;
  const s = state.stability ?? 0;
  const l = state.lapses ?? 0;
  return d + l * 3 + (s < 1 ? 8 : 0) + 5 / (1 + s);
}

/** Build deck with difficult phonemes first; then light shuffle within tiers. */
function buildWeightedDeck(
  due: Phoneme[],
  cardStates: Record<string, { difficulty?: number; stability?: number; lapses?: number }>,
  mode: string
): Phoneme[] {
  const getNeed = mode === "combined"
    ? (p: Phoneme) => getNeedScoreCombined(p, cardStates)
    : (p: Phoneme) => getNeedScore(p, mode, cardStates);
  const scored = due.map((p) => ({ p, need: getNeed(p) }));
  scored.sort((a, b) => b.need - a.need);
  const ordered = scored.map((s) => s.p);
  return shuffle(ordered.slice(0, Math.ceil(ordered.length * 0.7))).concat(
    shuffle(ordered.slice(Math.ceil(ordered.length * 0.7)))
  );
}

/** For combined mode: max need across all drill modes. */
function getNeedScoreCombined(
  phoneme: Phoneme,
  cardStates: Record<string, { difficulty?: number; stability?: number; lapses?: number }>
): number {
  const modes: DrillLevelKey[] = ["hear:easy", "hear:medium", "hear:hard", "say:easy", "say:medium", "say:hard", "draw:easy", "draw:medium", "draw:hard"];
  return Math.max(...modes.map((m) => getNeedScore(phoneme, m, cardStates)));
}

function getWeakPhonemes(
  phonemes: Phoneme[],
  cardStates: Record<string, { difficulty?: number; stability?: number; lapses?: number }>,
  mode: string,
  limit: number
): Phoneme[] {
  const getNeed = mode === "combined"
    ? (p: Phoneme) => getNeedScoreCombined(p, cardStates)
    : (p: Phoneme) => getNeedScore(p, mode, cardStates);
  const withState = phonemes
    .map((p) => ({ p, need: getNeed(p) }))
    .filter((x) => x.need > 6);
  withState.sort((a, b) => b.need - a.need);
  return withState.slice(0, limit).map((x) => x.p);
}

export default function DrillPage() {
  const [selectedLevel, setSelectedLevel] = useState<DrillLevelKey | null>(
    "hear:easy"
  );
  const [sessionDeck, setSessionDeck] = useState<Phoneme[]>([]);
  const [listenPlayed, setListenPlayed] = useState(false);
  const [listenPlaying, setListenPlaying] = useState(false);
  const [choice, setChoice] = useState<Phoneme | null>(null);
  const [options, setOptions] = useState<Phoneme[]>([]);
  const [recording, setRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [sayResult, setSayResult] = useState<{ correct: boolean; heard?: string; heard_iast?: string; feedback_english?: string; score?: number } | null>(null);
  const [drawFlashShown, setDrawFlashShown] = useState(false);
  const [drawHasDrawn, setDrawHasDrawn] = useState(false);
  const [drawResult, setDrawResult] = useState<{ predicted: string | null; correct: boolean; error?: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const drawCanvasRef = useRef<DrawCanvasHandle>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cardStates = useMemo(() => {
    const states = getAllCardStates();
    return Object.fromEntries(
      states.map((s) => [`${s.cardId}:${s.mode}`, s])
    ) as Record<string, (typeof states)[0]>;
  }, [refreshKey]);

  const mode = selectedLevel ?? "hear:easy";
  const [group, difficulty] =
    mode === "combined"
      ? (["combined", "easy"] as const)
      : (mode.split(":") as [GroupId, DifficultyId]);

  const duePhonemes = useMemo(() => {
    return phonemes.filter((p) => {
      const key = `${p.id}:${mode}`;
      const state = cardStates[key];
      if (!state) return true;
      return new Date() >= state.dueDate;
    });
  }, [cardStates, mode]);

  const [combinedLevels, setCombinedLevels] = useState<DrillLevelKey[]>([]);
  const [showLevelPicker, setShowLevelPicker] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<"hear" | "say" | "draw" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (
      !showLevelPicker &&
      sessionDeck.length === 0 &&
      duePhonemes.length > 0 &&
      mode !== "combined"
    ) {
      setSessionDeck(buildWeightedDeck(duePhonemes, cardStates, mode));
      setListenPlayed(false);
      setChoice(null);
      setOptions([]);
      setHasRecorded(false);
      setSayResult(null);
      setDrawFlashShown(false);
    }
  }, [showLevelPicker, duePhonemes, sessionDeck.length, mode, cardStates]);

  useEffect(() => {
    if (
      mode === "combined" &&
      sessionDeck.length === 0 &&
      duePhonemes.length > 0 &&
      combinedLevels.length === 0
    ) {
      const levels: DrillLevelKey[] = [
        "hear:easy", "hear:medium", "hear:hard",
        "say:easy", "say:medium", "say:hard",
        "draw:easy", "draw:medium", "draw:hard",
      ];
      const deck = buildWeightedDeck(duePhonemes, cardStates, mode);
      const levs = deck.map(
        () => levels[Math.floor(Math.random() * levels.length)]
      );
      setCombinedLevels(levs);
      setSessionDeck(deck);
      setListenPlayed(false);
      setChoice(null);
      setOptions([]);
      setHasRecorded(false);
    }
  }, [mode, sessionDeck.length, duePhonemes, combinedLevels.length, cardStates]);

  const currentPhoneme = sessionDeck[0];
  const currentCombinedLevel =
    mode === "combined" && combinedLevels.length > 0 ? combinedLevels[0] : null;
  const effectiveMode =
    mode === "combined" ? (currentCombinedLevel ?? "hear:easy") : mode;
  const [effGroup, effDiff] = effectiveMode.split(":") as [GroupId, DifficultyId];

  const optionCount =
    effGroup === "hear"
      ? effDiff === "medium"
        ? 2
        : 4
      : effGroup === "say"
        ? effDiff === "easy"
          ? 0
          : effDiff === "medium"
            ? 2
            : 4
        : effGroup === "draw"
          ? 4
          : 0;

  useEffect(() => {
    if (!currentPhoneme) return;
    if (effGroup === "hear" && optionCount > 0 && options.length === 0 && !choice) {
      setOptions(getMixedOptions(currentPhoneme, phonemes, optionCount));
    }
    if (effGroup === "say" && optionCount > 0 && options.length === 0 && !choice) {
      setOptions(getSameGroupRomanOptions(currentPhoneme, phonemes, optionCount));
    }
    if (effGroup === "draw" && options.length === 0 && !choice) {
      setOptions(getMixedOptions(currentPhoneme, phonemes, 4));
    }
  }, [
    effGroup,
    effDiff,
    currentPhoneme?.id,
    optionCount,
    options.length,
    choice,
  ]);

  /** Autoplay when a new card is shown (hear, draw). */
  useEffect(() => {
    if (!currentPhoneme || showLevelPicker) return;
    if (effGroup !== "hear" && effGroup !== "draw") return;
    const play = async () => {
      setListenPlaying(true);
      try {
        await playPhonemeAudio(currentPhoneme);
        setListenPlayed(true);
        if (effGroup === "hear" && optionCount > 0) {
          setOptions(getMixedOptions(currentPhoneme, phonemes, optionCount));
        }
        if (effGroup === "draw") {
          setOptions(getMixedOptions(currentPhoneme, phonemes, 4));
        }
      } finally {
        setListenPlaying(false);
      }
    };
    play();
  }, [currentPhoneme?.id, showLevelPicker, effGroup, optionCount]);

  /** Autoplay when answer is revealed (back of card). */
  const hearBack = effGroup === "hear" && choice !== null;
  const sayBack = effGroup === "say" && hasRecorded && sayResult !== null && (effDiff === "easy" || choice !== null);
  const drawBack = effGroup === "draw" && choice !== null;
  const showingBack = hearBack || sayBack || drawBack;
  useEffect(() => {
    if (!currentPhoneme || !showingBack) return;
    playPhonemeAudio(currentPhoneme).catch(() => {});
  }, [showingBack, currentPhoneme?.id]);

  const getState = useCallback(
    (p: Phoneme, m: string) =>
      cardStates[`${p.id}:${m}`] ??
      createEmptyFSRSState(p.id, USER_ID, m as DrillMode),
    [cardStates]
  );

  const advance = useCallback(() => {
    const nextDeck = sessionDeck.slice(1);
    setSessionDeck(nextDeck);
    if (mode === "combined" && combinedLevels.length > 0) {
      setCombinedLevels((l) => l.slice(1));
    }
    setRefreshKey((k) => k + 1);
    setListenPlayed(false);
    setChoice(null);
    setOptions([]);
    setHasRecorded(false);
    setSayResult(null);
    setDrawFlashShown(false);
    setDrawResult(null);
    drawCanvasRef.current?.clear();

    if (nextDeck.length === 0) {
      markDrillLevelCompleted(mode as DrillLevelKey);
      setShowLevelPicker(true);
    }
  }, [sessionDeck, mode, combinedLevels.length]);

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!currentPhoneme) return;
      const m = effectiveMode;
      const state = getState(currentPhoneme, m);
      saveCardState(scheduleCard({ ...state, mode: m }, rating));
      advance();
    },
    [currentPhoneme, effectiveMode, getState, advance]
  );

  const handlePlay = useCallback(async () => {
    if (!currentPhoneme || listenPlaying) return;
    setListenPlaying(true);
    try {
      await playPhonemeAudio(currentPhoneme);
      setListenPlayed(true);
      if (effGroup === "hear" && optionCount > 0) {
        setOptions(getMixedOptions(currentPhoneme, phonemes, optionCount));
      }
      if (effGroup === "draw") {
        setOptions(getMixedOptions(currentPhoneme, phonemes, 4));
      }
    } finally {
      setListenPlaying(false);
    }
  }, [currentPhoneme, listenPlaying, effGroup, effDiff, optionCount]);

  /** Draw medium: show correct answer for 2 sec then hide. */
  useEffect(() => {
    if (effGroup !== "draw" || effDiff !== "medium" || !listenPlayed || !currentPhoneme) return;
    setDrawFlashShown(false);
    const t = setTimeout(() => setDrawFlashShown(true), 2000);
    return () => clearTimeout(t);
  }, [effGroup, effDiff, listenPlayed, currentPhoneme?.id]);

  const handleChoice = useCallback((p: Phoneme) => setChoice(p), []);

  const handleDrawCheck = useCallback(() => {
    if (!currentPhoneme || !drawHasDrawn) return;
    const canvas = drawCanvasRef.current?.getCanvas();
    if (!canvas || options.length === 0) return;
    setAssessing(true);
    setDrawResult(null);
    requestAnimationFrame(() => {
      try {
        const matched = matchByPixels(canvas, options.map((p) => ({ devanagari: p.devanagari, id: p.id })));
        const predicted = matched?.devanagari ?? null;
        const correct = predicted === currentPhoneme.devanagari;
        setDrawResult({
          predicted,
          correct,
          error: !matched ? "Draw more clearly and try again." : undefined,
        });
      } catch {
        setDrawResult({ predicted: null, correct: false, error: "Recognition failed" });
      } finally {
        setAssessing(false);
      }
    });
  }, [currentPhoneme, drawHasDrawn, options]);

  const handleRecord = useCallback(async () => {
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
        setHasRecorded(true);

        if (effGroup === "say" && currentPhoneme) {
          setAssessing(true);
          setSayResult(null);
          try {
            const wavBlob = await blobToWavBlob(blob);
            const form = new FormData();
            form.append("audio", wavBlob, "recording.wav");
            form.append("target_text", currentPhoneme.iast);
            form.append("user_id", "local");
            const res = await fetch("/api/sabdakrida/session", { method: "POST", body: form });
            const data = await res.json();
            if (res.ok) {
              setSayResult({
                correct: data.correct ?? false,
                heard: data.heard,
                heard_iast: data.heard_iast ?? data.heard,
                feedback_english: data.feedback_english,
                score: data.score,
              });
            } else {
              setSayResult({ correct: false, heard: data?.error ?? "Assessment failed" });
            }
          } catch {
            setSayResult({ correct: false, heard: "Backend unavailable. Run Sabdakrida on port 8010." });
          } finally {
            setAssessing(false);
          }
        }
      };
      mr.stop();
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        chunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.start(100);
        setRecording(true);
      })
      .catch(() => {});
  }, [recording, effGroup, currentPhoneme]);

  const handleLevelSelect = useCallback((key: DrillLevelKey) => {
    if (key === "combined" && !isDrillLevelUnlocked("combined")) return;
    if (key !== "combined" && !isDrillLevelUnlocked(key)) return;
    setSelectedLevel(key);
    setSessionDeck([]);
    setCombinedLevels([]);
    setShowLevelPicker(false);
  }, []);

  const getPickerDifficultyStyles = (key: DrillLevelKey) => {
    if (key === "combined") return "bg-violet-500/20 text-violet-700 dark:text-violet-400 hover:bg-violet-500/30 border border-violet-500/40";
    const diff = key.split(":")[1];
    if (diff === "easy") return "drill-easy";
    if (diff === "medium") return "drill-medium";
    if (diff === "hard") return "drill-hard";
    return "bg-muted";
  };

  const weakPhonemes = useMemo(
    () => getWeakPhonemes(phonemes, cardStates, mode, 5),
    [cardStates, mode]
  );

  if (sessionDeck.length === 0 || showLevelPicker) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Pronunciation Drill</h1>
        <p className="text-muted-foreground text-sm">
          Practice vowels and consonants. Harder phonemes surface more often based on your ratings.
        </p>

        {duePhonemes.length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
            <button
              type="button"
              onClick={() => handleLevelSelect("hear:easy")}
              className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Start practice — {duePhonemes.length} phoneme{duePhonemes.length !== 1 ? "s" : ""} due
            </button>
            {weakPhonemes.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Focus today: {weakPhonemes.map((p) => p.devanagari).join(", ")} ({weakPhonemes.map((p) => p.iast).join(", ")})
              </p>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Or choose a mode and level:
          {duePhonemes.length === 0 && selectedLevel && mode !== "combined" && (
            <span className="block mt-2 text-muted-foreground">No cards due for current level.</span>
          )}
        </p>

        <div className="flex flex-wrap gap-2 items-center" ref={dropdownRef}>
          {GROUPS.map((g) => (
            <div key={g.id} className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === g.id ? null : g.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium touch-target border bg-muted hover:bg-muted/80"
              >
                <g.icon className="w-4 h-4" />
                {g.label}
                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === g.id ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === g.id && (
                <div className="absolute top-full left-0 mt-1 py-1 rounded-lg border border-border bg-card shadow-lg z-10 min-w-[120px]">
                  {DIFFICULTIES.map((d) => {
                    const key = `${g.id}:${d.id}` as DrillLevelKey;
                    const unlocked = isDrillLevelUnlocked(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (unlocked) {
                            setSelectedLevel(key);
                            setSessionDeck([]);
                            setShowLevelPicker(false);
                            setOpenDropdown(null);
                          }
                        }}
                        disabled={!unlocked}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                          unlocked ? "hover:bg-muted/80" : "opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setSelectedLevel("combined");
              setSessionDeck([]);
              setCombinedLevels([]);
              setShowLevelPicker(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium touch-target bg-violet-500/20 text-violet-700 dark:text-violet-400 hover:bg-violet-500/30 border border-violet-500/40"
          >
            <Sparkles className="w-4 h-4" />
            Combined
          </button>
        </div>
      </div>
    );
  }

  if (!currentPhoneme) return null;

  const showPickReveal = effGroup === "hear" && choice !== null;
  const showHearPickOptions =
    effGroup === "hear" &&
    listenPlayed &&
    options.length > 0 &&
    !choice;
  const showSayRomanPick = effGroup === "say" && optionCount > 0 && !choice;
  const showSayRecord =
    effGroup === "say" &&
    (effDiff === "easy" || choice !== null) &&
    !hasRecorded;
  const showSayReveal = effGroup === "say" && hasRecorded && sayResult !== null && (effDiff === "easy" || choice !== null);
  const showDrawOptions =
    effGroup === "draw" &&
    listenPlayed &&
    options.length > 0 &&
    (effDiff !== "medium" || drawFlashShown);
  const showDrawReveal = effGroup === "draw" && drawResult !== null;

  const getDifficultyStyles = (key: DrillLevelKey, isActive: boolean) => {
    if (key === "combined") return isActive ? "bg-violet-500/25 text-violet-700 dark:text-violet-400 border border-violet-500/50" : "bg-muted hover:bg-muted/80";
    const diff = key.split(":")[1];
    if (diff === "easy") return isActive ? "drill-easy-active border" : "drill-easy border";
    if (diff === "medium") return isActive ? "drill-medium-active border" : "drill-medium border";
    if (diff === "hard") return isActive ? "drill-hard-active border" : "drill-hard border";
    return "bg-muted";
  };

  const ModeButton = ({ groupId, label, icon }: { groupId: "hear" | "say" | "draw"; label: string; icon: React.ReactNode }) => {
    const isOpen = openDropdown === groupId;
    const isActive = mode !== "combined" && effGroup === groupId;
    return (
      <div className="relative">
        <button
            type="button"
            onClick={() => setOpenDropdown(isOpen ? null : groupId)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium touch-target border ${
              isActive ? (effDiff === "easy" ? "drill-easy-active" : effDiff === "medium" ? "drill-medium-active" : "drill-hard-active") : "bg-muted hover:bg-muted/80"
            }`}
          >
            {icon}
            {label}
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 py-1 rounded-lg border border-border bg-card shadow-lg z-10 min-w-[120px]">
              {DIFFICULTIES.map((d) => {
                const key = `${groupId}:${d.id}` as DrillLevelKey;
                const unlocked = isDrillLevelUnlocked(key);
                const active = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (unlocked) {
                        handleLevelSelect(key);
                        setOpenDropdown(null);
                      }
                    }}
                    disabled={!unlocked}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                      active ? "bg-primary/15 font-medium" : "hover:bg-muted/80"
                    } ${!unlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Pronunciation Drill</h1>
        <div className="flex flex-wrap gap-2 items-center" ref={dropdownRef}>
          <ModeButton groupId="hear" label="Hear" icon={<Ear className="w-4 h-4" />} />
          <ModeButton groupId="say" label="Say" icon={<Mic className="w-4 h-4" />} />
          <ModeButton groupId="draw" label="Draw" icon={<Pencil className="w-4 h-4" />} />
          <button
            type="button"
            onClick={() => handleLevelSelect("combined")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium touch-target ${
              mode === "combined" ? "bg-violet-500/25 text-violet-700 dark:text-violet-400 border border-violet-500/50" : "bg-muted hover:bg-muted/80 border border-transparent"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Combined
          </button>
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        {sessionDeck.length} left this session · {duePhonemes.length} due
      </p>

      {/* HEAR */}
      {effGroup === "hear" && (
        <DrillCard
          flipped={showPickReveal}
          hideRevealButton
          front={
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Listen, then pick the Devanagari you heard.
              </p>
              <button
                onClick={handlePlay}
                disabled={listenPlaying}
                className="flex items-center gap-2 mx-auto px-6 py-4 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-400 hover:bg-teal-500/30 disabled:opacity-70"
              >
                {listenPlaying ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
                {listenPlaying ? "Playing…" : "Play"}
              </button>
              {showHearPickOptions && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {options.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleChoice(p)}
                      className="flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-xl border-2 border-border hover:border-primary bg-card touch-target"
                    >
                      <span className="text-4xl font-bold">{p.devanagari}</span>
                      {effDiff === "easy" && (
                        <span className="font-mono text-sm text-muted-foreground">{p.iast}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          }
          back={
            showPickReveal && currentPhoneme ? (
              <div className="text-center space-y-3">
                <span className="text-6xl block">
                  {currentPhoneme.devanagari}
                </span>
                <span className="font-mono text-xl tracking-wide" style={{ fontVariant: "normal" }}>
                  {currentPhoneme.iast}
                </span>
                <button
                  onClick={() => handlePlay()}
                  disabled={listenPlaying}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-400 hover:bg-teal-500/30 disabled:opacity-70"
                >
                  {listenPlaying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                  {listenPlaying ? "Playing…" : "Play"}
                </button>
                {choice?.id !== currentPhoneme.id && (
                  <p className="text-sm text-rose-400">
                    You chose {choice?.devanagari} ({choice?.iast})
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Pick an option above.
              </div>
            )
          }
          onRate={handleRate}
        />
      )}

      {/* SAY */}
      {effGroup === "say" && (
        <DrillCard
          flipped={showSayReveal}
          hideRevealButton
          front={
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                {effDiff === "easy" && "See Devanagari and IAST. Say it. Get feedback."}
                {effDiff === "medium" && "See Devanagari, pick the correct IAST from 2 options, then say it."}
                {effDiff === "hard" && "See Devanagari, pick the correct IAST from 4 options, then say it."}
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-7xl block">{currentPhoneme.devanagari}</span>
                <button
                  onClick={() => handlePlay()}
                  disabled={listenPlaying}
                  className="shrink-0 p-2 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-400 hover:bg-teal-500/30 disabled:opacity-70"
                >
                  {listenPlaying ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>
              </div>
              {effDiff === "easy" && (
                <span className="font-mono text-xl text-muted-foreground">
                  {currentPhoneme.iast}
                </span>
              )}

              {showSayRomanPick && (
                <div className={`grid gap-2 mt-2 ${optionCount === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                  {options.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleChoice(p)}
                      className="py-3 px-4 rounded-xl border-2 border-border hover:border-primary bg-card font-mono text-lg touch-target"
                    >
                      {p.iast}
                    </button>
                  ))}
                </div>
              )}

              {showSayRecord && (
                <>
                  {effDiff !== "easy" && choice !== null && (
                    <p className="text-sm text-muted-foreground">
                      {choice.id === currentPhoneme.id
                        ? "Correct! Now record yourself."
                        : `It was ${currentPhoneme.iast}. Now record yourself.`}
                    </p>
                  )}
                  <button
                    onClick={handleRecord}
                    disabled={assessing}
                    className={`flex items-center gap-2 mx-auto px-6 py-4 rounded-xl touch-target ${
                      recording
                        ? "bg-rose-500 text-white"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {recording ? "Stop" : assessing ? "Checking…" : "Record"}
                  </button>
                </>
              )}

              {effDiff !== "easy" && !choice && optionCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Pick the correct IAST, then record
                </p>
              )}
            </div>
          }
          back={
            showSayReveal && currentPhoneme ? (
              <div className="text-center space-y-3">
                <span className="text-6xl block">
                  {currentPhoneme.devanagari}
                </span>
                <span className="font-mono text-xl">{currentPhoneme.iast}</span>
                {sayResult && (
                  <div className="space-y-2 p-4 rounded-lg bg-muted/50 text-left">
                    {sayResult.correct ? (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle className="w-5 h-5" />
                        Correct! साधु (sādhu).
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 font-medium">
                        <XCircle className="w-5 h-5" />
                        Heard: <span className="font-mono">{sayResult.heard_iast ?? sayResult.heard ?? "—"}</span>
                      </div>
                    )}
                    {sayResult.feedback_english && (
                      <p className="text-sm text-muted-foreground">{sayResult.feedback_english}</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handlePlay()}
                  disabled={listenPlaying}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-400"
                >
                  {listenPlaying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  Play
                </button>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Record to get feedback.
              </div>
            )
          }
          onRate={handleRate}
        />
      )}

      {/* DRAW */}
      {effGroup === "draw" && (
        <DrillCard
          flipped={showDrawReveal}
          hideRevealButton
          front={
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                {effDiff === "easy" && "Listen, see IAST, draw the Devanagari on the canvas."}
                {effDiff === "medium" && "Listen, see the answer for 2 seconds, then draw it."}
                {effDiff === "hard" && "Listen only. Draw the Devanagari you heard."}
              </p>
              {effDiff === "medium" && listenPlayed && !drawFlashShown && (
                <div className="text-6xl font-bold animate-pulse">
                  {currentPhoneme.devanagari}
                </div>
              )}
              <button
                onClick={handlePlay}
                disabled={listenPlaying}
                className="flex items-center gap-2 mx-auto px-6 py-4 rounded-xl bg-teal-500/20 text-teal-700 dark:text-teal-400 hover:bg-teal-500/30 disabled:opacity-70"
              >
                {listenPlaying ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
                {listenPlaying ? "Playing…" : "Play"}
              </button>
              {effDiff === "easy" && listenPlayed && (
                <span className="font-mono text-xl text-muted-foreground block">
                  {currentPhoneme.iast}
                </span>
              )}
              {showDrawOptions && (
                <>
                  <p className="text-muted-foreground text-sm mb-1">Draw one of these:</p>
                  <div className="flex items-center justify-center gap-4 text-2xl font-medium" style={{ fontFamily: "var(--font-devanagari), 'Noto Sans Devanagari', sans-serif" }}>
                    {options.map((p) => (
                      <span key={p.id}>{p.devanagari}</span>
                    ))}
                  </div>
                  <DrawCanvas
                    ref={drawCanvasRef}
                    onDrawChange={setDrawHasDrawn}
                    disabled={assessing}
                  />
                  <button
                    onClick={handleDrawCheck}
                    disabled={!drawHasDrawn || assessing}
                    className="flex items-center gap-2 mx-auto px-6 py-4 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 touch-target"
                  >
                    {assessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {assessing ? "Checking…" : "Check"}
                  </button>
                </>
              )}
            </div>
          }
          back={
            showDrawReveal && currentPhoneme ? (
              <div className="text-center space-y-3">
                <span className="text-6xl block">
                  {currentPhoneme.devanagari}
                </span>
                <span className="font-mono text-xl">{currentPhoneme.iast}</span>
                {drawResult?.correct ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle className="w-5 h-5" />
                    Correct! साधु (sādhu).
                  </div>
                ) : (
                  <div className="space-y-1">
                    {drawResult?.error ? (
                      <p className="text-sm text-amber-600">{drawResult.error}</p>
                    ) : drawResult?.predicted ? (
                      <p className="text-sm text-rose-400">
                        You drew {drawResult.predicted}. Correct: {currentPhoneme.devanagari} ({currentPhoneme.iast})
                      </p>
                    ) : (
                      <p className="text-sm text-amber-600">Recognition unavailable for this character.</p>
                    )}
                  </div>
                )}
                <button
                  onClick={() => handlePlay()}
                  disabled={listenPlaying}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-teal-500/20 text-teal-700 dark:text-teal-400"
                >
                  {listenPlaying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  Play
                </button>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Draw and tap Check.
              </div>
            )
          }
          onRate={handleRate}
        />
      )}
    </div>
  );
}
