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

from ..asr import whisper_transcribe, phoneme_diff_with_positions, phoneme_similarity
from ..asr.phoneme_diff import get_syllable_at
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


def _check_vowel_duration_fast(audio_path: str, target_text: str) -> tuple[bool, float | None]:
    """
    Fast heuristic without TTS: if target has long vowels, require minimum duration.
    ~0.15s per char as rough reference; learner <50% of that = too fast.
    Returns (vowel_length_error_suspected, ref_duration_estimate).
    """
    if not any(v in target_text for v in LONG_VOWELS):
        return (False, None)
    try:
        learner_y, sr = librosa.load(audio_path, sr=16000)
        learner_dur = len(learner_y) / sr
        ref_estimate = max(0.5, 0.12 * len(target_text))  # rough: ~0.12s per char
        if learner_dur < ref_estimate * 0.5:
            return True, ref_estimate
        return False, ref_estimate
    except Exception:
        return False, None


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
    errors_with_pos = phoneme_diff_with_positions(target_text, heard_iast)
    errors = [(exp, got) for exp, got, _ in errors_with_pos]

    # 3. Score 0–1 (phoneme similarity; strict perfect = 0 errors + duration ok)
    base_score = phoneme_similarity(target_text, heard_iast)
    vowel_duration_fail, ref_dur = _check_vowel_duration_fast(audio_path, target_text)

    # Strict perfect: exact phoneme match AND acceptable duration for long-vowel words
    # Cap at 99% — granular similarity can't truly reach 100% (ASR/measurement limits)
    if len(errors) == 0 and not vowel_duration_fail:
        score = min(0.99, round(base_score, 2))
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

    # 6. Build position-specific feedback (e.g. vowel_length: "In śaṅkāra, the ā in kāra...")
    error_details: list[dict] = []
    for exp, got, idx in errors_with_pos:
        key = (exp, got)
        if key not in PHONEME_CONFUSIONS:
            continue
        err_type = PHONEME_CONFUSIONS[key]
        if err_type == "vowel_length" and idx >= 0:
            syllable = get_syllable_at(target_text, idx)
            if syllable:
                long_vowel = exp if exp in LONG_VOWELS else got
                if long_vowel in LONG_VOWELS:
                    error_details.append({
                        "type": "vowel_length",
                        "word": target_text,
                        "syllable": syllable,
                        "vowel": long_vowel,
                        "message": f"In {target_text}, the {long_vowel} in {syllable} should be held twice as long.",
                    })
    # Duration-only fail: no phoneme errors but speech too fast for long vowels
    if vowel_duration_fail and not error_details:
        long_in_word = [v for v in LONG_VOWELS if v in target_text]
        if long_in_word:
            error_details.append({
                "type": "vowel_length",
                "word": target_text,
                "syllable": "",
                "vowel": long_in_word[0],
                "message": f"In {target_text}, hold the long vowel(s) ({', '.join(long_in_word)}) twice as long.",
            })

    # 7. Generate teacher response (Sanskrit for TTS, English for display)
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
            # Override with specific vowel feedback when available
            if error_details:
                feedback_english = error_details[0]["message"]
        else:
            response_text = "punar vadatu. śuddhataraṃ uccāraya."
            feedback_english = get_generic_fallback_advice(
                audio_path, target_text, errors, ref_dur
            )
            style = "command"
            if error_details:
                feedback_english = error_details[0]["message"]

    # 8. Return immediately — feedback_audio_key lets frontend fetch TTS async
    return {
        "target": target_text,
        "heard": heard,
        "heard_iast": heard_iast,
        "errors": [(str(a), str(b)) for a, b in errors],
        "error_types": error_types,
        "error_details": error_details,
        "feedback_audio_key": {"text": response_text, "style": style},
        "correct": len(errors) == 0 and not vowel_duration_fail,
        "score": score,
        "feedback_english": feedback_english,
    }
