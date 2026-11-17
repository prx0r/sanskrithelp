#!/usr/bin/env python3
"""build_verbs.py — generate tiṅ (verb) paradigms with Vidyut.

The verb half of the trainer: root × tense (lakāra) × person × number.
Every form and step comes from Vidyut 0.4.0; nothing is typed from memory.

Roots are pinned by (upadeshika, gaṇa) so a clean_text collision cannot pick
the wrong dhātu (e.g. 'as' to be vs 'ās' to sit).

Output: public/data/verbs.json
Usage:
  python3 tools/build_verbs.py [--check]
"""
from __future__ import annotations

import argparse
import importlib.metadata
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "verbs.json"

# id, deva, iast, gloss, upadeshika, gana
ROOTS = [
    ("as", "अस्", "as", "be", "asa~", "adAdi"),
    ("BU", "भू", "bhū", "become", "BU", "BvAdi"),
    ("gam", "गम्", "gam", "go", "ga\\mx~", "BvAdi"),
    ("paW", "पठ्", "paṭh", "read", "paWa~", "BvAdi"),
    ("liK", "लिख्", "likh", "write", "liKa~", "tudAdi"),
    ("dA", "दा", "dā", "give", "qudA\\Y", "juhotyAdi"),
    ("kf", "कृ", "kṛ", "do, make", "qukf\\Y", "tanAdi"),
    ("vad", "वद्", "vad", "speak", "vada~", "BvAdi"),
    ("dfS", "दृश्", "dṛś", "see", "df\\Si~r", "BvAdi"),
    ("Sru", "श्रु", "śru", "hear", "Sru\\", "BvAdi"),
    ("nI", "नी", "nī", "lead", "RI\\Y", "BvAdi"),
    ("pA", "पा", "pā", "drink", "pA\\", "BvAdi"),
    ("KAd", "खाद्", "khād", "eat", "KAdf~", "BvAdi"),
    ("vas", "वस्", "vas", "dwell", "va\\sa~", "BvAdi"),
    ("smf", "स्मृ", "smṛ", "remember", "smf\\", "BvAdi"),
]

LAKARA = [
    ("lat", "laṭ", "लट्", "present", "#4ade80",
     "what is happening now — gacchati, paṭhati"),
    ("lan", "laṅ", "लङ्", "past (imperfect)", "#f87171",
     "what happened — agacchat, apaṭhat; takes the augment a-"),
    ("lrt", "lṛṭ", "लृट्", "future", "#60a5fa",
     "what will happen — gamiṣyati, paṭhiṣyati"),
    ("lot", "loṭ", "लोट्", "imperative", "#fbbf24",
     "commands and wishes — gaccha, paṭha"),
    ("vidhilin", "vidhiliṅ", "विधिलिङ्", "optative", "#c084fc",
     "what should or could be — gacchet, paṭhet"),
]

PURUSHA = [
    ("Prathama", "prathama", "प्रथम", "3rd", "he / she / it"),
    ("Madhyama", "madhyama", "मध्यम", "2nd", "you"),
    ("Uttama", "uttama", "उत्तम", "1st", "I / we"),
]
VACANA = [
    ("Eka", "eka", "एक", "singular", "one"),
    ("Dvi", "dvi", "द्वि", "dual", "two"),
    ("Bahu", "bahu", "बहु", "plural", "three or more"),
]

# same role map as the noun engine
ROLE_OF = [
    (("3.4.", "4.1.2"), "affix"),
    (("7.", "6."), "operation"),
    (("8.",), "sound"),
    (("1.2.45", "1.2.46"), "stem"),
    (("1.", "2.", "3.", "5."), "definition"),
]


def role_of(code: str) -> str:
    for prefixes, role in ROLE_OF:
        for p in prefixes:
            if code == p or code.startswith(p):
                return role
    return "definition"


