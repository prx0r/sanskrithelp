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

# stem ids must match public/data/index.json exactly (case-sensitive).
# Where the form is syncretic the note says so; the listed vib/vac is the
# primary reading.
CANDIDATES = [
    ("deva", "prathama", "eka", "paryantapancasika", "pary-p01-v06", "devaḥ",
     "nominative singular — the subject"),
    ("deva", "caturthi", "eka", "sivastotravali", "s02-v06", "devāya",
     "dative singular — the recipient"),
    ("Pala", "prathama", "eka", "sivastotravali", "s17-v39", "phalam",
     "neuter singular — nominative and accusative share the form"),
    ("deva", "prathama", "eka", "bodhavilasa", "bodh-p03-v25", "devaḥ",
     "nominative singular — the subject"),
    ("deva", "prathama", "eka", "paramarthasara", "param-p06-v47", "devaḥ",
     "nominative singular — the subject"),
    ("Atman", "prathama", "eka", "sivastotravali", "s01-v02", "ātmā",
     "nominative singular — the subject"),
    ("guru", "dvitiya", "eka", "bhairavanukarana", "bhair-p01-v07", "gurum",
     "accusative singular — the object"),
    ("devI", "prathama", "eka", "sivastotravali", "s01-v09", "devī",
     "nominative singular — the subject"),
    ("manas", "dvitiya", "eka", "sivastotravali", "s01-v26", "manaḥ",
     "neuter singular — nominative and accusative share the form"),
    ("rUpa", "sasthi", "eka", "sambandhasiddhi", "samb-p01-v05", "rūpasya",
     "genitive singular — the possessor"),
    ("vAc", "dvitiya", "eka", "paryantapancasika", "pary-p01-v01", "vācam",
     "accusative singular — the object"),
    ("guru", "prathama", "bahu", "paryantapancasika", "pary-p08-v52", "guravaḥ",
     "nominative plural — the subjects (vocative shares the form)"),
    ("Bagavant", "prathama", "eka", "sivastotravali", "s01-v22", "bhagavan",
     "nominative singular — the subject (vocative shares the form)"),
    ("dAtf", "prathama", "eka", "sivastotravali", "s19-v15", "dātā",
     "nominative singular — the subject"),
    ("maDu", "sasthi", "eka", "ghatakarpara", "ghat-p02-v14", "madhunaḥ",
     "ablative or genitive singular — the two share the form"),
    ("rAjan", "prathama", "eka", "paramarthasara", "param-p12-v101", "rājā",
     "nominative singular — the subject"),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    index = json.loads((ROOT / "public" / "data" / "index.json").read_text(encoding="utf-8"))
    fams = {f["id"]: f["file"] for f in index["families"]}
    by_id = {st["id"]: st for st in index["stems"]}
    for stem, *_ in CANDIDATES:
        if stem not in by_id:
            print(f"build_attested: unknown stem id {stem!r} (check index.json casing)",
                  file=sys.stderr)
            return 1
    need_fam = {by_id[stem]["family"] for stem, *_ in CANDIDATES}
    paradigms = {}
    for fid in {fams[f] for f in need_fam}:
        fam_doc = json.loads((ROOT / "public" / fid).read_text(encoding="utf-8"))
        for sid, node in fam_doc["stems"].items():
            paradigms[sid] = node["paradigm"]

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
        slot = paradigms.get(stem, {}).get(vib, {}).get(vac, {})
        if slot.get("status") != "DERIVED" or slot.get("iast") != form:
            print(f"build_attested: our paradigm has no {stem}.{vib}.{vac} = {form}",
                  file=sys.stderr)
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
