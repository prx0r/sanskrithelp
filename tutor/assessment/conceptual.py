"""
Conceptual understanding assessment — LLM + rubric.
Rubric in session spec. LLM checks each criterion. Pass threshold configurable (default 70%).
"""

from __future__ import annotations

import os
import json
from typing import Any


def assess_conceptual(
    user_answer: str,
    spec: dict[str, Any],
    pass_threshold: float = 0.7,
) -> tuple[bool, str, dict[str, Any]]:
    """
    Assess conceptual understanding. LLM checks rubric.
    pass_criteria.conceptual = list of strings (things to check for).
    Returns (passed, feedback_message, meta).
    """
    criteria = spec.get("pass_criteria", {}).get("conceptual")
    if not criteria:
        return True, "", {}

    # Call LLM with structured prompt: check each criterion
    prompt = f"""You are assessing a Sanskrit learner's conceptual understanding.

RUBRIC (check each):
{chr(10).join(f"- {c}" for c in criteria)}

LEARNER RESPONSE:
{user_answer}

For each rubric item, respond ONLY with Y or N. One character per line, in order.
Example:
Y
N
Y
"""
    # Use Chutes if available
    api_key = os.environ.get("CHUTES_API_KEY") or os.environ.get("CHUTES_API_TOKEN")
    if not api_key:
        # Fallback: heuristic keyword check (no LLM)
        return _heuristic_check(user_answer, criteria, pass_threshold)

    try:
        import urllib.request

        payload = {
            "model": "XiaomiMiMo/MiMo-V2-Flash-TEE",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 20,
            "temperature": 0,
        }
        req = urllib.request.Request(
            "https://llm.chutes.ai/v1/chat/completions",
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode())
        content = (
            data.get("choices", [{}])[0].get("message", {}).get("content", "") or ""
        )
        # Parse Y/N lines
        lines = [l.strip().upper() for l in content.splitlines() if l.strip()]
        hits = sum(1 for l in lines if l.startswith("Y"))
        total = min(len(criteria), len(lines)) or len(criteria)
        if total == 0:
            ratio = 0.0
        else:
            ratio = hits / total
        passed = ratio >= pass_threshold
        meta = {"criteria_met": hits, "criteria_total": total, "ratio": ratio}
        if passed:
            return True, "Your explanation demonstrates understanding.", meta
        return (
            False,
            f"Review the concept. You met {hits}/{total} criteria. Try including: "
            + ", ".join(c for c, _ in zip(criteria, lines) if not _.startswith("Y")),
            meta,
        )
    except Exception as e:
        return _heuristic_check(user_answer, criteria, pass_threshold)


def _heuristic_check(
    user_answer: str, criteria: list[str], pass_threshold: float
) -> tuple[bool, str, dict[str, Any]]:
    """Fallback when LLM unavailable: crude keyword match."""
    lower = (user_answer or "").lower()
    hits = 0
    for c in criteria:
        # Check if any significant word from criterion appears
        words = [w for w in c.lower().split() if len(w) > 3]
        if any(w in lower for w in words):
            hits += 1
    total = len(criteria)
    ratio = hits / total if total else 0.0
    passed = ratio >= pass_threshold
    meta = {"criteria_met": hits, "criteria_total": total, "ratio": ratio, "heuristic": True}
    if passed:
        return True, "Your explanation touches on the key points.", meta
    return False, f"Heuristic: met {hits}/{total} criteria. Use voice/LLM for proper assessment.", meta
