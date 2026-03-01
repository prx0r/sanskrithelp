/**
 * Hand-drawn reference images for Devanagari characters.
 * When you draw each character once in the "form we want", we use those
 * instead of font-rendered glyphs for pixel matching.
 *
 * Storage: localStorage key "devanagari_ref_drawings"
 * Format: { [devanagari]: base64Png }
 */

const STORAGE_KEY = "devanagari_ref_drawings";

export type ReferenceDrawings = Record<string, string>;

export function getReferenceDrawings(): ReferenceDrawings {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReferenceDrawings) : {};
  } catch {
    return {};
  }
}

export function saveReferenceDrawings(refs: ReferenceDrawings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(refs));
  } catch (e) {
    console.error("Failed to save reference drawings:", e);
  }
}

export function setReference(devanagari: string, base64Png: string): void {
  const refs = getReferenceDrawings();
  refs[devanagari] = base64Png;
  saveReferenceDrawings(refs);
}

export function getReference(devanagari: string): string | null {
  return getReferenceDrawings()[devanagari] ?? null;
}

export function hasReference(devanagari: string): boolean {
  return !!getReference(devanagari);
}
