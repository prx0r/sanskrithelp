#!/usr/bin/env python3
"""build_sentences.py — precomputed, verified sentence bank.

Frames live in public/data/frames.json (single source; the app and the MCP
worker both read the bank, never reimplement the frames). This builder
instantiates them with a fixed seed, verifies every word against the
paradigms, and writes public/data/sentences.json.

Invariants (build fails if any breaks):
  - every noun word is a DERIVED form for its (stem, case, number)
  - the verb agrees with the subject (3rd person, subject's number)
  - no stem fills two slots in one sentence
  - mass nouns never pluralise; proper nouns take no article
  - coverage: every stem appears as a target at least twice

Usage: python3 tools/build_sentences.py [--check] [--per-frame N]
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "sentences.json"

IRREG = {"man": "men", "wife": "wives", "hero": "heroes", "being": "beings", "self": "selves"}


def plural(gloss: str) -> str:
    import re as _re
    m = _re.match(r"^(.*?)(\s*\(.*\))$", gloss)
    tail = m.group(2) if m else ""
    core = m.group(1) if m else gloss
    if core in IRREG:
        return IRREG[core] + tail
    if core.endswith(("s", "x", "ch", "sh")):
        return core + "es" + tail
    if len(core) > 1 and core.endswith("y") and core[-2] not in "aeiou":
        return core[:-1] + "ies" + tail
    if core.endswith("o"):
        return core + "es" + tail
    return core + "s" + tail


def en_noun(frames, stem_id, gloss, vac):
    proper = stem_id in frames["proper"]
    mass = stem_id in frames["mass"]
    if mass:
        return gloss if proper else f"the {gloss}"
    if vac == "bahu":
        return f"{plural(gloss)}" if proper else f"the {plural(gloss)}"
    if vac == "dvi":
        return f"two {plural(gloss)}" if proper else f"the two {plural(gloss)}"
    return gloss if proper else f"the {gloss}"


def cap(s: str) -> str:
    return s[:1].upper() + s[1:] if s else s


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--per-frame", type=int, default=60)
    args = ap.parse_args()

    data = ROOT / "public" / "data"
    frames_doc = json.loads((data / "frames.json").read_text(encoding="utf-8"))
    index = json.loads((data / "index.json").read_text(encoding="utf-8"))
    verbs = json.loads((data / "verbs.json").read_text(encoding="utf-8"))

    stems = {s["id"]: s for s in index["stems"]}
    fams = {f["id"]: f for f in index["families"]}
    parad = {}
    for fam_file in sorted((data / "fam").glob("*.json")):
        fam_doc = json.loads(fam_file.read_text(encoding="utf-8"))
        for sid, node in fam_doc["stems"].items():
            parad[sid] = node["paradigm"]
    vpar = verbs["paradigms"]
    kinds = frames_doc["kinds"]
    default_kind = frames_doc.get("kind_default", "thing")

    rng = random.Random(20261117)
    entries = []
    seen = set()

    def form_of(sid, vib, vac):
        c = parad.get(sid, {}).get(vib, {}).get(vac)
        if not c or c.get("status") != "DERIVED":
            return None
        return c

    def verb_form(root, lak, vac):
        c = vpar.get(root, {}).get(lak, {}).get(f"Prathama.{VCAP.get(vac, vac)}")
        if not c or c.get("status") != "DERIVED":
            return None
        return c

    def candidates(kind_list):
        return [sid for sid, s in stems.items()
                if kinds.get(sid, default_kind) in kind_list]

    def build_one(frame):
        subj_idx = next((i for i, r in enumerate(frame["roles"]) if r["vib"] == "prathama"), -1)
        subj_vac = "eka"
        focus = frame["vib"]
        if subj_idx >= 0 and frame["roles"][subj_idx]["vib"] == focus and rng.random() < 0.35:
            subj_vac = "bahu"
        parts = []
        used = set()
        for i, role in enumerate(frame["roles"]):
            pool = [s for s in candidates(role["kinds"]) if s not in used]
            if not pool:
                return None
            sid = rng.choice(pool)
            used.add(sid)
            # number: subject keeps its pre-set number; proper names and
            # mass nouns never pluralise; other slots vary
            if sid in frames_doc["proper"] or sid in frames_doc["mass"]:
                vac = "eka"
            elif i == subj_idx:
                vac = subj_vac
            elif rng.random() < 0.3:
                vac = "bahu"
            else:
                vac = "eka"
            c = form_of(sid, role["vib"], vac)
            if not c:
                return None
            parts.append({"stem": sid, "vib": role["vib"], "vac": vac,
                          "iast": c["iast"], "deva": c["deva"],
                          "family": stems[sid]["family"],
                          "en": en_noun(frames_doc, sid, stems[sid]["gloss"], vac)})
        # verb (absent in the address frame)
        verb = None
        if frame.get("verb"):
            vb = frame["verb"]
            sv = parts[subj_idx]["vac"] if subj_idx >= 0 else "eka"
            v = verb_form(vb["root"], vb["lakara"], sv)
            if not v:
                return None
            verb = {"root": vb["root"], "lakara": vb["lakara"], "iast": v["iast"],
                    "deva": v["deva"], "purusha": "Prathama", "vacana": sv}
            ven = frame["verbEn"] if sv == "eka" else frame["verbEnPl"]
        else:
            ven = ""
        # english + word order
        en = frame["en"]
        seq = []
        for item in frame["order"]:
            if "verb" in item:
                en = en.replace("{V}", ven, 1)
                seq.append({"verb": True, "iast": verb["iast"], "deva": verb["deva"]})
            elif "lit" in item:
                seq.append({"lit": item["lit"]})
            else:
                i = item["role"]
                en = en.replace("{%d}" % i, parts[i]["en"], 1)
                seq.append({"stem": parts[i]["stem"], "vib": parts[i]["vib"],
                            "vac": parts[i]["vac"], "iast": parts[i]["iast"],
                            "deva": parts[i]["deva"]})
        if frame["id"] == "address":
            en = en.replace("O the ", "O ")
        en = cap(en)
        target_idx = next((i for i, r in enumerate(frame["roles"]) if r["vib"] == focus), 0)
        t = parts[target_idx]
        key = (frame["id"], t["stem"], t["vib"], t["vac"])
        return {
            "id": f"{frame['id']}-{t['stem']}-{t['vib']}-{t['vac']}",
            "frame": frame["id"], "en": en, "words": seq, "verb": verb,
            "target": {"stem": t["stem"], "vib": t["vib"], "vac": t["vac"],
                       "iast": t["iast"], "deva": t["deva"], "family": t["family"]},
            "_key": key,
        }

    per_frame = args.per_frame
    for frame in frames_doc["frames"]:
        made = 0
        guard = 0
        while made < per_frame and guard < per_frame * 40:
            guard += 1
            e = build_one(frame)
            if not e or e["_key"] in seen:
                continue
            seen.add(e["_key"])
            del e["_key"]
            entries.append(e)
            made += 1

    # coverage: every stem as a target at least twice
    by_stem: dict[str, int] = {}
    for e in entries:
        by_stem[e["target"]["stem"]] = by_stem.get(e["target"]["stem"], 0) + 1
    def max_keys(sid):
        n = 0
        for f in frames_doc["frames"]:
            fi = next((i for i, r in enumerate(f["roles"]) if r["vib"] == f["vib"]), None)
            if fi is None or sid not in candidates(f["roles"][fi]["kinds"]):
                continue
            n += 1 if sid in frames_doc["mass"] else 2
        return n

    for sid in stems:
        need = min(2, max_keys(sid)) - by_stem.get(sid, 0)
        guard = 0
        while need > 0 and guard < 400:
            guard += 1
            frame = rng.choice(frames_doc["frames"])
            # the stem must fill the FOCUS role, else it is not the target
            focus_idx = next((i for i, r in enumerate(frame["roles"])
                              if r["vib"] == frame["vib"]), 0)
            if sid not in candidates(frame["roles"][focus_idx]["kinds"]):
                continue
            e2 = build_one_forced(frame, sid, focus_idx, parad, vpar, stems,
                                 kinds, default_kind, frames_doc, rng)
            if not e2 or e2["_key"] in seen:
                continue
            seen.add(e2["_key"])
            del e2["_key"]
            entries.append(e2)
            by_stem[sid] = by_stem.get(sid, 0) + 1
            need -= 1

    missing = [sid for sid in stems
               if by_stem.get(sid, 0) < min(2, max_keys(sid))]
    by_case: dict[str, int] = {}
    for e in entries:
        by_case[e["target"]["vib"]] = by_case.get(e["target"]["vib"], 0) + 1

    doc = {
        "format": "sanskrithelp.sentences/1",
        "count": len(entries),
        "frames": [f["id"] for f in frames_doc["frames"]],
        "coverage": {"by_stem_target": by_stem, "by_case": by_case,
                     "stems_missing": missing},
        "note": ("Constructed examples, every word engine-generated. The subject "
                 "is third person; its number drives verb agreement. Words are "
                 "written unjoined."),
        "entries": entries,
    }
    blob = (json.dumps(doc, ensure_ascii=False, sort_keys=True, indent=1) + "\n").encode()

    if missing:
        print(f"build_sentences: coverage gaps for {missing}", file=sys.stderr)
        return 1

    if args.check:
        if not OUT.exists() or OUT.read_bytes() != blob:
            print("build_sentences --check: sentences.json differs", file=sys.stderr)
            return 1
        print(f"build_sentences --check: GREEN ({len(entries)} sentences)")
        return 0

    OUT.write_bytes(blob)
    print(f"build_sentences: {len(entries)} sentences, cases {by_case}")
    return 0


VCAP = {"eka": "Eka", "dvi": "Dvi", "bahu": "Bahu"}


def build_one_forced(frame, sid, role_idx, parad, vpar, stems, kinds,
                     default_kind, frames_doc, rng):
    subj_idx = next((i for i, r in enumerate(frame["roles"]) if r["vib"] == "prathama"), -1)
    parts = []
    used = {sid} if role_idx != 0 else set()
    # build all roles, forcing sid into role_idx
    tmp = []
    for i, role in enumerate(frame["roles"]):
        if i == role_idx:
            # vary number so repeated coverage hits don't collide on one key
            # (proper names and mass nouns stay singular)
            vac = "bahu" if (rng.random() < 0.5 and sid not in frames_doc["mass"]
                             and sid not in frames_doc["proper"]) else "eka"
            if i == subj_idx and vac == "bahu":
                pass  # subject plural is fine here: verb below agrees with it
            c = parad.get(sid, {}).get(role["vib"], {}).get(vac)
            if not c or c.get("status") != "DERIVED":
                return None
            tmp.append({"stem": sid, "vib": role["vib"], "vac": vac,
                        "iast": c["iast"], "deva": c["deva"],
                        "family": stems[sid]["family"],
                        "en": en_noun(frames_doc, sid, stems[sid]["gloss"], vac)})
            used.add(sid)
            continue
        vac = "eka"
        if i != subj_idx and rng.random() < 0.3:
            vac = "bahu"
        pool = [s for s, it in stems.items()
                if kinds.get(s, default_kind) in role["kinds"] and s not in used
                and (vac == "eka" or s not in frames_doc["mass"])]
        if not pool:
            return None
        s2 = rng.choice(pool)
        used.add(s2)
        c = parad.get(s2, {}).get(role["vib"], {}).get(vac)
        if not c or c.get("status") != "DERIVED":
            return None
        tmp.append({"stem": s2, "vib": role["vib"], "vac": vac,
                    "iast": c["iast"], "deva": c["deva"],
                    "family": stems[s2]["family"],
                    "en": en_noun(frames_doc, s2, stems[s2]["gloss"], vac)})
    parts = tmp
    subj_vac = parts[subj_idx]["vac"] if subj_idx >= 0 else "eka"
    verb = None
    if frame.get("verb"):
        vb = frame["verb"]
        slot = vpar.get(vb["root"], {}).get(vb["lakara"], {}).get(f"Prathama.{VCAP.get(subj_vac, subj_vac)}")
        if not slot or slot.get("status") != "DERIVED":
            return None
        verb = {"root": vb["root"], "lakara": vb["lakara"], "iast": slot["iast"],
                "deva": slot["deva"], "purusha": "Prathama", "vacana": subj_vac}
        ven = frame["verbEn"] if subj_vac == "eka" else frame["verbEnPl"]
    else:
        ven = ""
    en = frame["en"]
    seq = []
    for item in frame["order"]:
        if "verb" in item:
            en = en.replace("{V}", ven, 1)
            seq.append({"verb": True, "iast": verb["iast"], "deva": verb["deva"]})
        elif "lit" in item:
            seq.append({"lit": item["lit"]})
        else:
            i = item["role"]
            en = en.replace("{%d}" % i, parts[i]["en"], 1)
            seq.append({"stem": parts[i]["stem"], "vib": parts[i]["vib"],
                        "vac": parts[i]["vac"], "iast": parts[i]["iast"],
                        "deva": parts[i]["deva"]})
    if frame["id"] == "address":
        en = en.replace("O the ", "O ")
    en = cap(en)
    focus = frame["vib"]
    target_idx = next((i for i, r in enumerate(frame["roles"]) if r["vib"] == focus), 0)
    t = parts[target_idx]
    return {
        "id": f"{frame['id']}-{t['stem']}-{t['vib']}-{t['vac']}",
        "frame": frame["id"], "en": en, "words": seq, "verb": verb,
        "target": {"stem": t["stem"], "vib": t["vib"], "vac": t["vac"],
                   "iast": t["iast"], "deva": t["deva"], "family": t["family"]},
        "_key": (frame["id"], t["stem"], t["vib"], t["vac"]),
    }


if __name__ == "__main__":
    raise SystemExit(main())
