# -*- coding: utf-8 -*-
"""Run phoneme_diff tests (no heavy deps)."""
import importlib.util
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))
# Load phoneme_diff module directly to avoid asr/whisper (needs librosa)
spec = importlib.util.spec_from_file_location(
    "phoneme_diff", root / "asr" / "phoneme_diff.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
phoneme_diff = mod.phoneme_diff


def main():
    # Regression tests from sabdo.md
    r1 = phoneme_diff("\u1e6d\u012bk\u0101", "t\u012bk\u0101")  # tikka vs tikka (retroflex)
    assert r1 == [("\u1e6d", "t")], f"Expected [('ṭ', 't')], got {r1}"
    print("  retroflex_dental OK")

    r2 = phoneme_diff("k\u0101la", "kala")  # kāla vs kala (vowel length)
    assert r2 == [("\u0101", "a")], f"Expected [('ā', 'a')], got {r2}"
    print("  vowel_length OK")

    r3 = phoneme_diff("\u1e6d\u012bk\u0101", "\u1e6d\u012bk\u0101")  # same
    assert r3 == [], f"Expected [], got {r3}"
    print("  identical OK")

    print("All phoneme_diff tests passed.")


if __name__ == "__main__":
    main()
