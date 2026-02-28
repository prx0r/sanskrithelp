"""
Mode 1 — Real-time shadowing. The full MVP.
Whisper confusion → phoneme diff → user profile → TTS feedback.
Vowel duration heuristic (Phase 3): total-duration ratio vs TTS reference.
"""

import base64
from collections import Counter

import librosa

from ..asr import whisper_transcribe, phoneme_diff
from ..data import PHONEME_CONFUSIONS, ERROR_EXPLANATIONS
from ..db import update_user_profile
from ..tts import tts_speak

LONG_VOWELS = ("ā", "ī", "ū", "ṝ")


async def _check_vowel_duration(audio_path: str, target_text: str) -> bool:
    """
    Heuristic: if target has long vowels, compare total learner duration vs TTS reference.
    Returns True if vowel_length error suspected (learner too short).
    """
    import os

    if not any(v in target_text for v in LONG_VOWELS):
        return False
    ref_path = None
    try:
        ref_path = await tts_speak(target_text, style="narration", save=True)
        learner_y, sr = librosa.load(audio_path, sr=16000)
        ref_y, _ = librosa.load(ref_path, sr=16000)
        learner_dur = len(learner_y) / sr
        ref_dur = len(ref_y) / sr
        if ref_dur > 0.1 and learner_dur / ref_dur < 0.7:
            return True
    except Exception:
        pass
    finally:
        if ref_path and os.path.exists(ref_path):
            try:
                os.unlink(ref_path)
            except OSError:
                pass
    return False


async def pronunciation_session(
    audio_path: str, target_text: str, user_id: str
) -> dict:
    """
    Core pronunciation session: transcribe, diff, update profile, speak feedback.
    """
    # 1. Transcribe with Sanskrit Whisper
    heard = await whisper_transcribe(audio_path, language="sa")

    # 2. Phoneme-level diff
    errors = phoneme_diff(target_text, heard)

    # 3. Map to error types (only (expected, heard) pairs in PHONEME_CONFUSIONS)
    error_types = []
    for e in errors:
        if e in PHONEME_CONFUSIONS:
            error_types.append(PHONEME_CONFUSIONS[e])

    # 3b. Vowel duration heuristic (Phase 3)
    if await _check_vowel_duration(audio_path, target_text):
        error_types.append("vowel_length")

    # 4. Update user weakness profile in SQLite
    if error_types:
        update_user_profile(user_id, error_types)

    # 5. Generate teacher response
    if not errors:
        response_text = "sādhu! śuddha uccāraṇā. etat samyak asti."
        style = "praise"
    else:
        primary_error = (
            Counter(error_types).most_common(1)[0][0] if error_types else None
        )
        if primary_error and primary_error in ERROR_EXPLANATIONS:
            explanation = ERROR_EXPLANATIONS[primary_error]
            response_text = f"{explanation['sanskrit']} {explanation['english']}"
            style = explanation["tone"]
        else:
            response_text = "punar vadatu. śuddhataraṃ uccāraya."
            style = "command"

    # 6. Speak the response
    audio_response = await tts_speak(response_text, style=style)
    audio_b64 = base64.b64encode(audio_response).decode("ascii") if isinstance(audio_response, bytes) else None

    return {
        "target": target_text,
        "heard": heard,
        "errors": [(str(a), str(b)) for a, b in errors],
        "error_types": error_types,
        "audio": audio_b64,
        "correct": len(errors) == 0,
    }
