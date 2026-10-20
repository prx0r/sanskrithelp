import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai";
import type { LearnerObjectState } from "@/lib/sanskrit/types";
import {
  isAttemptEvent,
  mergeLearningEvents,
  type LearningEvent,
} from "@/lib/learning/events";
import { selectNextManualTask } from "@/lib/learning/coach";
import {
  allowedSanskritTokens,
  extractCandidateJson,
  findUnverifiedSanskrit,
  sanitizeModelAction,
} from "@/lib/learning/coachPlan";
import type { Mode } from "@/lib/sanskrit/types";

const MODES: Mode[] = ["INHABIT", "DECOMPILE", "GENERATE", "PLAY"];

interface CoachRequestContext {
  mode: Mode;
  taskId: string;
  skillId?: string;
  stimulus?: string;
  expected?: string;
  engineState?: unknown;
}

interface CoachRequestBody {
  context?: CoachRequestContext;
  learner?: Record<string, LearnerObjectState>;
  events?: LearningEvent[];
}

function isMode(value: unknown): value is Mode {
  return typeof value === "string" && (MODES as string[]).includes(value);
}

function isLearnerRecord(value: unknown): value is Record<string, LearnerObjectState> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value as Record<string, unknown>).every(
    ([key, state]) =>
      typeof key === "string" &&
      !!state &&
      typeof state === "object" &&
      typeof (state as LearnerObjectState).recognition === "number" &&
      typeof (state as LearnerObjectState).production === "number" &&
      typeof (state as LearnerObjectState).reverseParse === "number" &&
      typeof (state as LearnerObjectState).operatorTransfer === "number" &&
      typeof (state as LearnerObjectState).errors === "number" &&
      Array.isArray((state as LearnerObjectState).confusions),
  );
}

function validateContext(context: unknown): CoachRequestContext {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    throw new Error("Coach request requires context");
  }
  const candidate = context as Record<string, unknown>;
  if (!isMode(candidate.mode)) throw new Error("Coach context requires a valid mode");
  if (typeof candidate.taskId !== "string" || !candidate.taskId.trim() || candidate.taskId.length > 200) {
    throw new Error("Coach context requires a stable task ID");
  }
  for (const key of ["skillId", "stimulus", "expected"] as const) {
    const value = candidate[key];
    if (value !== undefined && (typeof value !== "string" || value.length > 2000)) {
      throw new Error(`Coach context field ${key} must be short text`);
    }
  }
  return {
    mode: candidate.mode,
    taskId: candidate.taskId.trim(),
    skillId: typeof candidate.skillId === "string" ? candidate.skillId : undefined,
    stimulus: typeof candidate.stimulus === "string" ? candidate.stimulus : undefined,
    expected: typeof candidate.expected === "string" ? candidate.expected : undefined,
    engineState: candidate.engineState,
  };
}

function deterministicInstruction(context: CoachRequestContext): string {
  const focus = context.skillId ? ` Work only on ${context.skillId}.` : "";
  const stimulus = context.stimulus ? ` Start from: ${context.stimulus}.` : "";
  return `Do one testable ${context.mode.toLowerCase()} action.${focus}${stimulus} Predict the result aloud, check it with the on-screen validator, then record whether the prediction matched.`;
}

export async function POST(req: Request) {
  let body: CoachRequestBody;
  try {
    body = (await req.json()) as CoachRequestBody;
  } catch {
    return NextResponse.json({ error: "Coach request must be JSON" }, { status: 400 });
  }

  let context: CoachRequestContext;
  try {
    context = validateContext(body.context);
    if (body.learner !== undefined && !isLearnerRecord(body.learner)) {
      throw new Error("Learner snapshot must be a skill-score record");
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid coach request" },
      { status: 400 },
    );
  }

  let events: LearningEvent[] = [];
  try {
    events = mergeLearningEvents([], body.events ?? []);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid learning events" },
      { status: 400 },
    );
  }

  const learner = body.learner ?? {};
  const task = selectNextManualTask({
    learner,
    events,
    current: {
      mode: context.mode,
      taskId: context.taskId,
      skillId: context.skillId,
      stimulus: context.stimulus ?? "Current simulator selection",
      expected: context.expected,
    },
  });

  // The model may clarify wording only. Grammar facts remain in `task`.
  const allowed = allowedSanskritTokens({
    task,
    context: {
      skillId: context.skillId,
      stimulus: context.stimulus,
      expected: context.expected,
      engineState: context.engineState,
    },
  });

  const fallbackInstruction = deterministicInstruction(context);
  const basePrompt = [
    "You are a concise Sanskrit practice coach.",
    "Rewrite the deterministic instruction in one or two short sentences.",
    "Do not introduce new Sanskrit words, roots, operators, forms, loci, or rule names.",
    "Use only the exact Sanskrit terms already supplied.",
    "Keep any [BRACKETED-TOKEN] unchanged.",
    "Return JSON only: {\"instruction\": string, \"stopCondition\": string}.",
    `Deterministic instruction: ${fallbackInstruction}`,
    `Stop condition: ${task.stopCondition}`,
    `Allowed Sanskrit tokens: ${[...allowed].join(", ") || "(none)"}`,
  ].join("\n");

  try {
    const modelText = await chatCompletion(
      [
        { role: "system", content: basePrompt },
        {
          role: "user",
          content: `Task ${task.id}. Rephrase the instruction without changing its Sanskrit content.`,
        },
      ],
      { temperature: 0.2, maxTokens: 280 },
    );
    const action = sanitizeModelAction(extractCandidateJson(modelText));
    const unverified = findUnverifiedSanskrit(action.instruction, allowed);
    if (unverified.length > 0) {
      return NextResponse.json({
        plan: task,
        instruction: fallbackInstruction,
        stopCondition: task.stopCondition,
        fallbackUsed: true,
        fallbackReason: `Model introduced unverified Sanskrit: ${unverified.join(", ")}`,
        receivedEvents: events.filter(isAttemptEvent).length,
      });
    }
    return NextResponse.json({
      plan: task,
      instruction: action.instruction,
      stopCondition: action.stopCondition,
      fallbackUsed: false,
      receivedEvents: events.filter(isAttemptEvent).length,
    });
  } catch (error) {
    console.error("Simulator coach error:", error);
    return NextResponse.json({
      plan: task,
      instruction: fallbackInstruction,
      stopCondition: task.stopCondition,
      fallbackUsed: true,
      fallbackReason: "Coach model unavailable; deterministic instruction returned.",
      receivedEvents: events.filter(isAttemptEvent).length,
    });
  }
}
