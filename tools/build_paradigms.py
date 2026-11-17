#!/usr/bin/env python3
"""build_paradigms.py — generate every Sanskrit declension paradigm with Vidyut.

This is the formal engine behind the Prakriyā Wheel. Nothing is typed from
memory: every surface form and every derivation step comes from Vidyut 0.4.0,
and the machine output is cross-checked against a hand-curated reference table
(the six stems in svread) so drift is caught, not hidden.

Outputs (deterministic bytes):
  data/index.json          meta: colour roles, families, stems, vibhakti, vacana,
                           sutra map, crosscheck summary
  data/fam/<family>.json   full 8x3 paradigms + step traces + reverse index

Roles are assigned from the sūtra number only (see ROLE_OF); the browser
re-derives the same role with the same table, so no role is stored twice.

Usage:
  python3 tools/build_paradigms.py            # write data/
  python3 tools/build_paradigms.py --check    # byte comparison, no writes
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
CURATED = Path("/root/svread/data/wheels/declension.json")

# ---------------------------------------------------------------- catalogue
# slp1, deva, iast, gloss, family, linga, nyap (ā/ī/ū feminines), note
STEMS = [
    # a-stem masculine
    ("deva", "देव", "deva", "god", "a-masc", "Pum", 0, "the anchor stem"),
    ("rAma", "राम", "rāma", "Rāma", "a-masc", "Pum", 0, "same rules as deva — transfer test"),
    ("nara", "नर", "nara", "man", "a-masc", "Pum", 0, ""),
    ("vIra", "वीर", "vīra", "hero", "a-masc", "Pum", 0, ""),
    ("aSva", "अश्व", "aśva", "horse", "a-masc", "Pum", 0, ""),
    ("vfkza", "वृक्ष", "vṛkṣa", "tree", "a-masc", "Pum", 0, ""),
    ("sUrya", "सूर्य", "sūrya", "sun", "a-masc", "Pum", 0, ""),
    ("putra", "पुत्र", "putra", "son", "a-masc", "Pum", 0, ""),
    ("raTa", "रथ", "ratha", "chariot", "a-masc", "Pum", 0, ""),
    # a-stem neuter
    ("Pala", "फल", "phala", "fruit", "a-neut", "Napumsaka", 0, "nominative = accusative"),
    ("jala", "जल", "jala", "water", "a-neut", "Napumsaka", 0, ""),
    ("vana", "वन", "vana", "forest", "a-neut", "Napumsaka", 0, ""),
    ("kula", "कुल", "kula", "family", "a-neut", "Napumsaka", 0, ""),
    ("rUpa", "रूप", "rūpa", "form", "a-neut", "Napumsaka", 0, ""),
    ("gfha", "गृह", "gṛha", "house", "a-neut", "Napumsaka", 0, ""),
    ("cakra", "चक्र", "cakra", "wheel", "a-neut", "Napumsaka", 0, ""),
    ("dAna", "दान", "dāna", "gift", "a-neut", "Napumsaka", 0, ""),
    # ā-stem feminine
    ("sItA", "सीता", "sītā", "Sītā", "aa-fem", "Stri", 1, "long-ā family"),
    ("latA", "लता", "latā", "creeper", "aa-fem", "Stri", 1, ""),
    ("kanyA", "कन्या", "kanyā", "girl", "aa-fem", "Stri", 1, ""),
    ("gaNgA", "गङ्गा", "gaṅgā", "Ganges", "aa-fem", "Stri", 1, ""),
    ("BAryA", "भार्या", "bhāryā", "wife", "aa-fem", "Stri", 1, ""),
    ("mAlA", "माला", "mālā", "garland", "aa-fem", "Stri", 1, ""),
    ("kalA", "कला", "kalā", "art", "aa-fem", "Stri", 1, ""),
    # ī-stem feminine
    ("nadI", "नदी", "nadī", "river", "ii-fem", "Stri", 1, "yā-ādeśa family"),
    ("devI", "देवी", "devī", "goddess", "ii-fem", "Stri", 1, ""),
    ("patnI", "पत्नी", "patnī", "wife", "ii-fem", "Stri", 1, ""),
    ("saKI", "सखी", "sakhī", "female friend", "ii-fem", "Stri", 1, ""),
    ("gOrI", "गौरी", "gaurī", "Gaurī", "ii-fem", "Stri", 1, ""),
    # ū-stem feminine
    ("vaDU", "वधू", "vadhū", "bride", "uu-fem", "Stri", 1, "shortening before vowel endings"),
    ("BU", "भू", "bhū", "earth", "uu-fem", "Stri", 1, ""),
    # i-stem
    ("agni", "अग्नि", "agni", "fire", "i-masc", "Pum", 0, "guṇa before ṅ-marked endings"),
    ("kavi", "कवि", "kavi", "poet", "i-masc", "Pum", 0, ""),
    ("muni", "मुनि", "muni", "sage", "i-masc", "Pum", 0, ""),
    ("fzi", "ऋषि", "ṛṣi", "seer", "i-masc", "Pum", 0, ""),
    ("giri", "गिरि", "giri", "mountain", "i-masc", "Pum", 0, ""),
    ("pati", "पति", "pati", "lord", "i-masc", "Pum", 0, "irregular genitive patyuḥ"),
    ("vAri", "वारि", "vāri", "water", "i-neut", "Napumsaka", 0, "neuter i-stem"),
    ("daDi", "दधि", "dadhi", "curd", "i-neut", "Napumsaka", 0, ""),
    # u-stem
    ("guru", "गुरु", "guru", "teacher", "u-masc", "Pum", 0, "sentence-wheel anchor"),
    ("Satru", "शत्रु", "śatru", "enemy", "u-masc", "Pum", 0, ""),
    ("BAnu", "भानु", "bhānu", "sun", "u-masc", "Pum", 0, ""),
    ("ripu", "रिपु", "ripu", "enemy", "u-masc", "Pum", 0, ""),
    ("maDu", "मधु", "madhu", "honey", "u-neut", "Napumsaka", 0, "neuter u-stem"),
    ("vasu", "वसु", "vasu", "wealth", "u-neut", "Napumsaka", 0, ""),
    # ṛ-stem agent nouns
    ("pitf", "पितृ", "pitṛ", "father", "r-agent", "Pum", 0, "kinship; strong ṛ → ā"),
    ("BrAtf", "भ्रातृ", "bhrātṛ", "brother", "r-agent", "Pum", 0, ""),
    ("kartf", "कर्तृ", "kartṛ", "doer", "r-agent", "Pum", 0, "agent noun"),
    ("dAtf", "दातृ", "dātṛ", "giver", "r-agent", "Pum", 0, ""),
    # consonant stems
    ("rAjan", "राजन्", "rājan", "king", "an-masc", "Pum", 0, "-an stem; nom rājā"),
    ("Atman", "आत्मन्", "ātman", "self", "an-masc", "Pum", 0, "-an stem"),
    ("vAc", "वाच्", "vāc", "speech", "c-fem", "Stri", 0, "-c stem; nom vāk"),
    ("manas", "मनस्", "manas", "mind", "as-neut", "Napumsaka", 0, "-as neuter"),
    ("suKin", "सुखिन्", "sukhin", "happy", "in-masc", "Pum", 0, "-in stem; nom sukhī"),
    ("Bavant", "भवत्", "bhavant", "being (honorific)", "ant-masc", "Pum", 0, "-ant participle"),
    ("Bagavant", "भगवन्", "bhagavant", "blessed lord", "vant-masc", "Pum", 0, "-vant stem"),
    ("go", "गो", "go", "cow", "diph-masc", "Pum", 0, "diphthong stem; nom gauḥ"),
]

FAMILIES = [
    ("a-masc", "short -a masculine", "अकारान्त पुंल्लिङ्ग", "Pum",
     "Every -a masculine declines alike: deva, rāma, nara… Change the stem, no rule changes."),
    ("a-neut", "short -a neuter", "अकारान्त नपुंसक", "Napumsaka",
     "Oblique cases match the masculine; nominative, accusative and vocative do not."),
    ("aa-fem", "long -ā feminine", "आकारान्त स्त्रीलिङ्ग", "Stri",
     "yā-ādeśa before vowel endings: sītayā, sītāyai, sītāyāḥ."),
    ("ii-fem", "long -ī feminine", "ईकारान्त स्त्रीलिङ्ग", "Stri",
     "ī shortens to y before vowels: nadyā, nadyai, nadyāḥ."),
    ("uu-fem", "long -ū feminine", "ऊकारान्त स्त्रीलिङ्ग", "Stri",
     "ū shortens to v before vowels: vadhvā, vadhvai, vadhvāḥ."),
    ("i-masc", "-i masculine", "इकारान्त पुंल्लिङ्ग", "Pum",
     "New family: agninā, agnaye, agneḥ, agnau. Final i guṇates to e before ṅ-endings."),
    ("i-neut", "-i neuter", "इकारान्त नपुंसक", "Napumsaka",
     "Neuter i-stems take -nā, -ne, -naḥ: vāriṇā, vāriṇe, vāriṇaḥ."),
    ("u-masc", "-u masculine", "उकारान्त पुंल्लिङ्ग", "Pum",
     "Like -i with its own vowel: guruṇā, gurave, guroḥ, gurau."),
    ("u-neut", "-u neuter", "उकारान्त नपुंसक", "Napumsaka",
     "madhunā, madhune, madhunaḥ — neuter u-stem."),
    ("r-agent", "-ṛ agent noun", "ऋकारान्त पुंल्लिङ्ग", "Pum",
     "pitā, pitrā, pitre, pituḥ. Final ṛ is strong in the nominative."),
    ("an-masc", "-an masculine", "अन्-अन्त पुंल्लिङ्ग", "Pum",
     "rājā, rājñā, rājñe, rājñaḥ — the n assimilates before endings."),
    ("c-fem", "-c feminine", "च्-अन्त स्त्रीलिङ्ग", "Stri",
     "vāk, vācā, vāce, vācaḥ — the final stop devoices in the nominative."),
    ("as-neut", "-as neuter", "अस्-अन्त नपुंसक", "Napumsaka",
     "manaḥ, manasā, manase, manasaḥ — s becomes ḥ in the nominative."),
    ("in-masc", "-in masculine", "इन्-अन्त पुंल्लिङ्ग", "Pum",
     "sukhī, sukhinā, sukhine — the in-stem that makes adjectives agree."),
    ("ant-masc", "-ant participle", "अत्-अन्त पुंल्लिङ्ग", "Pum",
     "bhavan, bhavantā, bhavate — present participles decline like this."),
    ("vant-masc", "-vant masculine", "वत्-अन्त पुंल्लिङ्ग", "Pum",
     "bhagavan, bhagavantā, bhagavate — the -vant possession suffix."),
    ("diph-masc", "diphthong stem", "ओकारान्त पुंल्लिङ्ग", "Pum",
     "go → gauḥ, gavā, gave, goḥ. Irregular but regular in its own pattern."),
]

VIBHAKTI = [
    ("prathama", "prathamā", "प्रथमा", "nominative", "who/what (subject)", "2.3.46"),
    ("dvitiya", "dvitīyā", "द्वितीया", "accusative", "whom/what (object)", "2.3.2"),
    ("tritiya", "tṛtīyā", "तृतीया", "instrumental", "with/by means of", "2.3.18"),
    ("caturthi", "caturthī", "चतुर्थी", "dative", "to/for (recipient)", "2.3.13"),
    ("pancami", "pañcamī", "पञ्चमी", "ablative", "from (origin)", "2.3.28"),
    ("sasthi", "ṣaṣṭhī", "षष्ठी", "genitive", "of (possessor)", "2.3.50"),
    ("saptami", "saptamī", "सप्तमी", "locative", "in/at/on (locus)", "2.3.36"),
    ("sambodhana", "sambodhana", "संबोधन", "vocative", "O! (address)", "2.3.47"),
]
VACANA = [
    ("eka", "ekavacana", "एकवचन", "singular", "one"),
    ("dvi", "dvivacana", "द्विवचन", "dual", "exactly two"),
    ("bahu", "bahuvacana", "बहुवचन", "plural", "three or more"),
]

# Role is a pure function of the sūtra number. The browser uses the same map.
ROLE_OF = [
    (("4.1.2",), "affix"),
    (("7.", "6."), "operation"),
    (("8.",), "sound"),
    (("1.2.45", "1.2.46"), "stem"),
    (("4.",), "affix"),
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
        parts = [p for p in parts if p and p.strip()]
        return " + ".join(parts)
    return ia(res) if isinstance(res, str) else str(res)


def _sup_of(steps, ia) -> str:
    """The underlying sup ending, from the 4.1.2 step, transliterated."""
    for code, after, _role in steps:
        if code == "4.1.2":
            parts = [p.strip() for p in after.split("+") if p.strip()]
            return parts[-1] if len(parts) > 1 else ""
    return ""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    try:
        import importlib.metadata
        version = importlib.metadata.version("vidyut")
    except Exception:
        print("build_paradigms: vidyut not installed", file=sys.stderr)
        return 1

    from vidyut.lipi import Scheme, transliterate
    from vidyut.prakriya import (
        Linga, Pada, Pratipadika, Vacana as VV, Vibhakti, Vyakarana,
    )

    v = Vyakarana()
    LINGA = {"Pum": Linga.Pum, "Stri": Linga.Stri, "Napumsaka": Linga.Napumsaka}
    VIBH = {
        "prathama": Vibhakti.Prathama, "dvitiya": Vibhakti.Dvitiya,
        "tritiya": Vibhakti.Trtiya, "caturthi": Vibhakti.Caturthi,
        "pancami": Vibhakti.Panchami, "sasthi": Vibhakti.Sasthi,
        "saptami": Vibhakti.Saptami, "sambodhana": Vibhakti.Sambodhana,
    }
    VAC = {"eka": VV.Eka, "dvi": VV.Dvi, "bahu": VV.Bahu}

    def ia(s: str) -> str:
        try:
            return transliterate(s, Scheme.Slp1, Scheme.Iast)
        except Exception:
            return s

    sutra_map: dict[str, str] = {}
    try:
        import csv
        with open("/root/vidyut-0.4.0/prakriya/sutrapatha.tsv", encoding="utf-8") as f:
            for row in csv.DictReader(f, delimiter="\t"):
                code = row["code"].strip()
                try:
                    sutra_map[code] = transliterate(row["text"].strip(), Scheme.Slp1, Scheme.Iast)
                except Exception:
                    sutra_map[code] = row["text"].strip()
    except OSError:
        pass

    families_out = {f[0]: [] for f in FAMILIES}
    paradigms: dict[str, dict] = {}
    reverse: dict[str, list] = {}
    errors: list[str] = []

    for slp, deva, iast, gloss, fam, linga, nyap, note in STEMS:
        mk = Pratipadika.nyap if nyap else Pratipadika.basic
        table: dict[str, dict] = {}
        for vid, *_ in VIBHAKTI:
            table[vid] = {}
            for wid, *_ in VACANA:
                try:
                    res = v.derive(Pada.Subanta(mk(slp), LINGA[linga], VIBH[vid], VAC[wid]))
                except Exception as exc:  # noqa: BLE001
                    errors.append(f"{slp}.{vid}.{wid}: {exc}")
                    res = []
                if not res:
                    errors.append(f"{slp}.{vid}.{wid}: empty derivation")
                    table[vid][wid] = {"status": "MACHINE_GAP"}
                    continue
                r = res[0]
                surface = ia(r.text)
                steps = []
                for st in r.history:
                    code = str(getattr(st, "code", ""))
                    after = _join(getattr(st, "result", ""), ia)
                    steps.append([code, after, role_of(code)])
                table[vid][wid] = {
                    "iast": surface,
                    "sup": _sup_of(steps, ia),
                    "deva": transliterate(surface, Scheme.Iast, Scheme.Devanagari),
                    "status": "DERIVED",
                    "steps": steps,
                }
                reverse.setdefault(surface, []).append([slp, vid, wid])
        paradigms[slp] = table
        families_out[fam].append(slp)

    # reverse index: only keep genuine syncretism (2+ analyses)
    rev_out = {}
    for form, reads in sorted(reverse.items()):
        if len(reads) > 1:
            seen = set()
            uniq = []
            for r in reads:
                key = tuple(r)
                if key in seen:
                    continue
                seen.add(key)
                uniq.append(r)
            rev_out[form] = sorted(uniq)

    # ---- crosscheck: machine vs the hand-curated six-stem table in svread ----
    cc = {"status": "unavailable", "checked": 0, "agree": 0, "disagree": []}
    if CURATED.exists():
        try:
            cur = json.loads(CURATED.read_text(encoding="utf-8"))
            agree = 0
            dis = []
            seen = 0
            for sid, table in (cur.get("paradigms") or {}).items():
                if sid not in paradigms:
                    continue
                for vid, row in table.items():
                    for wid, cell in row.items():
                        mach = paradigms[sid].get(vid, {}).get(wid, {})
                        if mach.get("status") != "DERIVED":
                            continue
                        seen += 1
                        if mach["iast"] == cell.get("iast"):
                            agree += 1
                        else:
                            dis.append({"stem": sid, "vibhakti": vid, "vacana": wid,
                                        "curated": cell.get("iast"), "machine": mach["iast"]})
            cc = {"status": "complete", "checked": seen, "agree": agree,
                  "disagree": dis, "source": "svread/data/wheels/declension.json"}
        except Exception as exc:  # noqa: BLE001
            cc = {"status": f"error: {exc}", "checked": 0, "agree": 0, "disagree": []}

    # ---- write ----
    files: dict[Path, bytes] = {}

    def dump(obj) -> bytes:
        return (json.dumps(obj, ensure_ascii=False, sort_keys=True, indent=1) + "\n").encode()

    index = {
        "format": "sanskrithelp.prakriya/1",
        "status": "machine-derived-unreviewed",
        "engine": {"name": "vidyut", "version": version,
                   "note": "Every surface and every step is Vidyut output. A derivation is a computation, not a scholarly reading."},
        "title": "Prakriyā Wheel",
        "colour_roles": {
            "stem": {"colour": "#59a6ee", "label": "aṅga", "en": "stem", "what": "the prātipadika you picked"},
            "class": {"colour": "#9bd9b4", "label": "gaṇa", "en": "class", "what": "gender + stem-final → family"},
            "affix": {"colour": "#f4c56a", "label": "pratyaya", "en": "affix", "what": "the sup ending for case × number"},
            "operation": {"colour": "#c29af4", "label": "saṃskāra", "en": "operation", "what": "the rule that transforms the stem"},
            "sound": {"colour": "#a78bfa", "label": "sandhi", "en": "sound", "what": "final adjustment of adjacent sounds"},
            "surface": {"colour": "#42cbb6", "label": "rūpa", "en": "surface", "what": "the finished word"},
            "definition": {"colour": "#7d93a8", "label": "saṃjñā", "en": "definition", "what": "technical naming step"},
            "blocked": {"colour": "#ed938f", "label": "na siddhyati", "en": "blocked", "what": "no derivation on file"},
        },
        "formula": "rūpa = saṃskāra( pratyaya( gaṇa( aṅga ) ) )",
        "families": [{"id": f[0], "label": f[1], "deva": f[2], "gender": f[3],
                      "note": f[4], "stems": families_out[f[0]],
                      "file": f"data/fam/{f[0]}.json"} for f in FAMILIES],
        "stems": [{"id": s[0], "deva": s[1], "iast": s[2], "gloss": s[3],
                   "family": s[4],
                   "gender": {"Pum": "masculine", "Stri": "feminine",
                              "Napumsaka": "neuter"}[s[5]],
                   "note": s[7]} for s in STEMS],
        "vibhakti": [{"id": v[0], "sanskrit": v[1], "deva": v[2], "en": v[3],
                      "question": v[4], "sutra": v[5]} for v in VIBHAKTI],
        "vacana": [{"id": v[0], "sanskrit": v[1], "deva": v[2], "en": v[3],
                    "count": v[4]} for v in VACANA],
        "role_of": [[list(p), r] for p, r in ROLE_OF],
        "sutra_map": sutra_map,
        "counts": {"stems": len(STEMS), "families": len(FAMILIES),
                   "forms": sum(1 for p in paradigms.values() for row in p.values() for c in row.values() if c.get("status") == "DERIVED"),
                   "slots": len(STEMS) * len(VIBHAKTI) * len(VACANA),
                   "errors": len(errors)},
        "crosscheck": cc,
        "errors": errors,
        "warning": "Machine derivations. Not a scholarly reading, not a translation, not doctrine. Cross-check disagreements are recorded, never silently resolved.",
    }
    files[DATA / "index.json"] = dump(index)
    files[DATA / "reverse.json"] = dump({"format": "sanskrithelp.reverse/1", "forms": rev_out})

    for fam_id in families_out:
        doc = {
            "format": "sanskrithelp.paradigm/1",
            "family": fam_id,
            "status": "machine-derived-unreviewed",
            "stems": {},
        }
        for slp in families_out[fam_id]:
            doc["stems"][slp] = {
                "paradigm": paradigms[slp],
                "reverse": {form: r for form, r in ((k, v) for k, v in reverse.items() if any(x[0] == slp for x in v))},
            }
        files[DATA / "fam" / f"{fam_id}.json"] = dump(doc)

    if args.check:
        bad = 0
        for path, blob in files.items():
            if not path.exists() or path.read_bytes() != blob:
                print(f"build_paradigms --check: differs {path.relative_to(ROOT)}", file=sys.stderr)
                bad += 1
        print(f"build_paradigms --check: {'GREEN' if not bad else f'RED ({bad})'}")
        return 0 if not bad else 1

    for path, blob in files.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(blob)

    total = sum(len(b) for b in files.values())
    print(f"build_paradigms: {len(STEMS)} stems, {index['counts']['forms']}/{index['counts']['slots']} forms, "
          f"{len(rev_out)} syncretic surfaces, {len(errors)} errors, "
          f"crosscheck {cc.get('agree')}/{cc.get('checked')} agree; {total/1024:.0f} KiB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
