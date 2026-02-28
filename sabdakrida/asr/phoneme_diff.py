"""
IAST phoneme diff — character-level comparison for pronunciation diagnosis.
"""

from difflib import SequenceMatcher
import unicodedata
import re


def normalize_iast(text: str) -> str:
    """Normalize IAST/Devanagari to consistent IAST for comparison."""
    if not text:
        return ""
    # Strip whitespace, collapse spaces
    text = re.sub(r"\s+", " ", text.strip())
    # NFC normalize Unicode
    text = unicodedata.normalize("NFC", text)
    # Remove common punctuation that ASR might introduce
    text = re.sub(r"[.,;:!?\-–—]", "", text)
    return text


def phoneme_diff(target: str, heard: str) -> list[tuple[str, str]]:
    """
    Return list of (expected_char, heard_char) tuples where they differ.
    Uses difflib SequenceMatcher for character-level diff.
    """
    target_norm = normalize_iast(target)
    heard_norm = normalize_iast(heard)
    errors = []
    matcher = SequenceMatcher(None, target_norm, heard_norm)
    for opcode, a0, a1, b0, b1 in matcher.get_opcodes():
        if opcode == "replace":
            exp_slice = target_norm[a0:a1]
            got_slice = heard_norm[b0:b1]
            # Pair up character-by-character where lengths differ, handle insertions/deletions
            for i, exp in enumerate(exp_slice):
                got = got_slice[i] if i < len(got_slice) else ""
                errors.append((exp, got))
            # If heard has extra chars
            for i in range(len(exp_slice), len(got_slice)):
                errors.append(("", got_slice[i]))
    return errors


def phoneme_similarity(target: str, heard: str) -> float:
    """
    Return similarity score 0–1. Uses SequenceMatcher.ratio() on normalized text.
    Both inputs should be in same script (IAST) for valid comparison.
    """
    target_norm = normalize_iast(target)
    heard_norm = normalize_iast(heard)
    if not target_norm and not heard_norm:
        return 1.0
    if not target_norm:
        return 0.0
    matcher = SequenceMatcher(None, target_norm, heard_norm)
    return matcher.ratio()
