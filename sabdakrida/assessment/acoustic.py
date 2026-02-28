"""
Acoustic analysis for waveform-based pronunciation feedback.
Uses librosa to extract features and suggest targeted advice.
"""

import numpy as np

try:
    import librosa
    HAVE_LIBROSA = True
except ImportError:
    HAVE_LIBROSA = False


def analyze_audio(audio_path: str, reference_duration: float | None = None) -> dict:
    """
    Analyze learner audio for pronunciation feedback.
    Returns dict with duration_ratio, rms_energy, advice_hints.
    """
    if not HAVE_LIBROSA:
        return {"duration_ratio": 1.0, "rms_energy": 0.5, "advice_hints": []}

    try:
        y, sr = librosa.load(audio_path, sr=16000)
        duration = len(y) / sr
        rms = float(np.sqrt(np.mean(y**2)))

        # Normalize RMS to 0–1 (typical speech is ~0.01–0.3)
        rms_norm = min(1.0, rms * 10) if rms > 0 else 0

        hints = []

        # Duration heuristics
        if reference_duration and reference_duration > 0.15:
            ratio = duration / reference_duration
            if ratio < 0.5:
                hints.append(
                    "Speak more slowly. Hold each syllable clearly — Sanskrit vowels need full length."
                )
            elif ratio < 0.75:
                hints.append(
                    "Slightly too fast. Try lengthening the long vowels (ā, ī, ū) — they should be twice as long as short ones."
                )
            elif ratio > 2.0:
                hints.append(
                    "A bit slow — that's okay for practice. Focus on clarity of each sound."
                )

        # Energy/volume — lowered thresholds so we usually give feedback
        if rms_norm < 0.05:
            hints.append("Speak a bit louder — the mic may not be picking you up clearly.")
        elif rms_norm < 0.15:
            hints.append("Speak up slightly. Clear, confident articulation helps the model hear you.")

        return {
            "duration": duration,
            "duration_ratio": duration / reference_duration if reference_duration and reference_duration > 0 else 1.0,
            "rms_energy": rms_norm,
            "advice_hints": hints,
        }
    except Exception:
        return {"duration_ratio": 1.0, "rms_energy": 0.5, "advice_hints": []}


def get_generic_fallback_advice(
    audio_path: str,
    target_text: str,
    errors: list,
    reference_duration: float | None,
) -> str:
    """
    When no known error type matches, use waveform analysis to suggest what to improve.
    Never returns the bland 'Try again' — always gives actionable advice.
    """
    analysis = analyze_audio(audio_path, reference_duration)
    hints = analysis.get("advice_hints", [])

    if hints:
        return " ".join(hints)

    # No acoustic hints — use error pairs if any, else give structured tips
    if errors:
        exp_heard = [(str(a), str(b)) for a, b in errors[:3]]
        detail = f" Model heard {exp_heard[0][1] or '(gap)'} instead of {exp_heard[0][0]}." if exp_heard else ""
        return (
            f"The model didn't recognize some sounds.{detail} "
            "Try: (1) speak a bit slower, (2) emphasise each syllable clearly, "
            "(3) hold long vowels (ā, ī, ū) twice as long as short ones."
        )

    return (
        "Speak more slowly and clearly. Emphasise each syllable — "
        "Sanskrit sounds (retroflex ṭ/ḍ, aspirated dh/bh, long vowels) need careful articulation."
    )
