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
import { Volume2, Loader2, Ear, Mic, Sparkles } from "lucide-react";
import type { Phoneme, DrillMode } from "@/lib/types";

const phonemes = phonemesData as Phoneme[];
const USER_ID = "local";

const GROUPS = [
  { id: "hear", label: "Hear", icon: Ear },
  { id: "see-say", label: "See → Say", icon: Mic },
  { id: "hear-say", label: "Hear → Say", icon: Volume2 },
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
  const modes = ["hear:easy", "hear:medium", "hear:hard", "see-say:easy", "see-say:medium", "see-say:hard", "hear-say:easy", "hear-say:medium", "hear-say:hard"];
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
  const [refreshKey, setRefreshKey] = useState(0);
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
        "see-say:easy", "see-say:medium", "see-say:hard",
        "hear-say:easy", "hear-say:medium", "hear-say:hard",
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
      : effGroup === "see-say" && effDiff === "medium"
        ? 4
        : 0;

  useEffect(() => {
    if (!currentPhoneme) return;
    if (effGroup === "hear" && optionCount > 0 && options.length === 0 && !choice) {
      setOptions(getMixedOptions(currentPhoneme, phonemes, optionCount));
    }
    if (
      effGroup === "see-say" &&
      effDiff === "medium" &&
      options.length === 0 &&
      !choice
    ) {
      setOptions(getSameGroupRomanOptions(currentPhoneme, phonemes, 4));
    }
  }, [
    effGroup,
    effDiff,
    currentPhoneme?.id,
    optionCount,
    options.length,
    choice,
  ]);

  /** Autoplay when a new card is shown. */
  useEffect(() => {
    if (!currentPhoneme || showLevelPicker) return;
    const play = async () => {
      setListenPlaying(true);
      try {
        await playPhonemeAudio(currentPhoneme);
        setListenPlayed(true);
        if (effGroup === "hear" && optionCount > 0) {
          setOptions(getMixedOptions(currentPhoneme, phonemes, optionCount));
        }
        if (effGroup === "see-say" && effDiff === "medium") {
          setOptions(getSameGroupRomanOptions(currentPhoneme, phonemes, 4));
        }
      } finally {
        setListenPlaying(false);
      }
    };
    play();
  }, [currentPhoneme?.id, showLevelPicker]);

  /** Autoplay when answer is revealed (back of card). */
  const hearBack = effGroup === "hear" && choice !== null;
  const seeSayBack =
    effGroup === "see-say" &&
    (effDiff === "medium" ? choice !== null && hasRecorded : hasRecorded);
  const hearSayBack = effGroup === "hear-say" && listenPlayed && hasRecorded;
  const showingBack = hearBack || seeSayBack || hearSayBack;
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
        setOptions(
          getMixedOptions(currentPhoneme, phonemes, optionCount)
        );
      }
      if (effGroup === "see-say" && effDiff === "medium") {
        setOptions(getSameGroupRomanOptions(currentPhoneme, phonemes, 4));
      }
    } finally {
      setListenPlaying(false);
    }
  }, [currentPhoneme, listenPlaying, effGroup, effDiff, optionCount]);

  const handleChoice = useCallback((p: Phoneme) => setChoice(p), []);

  const handleRecord = useCallback(() => {
    if (recording) {
      const mr = mediaRecorderRef.current;
      if (!mr || mr.state !== "recording") return;
      mr.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
        setRecording(false);
        setHasRecorded(true);
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
  }, [recording]);

  const handleLevelSelect = useCallback((key: DrillLevelKey) => {
    if (key === "combined" && !isDrillLevelUnlocked("combined")) return;
    if (key !== "combined" && !isDrillLevelUnlocked(key)) return;
    setSelectedLevel(key);
    setSessionDeck([]);
    setCombinedLevels([]);
    setShowLevelPicker(false);
  }, []);

  const getPickerDifficultyStyles = (key: DrillLevelKey) => {
    if (key === "combined") return "bg-amber-500/25 text-amber-700 dark:text-amber-400 hover:bg-amber-500/35 border border-amber-500/40";
    const diff = key.split(":")[1];
    if (diff === "easy") return "drill-easy hover:bg-amber-500/35";
    if (diff === "medium") return "drill-medium hover:bg-slate-400/35";
    if (diff === "hard") return "drill-hard hover:bg-rose-900/35";
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
          Or choose a group and difficulty: <span className="text-amber-500 dark:text-amber-500/90">●</span> Easy · <span className="text-slate-400">○</span> Medium · <span className="text-rose-400">◆</span> Hard
          {duePhonemes.length === 0 && selectedLevel && mode !== "combined" && (
            <span className="block mt-2 text-amber-500/90">No cards due for current level.</span>
          )}
        </p>

        <div className="space-y-6">
          {GROUPS.map((g) => (
            <div key={g.id} className="space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <g.icon className="w-4 h-4" />
                {g.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((d) => {
                  const key = `${g.id}:${d.id}` as DrillLevelKey;
                  const unlocked = isDrillLevelUnlocked(key);
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (unlocked) {
                          setSelectedLevel(key);
                          setSessionDeck([]);
                          setShowLevelPicker(false);
                        }
                      }}
                      disabled={!unlocked}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium touch-target border ${
                        unlocked ? getPickerDifficultyStyles(key) : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      {unlocked && <span className="w-1.5 h-1.5 rounded-full bg-current/70" />}
                      {d.id === "easy" ? "●" : d.id === "medium" ? "○" : "◆"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="w-4 h-4" />
              Combined
            </div>
            <button
              onClick={() => {
                setSelectedLevel("combined");
                setSessionDeck([]);
                setCombinedLevels([]);
                setShowLevelPicker(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium touch-target bg-amber-500/25 text-amber-700 dark:text-amber-400 hover:bg-amber-500/35 border border-amber-500/40"
            >
              All modes mixed
            </button>
          </div>
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
  const showSeeSayRomanPick =
    effGroup === "see-say" && effDiff === "medium" && !choice;
  const showSeeSayRecord =
    effGroup === "see-say" &&
    (effDiff !== "medium" || choice !== null) &&
    !hasRecorded;
  const showSeeSayRevealFinal =
    effGroup === "see-say" &&
    (effDiff === "medium" ? choice !== null && hasRecorded : hasRecorded);
  const showHearSayReveal =
    effGroup === "hear-say" && listenPlayed && hasRecorded;

  const getDifficultyStyles = (key: DrillLevelKey, isActive: boolean) => {
    if (key === "combined") return isActive ? "bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/50" : "bg-muted hover:bg-muted/80";
    const diff = key.split(":")[1];
    if (diff === "easy") return isActive ? "drill-easy-active border" : "drill-easy border";
    if (diff === "medium") return isActive ? "drill-medium-active border" : "drill-medium border";
    if (diff === "hard") return isActive ? "drill-hard-active border" : "drill-hard border";
    return "bg-muted";
  };

  const LEVEL_BUTTONS: { key: DrillLevelKey; icon: React.ReactNode; label: string; diff?: string }[] = [
    ...GROUPS.flatMap((g) =>
      DIFFICULTIES.map((d) => ({
        key: `${g.id}:${d.id}` as DrillLevelKey,
        icon: g.id === "hear" ? <Ear className="w-4 h-4" /> : g.id === "see-say" ? <Mic className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />,
        label: g.label,
        diff: d.id,
      }))
    ),
    { key: "combined", icon: <Sparkles className="w-4 h-4" />, label: "Combined" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Pronunciation Drill</h1>
        <div className="flex flex-wrap gap-2">
          {LEVEL_BUTTONS.map(({ key, icon, label, diff }) => {
            const unlocked = isDrillLevelUnlocked(key);
            const isActive = mode === key;
            return (
              <button
                key={key}
                onClick={() => unlocked && handleLevelSelect(key)}
                disabled={!unlocked}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium touch-target ${getDifficultyStyles(key, isActive)}`}
              >
                {icon}
                {label}
                {diff && <span className="w-1.5 h-1.5 rounded-full bg-current/60" aria-label={diff} />}
              </button>
            );
          })}
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
                className="flex items-center gap-2 mx-auto px-6 py-4 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 disabled:opacity-70"
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
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 disabled:opacity-70"
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

      {/* SEE-SAY */}
      {effGroup === "see-say" && (
        <DrillCard
          flipped={showSeeSayRevealFinal}
          hideRevealButton
          front={
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                {effDiff === "easy" && "See the symbol. Say it. Hear the model."}
                {effDiff === "medium" &&
                  "See Devanagari, pick the correct roman, then say it."}
                {effDiff === "hard" && "See the symbol. Say it. No hints."}
              </p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-7xl block">{currentPhoneme.devanagari}</span>
                <button
                  onClick={() => handlePlay()}
                  disabled={listenPlaying}
                  className="shrink-0 p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 disabled:opacity-70"
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

              {showSeeSayRomanPick && (
                <div className="grid grid-cols-2 gap-2 mt-2">
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

              {showSeeSayRecord && (effDiff !== "medium" || choice !== null) && (
                <>
                  {effDiff === "medium" && choice !== null && (
                    <p className="text-sm text-muted-foreground">
                      {choice.id === currentPhoneme.id
                        ? "Correct! Now record yourself."
                        : `It was ${currentPhoneme.iast}. Now record yourself.`}
                    </p>
                  )}
                  <button
                    onClick={handleRecord}
                    className={`flex items-center gap-2 mx-auto px-6 py-4 rounded-xl touch-target ${
                      recording
                        ? "bg-rose-500 text-white"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {recording ? "Stop" : "Record"}
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Record, then tap Play to hear the model
                  </p>
                </>
              )}

              {effDiff === "medium" && !choice && (
                <p className="text-xs text-muted-foreground">
                  Pick the correct roman, then record
                </p>
              )}
            </div>
          }
          back={
            showSeeSayRevealFinal && currentPhoneme ? (
              <div className="text-center space-y-3">
                <span className="text-6xl block">
                  {currentPhoneme.devanagari}
                </span>
                <span className="font-mono text-xl">{currentPhoneme.iast}</span>
                <button
                  onClick={() => handlePlay()}
                  disabled={listenPlaying}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400"
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
                Record and tap Play to hear the model.
              </div>
            )
          }
          onRate={handleRate}
        />
      )}

      {/* HEAR-SAY */}
      {effGroup === "hear-say" && (
        <DrillCard
          flipped={showHearSayReveal}
          hideRevealButton
          front={
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Hear it. Say it back. Hear the model to compare.
                {effDiff === "medium" && (
                  <span className="block mt-1 text-2xl">
                    {currentPhoneme.devanagari}
                  </span>
                )}
              </p>
              <button
                onClick={handlePlay}
                disabled={listenPlaying}
                className="flex items-center gap-2 mx-auto px-6 py-4 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 disabled:opacity-70"
              >
                {listenPlaying ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
                {listenPlayed ? "Play again" : "Play"}
              </button>
              {listenPlayed && (
                <button
                  onClick={handleRecord}
                  className={`flex items-center gap-2 mx-auto px-6 py-4 rounded-xl touch-target ${
                    recording
                      ? "bg-rose-500 text-white"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {recording ? "Stop" : "Record"}
                </button>
              )}
            </div>
          }
          back={
            showHearSayReveal && currentPhoneme ? (
              <div className="text-center space-y-3">
                <span className="text-6xl block">
                  {currentPhoneme.devanagari}
                </span>
                <span className="font-mono text-xl">{currentPhoneme.iast}</span>
                <button
                  onClick={() => handlePlay()}
                  disabled={listenPlaying}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400"
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
                Play, record, then tap Play.
              </div>
            )
          }
          onRate={handleRate}
        />
      )}
    </div>
  );
}
