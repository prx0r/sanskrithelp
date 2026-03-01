"""
Conceptual understanding assessment — LLM + rubric.
Uses Qwen for assessment and to generate explanatory feedback when wrong.
"""

from __future__ import annotations

import os
import json
from typing import Any

CHUTES_URL = "https://llm.chutes.ai/v1/chat/completions"
MODEL = os.environ.get("TUTOR_MODEL", "Qwen/Qwen3.5-397B-A17B-TEE")


def assess_conceptual(
    user_answer: str,
    spec: dict[str, Any],
    pass_threshold: float = 0.7,
) -> tuple[bool, str, dict[str, Any]]:
    """
    Assess conceptual understanding. LLM checks rubric.
    When wrong, generates explanatory feedback (what was missing, gentle hint).
    Returns (passed, feedback_message, meta).
    """
    criteria = spec.get("pass_criteria", {}).get("conceptual")
    if not criteria:
        return True, "", {}

    api_key = os.environ.get("CHUTES_API_KEY") or os.environ.get("CHUTES_API_TOKEN")
    if not api_key:
        return _heuristic_check(user_answer, criteria, pass_threshold)

    try:
        import urllib.request

        # Step 1: Check rubric
        check_prompt = f"""You are assessing a Sanskrit learner's conceptual understanding.

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
        payload = {
            "model": MODEL,
            "messages": [{"role": "user", "content": check_prompt}],
            "max_tokens": 30,
            "temperature": 0,
        }
        req = urllib.request.Request(
            CHUTES_URL,
            data=json.dumps(payload).encode(),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=45) as r:
            data = json.loads(r.read().decode())
        content = (
            data.get("choices", [{}])[0].get("message", {}).get("content", "") or ""
        )
        lines = [l.strip().upper() for l in content.splitlines() if l.strip()]
        hits = sum(1 for l in lines if l.startswith("Y"))
        total = min(len(criteria), len(lines)) or len(criteria)
        ratio = hits / total if total else 0.0
        passed = ratio >= pass_threshold

        criteria_missed = [
            c for c, line in zip(criteria, lines) if line and not line.startswith("Y")
        ]
        if len(lines) < len(criteria):
            criteria_missed = criteria[len(lines):] + criteria_missed
        meta = {
            "criteria_met": hits,
            "criteria_total": total,
            "ratio": ratio,
            "criteria_missed": criteria_missed[:3],
        }

        if passed:
            return True, "Your explanation demonstrates understanding. Well done!", meta

        # Step 2: Generate explanatory feedback
        feedback_prompt = f"""You are a patient Sanskrit tutor. A learner gave this answer to a conceptual question:

LEARNER: "{user_answer}"

RUBRIC (what we were looking for):
{chr(10).join(f"- {c}" for c in criteria)}

They met {hits}/{total} criteria. What they missed: {', '.join(criteria_missed[:3])}.

Write 2-4 short sentences of gentle, explanatory feedback. Do NOT just list what they missed. Instead:
1. Acknowledge what they got right (if anything)
2. Briefly explain the concept they're missing
3. Give a concrete hint or example to try again
4. Be warm and encouraging

Keep it concise. No bullet points. Write as if speaking to the learner."""
        payload2 = {
            "model": MODEL,
            "messages": [{"role": "user", "content": feedback_prompt}],
            "max_tokens": 180,
            "temperature": 0.6,
        }
        req2 = urllib.request.Request(
            CHUTES_URL,
            data=json.dumps(payload2).encode(),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req2, timeout=45) as r2:
            data2 = json.loads(r2.read().decode())
        feedback = (
            data2.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            or f"Review the concept. You met {hits}/{total} criteria. Try including: {', '.join(criteria_missed[:3])}."
        )
        return False, feedback, meta
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
