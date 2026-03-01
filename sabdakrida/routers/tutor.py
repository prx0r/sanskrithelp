"""
Proactive tutor API — Navigator, Session Conductor.
"""

import os
import tempfile
from fastapi import APIRouter, File, Form, UploadFile

router = APIRouter(prefix="/tutor", tags=["tutor"])


def _tutor_available() -> bool:
    try:
        from tutor.navigator import get_daily_brief
        from tutor.conductor import start_session, submit_session
        return True
    except ImportError:
        return False


@router.get("/weekly-arc/{user_id}")
async def get_weekly_arc(user_id: str):
    """Return current weekly arc. Generate if missing or older than 7 days."""
    if not _tutor_available():
        return {"error": "Tutor module not available"}
    from tutor.navigator import generate_weekly_arc
    from tutor.profile import load_tutor_profile
    from datetime import datetime, timedelta
    profile = load_tutor_profile(user_id)
    now = datetime.utcnow()
    if not profile.weekly_arc:
        return generate_weekly_arc(profile)
    last = profile.last_arc_generated
    if last and (now - last).days >= 7:
        return generate_weekly_arc(profile)
    return profile.weekly_arc


@router.get("/daily-brief/{user_id}")
async def get_daily_brief(user_id: str):
    """Today's slot from weekly arc."""
    if not _tutor_available():
        return {"error": "Tutor module not available"}
    from tutor.navigator import get_daily_brief
    return get_daily_brief(user_id)


@router.get("/session/spec/{zone_id}/{level}")
async def get_session_spec(zone_id: str, level: int):
    """Session spec for a level."""
    if not _tutor_available():
        return {"error": "Tutor module not available"}
    from tutor.conductor import _load_session_spec
    spec = _load_session_spec(zone_id, level)
    if not spec:
        return {"error": f"No spec for {zone_id} level {level}"}
    return spec


@router.post("/session/start")
async def session_start(
    user_id: str = Form(default="default"),
    zone_id: str = Form(...),
    level: int = Form(...),
):
    """Start a session. Returns first prompt."""
    if not _tutor_available():
        return {"error": "Tutor module not available"}
    from tutor.conductor import start_session
    return start_session(user_id, zone_id, level)


@router.post("/session/submit")
async def session_submit(
    user_id: str = Form(default="default"),
    zone_id: str = Form(...),
    level: int = Form(...),
    user_input: str = Form(default=""),
    audio: UploadFile = File(default=None),
):
    """Submit user response. Assess and return pass/fail."""
    if not _tutor_available():
        return {"error": "Tutor module not available"}
    from tutor.conductor import submit_session

    audio_path = None
    if audio and audio.filename:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(await audio.read())
            audio_path = f.name
        try:
            result = submit_session(user_id, zone_id, level, user_input, audio_path)
            return result
        finally:
            try:
                os.unlink(audio_path)
            except OSError:
                pass
    return submit_session(user_id, zone_id, level, user_input, None)
