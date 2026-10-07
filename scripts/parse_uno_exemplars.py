#!/usr/bin/env python3
"""Parse uno.txt into verbatim teacher exemplars.

Splis each assistant turn into PEDAGOGY block + SPOKEN reply.
The spoken text is transmission: quoted verbatim downstream, never paraphrased.
Output: data/hxrmxs-exemplars.json (compact, deterministic order).
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = "/root/projects/.meta/misc/notes/uno.txt"
OUT = os.path.join(ROOT, "data/hxrmxs-exemplars.json")


def parse_register(raw):
    out = {}
    for m in re.finditer(r'(intensity|intimacy|attunement)\s*=\s*([A-Z]{2}_\d\d)', raw):
        out[{"intensity": "PR", "intimacy": "IN", "attunement": "AT"}[m.group(1)]] = m.group(2)
    for key in ["LS", "PD", "MM"]:
        m = re.search(r'\b%s_(\d\d)\b' % key, raw)
        if m:
            out[key] = "%s_%s" % (key, m.group(1))
    return out


def main():
    t = open(SRC).read().replace('\\n', '\n')
    # assistant contents: "...[PEDAGOGY]...[/PEDAGOGY]\n<spoken>"
    pattern = re.compile(r'"role":\s*"assistant",\s*"content":\s*"\[PEDAGOGY\](.*?)\[/PEDAGOGY\](.*?)(?="\s*\}\s*,?\s*(?:\{|\]))', re.S)
    ex = []
    for i, m in enumerate(pattern.finditer(t)):
        ped, spoken = m.group(1), m.group(2)
        spoken = spoken.replace('\\"', '"').strip()
        if len(spoken) < 20:
            continue
        f = re.search(r'^function_id:\s*(\S+)', ped, re.M)
        ex.append({
            "id": "ex%04d" % i,
            "function_id": f.group(1) if f else "UNKNOWN",
            "lineage": (re.search(r'^lineage:\s*(.+)$', ped, re.M) or [None, ""])[1].strip(),
            "phase": (re.search(r'^phase:\s*(.+)$', ped, re.M) or [None, ""])[1].strip(),
            "student_state": (re.search(r'^student_state:\s*(.+)$', ped, re.M) or [None, ""])[1].strip(),
            "mechanism": (re.search(r'^mechanism_shape:\s*(.+)$', ped, re.M) or [None, ""])[1].strip(),
            "register": parse_register(ped),
            "impact": (re.search(r'^impact_predicted:\s*(.+)$', ped, re.M) or [None, ""])[1].strip(),
            "text": spoken,
        })
    # normalize ME_ names already fine; drop UNKNOWN-function (still transmittable? keep, flagged)
    json.dump({"id": "hxrmxs-exemplars-v1", "count": len(ex),
               "note": "Verbatim teacher speech. Quote, never paraphrase.",
               "exemplars": ex}, open(OUT, "w"), ensure_ascii=False, indent=1)
    print("exemplars:", len(ex), "->", OUT)


if __name__ == "__main__":
    main()
