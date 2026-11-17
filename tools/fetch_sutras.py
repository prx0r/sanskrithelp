#!/usr/bin/env python3
"""fetch_sutras.py — build the spaced sūtra-text map (code → IAST).

Vidyut's rule inventory has no word division ("vfdDirAdEc"), which is correct
for computation but unreadable as a teaching citation. The ashtadhyayi.com
dataset (the same MIT-licensed source Vidyut's own data README credits) ships a
*padaccheda* field for every sūtra; we take that, strip its markup, and
transliterate to IAST.

Source : https://raw.githubusercontent.com/ashtadhyayi-com/data/master/sutraani/data.txt
Credit : ashtadhyayi.com (Nīleśh Bandu), MIT-licensed data release.
Output : public/data/sutras.json  (committed, so CI needs no network)

Field used: each entry carries a, p, n (adhyāya.pāda.number) and `pc`
(padaccheda). `pc` separates word-units with `##` and tags each with `$S$…`
metadata; we keep the text before each `$S$`.

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
CACHE = ROOT / "tools" / ".cache" / "sutraani-data.txt"
URL = ("https://raw.githubusercontent.com/ashtadhyayi-com/data/"
       "master/sutraani/data.txt")

ZW = dict.fromkeys(map(ord, "\u200c\u200d\ufeff\u00a0"))


def fetch() -> tuple[str, str]:
    if CACHE.exists():
        return CACHE.read_text(encoding="utf-8"), "cache"
    req = urllib.request.Request(URL, headers={"User-Agent": "sanskrithelp/1"})
    with urllib.request.urlopen(req, timeout=120) as r:  # noqa: S310
        raw = r.read().decode("utf-8")
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(raw, encoding="utf-8")
    return raw, "network"


def clean(t: str) -> str:
    t = t.translate(ZW)
    t = re.sub(r"[_`>#*]", "", t)
    return re.sub(r"\s+", " ", t).strip()


def padaccheda(entry: dict) -> str:
    """Join the word-units of the `pc` field, dropping $S$ metadata."""
    pc = entry.get("pc") or ""
    units = [clean(p.split("$S$")[0]) for p in pc.split("##")]
    units = [u for u in units if u]
    text = " ".join(units).strip()
    return text or clean(entry.get("s") or "")


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
        print(f"fetch_sutras: download failed ({exc}); the committed "
              f"public/data/sutras.json remains authoritative", file=sys.stderr)
        return 1

    data = json.loads(raw)
    rows = data.get("data") if isinstance(data, dict) else data
    sutras: dict[str, str] = {}
    for entry in rows:
        a, p, n = entry.get("a"), entry.get("p"), entry.get("n")
        if not (a and p and n):
            continue
        code = f"{a}.{p}.{n}"
        deva = padaccheda(entry)
        if not deva:
            continue
        sutras[code] = transliterate(deva, Scheme.Devanagari, Scheme.Iast)

    doc = {
        "format": "sanskrithelp.sutras/1",
        "source": URL,
        "credit": "ashtadhyayi.com data (MIT) — padaccheda field",
        "raw_sha256": hashlib.sha256(raw.encode()).hexdigest(),
        "fetched_via": how,
        "count": len(sutras),
        "note": ("Sūtra text with word division taken from the ashtadhyayi.com "
                 "padaccheda, markup stripped mechanically and transliterated to "
                 "IAST. Citation text only — not a grammatical claim."),
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
