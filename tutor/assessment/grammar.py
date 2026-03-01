"""
Grammar production assessment — deterministic.
Validate against conjugation tables, declension tables, corpus.
Hard fail: wrong form = wrong. No LLM.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def _load_dhatus() -> list[dict]:
    """Load dhātus from data/dhatus.json."""
    path = Path(__file__).resolve().parent.parent.parent / "data" / "dhatus.json"
    if not path.exists():
        return []
    raw = path.read_text(encoding="utf-8")
    data = json.loads(raw)
    return data if isinstance(data, list) else data.get("data", [])


# Root IAST → valid forms (IAST, normalised lowercase)
_ROOT_FORMS: dict[str, set[str]] = {}


def _build_root_forms() -> dict[str, set[str]]:
    global _ROOT_FORMS
    if _ROOT_FORMS:
        return _ROOT_FORMS
    dhatus = _load_dhatus()
    for d in dhatus:
        iast = (d.get("iast") or "").strip().lower()
        if not iast:
            continue
        forms = {iast}
        for df in d.get("derivedForms", []):
            f = (df.get("form") or "").strip().lower()
            if f:
                forms.add(f)
        for name in d.get("derivesTo", []):
            n = (name or "").strip().lower()
            if n:
                forms.add(n)
        _ROOT_FORMS[iast] = forms
        # Also key by simplified form for lookup (bhu, kri, etc.)
        simple = iast.replace("ū", "u").replace("ṛ", "r").replace("ṃ", "m").replace("ā", "a").replace("ī", "i").replace("ṭ", "t")
        if simple != iast:
            _ROOT_FORMS[simple] = forms
        if iast == "kṛ":
            _ROOT_FORMS["kri"] = forms
        if iast == "bhū":
            _ROOT_FORMS["bhu"] = forms
        if iast == "gam":
            _ROOT_FORMS["ga"] = forms
    return _ROOT_FORMS


def _normalize_iast(s: str) -> str:
    """Normalize for comparison: strip, lowercase."""
    return (s or "").strip().lower()


def assess_grammar_production(
    user_answer: str,
    spec: dict[str, Any],
    context: dict[str, Any] | None = None,
) -> tuple[bool, str]:
    """
    Assess grammar production. Deterministic.
    Returns (passed, feedback_message).
    """
    criteria = spec.get("pass_criteria", {}).get("production")
    if not criteria:
        return True, ""

    answer = _normalize_iast(user_answer)
    if not answer:
        return False, "No answer provided."

    root_forms = _build_root_forms()

    # Specific checks from criteria
    if "correct_root_for_gacchati" in criteria:
        # gacchati comes from √gam
        if answer in ("gam", "ga", "gama"):
            return True, "Correct. गच्छति derives from √गम् (gam)."
        return False, f"गच्छति (gacchati) comes from the root √गम् (gam), not {user_answer}."

    if "gacchati" in criteria:
        if answer == "gacchati":
            return True, "Correct."
        return False, f"The present 3rd person singular of √गम् is गच्छति (gacchati). You wrote: {user_answer}."

    if "produces_3_valid_forms" in criteria or "produces_5_valid_forms" in criteria:
        min_forms = 5 if "produces_5_valid_forms" in criteria else 3
        root_hint = (context or {}).get("root") or "bhu"
        if "root_kri" in criteria:
            root_hint = "kri"
        elif "root_bhu" in criteria:
            root_hint = "bhu"
        valid = root_forms.get(root_hint) or root_forms.get("kṛ" if root_hint == "kri" else "bhū") or set()
        # User might separate with comma, newline, space
        parts = [p.strip() for p in answer.replace(",", " ").replace("\n", " ").split() if p.strip()]
        found = sum(1 for p in parts if _normalize_iast(p) in valid)
        if found >= min_forms:
            return True, f"Correct. You produced {found} valid form(s)."
        return False, f"You produced {found} valid form(s). Need at least {min_forms}. Valid forms for √{root_hint} include: {', '.join(sorted(valid)[:8])}..."

    return False, "Assessment criteria not implemented for this production check."
