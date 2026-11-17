#!/usr/bin/env python3
"""verify_data.py — fail the build if the generated data is inconsistent.

Runs in CI before deploy. Checks:
  1. index.json counts match the actual family files.
  2. every form is REFUSED unless status is DERIVED or MACHINE_GAP.
  3. no slot renders a surface without a step trace (no invented forms).
  4. every family file referenced by index.json exists and parses.
  5. the site's own files exist (index.html, assets, data entry points).

Exit 0 = shippable. Any failure exits 1 with the reason. No network.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
DATA = PUB / "data"

errors: list[str] = []
notes: list[str] = []


def need(path: Path, why: str) -> bool:
    if not path.exists():
        errors.append(f"missing {path.relative_to(ROOT)} ({why})")
        return False
    return True


def main() -> int:
    for rel, why in [
        ("public/index.html", "the page"),
        ("public/assets/app.js", "the client"),
        ("public/assets/style.css", "the stylesheet"),
        ("public/data/index.json", "the index"),
        ("public/data/sutras.json", "the sutra citation text"),
        ("public/data/verbs.json", "the verb paradigms"),
        ("public/data/cases.json", "the karaka/case map"),
        ("public/data/curriculum.json", "the learning path"),
        ("public/robots.txt", "crawl policy"),
        ("public/sitemap.xml", "sitemap"),
    ]:
        need(ROOT / rel, why)
    if errors:
        return report()

    index = json.loads((DATA / "index.json").read_text(encoding="utf-8"))
    if index.get("format") != "sanskrithelp.prakriya/1":
        errors.append(f"bad format {index.get('format')!r}")

    counts = index.get("counts", {})
    if counts.get("errors"):
        errors.append(f"{counts['errors']} derivation errors recorded in index.json")
    if counts.get("forms") != counts.get("slots"):
        errors.append(
            f"coverage {counts.get('forms')}/{counts.get('slots')} — a slot is unfilled, "
            "which must be status MACHINE_GAP and is still a defect to report"
        )

    stems = {s["id"] for s in index.get("stems", [])}
    if len(stems) != counts.get("stems"):
        errors.append("stem list length disagrees with counts")

    seen_forms = 0
    for fam in index.get("families", []):
        path = PUB / fam["file"] if fam["file"].startswith("data/") else DATA / Path(fam["file"]).name
        if not need(path, f"family {fam['id']}"):
            continue
        doc = json.loads(path.read_text(encoding="utf-8"))
        if doc.get("family") != fam["id"]:
            errors.append(f"{path.name}: family mismatch")
        if set(doc.get("stems", {})) != set(fam["stems"]):
            errors.append(f"{path.name}: stem set disagrees with index")
        for sid, node in doc["stems"].items():
            if sid not in stems:
                errors.append(f"{path.name}: unknown stem {sid}")
            for vid, row in node.get("paradigm", {}).items():
                for wid, cell in row.items():
                    st = cell.get("status")
                    if st not in ("DERIVED", "MACHINE_GAP"):
                        errors.append(f"{sid}.{vid}.{wid}: illegal status {st!r}")
                        continue
                    if st == "DERIVED":
                        seen_forms += 1
                        if not cell.get("iast") or not cell.get("deva"):
                            errors.append(f"{sid}.{vid}.{wid}: DERIVED without surfaces")
                        steps = cell.get("steps") or []
                        if not steps:
                            errors.append(f"{sid}.{vid}.{wid}: DERIVED without a trace")
                        for s in steps:
                            if len(s) != 3 or not s[0] or s[2] not in (
                                "stem", "class", "affix", "operation", "sound",
                                "surface", "definition", "blocked",
                            ):
                                errors.append(f"{sid}.{vid}.{wid}: bad step {s!r}")
                                break
    if seen_forms != counts.get("forms"):
        errors.append(f"family files hold {seen_forms} forms, index claims {counts.get('forms')}")

    verbs = json.loads((DATA / "verbs.json").read_text(encoding="utf-8"))
    vc = verbs.get("counts", {})
    if vc.get("errors"):
        errors.append(f"{vc['errors']} verb derivation errors")
    if vc.get("forms") != vc.get("slots"):
        errors.append(f"verb coverage {vc.get('forms')}/{vc.get('slots')}")
    for rid, tenses in verbs.get("paradigms", {}).items():
        for lid, slot in tenses.items():
            for key, c in slot.items():
                if c.get("status") == "DERIVED" and (not c.get("iast") or not c.get("steps")):
                    errors.append(f"verb {rid}.{lid}.{key}: DERIVED without form/trace")
    cur = json.loads((DATA / "curriculum.json").read_text(encoding="utf-8"))
    fam_ids = {f["id"] for f in index.get("families", [])}
    stem_ids = {s["id"] for s in index.get("stems", [])}
    root_ids = {r["id"] for r in verbs.get("roots", [])}
    lak_ids = {l["id"] for l in verbs.get("lakara", [])}
    vib_ids = {v["id"] for v in index.get("vibhakti", [])}
    seen = set()
    for st in cur.get("stages", []):
        if st["id"] in seen:
            errors.append(f"curriculum: duplicate stage {st['id']}")
        seen.add(st["id"])
        for f in st.get("families", []):
            if f not in fam_ids:
                errors.append(f"curriculum {st['id']}: unknown family {f}")
        for c in st.get("cases", []):
            if c not in vib_ids:
                errors.append(f"curriculum {st['id']}: unknown case {c}")
        for r in st.get("roots", []):
            if r not in root_ids:
                errors.append(f"curriculum {st['id']}: unknown root {r}")
        for l in st.get("lakara", []):
            if l not in lak_ids:
                errors.append(f"curriculum {st['id']}: unknown tense {l}")
        for n in st.get("needs", []):
            if n not in [x["id"] for x in cur["stages"]]:
                errors.append(f"curriculum {st['id']}: unknown prerequisite {n}")
        if not st.get("modes"):
            errors.append(f"curriculum {st['id']}: no modes")

    cases = json.loads((DATA / "cases.json").read_text(encoding="utf-8"))
    if len(cases.get("karaka", [])) != 6:
        errors.append("cases.json should hold six karakas")

    cc = index.get("crosscheck", {})
    if cc.get("status") == "complete":
        notes.append(f"crosscheck {cc.get('agree')}/{cc.get('checked')} hand slots agree")
        if cc.get("disagree"):
            notes.append(f"{len(cc['disagree'])} recorded disagreement(s) — listed, not hidden")
    else:
        notes.append(f"crosscheck {cc.get('status')}")

    return report()


def report() -> int:
    for n in notes:
        print(f"note: {n}")
    if errors:
        for e in errors[:40]:
            print(f"FAIL: {e}", file=sys.stderr)
        if len(errors) > 40:
            print(f"... and {len(errors) - 40} more", file=sys.stderr)
        return 1
    print("verify_data: GREEN")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
