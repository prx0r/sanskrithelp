"""
Pronunciation assessment — probabilistic.
Whisper + phoneme_diff with tolerance thresholds.
Soft warning for slightly off phoneme. Flag unverified when user uses text.
"""

from __future__ import annotations

from typing import Any


def assess_pronunciation(
    audio_path: str | None,
    user_text: str | None,
    target_text: str,
    spec: dict[str, Any],
    strict_mode: bool = False,
) -> tuple[bool, str, dict[str, Any]]:
    """
    Assess pronunciation. Probabilistic.
    If audio_path: transcribe, phoneme_diff, score. Thresholds apply.
    If user_text only: flag unverified_pronunciation, return (False, "Use voice to verify", meta).
    Returns (passed, feedback_message, meta).
    """
    meta: dict[str, Any] = {"unverified_pronunciation": False}

    if audio_path:
        # Defer to sabdakrida.assessment.mode1 for actual transcription/diff
        try:
            import asyncio
            from sabdakrida.assessment.mode1 import pronunciation_session

            loop = asyncio.new_event_loop()
            try:
                result = loop.run_until_complete(
                    pronunciation_session(audio_path, target_text, "tutor")
                )
            finally:
                loop.close()

            score = result.get("score", 0.0)
            correct = result.get("correct", False)
            errors = result.get("errors", [])
            feedback = result.get("feedback_english", "")

            # Tolerance: strict_mode = pronunciation gate, else lenient
            threshold = 0.95 if strict_mode else 0.85
            passed = score >= threshold or correct
            meta["score"] = score
            meta["errors"] = errors
            return passed, feedback, meta

        except Exception as e:
            return False, f"Pronunciation check failed: {e}", meta

    # Text input — cannot verify pronunciation
    meta["unverified_pronunciation"] = True
    return (
        False,
        "Pronunciation cannot be verified from text. Use voice input for production checks, or this will be marked as unverified.",
        meta,
    )
