#!/usr/bin/env python3
"""
Pre-generate all 49 Sanskrit phonemes with Kokoro TTS (lang_code='h').
Run: pip install kokoro soundfile; python scripts/generate_phonemes.py
Output: public/audio/phonemes/*.wav
"""
from pathlib import Path
import numpy as np

try:
    from kokoro import KPipeline
except ImportError:
    print("Install: pip install kokoro soundfile")
    raise

PHONEME_DIR = Path(__file__).resolve().parents[1] / "public" / "audio" / "phonemes"
PHONEME_DIR.mkdir(parents=True, exist_ok=True)

VOWELS = {"a", "aa", "i", "ii", "u", "uu", "r_vocalic", "rr_vocalic", "l_vocalic", "e", "ai", "o", "au"}

PHONEMES = {
    "a": "अ", "aa": "आ", "i": "इ", "ii": "ई",
    "u": "उ", "uu": "ऊ", "r_vocalic": "ऋ", "rr_vocalic": "ॠ", "l_vocalic": "ऌ",
    "e": "ए", "ai": "ऐ", "o": "ओ", "au": "औ",
    "am": "अं", "ah": "अः",
    "ka": "क", "kha": "ख", "ga": "ग", "gha": "घ", "nga": "ङ",
    "ca": "च", "cha": "छ", "ja": "ज", "jha": "झ", "nya": "ञ",
    "ta_retro": "ट", "tha_retro": "ठ", "da_retro": "ड", "dha_retro": "ढ", "na_retro": "ण",
    "ta": "त", "tha": "थ", "da": "द", "dha": "ध", "na": "न",
    "pa": "प", "pha": "फ", "ba": "ब", "bha": "भ", "ma": "म",
    "ya": "य", "ra": "र", "la": "ल", "va": "व",
    "sha_palatal": "श", "sha_retro": "ष", "sa": "स", "ha": "ह",
}

# Map phonemes.json ids to script names
ID_MAP = {"ta-retro": "ta_retro", "tha-retro": "tha_retro", "da-retro": "da_retro",
          "dha-retro": "dha_retro", "na-retro": "na_retro", "r": "r_vocalic",
          "rr": "rr_vocalic", "l": "l_vocalic", "sha-palatal": "sha_palatal",
          "sha-retro": "sha_retro"}

pipeline = KPipeline(lang_code="h")

for name, char in PHONEMES.items():
    out = PHONEME_DIR / f"{name}.wav"
    if out.exists():
        print(f"Skip {name} (exists)")
        continue
    text = char if name in VOWELS else f"{char}अ"
    print(f"Generating {name} ({char})...")
    chunks = []
    for _, _, audio in pipeline(text, voice="hf_alpha", speed=0.7):
        chunks.append(audio)
    import soundfile as sf
    sf.write(str(out), np.concatenate(chunks), 24000)

print("Done.")
