"""
Regression tests for phoneme_diff (from sabdo.md Testing Checklist).
"""
import sys
from pathlib import Path

# Add parent for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from asr.phoneme_diff import phoneme_diff


def test_retroflex_dental():
    assert phoneme_diff("ṭīkā", "tīkā") == [("ṭ", "t")]


def test_vowel_length():
    assert phoneme_diff("kāla", "kala") == [("ā", "a")]


def test_empty_errors_produce_praise():
    # When errors is empty, pronunciation_session returns praise — tested in integration
    errors = phoneme_diff("ṭīkā", "ṭīkā")
    assert errors == []
