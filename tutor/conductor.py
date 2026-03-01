"""
Session conductor — runs objective-driven sessions.
Loads spec, conducts turns, assesses, updates profile.
Max 15 min. 3 retries then remedial.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from datetime import datetime

from .profile import load_tutor_profile, save_tutor_profile
from .assessment import assess_grammar_production, assess_pronunciation, assess_conceptual


def _load_session_spec(zone_id: str, level: int) -> dict[str, Any] | None:
    path = Path(__file__).resolve().parent / "config" / "session_specs" / f"{zone_id}.json"
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    for lvl in data.get("levels", []):
        if lvl.get("level") == level:
            return lvl
    return None


def start_session(user_id: str, zone_id: str, level: int) -> dict[str, Any]:
    """
    Start a session. Returns first prompt and session state.
    """
    profile = load_tutor_profile(user_id)
    spec = _load_session_spec(zone_id, level)
    if not spec:
        return {"error": f"No session spec for {zone_id} level {level}"}

    retries = profile.retries_for(zone_id, level)
    if retries >= 3:
        remedial = spec.get("remedial_on_fail", {})
        return {
            "remedial": True,
            "message": "You've had 3 attempts. Let's review prerequisite material first.",
            "prerequisite_zones": remedial.get("prerequisite_zones", []),
            "retry_variant": remedial.get("retry_variant"),
        }

    objectives = spec.get("objectives", [])
    assessment_type = spec.get("assessment_type", "conceptual")

    # First prompt — LLM could generate this; for now static
    prompt = _get_first_prompt(zone_id, level, objectives, assessment_type)

    return {
        "session_id": f"{user_id}_{zone_id}_{level}_{datetime.utcnow().timestamp()}",
        "zone_id": zone_id,
        "level": level,
        "objectives": objectives,
        "assessment_type": assessment_type,
        "max_duration_minutes": spec.get("max_duration_minutes", 15),
        "prompt": prompt,
        "started_at": datetime.utcnow().isoformat(),
    }


def _get_first_prompt(zone_id: str, level: int, objectives: list[str], assessment_type: str) -> str:
    if zone_id == "compression" and level == 1:
        return "What is a pratyāhāra? Give one example, e.g. ac or hal."
    if zone_id == "phonetics" and level == 1:
        return "Name the five places of articulation in Sanskrit. Give one example consonant from each place."
    if zone_id == "roots" and level == 1:
        return "In your own words, what is a dhātu (verbal root)? Give one example of a root and a form derived from it."
    if zone_id == "roots" and level == 2:
        return "What is the root (dhātu) of गच्छति (gacchati)? Give just the root in IAST."
    if zone_id == "roots" and level == 3:
        return "Produce 3 valid forms derived from the root √भू (bhū). You can use verbs, participles, nouns — any attested form. List them separated by commas."
    if zone_id == "roots" and level == 4:
        return "What is the present tense, 3rd person singular of the root √गम् (gam)? Give the form in IAST."
    if zone_id == "roots" and level == 5:
        return "Produce 5 different forms from the root √कृ (kṛ) across different tenses or moods. List them separated by commas."
    return f"Complete the following: {'; '.join(objectives)}"


def submit_session(
    user_id: str,
    zone_id: str,
    level: int,
    user_input: str,
    audio_path: str | None = None,
) -> dict[str, Any]:
    """
    Submit user response. Assess, return pass/fail and feedback.
    Update profile on pass. Increment retry on fail.
    """
    profile = load_tutor_profile(user_id)
    spec = _load_session_spec(zone_id, level)
    if not spec:
        return {"error": f"No session spec for {zone_id} level {level}"}

    assessment_type = spec.get("assessment_type", "conceptual")

    if assessment_type == "conceptual":
        passed, feedback, meta = assess_conceptual(user_input, spec)
    elif assessment_type == "production":
        # Grammar production; pronunciation would use audio_path
        if spec.get("pass_criteria", {}).get("pronunciation"):
            passed, feedback, meta = assess_pronunciation(
                audio_path, user_input if not audio_path else None,
                spec.get("target_text", ""), spec
            )
        else:
            passed, feedback, meta = assess_grammar_production(user_input, spec)
    else:
        passed, feedback, meta = assess_conceptual(user_input, spec)

    if passed:
        profile.pass_level(zone_id, level)
        save_tutor_profile(profile)
        return {
            "passed": True,
            "feedback": feedback,
            "zone_level": profile.zone_levels.get(zone_id, level),
        }

    retries = profile.increment_retry(zone_id, level)
    save_tutor_profile(profile)

    remedial = None
    if retries >= 3:
        remedial = spec.get("remedial_on_fail", {})

    return {
        "passed": False,
        "feedback": feedback,
        "retries_remaining": 3 - retries,
        "remedial": remedial if retries >= 3 else None,
        "meta": meta,
    }
