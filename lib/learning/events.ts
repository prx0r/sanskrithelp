import { isCanonicalSkillId, parseSkillId } from "./skills";

export const LEARNING_EVENT_VERSION = "learning-events-v1";
export const LEARNING_EVENTS_KEY = "sanskrit_learning_events_v1";
export const MAX_LEARNING_EVENTS = 500;

export type LearningSource =
  | "simulator"
  | "drill"
  | "tutor"
  | "sabdakrida"
  | "ai-coach"
  | "practice-log"
  | "night-export";

export type LearningTaskMode =
  | "INHABIT"
  | "DECOMPILE"
  | "GENERATE"
  | "PLAY"
  | "COACH"
  | "PRACTICE";

export type AttemptModality = "text" | "audio" | "draw" | "predict" | "review";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface LearningEventBase {
  id: string;
  timestamp: string;
  type: "attempt" | "coach";
  source: LearningSource;
  schemaVersion: typeof LEARNING_EVENT_VERSION;
}

export interface AttemptEvent extends LearningEventBase {
  type: "attempt";
  skillId: string;
  taskId: string;
  mode: LearningTaskMode;
  modality: AttemptModality;
  stimulus: JsonValue;
  expected?: JsonValue;
  response?: JsonValue;
  /** Null for non-graded observations or unassessed coaching turns. */
  correct: boolean | null;
  confidence?: number;
  latencyMs?: number;
  /**
   * Which memory is being graded (vision: scheduler knows WHAT failed).
   * audio-recognition | phoneme-discrimination | lexical-recall |
   * grammar-parse | productive-speech | devanagari | chunk-automaticity
   */
  dimension?: string;
}

export interface CoachInstructionEvent extends LearningEventBase {
  type: "coach";
  source: "ai-coach";
  skillId?: string;
  taskId?: string;
  instruction: string;
  stopCondition?: string;
  model?: string;
  validation: "checked" | "fallback";
  usedEventIds: string[];
}

export type LearningEvent = AttemptEvent | CoachInstructionEvent;

export interface LearningEventLog {
  version: typeof LEARNING_EVENT_VERSION;
  exportedAt: string;
  events: LearningEvent[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonValue(value: unknown, seen = new WeakSet<object>(), depth = 0): value is JsonValue {
  if (depth > 8) return false;
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return true;
  }
  if (typeof value === "object") {
    if (seen.has(value)) return false;
    seen.add(value);
  }
  if (Array.isArray(value)) return value.every((item) => isJsonValue(item, seen, depth + 1));
  if (isRecord(value)) {
    return Object.entries(value).every(
      ([key, item]) => typeof key === "string" && isJsonValue(item, seen, depth + 1),
    );
  }
  return false;
}

function createEventId(timestampMs: number): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 0xffffffff)
          .toString(36)
          .padStart(7, "0");
  return `evt_${timestampMs.toString(36)}_${random}`;
}

function normalizeIsoTimestamp(timestamp?: string): string {
  const date = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error("Invalid event timestamp");
  return date.toISOString();
}

function validateCommonFields(event: LearningEventBase): void {
  if (!event.id || event.id.length > 160) throw new Error("Invalid event id");
  normalizeIsoTimestamp(event.timestamp);
  if (event.schemaVersion !== LEARNING_EVENT_VERSION) {
    throw new Error(`Unsupported event schema: ${event.schemaVersion}`);
  }
}

function validateOptionalMetrics(event: AttemptEvent): void {
  if (event.confidence !== undefined) {
    if (typeof event.confidence !== "number" || event.confidence < 0 || event.confidence > 1) {
      throw new Error("Confidence must be between 0 and 1");
    }
  }
  if (event.latencyMs !== undefined) {
    if (!Number.isFinite(event.latencyMs) || event.latencyMs < 0 || event.latencyMs > 12 * 60 * 60 * 1000) {
      throw new Error("Latency must be a finite non-negative duration");
    }
  }
}

function validateAttemptFields(event: AttemptEvent): void {
  if (!isCanonicalSkillId(event.skillId)) {
    throw new Error(`Attempt uses a non-canonical skill ID: ${event.skillId}`);
  }
  if (!event.taskId || event.taskId.length > 200 || /[\u0000-\u001F]/.test(event.taskId)) {
    throw new Error("Attempt requires a stable task ID");
  }
  if (!isJsonValue(event.stimulus)) throw new Error("Attempt stimulus must be JSON");
  if (event.expected !== undefined && !isJsonValue(event.expected)) {
    throw new Error("Attempt expected value must be JSON");
  }
  if (event.response !== undefined && !isJsonValue(event.response)) {
    throw new Error("Attempt response must be JSON");
  }
  if (event.correct !== null && typeof event.correct !== "boolean") {
    throw new Error("Attempt correctness must be boolean or null");
  }
  validateOptionalMetrics(event);
}

