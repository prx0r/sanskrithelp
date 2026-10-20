"use client";

import { useMemo, useRef, useState } from "react";
import type { Mode } from "@/lib/sanskrit/types";
import type { LearnerObjectState } from "@/lib/sanskrit/types";
import {
  appendLearningEvent,
  createCoachInstructionEvent,
  exportLearningLog,
  importLearningLog,
  loadLearningEvents,
} from "@/lib/learning/events";
import { summarizeLearner } from "@/lib/learning/coach";

interface CoachTaskContext {
  taskId: string;
  skillId?: string;
  stimulus: string;
  expected?: string;
  engineState?: Record<string, unknown>;
}

interface CoachPlan {
  instruction: string;
  stopCondition: string;
  fallbackUsed: boolean;
  fallbackReason?: string;
  plan: {
    id: string;
    title: string;
    mode: Mode;
    skillId: string;
    stimulus: string;
    expected?: string;
    checks: string[];
    stopCondition: string;
  };
}

export default function CoachManual({
  mode,
  learner,
  currentTask,
}: {
  mode: Mode;
  learner: Record<string, LearnerObjectState>;
  currentTask: CoachTaskContext;
}) {
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logSize, setLogSize] = useState(() => loadLearningEvents().length);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const summary = useMemo(
    () => summarizeLearner(learner, loadLearningEvents()),
    [learner],
  );

  async function requestCoach() {
    setLoading(true);
    setError(null);
    try {
      const recentEvents = loadLearningEvents().slice(-12);
      const res = await fetch("/api/simulator-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: {
            mode,
            taskId: currentTask.taskId,
            skillId: currentTask.skillId,
            stimulus: currentTask.stimulus,
            expected: currentTask.expected,
            engineState: currentTask.engineState ?? {},
          },
          learner,
          events: recentEvents,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? `Coach request failed: ${res.status}`);
      const nextPlan = data as CoachPlan;
      setPlan(nextPlan);
      const usedEventIds = recentEvents.map((event) => event.id);
      appendLearningEvent(
        createCoachInstructionEvent({
          source: "ai-coach",
          skillId: nextPlan.plan.skillId,
          taskId: nextPlan.plan.id,
          instruction: nextPlan.instruction,
          stopCondition: nextPlan.stopCondition,
          model: "simulator-coach",
          validation: nextPlan.fallbackUsed ? "fallback" : "checked",
          usedEventIds,
        }),
      );
      setLogSize(loadLearningEvents().length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coach request failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadLog() {
    const payload = exportLearningLog(loadLearningEvents());
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sanskrit-learning-log.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importLog(file: File) {
    try {
      const events = importLearningLog(JSON.parse(await file.text()));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "sanskrit_learning_events_v1",
          JSON.stringify(events),
        );
      }
      setLogSize(events.length);
      setError(null);
    } catch {
      setError("That file is not a supported learning-log export.");
    }
  }

  return (
    <section aria-label="Coach manual" className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Manual + AI coach</h2>
          <p className="text-xs text-muted-foreground">
            Predict first. Check the built-in validator. Ask the coach for one next step.
            Attempts stay in this browser unless you export them.
          </p>
        </div>
        <button
          type="button"
          onClick={requestCoach}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
        >
          {loading ? "Asking coach…" : "Get AI next step"}
        </button>
      </div>

      <ol className="mt-3 space-y-2 text-sm list-decimal pl-5">
        <li>Choose one mode and one testable prediction.</li>
        <li>Say or write the prediction before pressing Apply, Predict, Collide, or Hear.</li>
        <li>Read the deterministic valid/conditional/invalid result, not only the surface form.</li>
        <li>Use the coach for one focused correction, then do that task twice.</li>
      </ol>

      <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div className="rounded bg-background border border-border p-2">
          <dt>Attempts logged</dt>
          <dd className="text-foreground text-sm">{logSize}</dd>
        </div>
        <div className="rounded bg-background border border-border p-2">
          <dt>Recent accuracy</dt>
          <dd className="text-foreground text-sm">
            {summary.recentAccuracy === null ? "—" : `${Math.round(summary.recentAccuracy * 100)}%`}
          </dd>
        </div>
        <div className="rounded bg-background border border-border p-2">
          <dt>Weakest local signal</dt>
          <dd className="text-foreground text-sm">
            {summary.legacyWeakest
              ? `${summary.legacyWeakest.id} · ${summary.legacyWeakest.field}`
              : "—"}
          </dd>
        </div>
      </dl>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {plan && (
        <div className="mt-3 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm">
          <div className="font-semibold">{plan.plan.title}</div>
          <p className="mt-1">{plan.instruction}</p>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground">
            {plan.plan.checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Stop when: {plan.stopCondition}
            {plan.fallbackUsed ? " · Deterministic fallback was used." : ""}
          </p>
          {plan.fallbackReason && (
            <p className="mt-1 text-xs text-muted-foreground">{plan.fallbackReason}</p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={downloadLog}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        >
          Export attempt log
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="px-3 py-2 rounded-lg border border-border text-sm"
        >
          Import attempt log
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importLog(file);
            event.target.value = "";
          }}
        />
      </div>
    </section>
  );
}
