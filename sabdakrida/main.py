"""
Śabdakrīḍā — Sanskrit Pronunciation Tutor + Games
FastAPI entrypoint. Run: uvicorn sabdakrida.main:app --reload
From project root: uvicorn sabdakrida.main:app --reload
"""

import os
import sys
import tempfile
from pathlib import Path

# Ensure project root on path for games package
_project_root = Path(__file__).resolve().parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from fastapi import FastAPI, File, Form, UploadFile
from pydantic import BaseModel
from fastapi.responses import Response

from sabdakrida.assessment.mode1 import pronunciation_session
from sabdakrida.data.drill_words import DRILL_WORDS
from sabdakrida.db.profile import get_drill_priority
from sabdakrida.tts import tts_speak

app = FastAPI(title="Śabdakrīḍā", version="1.0")

# Mount games router (Dhātu Dash, user profile)
try:
    from sabdakrida.routers.games import router as games_router
    app.include_router(games_router)
except ImportError:
    pass

# Mount tutor router (proactive tutor, Navigator, sessions)
try:
    from sabdakrida.routers.tutor import router as tutor_router
    app.include_router(tutor_router)
except ImportError:
    pass


@app.get("/")
async def root():
    return {"name": "Śabdakrīḍā", "mode": "Sanskrit Pronunciation Tutor", "status": "running"}


@app.post("/session/mode1")
async def mode1_session(
    audio: UploadFile = File(...),
    target_text: str = Form(...),
    user_id: str = Form(default="default"),
):
    """Real-time pronunciation assessment — returns JSON with base64 audio."""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(await audio.read())
        audio_path = f.name
    try:
        result = await pronunciation_session(audio_path, target_text, user_id)
        return result
    finally:
        try:
            os.unlink(audio_path)
        except OSError:
            pass


@app.get("/profile/{user_id}/drills")
async def get_drill_words(user_id: str):
    """Return prioritised drill words based on user weakness profile."""
    priorities = get_drill_priority(user_id)
    drills = []
    for error_type, count in priorities[:3]:
        words = DRILL_WORDS.get(error_type, [])
        drills.append({"error_type": error_type, "count": count, "words": words})
    return {"drills": drills}


@app.post("/tts")
async def speak(
    text: str = Form(...),
    style: str = Form(default="narration"),
):
    """Speak Sanskrit text — used for teacher demonstrations."""
    audio_bytes = await tts_speak(text, style=style)
    if isinstance(audio_bytes, str):
        with open(audio_bytes, "rb") as f:
            audio_bytes = f.read()
    return Response(content=audio_bytes, media_type="audio/wav")


class FeedbackAudioBody(BaseModel):
    text: str
    style: str = "command"


@app.post("/draw/recognize")
async def draw_recognize(image: UploadFile = File(...)):
    """Recognize hand-drawn Devanagari. Returns { predicted, score }.
    Requires TensorFlow + model. Returns 501 if not implemented."""
    from fastapi.responses import JSONResponse
    try:
        from sabdakrida.draw.recognize import recognize_devanagari
    except ImportError:
        return JSONResponse(
            {"error": "Draw recognition not installed (tensorflow + model)", "predicted": None},
            status_code=501,
        )
    data = await image.read()
    try:
        result = recognize_devanagari(data)
    except ImportError:
        return JSONResponse(
            {"error": "Draw recognition requires tensorflow, numpy, Pillow", "predicted": None},
            status_code=501,
        )
    if result:
        return {"predicted": result["predicted"], "score": result.get("score")}
    return JSONResponse(
        {"error": "Recognition failed", "predicted": None},
        status_code=500,
    )


@app.post("/feedback-audio")
async def feedback_audio(body: FeedbackAudioBody):
    """Fetch feedback TTS. Called after assessment so result returns fast (Whisper-only)."""
    text, style = body.text, body.style
    audio_bytes = await tts_speak(text, style=style)
    if isinstance(audio_bytes, str):
        with open(audio_bytes, "rb") as f:
            audio_bytes = f.read()
    return Response(content=audio_bytes, media_type="audio/wav")
