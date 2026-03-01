#!/usr/bin/env python3
"""
Generate audio for Kashmir Shaivism readings.
- Sanskrit: indic-parler-tts (via sabdakrida /tts or direct import)
- English: Kokoro (via Chutes API)
- Modes: sa (Sanskrit only), parallel (Skt → 1.2s silence → Eng), en (English only)

Usage:
  python scripts/readings/generate_audio.py [--text pratyabhijna_hrdayam]
  python scripts/readings/generate_audio.py --text pratyabhijna_hrdayam --limit 3

Requires:
  - Sabdakrida running (python -m uvicorn sabdakrida.main:app --port 8010) for Sanskrit
  - CHUTES_API_KEY in env for English (Kokoro)
  - pip install pydub requests
"""
from __future__ import annotations

import argparse
import asyncio
import io
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

# Ensure we can import sabdakrida
try:
    from pydub import AudioSegment
except ImportError:
    print("pip install pydub")
    sys.exit(1)

SABDAKRIDA_URL = os.environ.get("SABDAKRIDA_URL", "http://127.0.0.1:8010")
CHUTES_URL = "https://chutes-kokoro.chutes.ai/speak"


def tts_sanskrit(text: str) -> bytes:
    """Call sabdakrida /tts for indic-parler synthesis."""
    import urllib.request
    import urllib.parse
    data = urllib.parse.urlencode({"text": text, "style": "narration"}).encode()
    req = urllib.request.Request(
        f"{SABDAKRIDA_URL}/tts",
        data=data,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def tts_english(text: str) -> bytes:
    """Call Chutes Kokoro for English TTS."""
    api_key = os.environ.get("CHUTES_API_KEY")
    if not api_key:
        raise RuntimeError("CHUTES_API_KEY not set")
    import urllib.request
    import json as j
    payload = {"text": text, "voice": "am_adam", "speed": 0.85}  # English male
    data = j.dumps(payload).encode()
    req = urllib.request.Request(
        CHUTES_URL,
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def generate_silence(ms: int = 1200) -> AudioSegment:
    return AudioSegment.silent(duration=ms)


def generate_unit_audio(unit: dict, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    uid = unit["id"]

    # Sanskrit — indic-parler via sabdakrida
    try:
        wav_sa = tts_sanskrit(unit["devanagari"])
        audio_sa = AudioSegment.from_file(io.BytesIO(wav_sa), format="wav")
    except Exception as e:
        print(f"  Sanskrit TTS failed for {uid}: {e}")
        return

    # English — Kokoro
    try:
        wav_en = tts_english(unit["english"])
        audio_en = AudioSegment.from_file(io.BytesIO(wav_en), format="wav")
    except Exception as e:
        print(f"  English TTS failed for {uid}: {e}")
        audio_en = None

    silence = generate_silence(1200)

    # Mode 1: Sanskrit only
    audio_sa.export(out_dir / f"{uid}_sa.mp3", format="mp3", bitrate="192k")
    print(f"  {uid}_sa.mp3")

    # Mode 2: Parallel (Sanskrit → pause → English)
    if audio_en:
        parallel = audio_sa + silence + audio_en
        parallel.export(out_dir / f"{uid}_parallel.mp3", format="mp3", bitrate="192k")
        print(f"  {uid}_parallel.mp3")

    # Mode 3: English only
    if audio_en:
        audio_en.export(out_dir / f"{uid}_en.mp3", format="mp3", bitrate="192k")
        print(f"  {uid}_en.mp3")


def process_text(units_json_path: Path, audio_out: Path, limit: int | None = None) -> None:
    units = json.loads(units_json_path.read_text(encoding="utf-8"))
    if limit:
        units = units[:limit]
    for unit in units:
        text_dir = units_json_path.parent.name
        target = audio_out / text_dir
        generate_unit_audio(unit, target / "audio")
        print(f"Done: {unit['id']}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate readings audio")
    parser.add_argument("--text", default="pratyabhijna_hrdayam", help="Text slug (or --all)")
    parser.add_argument("--all", action="store_true", help="Process all texts with units.json")
    parser.add_argument("--limit", type=int, default=None, help="Limit units (for testing)")
    args = parser.parse_args()

    audio_out = ROOT / "public" / "content" / "readings"
    readings_dir = audio_out

    if args.all:
        for subdir in readings_dir.iterdir():
            if subdir.is_dir():
                units_path = subdir / "units.json"
                if units_path.exists():
                    text_slug = subdir.name
                    print(f"\n=== {text_slug} ===")
                    process_text(units_path, audio_out, args.limit)
    else:
        units_path = ROOT / "public" / "content" / "readings" / args.text / "units.json"
        if not units_path.exists():
            print(f"Run fetch script first. Missing: {units_path}")
            sys.exit(1)
        process_text(units_path, audio_out, args.limit)

    print("\nDone.")


if __name__ == "__main__":
    main()