export function createAttemptEvent(
  input: Omit<AttemptEvent, "id" | "timestamp" | "type" | "schemaVersion"> & {
    id?: string;
    timestamp?: string;
  },
): AttemptEvent {
  const timestamp = normalizeIsoTimestamp(input.timestamp);
  const event: AttemptEvent = {
    ...input,
    id: input.id ?? createEventId(Date.parse(timestamp)),
    timestamp,
    type: "attempt",
    schemaVersion: LEARNING_EVENT_VERSION,
  };
  validateCommonFields(event);
  validateAttemptFields(event);
  return event;
}

export function createCoachInstructionEvent(
  input: Omit<CoachInstructionEvent, "id" | "timestamp" | "type" | "schemaVersion"> & {
    id?: string;
    timestamp?: string;
  },
): CoachInstructionEvent {
  const timestamp = normalizeIsoTimestamp(input.timestamp);
  const event: CoachInstructionEvent = {
    ...input,
    id: input.id ?? createEventId(Date.parse(timestamp)),
    timestamp,
    type: "coach",
    schemaVersion: LEARNING_EVENT_VERSION,
  };
  validateCommonFields(event);
  if (event.source !== "ai-coach") throw new Error("Coach events must use ai-coach source");
  if (!event.instruction.trim() || event.instruction.length > 2000) {
    throw new Error("Coach instruction must be non-empty text");
  }
  if (event.skillId && !isCanonicalSkillId(event.skillId)) {
    throw new Error(`Coach event uses a non-canonical skill ID: ${event.skillId}`);
  }
  if (!Array.isArray(event.usedEventIds) || event.usedEventIds.some((id) => typeof id !== "string")) {
    throw new Error("Coach event requires event IDs");
  }
  return event;
}

export function loadLearningEvents(): LearningEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LEARNING_EVENTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return mergeLearningEvents([], parsed);
  } catch {
    return [];
  }
}

export function mergeLearningEvents(
  existing: LearningEvent[],
  incoming: unknown,
): LearningEvent[] {
  const incomingEvents = Array.isArray(incoming) ? incoming : [incoming];
  const merged = new Map<string, LearningEvent>();
  for (const event of existing) merged.set(event.id, event);

  for (const candidate of incomingEvents) {
    if (!isRecord(candidate)) continue;
    if (candidate.type === "attempt") {
      const event = createAttemptEvent(candidate as Omit<
        AttemptEvent,
        "id" | "timestamp" | "type" | "schemaVersion"
      > & { id: string; timestamp: string });
      merged.set(event.id, event);
    } else if (candidate.type === "coach") {
      const event = createCoachInstructionEvent(candidate as Omit<
        CoachInstructionEvent,
        "id" | "timestamp" | "type" | "schemaVersion"
      > & { id: string; timestamp: string });
      merged.set(event.id, event);
    }
  }

  return [...merged.values()]
    .sort((a, b) =>
      a.timestamp === b.timestamp ? (a.id < b.id ? -1 : 1) : a.timestamp < b.timestamp ? -1 : 1,
    )
    .slice(-MAX_LEARNING_EVENTS);
}

export function appendLearningEvent(event: LearningEvent): LearningEvent[] {
  if (typeof window === "undefined") return [event];
  const merged = mergeLearningEvents(loadLearningEvents(), event);
  try {
    window.localStorage.setItem(LEARNING_EVENTS_KEY, JSON.stringify(merged));
  } catch {
    // Local storage may be unavailable or full; the caller still has the event.
  }
  return merged;
}

export function exportLearningLog(events: LearningEvent[]): LearningEventLog {
  return {
    version: LEARNING_EVENT_VERSION,
    exportedAt: new Date().toISOString(),
    events: mergeLearningEvents([], events),
  };
}

export function importLearningLog(payload: unknown): LearningEvent[] {
  if (!isRecord(payload) || payload.version !== LEARNING_EVENT_VERSION || !Array.isArray(payload.events)) {
    throw new Error("Unsupported learning-log export");
  }
  return mergeLearningEvents([], payload.events);
}

export function isAttemptEvent(event: LearningEvent): event is AttemptEvent {
  return event.type === "attempt";
}

export function skillFromEvent(event: AttemptEvent): string {
  return parseSkillId(event.skillId)?.id ?? event.skillId;
}
