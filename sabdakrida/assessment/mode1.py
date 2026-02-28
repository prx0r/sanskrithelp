"""
Mode 1 — Real-time shadowing. The full MVP.
Whisper confusion → phoneme diff → user profile → TTS feedback.
Score 0–1, waveform-based advice, strict perfect criteria.
"""

import base64
import os
import re
from collections import Counter

import librosa

from ..asr import whisper_transcribe, phoneme_diff, phoneme_similarity
from ..data import PHONEME_CONFUSIONS, ERROR_EXPLANATIONS
from ..db import update_user_profile, record_pronunciation_score
from ..tts import tts_speak
from .acoustic import get_generic_fallback_advice
from indic_transliteration import sanscript

_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]+")

LONG_VOWELS = ("ā", "ī", "ū", "ṝ")


def _to_iast(text: str) -> str:
    """Convert Devanagari to IAST for readable display. Pass-through if already roman."""
    if not text or not _DEVANAGARI_RE.search(text):
        return text
    try:
        return sanscript.transliterate(text, sanscript.DEVANAGARI, sanscript.IAST)
    except Exception:
        return text


async def _check_vowel_duration(audio_path: str, target_text: str) -> tuple[bool, float | None]:
    """
    Heuristic: if target has long vowels, compare total learner duration vs TTS reference.
    Returns (vowel_length_error_suspected, ref_duration) — ref_duration for acoustic advice.
    """
    if not any(v in target_text for v in LONG_VOWELS):
        return (False, None)
    ref_path = None
    try:
        ref_path = await tts_speak(target_text, style="narration", save=True)
        learner_y, sr = librosa.load(audio_path, sr=16000)
        ref_y, _ = librosa.load(ref_path, sr=16000)
        learner_dur = len(learner_y) / sr
        ref_dur = len(ref_y) / sr
        if ref_dur > 0.1 and learner_dur / ref_dur < 0.7:
            return True, ref_dur
        return False, ref_dur
    except Exception:
        return False, None
    finally:
        if ref_path and os.path.exists(ref_path):
            try:
                os.unlink(ref_path)
            except OSError:
                pass


async def pronunciation_session(
    audio_path: str, target_text: str, user_id: str
) -> dict:
    """
    Core pronunciation session: transcribe, diff, score, update profile, speak feedback.
    """
    # 1. Transcribe with Sanskrit Whisper (returns Devanagari)
    heard = await whisper_transcribe(audio_path, language="sa")
    heard_iast = _to_iast(heard)

    # 2. Phoneme diff — use IAST for both so PHONEME_CONFUSIONS matches
    errors = phoneme_diff(target_text, heard_iast)

    # 3. Score 0–1 (phoneme similarity; strict perfect = 0 errors + duration ok)
    base_score = phoneme_similarity(target_text, heard_iast)
    vowel_duration_fail, ref_dur = await _check_vowel_duration(audio_path, target_text)

    # Strict perfect: exact phoneme match AND acceptable duration for long-vowel words
    if len(errors) == 0 and not vowel_duration_fail:
        score = 1.0
    elif len(errors) == 0 and vowel_duration_fail:
        score = 0.85  # Close — duration slightly off
    else:
        score = round(base_score, 2)

    # 4. Map to error types
    error_types = []
    for e in errors:
        if e in PHONEME_CONFUSIONS:
            error_types.append(PHONEME_CONFUSIONS[e])
    if vowel_duration_fail:
        error_types.append("vowel_length")

    # 5. Update user profile
    if error_types:
        update_user_profile(user_id, error_types)
    record_pronunciation_score(user_id, target_text, score, len(errors) == 0 and not vowel_duration_fail)

    # 6. Generate teacher response (Sanskrit for TTS, English for display)
    if not errors and not vowel_duration_fail:
        response_text = "sādhu! śuddha uccāraṇā. etat samyak asti."
        feedback_english = "Well done! Clear pronunciation. That's correct."
        style = "praise"
    else:
        primary_error = (
            Counter(error_types).most_common(1)[0][0] if error_types else None
        )
        if primary_error and primary_error in ERROR_EXPLANATIONS:
            explanation = ERROR_EXPLANATIONS[primary_error]
            response_text = explanation["sanskrit"]
            feedback_english = explanation["english"]
            style = explanation["tone"]
        else:
            response_text = "punar vadatu. śuddhataraṃ uccāraya."
            feedback_english = get_generic_fallback_advice(
                audio_path, target_text, errors, ref_dur
            )
            style = "command"

    # 7. Speak the response
    audio_response = await tts_speak(response_text, style=style)
    audio_b64 = base64.b64encode(audio_response).decode("ascii") if isinstance(audio_response, bytes) else None

    return {
        "target": target_text,
        "heard": heard,
        "heard_iast": heard_iast,
        "errors": [(str(a), str(b)) for a, b in errors],
        "error_types": error_types,
        "audio": audio_b64,
        "correct": len(errors) == 0 and not vowel_duration_fail,
        "score": score,
        "feedback_english": feedback_english,
    }
