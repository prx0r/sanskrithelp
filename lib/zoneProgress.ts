/**
 * Zone progress — prerequisite DAG, tutor unlock, content access.
 * Informs the whole user journey: what content they can access.
 * Syncs with lessonProgress for phonetics (phoneme units).
 */

import { getLessonProgress } from "./lessonProgress";

const STORAGE_KEY = "sanskrit_zone_progress";

// Prerequisite DAG from tutor/config/zones.json
export const ZONE_CONFIG: Record<
  string,
  { label: string; prerequisites: string[]; order: number; level_count?: number }
> = {
  compression: { label: "Pratyāhāras", prerequisites: [], order: 1, level_count: 5 },
  phonetics: { label: "Phoneme Grid", prerequisites: [], order: 2, level_count: 5 },
  gradation: { label: "Guṇa / Vṛddhi", prerequisites: ["phonetics"], order: 3, level_count: 8 },
  sandhi: { label: "Sandhi", prerequisites: ["phonetics", "gradation"], order: 4, level_count: 15 },
  roots: { label: "Dhātus", prerequisites: ["phonetics", "gradation"], order: 5, level_count: 10 },
  words: { label: "Words", prerequisites: [], order: 6, level_count: 8 },
  suffixes: { label: "Suffixes", prerequisites: ["roots"], order: 7, level_count: 10 },
  karakas: { label: "Kārakas", prerequisites: ["words"], order: 8, level_count: 10 },
  verbs: { label: "Verbs", prerequisites: ["roots"], order: 9, level_count: 12 },
  compounds: { label: "Compounds", prerequisites: ["sandhi", "karakas"], order: 10, level_count: 10 },
  reading: { label: "Reading", prerequisites: ["sandhi", "verbs"], order: 11, level_count: 10 },
  philosophy: { label: "Darśana", prerequisites: ["compounds", "reading"], order: 12, level_count: 8 },
};

export type ZoneId = keyof typeof ZONE_CONFIG;

export interface ZoneProgress {
  completedZones: ZoneId[]; // intro marked done
}

const DEFAULT_UNIT_COUNT = 9; // phoneme units

function load(): ZoneProgress {
  if (typeof window === "undefined") return { completedZones: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { completedZones: [] };
  } catch {
    return { completedZones: [] };
  }
}

function save(p: ZoneProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

/** Can user access this zone? Prerequisites must be completed. */
export function isZoneUnlocked(zoneId: string): boolean {
  const cfg = ZONE_CONFIG[zoneId];
  if (!cfg) return true;
  const completed = load().completedZones;
  return cfg.prerequisites.every((prereq) => completed.includes(prereq as ZoneId));
}

/** Has user completed this zone's intro / unlocked the tutor? Phonetics = all phoneme units. */
export function isZoneTutorUnlocked(zoneId: string): boolean {
  if (zoneId === "phonetics") {
    const lesson = getLessonProgress();
    return lesson.completedUnits.length >= DEFAULT_UNIT_COUNT;
  }
  return load().completedZones.includes(zoneId as ZoneId);
}

export function markZoneComplete(zoneId: string): void {
  const p = load();
  if (!p.completedZones.includes(zoneId as ZoneId)) {
    p.completedZones.push(zoneId as ZoneId);
    save(p);
  }
}

export function getCompletedZones(): ZoneId[] {
  return load().completedZones;
}

export function getUnlockedZones(): ZoneId[] {
  return (Object.keys(ZONE_CONFIG) as ZoneId[]).filter(isZoneUnlocked);
}
