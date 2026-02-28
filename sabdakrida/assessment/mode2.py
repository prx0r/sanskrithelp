"""
Mode 2 — Deep assessment with IndicMFA alignment + MFCC.
Requires montreal-forced-aligner + Sanskrit acoustic model.
"""


async def deep_assess(learner_audio_path: str, target_text: str, user_id: str) -> dict:
    """Deep phoneme assessment with forced alignment and MFCC distance."""
    raise NotImplementedError(
        "Mode 2: Install IndicMFA and Sanskrit MFA model. See sabdo.md Phase 4."
    )
