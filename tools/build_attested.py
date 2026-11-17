#!/usr/bin/env python3
"""build_attested.py — real-text examples, build-time verified.

Each entry names a stem + slot and a verse in the svread corpus, and the
builder REFUSES unless:
  1. the work bundle exists and contains the chunk,
  2. the expected form appears as a whole token in the chunk's Sanskrit,
  3. the chunk carries a non-empty English translation (L2 else L3).

These verses are HARD (tantric literature). The app presents them as
"spot the form you know" (Heritage style), never as beginner reading.
If a verse gets too easy a gloss, that is a curation bug, not the engine's.

  SVREAD_DATA=/root/svread/data python3 tools/build_attested.py [--check]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "attested.json"
SRC = Path(os.environ.get("SVREAD_DATA", "/root/svread/data"))
TOKEN = r"[^\wāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]"

# stem, vib, vac, work, chunk, form, gloss-note
CANDIDATES = [
    ("deva", "prathama", "eka", "paryantapancasika", "pary-p01-v06", "devaḥ",
     "nominative singular — the subject"),
    ("deva", "caturthi", "eka", "sivastotravali", "s02-v06", "devāya",
     "dative singular — the recipient"),
    ("phala", "prathama", "bahu", "sivastotravali", "s17-v39", "phalam",
     "neuter nom/acc singular — the two cases share the form"),
    ("deva", "prathama", "eka", "bodhavilasa", "bodh-p03-v25", "devaḥ",
     "nominative singular — the subject"),
    ("deva", "prathama", "eka", "paramarthasara", "param-p06-v47", "devaḥ",
     "nominative singular — the subject"),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    entries = []
    for stem, vib, vac, work, chunk, form, note in CANDIDATES:
        bundle = SRC / f"{work}.json"
        if not bundle.exists():
            print(f"build_attested: missing bundle {bundle}", file=sys.stderr)
            return 1
        d = json.loads(bundle.read_text(encoding="utf-8"))
        ch = next((c for c in d.get("chunks", []) if c.get("chunk") == chunk), None)
        if ch is None:
            print(f"build_attested: missing chunk {work}/{chunk}", file=sys.stderr)
            return 1
        sa = ch.get("sanskrit") or ch.get("sa") or ch.get("iast") or ""
        if not re.search(TOKEN + re.escape(form) + TOKEN, " " + sa + " "):
            print(f"build_attested: {form} not a token in {work}/{chunk}", file=sys.stderr)
            return 1
        en = (ch.get("l2") or ch.get("l3") or "").strip()
        if not en:
            print(f"build_attested: no translation in {work}/{chunk}", file=sys.stderr)
            return 1
        entries.append({
            "stem": stem, "vibhakti": vib, "vacana": vac, "form": form,
            "work": work, "target": chunk,
            "sanskrit": sa.strip(), "translation": en,
            "note": "Hard text. Find the form you know — the rest is for later. " + note,
        })

    doc = {
        "format": "sanskrithelp.attested/1",
        "source": "svread reader bundles (sanskrit + L2/L3 per chunk)",
        "count": len(entries),
        "warning": ("Verified citations, not reading assignments. Each verse is "
                    "harder than the drill that produced its form."),
        "entries": entries,
    }
    blob = (json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=1) + "\n").encode()

    if args.check:
        if not OUT.exists() or OUT.read_bytes() != blob:
            print("build_attested --check: attested.json differs (re-run with SVREAD_DATA)", file=sys.stderr)
            return 1
        print(f"build_attested --check: GREEN ({len(entries)} citations)")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(blob)
    print(f"build_attested: {len(entries)} citations -> {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
