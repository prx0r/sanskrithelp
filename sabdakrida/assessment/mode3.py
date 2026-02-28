"""
Mode 3 — Holistic conversational assessment via Qwen2-Audio.
Requires Chutes API. Qwen2-Audio cannot speak Sanskrit — pipe text through indic-parler-tts.
"""


async def holistic_assess(learner_audio_path: str, target_text: str) -> dict:
    """Holistic śloka recitation assessment."""
    raise NotImplementedError(
        "Mode 3: Set up Chutes API for Qwen2-Audio. See sabdo.md Phase 5."
    )
