"""
Navigator — weekly arc, daily slot.
Generates weekly plan; daily brief fills today's slot from arc.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from .profile import TutorProfile, load_tutor_profile, save_tutor_profile


def _load_zones() -> dict[str, dict]:
    path = Path(__file__).resolve().parent / "config" / "zones.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _prerequisites_met(profile: TutorProfile, zone_id: str, zones: dict) -> bool:
    prereqs = zones.get(zone_id, {}).get("prerequisites", [])
    for p in prereqs:
        required_level = 1  # At least intro done
        if p == "zone_11" and zone_id == "philosophy":
            threshold = zones.get("philosophy", {}).get("zone_11_threshold", 0.7)
            # Would need zone_scores from games profile
            required_level = int(threshold * 10) if threshold else 1
        if profile.zone_levels.get(p, 0) < required_level:
            return False
    return True


def generate_weekly_arc(profile: TutorProfile) -> dict[str, Any]:
    """
    Generate weekly arc. Goals: which zones to advance. Daily slots: what to do each day.
    Stored in profile. Regenerated weekly or when user completes a level.
    """
    zones = _load_zones()
    ordered = sorted(zones.items(), key=lambda x: x[1].get("order", 99))

    goals = []
    for zone_id, meta in ordered:
        if not _prerequisites_met(profile, zone_id, zones):
            continue
        current = profile.zone_levels.get(zone_id, 0)
        max_level = meta.get("level_count", 10)
        if current < max_level:
            goals.append({
                "zone": zone_id,
                "from_level": current,
                "to_level": min(current + 2, max_level),  # Aim to advance ~2 levels
                "focus": meta.get("label", zone_id),
            })

    # Build 7 daily slots
    daily_slots = []
    for day in range(7):
        # Simple: rotate through goals, one session per day
        if goals:
            g = goals[day % len(goals)]
            daily_slots.append({
                "day": day,
                "session_type": "level",
                "zone": g["zone"],
                "level": g["from_level"] + 1,  # Next level to attempt
                "drill_recommendations": _drills_for_zone(g["zone"]),
            })
        else:
            daily_slots.append({
                "day": day,
                "session_type": "maintenance",
                "zone": None,
                "level": None,
                "drill_recommendations": ["dhatu_dash", "pronunciation"],
            })

    arc = {
        "goals": goals,
        "daily_slots": daily_slots,
        "generated_at": datetime.utcnow().isoformat(),
    }
    profile.weekly_arc = arc
    profile.last_arc_generated = datetime.utcnow()
    save_tutor_profile(profile)
    return arc


def _drills_for_zone(zone_id: str) -> list[str]:
    mapping = {
        "roots": ["dhatu_dash"],
        "phonetics": ["pronunciation"],
        "sandhi": ["sandhi_forge"],
        "karakas": ["karaka_web"],
        "compounds": ["pratyaya_reactor"],
    }
    base = mapping.get(zone_id, [])
    return base + ["pronunciation"]  # Always recommend pronunciation maintenance


def get_daily_brief(user_id: str) -> dict[str, Any]:
    """
    Get today's brief from weekly arc. Regenerates arc if missing or > 7 days old.
    """
    profile = load_tutor_profile(user_id)
    zones = _load_zones()

    now = datetime.utcnow()
    arc = profile.weekly_arc
    if not arc:
        arc = generate_weekly_arc(profile)
    elif profile.last_arc_generated:
        if isinstance(profile.last_arc_generated, str):
            try:
                last = datetime.fromisoformat(profile.last_arc_generated.replace("Z", "+00:00"))
            except ValueError:
                last = now - timedelta(days=8)
        else:
            last = profile.last_arc_generated
        if (now - last).days >= 7:
            arc = generate_weekly_arc(profile)

    # Today's slot (day 0 = first day of week, simplified)
    day_index = now.weekday()  # 0=Monday
    slots = arc.get("daily_slots", [])
    today_slot = slots[day_index % len(slots)] if slots else {}

    return {
        "today_slot": today_slot,
        "goals": arc.get("goals", []),
        "message": _format_brief_message(today_slot, zones),
    }


def _format_brief_message(slot: dict, zones: dict) -> str:
    st = slot.get("session_type")
    zone = slot.get("zone")
    level = slot.get("level")
    drills = slot.get("drill_recommendations", [])

    if st == "level" and zone and level:
        label = zones.get(zone, {}).get("label", zone)
        return f"Today: {label} Level {level}. Recommended drills: {', '.join(drills)}."
    return f"Today: Maintenance. Recommended: {', '.join(drills)}."
