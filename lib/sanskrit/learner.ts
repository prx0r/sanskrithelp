import type { LearnerObjectState } from "./types";

const KEY = "sanskrit-learner-v2";

export function defaultLearner(): Record<string, LearnerObjectState> {
  return {
    "√gam": {
      id: "√gam",
      recognition: 0.98,
      production: 0.81,
      reverseParse: 0.44,
      operatorTransfer: 0.61,
      errors: 0,
      confusions: ["√nī", "causative", "kta"],
      brunoStrengthened: false,
    },
    "ṇic": {
      id: "ṇic",
      recognition: 0.9,
      production: 0.7,
      reverseParse: 0.35,
      operatorTransfer: 0.4,
      errors: 0,
      confusions: ["√gam causative"],
      brunoStrengthened: false,
    },
  };
}

export function loadLearner(): Record<string, LearnerObjectState> {
  if (typeof window === "undefined") return defaultLearner();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultLearner();
    return { ...defaultLearner(), ...JSON.parse(raw) };
  } catch {
    return defaultLearner();
  }
}

export function saveLearner(l: Record<string, LearnerObjectState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(l));
}

export function recordOutcome(
  l: Record<string, LearnerObjectState>,
  id: string,
  ok: boolean,
  wrong?: string
): Record<string, LearnerObjectState> {
  const cur = l[id] ?? {
    id,
    recognition: 0.5,
    production: 0.5,
    reverseParse: 0.2,
    operatorTransfer: 0.2,
    errors: 0,
    confusions: [],
    brunoStrengthened: false,
  };
  const next = { ...cur };
  if (ok) {
    next.recognition = Math.min(1, next.recognition + 0.04);
    next.operatorTransfer = Math.min(1, next.operatorTransfer + 0.03);
    next.production = Math.min(1, next.production + 0.02);
  } else {
    next.errors += 1;
    next.recognition = Math.max(0.05, next.recognition - 0.08);
    next.operatorTransfer = Math.max(0.05, next.operatorTransfer - 0.05);
    if (wrong && !next.confusions.includes(wrong)) next.confusions.push(wrong);
    // error-driven Bruno: strengthen once when transfer is weak
    if (next.operatorTransfer < 0.5 && !next.brunoStrengthened) {
      next.brunoStrengthened = true;
      next.confusions = [...next.confusions, `bruno:${id}`];
    }
  }
  return { ...l, [id]: next };
}

export function weakestGeneralization(
  l: Record<string, LearnerObjectState>
): { id: string; field: string; value: number } | null {
  let worst: { id: string; field: string; value: number } | null = null;
  for (const o of Object.values(l)) {
    const fields: Array<[string, number]> = [
      ["reverseParse", o.reverseParse],
      ["operatorTransfer", o.operatorTransfer],
      ["production", o.production],
    ];
    for (const [field, value] of fields) {
      if (!worst || value < worst.value) worst = { id: o.id, field, value };
    }
  }
  return worst;
}
