#!/usr/bin/env python3
"""fetch_sutras.py — build the spaced sūtra-text map (code → IAST).

Vidyut ships its Aṣṭādhyāyī text without word spacing ("vfdDirAdEc"), which is
correct for computation but unreadable as a teaching citation. The community
edition at github.com/sanskrit/ashtadhyayi keeps a *padaccheda* (word-split)
Devanāgarī text; we clean its editorial markup and transliterate to IAST.

Source : https://raw.githubusercontent.com/sanskrit/ashtadhyayi/master/data/vishvAsa-prastutiH.md
Credit : sanskrit/ashtadhyayi contributors (community-curated Aṣṭādhyāyī data).
Output : public/data/sutras.json  (committed, so CI needs no network)

Cleaning rules (mechanical, no rewriting):
  - drop +++(...)+++ editorial insertions (they are commentary, not sūtra text)
  - drop ** bold markers, [[wikilinks]], stray markdown punctuation
  - drop zero-width joiners/non-joiners
  - collapse whitespace
Word-dividing hyphens are kept: they are the padaccheda the edition provides.

Usage:
  python3 tools/fetch_sutras.py            # download (or use cache) + write
  python3 tools/fetch_sutras.py --check    # compare bytes, no writes
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "sutras.json"
CACHE = ROOT / "tools" / ".cache" / "vishvasa.md"
URL = ("https://raw.githubusercontent.com/sanskrit/ashtadhyayi/"
       "master/data/vishvAsa-prastutiH.md")

ZW = dict.fromkeys(map(ord, "\u200c\u200d\ufeff\u00a0"))


def fetch() -> tuple[str, str]:
    if CACHE.exists():
        raw = CACHE.read_text(encoding="utf-8")
        return raw, "cache"
    req = urllib.request.Request(URL, headers={"User-Agent": "sanskrithelp/1"})
    with urllib.request.urlopen(req, timeout=60) as r:  # noqa: S310
        raw = r.read().decode("utf-8")
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(raw, encoding="utf-8")
    return raw, "network"


def clean(t: str) -> str:
    t = re.sub(r"\+\+\+.*?\+\+\+", "", t)
    t = t.replace("**", "")
    t = re.sub(r"\[\[.*?\]\]", "", t)
    t = re.sub(r"[_`>#]", "", t)
    t = t.translate(ZW)
    return re.sub(r"\s+", " ", t).strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    try:
        from vidyut.lipi import Scheme, transliterate
    except Exception:
        print("fetch_sutras: vidyut not installed", file=sys.stderr)
        return 1

    try:
        raw, how = fetch()
    except Exception as exc:  # noqa: BLE001
        print(f"fetch_sutras: download failed ({exc}); "
              f"commit public/data/sutras.json is authoritative", file=sys.stderr)
        return 1

    sutras: dict[str, str] = {}
    for line in raw.splitlines():
        m = re.match(r"^(\d+\.\d+\.\d+)\t(.+)$", line)
        if not m:
            continue
        code, deva = m.group(1), clean(m.group(2))
        if not deva:
            continue
        sutras[code] = transliterate(deva, Scheme.Devanagari, Scheme.Iast)

    doc = {
        "format": "sanskrithelp.sutras/1",
        "source": URL,
        "credit": "sanskrit/ashtadhyayi community edition (padaccheda)",
        "raw_sha256": hashlib.sha256(raw.encode()).hexdigest(),
        "fetched_via": how,
        "count": len(sutras),
        "note": ("Sūtra text with word division. Editorial insertions and bold "
                 "markers removed mechanically; hyphens kept as the edition "
                 "gives them. This is citation text, not a grammatical claim."),
        "sutras": sutras,
    }
    blob = (json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=1) + "\n").encode()

    if args.check:
        if not OUT.exists() or OUT.read_bytes() != blob:
            print("fetch_sutras --check: sutras.json differs", file=sys.stderr)
            return 1
        print(f"fetch_sutras --check: GREEN ({len(sutras)} sūtras)")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(blob)
    print(f"fetch_sutras: {len(sutras)} sūtras -> {OUT.relative_to(ROOT)} "
          f"({len(blob)/1024:.0f} KiB, via {how})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
