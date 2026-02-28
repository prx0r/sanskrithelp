"""
IndicMFA wrapper — Montreal Forced Aligner with Sanskrit G2G model.
Install: conda install -c conda-forge montreal-forced-aligner
Clone IndicMFA and place Sanskrit model in ~/.mfa/models/acoustic/
"""


def run_indicmfa(audio_path: str, text: str) -> list[dict]:
    """
    Run MFA alignment. Returns [{'char': 'ṭ', 'start': 0.0, 'end': 0.08}, ...].
    Requires MFA and Sanskrit acoustic model to be installed.
    """
    # Stub — implement with: mfa align /path/to/audio/ sanskrit_g2g sanskrit_g2g /path/to/output/
    raise NotImplementedError(
        "IndicMFA: Install montreal-forced-aligner and Sanskrit model. See sabdo.md Phase 4."
    )
