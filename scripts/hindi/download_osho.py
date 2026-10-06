#!/usr/bin/env python3
"""Download Osho Hindi Siva Sutra 01-10 MP3s (local only, never commit).

Pattern verified 2026-10-06: direct MP3, ~31-40MB each, Accept-Ranges: bytes.
License: free download (Osho World); language-use only, not doctrinal authority.
Usage:
  python3 scripts/hindi/download_osho.py          # all 10
  python3 scripts/hindi/download_osho.py 01       # just Talk 01
  python3 scripts/hindi/download_osho.py --first10min  # + 10-min Dataset-Zero cut (needs ffmpeg)
"""
import os
import sys
import urllib.request

BASE = "https://oshoworld.com/wp-content/uploads/2020/11/Hindi%20Audio/OSHO-Shiv_Sutra_{}.mp3"
DEST = os.path.join(os.path.dirname(__file__), "../../public/memory/hindi/audio")
TALKS = [f"{i:02d}" for i in range(1, 11)]


def download(talk: str) -> str:
    os.makedirs(DEST, exist_ok=True)
    url = BASE.format(talk)
    out = os.path.join(DEST, f"osho-shiv-sutra-{talk}.mp3")
    if os.path.exists(out) and os.path.getsize(out) > 10_000_000:
        print(f"skip {talk} (already {os.path.getsize(out)//1_000_000}MB)")
        return out
    print(f"GET {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "sanskrithelp-corpus/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(out + ".download", "wb") as f:
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
    os.rename(out + ".download", out)
    print(f"saved {out} ({os.path.getsize(out)//1_000_000}MB)")
    return out


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else "all"
    if arg == "all":
        for t in TALKS:
            download(t)
    elif arg.startswith("--"):
        print("unknown flag (ffmpeg cut is manual for now):", arg)
        sys.exit(2)
    else:
        download(arg.zfill(2))