def _join(res, ia) -> str:
    if isinstance(res, (list, tuple)):
        parts = [ia(x) if isinstance(x, str) else str(x) for x in res]
        return " + ".join([p for p in parts if p and p.strip()])
    return ia(res) if isinstance(res, str) else str(res)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    version = importlib.metadata.version("vidyut")
    from vidyut import kosha as kosha_mod
    from vidyut.lipi import Scheme, transliterate
    from vidyut.prakriya import (
        DhatuPada, Lakara, Pada, Prayoga, Purusha, Vacana, Vyakarana,
    )

    v = Vyakarana()
    k = kosha_mod.Kosha("/root/vidyut-0.4.0/kosha")

    def ia(s):
        try:
            return transliterate(s, Scheme.Slp1, Scheme.Iast)
        except Exception:
            return s

    def dev(s):
        try:
            return transliterate(s, Scheme.Iast, Scheme.Devanagari)
        except Exception:
            return s

    # index bare dhatus by (upadeshika, gana-name)
    # Index only PRIMARY dhātus: skipped prefixed forms and derived stems
    # (Ric causative, san desiderative, yaN intensive share the upadeśa but are
    # not the root we want).
    index = {}
    for d in k.dhatus():
        txt = str(d)
        if "prefixes=" in txt or "sanadi" in txt:
            continue
        dh = getattr(d, "dhatu", None)
        if dh is None:
            continue
        up = str(getattr(dh, "aupadeshika", "") or "")
        gana = str(getattr(dh, "gana", "") or "").split(".")[-1]
        if up and gana:
            index.setdefault((up, gana), d)

    LK = {"lat": Lakara.Lat, "lan": Lakara.Lan, "lrt": Lakara.Lrt,
          "lot": Lakara.Lot, "vidhilin": Lakara.VidhiLin}
    PU = {"Prathama": Purusha.Prathama, "Madhyama": Purusha.Madhyama,
          "Uttama": Purusha.Uttama}
    VA = {"Eka": Vacana.Eka, "Dvi": Vacana.Dvi, "Bahu": Vacana.Bahu}

    errors = []
    paradigms = {}
    for rid, rdeva, riast, gloss, up, gana in ROOTS:
        dhatu = index.get((up, gana))
        if dhatu is None:
            errors.append(f"{rid}: dhatu not found for ({up},{gana})")
            continue
        try:
            dargs = dhatu.to_prakriya_args()
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{rid}: to_prakriya_args failed: {exc}")
            continue
        per_tense = {}
        for lid, *_ in LAKARA:
            slot = {}
            for pu, *_ in PURUSHA:
                for va, *_ in VACANA:
                    key = f"{pu}.{va}"
                    try:
                        res = v.derive(Pada.Tinanta(
                            dargs, Prayoga.Kartari, LK[lid], PU[pu], VA[va],
                            dhatu_pada=DhatuPada.Parasmaipada))
                    except Exception as exc:  # noqa: BLE001
                        errors.append(f"{rid}.{lid}.{key}: {exc}")
                        res = []
                    if not res:
                        slot[key] = {"status": "MACHINE_GAP"}
                        continue
                    r = res[0]
                    surface = ia(r.text)
                    steps = [[str(getattr(st, "code", "")),
                              _join(getattr(st, "result", ""), ia),
                              role_of(str(getattr(st, "code", "")))]
                             for st in r.history]
                    slot[key] = {
                        "status": "DERIVED",
                        "iast": surface,
                        "deva": dev(surface),
                        "steps": steps,
                    }
            per_tense[lid] = slot
        paradigms[rid] = per_tense

    total = sum(1 for p in paradigms.values() for t in p.values()
                for c in t.values() if c.get("status") == "DERIVED")
    slots = len(ROOTS) * len(LAKARA) * len(PURUSHA) * len(VACANA)

    doc = {
        "format": "sanskrithelp.verbs/1",
        "status": "machine-derived-unreviewed",
        "engine": {"name": "vidyut", "version": version},
        "note": ("Kartari (active) tiṅ forms only. Every surface and step is "
                 "Vidyut output; a derivation is a computation, not a reading."),
        "roots": [{"id": r[0], "deva": r[1], "iast": r[2], "gloss": r[3],
                   "gana": {"BvAdi":"Bhvadi","adAdi":"Adadi","tudAdi":"Tudadi","tanAdi":"Tanadi"}.get(r[5], r[5])} for r in ROOTS],
        "lakara": [{"id": l[0], "sanskrit": l[1], "deva": l[2], "en": l[3],
                    "colour": l[4], "note": l[5]} for l in LAKARA],
        "purusha": [{"id": p[0], "sanskrit": p[1], "deva": p[2], "en": p[3],
                     "pronoun": p[4]} for p in PURUSHA],
        "vacana": [{"id": vv[0], "sanskrit": vv[1], "deva": vv[2], "en": vv[3],
                    "count": vv[4]} for vv in VACANA],
        "counts": {"roots": len(ROOTS), "tenses": len(LAKARA),
                   "forms": total, "slots": slots, "errors": len(errors)},
        "errors": errors,
        "paradigms": paradigms,
    }
    blob = (json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=1) + "\n").encode()

    if args.check:
        if not OUT.exists() or OUT.read_bytes() != blob:
            print("build_verbs --check: differs", file=sys.stderr)
            return 1
        print(f"build_verbs --check: GREEN ({total} forms)")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(blob)
    print(f"build_verbs: {len(ROOTS)} roots, {len(LAKARA)} tenses, "
          f"{total}/{slots} forms, {len(errors)} errors; {len(blob)/1024:.0f} KiB")
    for e in errors[:6]:
        print("  !", e, file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
