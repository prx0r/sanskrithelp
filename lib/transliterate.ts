/**
 * Sanskrit IAST ↔ Devanagari transliteration.
 * Uses @indic-transliteration/sanscript for script conversion.
 */

import Sanscript from "@indic-transliteration/sanscript";

const DEVANAGARI_RE = /[\u0900-\u097F]/;

/** Convert IAST (roman) to Devanagari. */
export function iastToDevanagari(text: string): string {
  if (!text?.trim()) return text;
  try {
    return Sanscript.t(text, "iast", "devanagari");
  } catch {
    return text;
  }
}

/** Convert Devanagari to IAST (roman). */
export function devanagariToIast(text: string): string {
  if (!text?.trim() || !DEVANAGARI_RE.test(text)) return text;
  try {
    return Sanscript.t(text, "devanagari", "iast");
  } catch {
    return text;
  }
}
