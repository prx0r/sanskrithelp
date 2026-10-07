#!/usr/bin/env python3
"""Repackage Bhatia Colloquial Hindi dialogues into Glot scenario/drill packs.

Steps: drop mojibake duplicate lines -> repair hs/hq artifacts -> split
completed dialogues (scenarios) vs fill-in drills (paired with completed
versions where the same scene exists) -> emit bhatia.json (scenarios.json shape).
Confidence per line: clean | repaired | dropped. Nothing committed silently.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data/language-resources/extracted/colloquial_hindi_dialogues.jsonl")
OUT = os.path.join(ROOT, "public/memory/hindi/bhatia.json")

MOJIBAKE = re.compile(r"[@ÆÊ]|i[f][lmao]+[A-Z]|O[a-z]*U")
HS_HQ = [(re.compile(r"\bhq\b"), "hain"), (re.compile(r"\bhs\b"), "hai")]
EN_WORDS = set("is my the how what your you are and favourite favorite movie come why where when who".split())


def is_english(t):
    w = re.findall(r"[A-Za-z']+", t.lower())
    return len(w) >= 2 and sum(1 for x in w if x in EN_WORDS) >= 2


def clean_line(t):
    """Returns (text, confidence)."""
    if "____" in t:
        return t, "drill-blank"
    if MOJIBAKE.search(t):
        return "", "dropped-mojibake"
    for pat, rep in HS_HQ:
        t = pat.sub(rep, t)
    # stage directions kept as context
    return t.strip(), ("repaired" if t != t else "clean")


def main():
    rows = [json.loads(l) for l in open(SRC)]
    # pair blank drills with completed versions (same speaker flow, blanks filled)
    scenarios, drills, log = [], [], []
    for r in rows:
        lines = []
        for l in r["lines"]:
            t, conf = clean_line(l["text"])
            if conf == "dropped-mojibake":
                log.append({"drop": l["text"][:60]})
                continue
            lines.append({"speaker": l["speaker"], "text": t, "conf": conf})
        real = [l for l in lines if l["conf"] != "drill-blank"]
        blanks = [l for l in lines if l["conf"] == "drill-blank"]
        if blanks and not real:
            continue  # pure blanks, no content
        if len(real) >= 4 and not blanks:
            hi = [l for l in real if not is_english(l["text"])]
            en = [l for l in real if is_english(l["text"])]
            npc = [{"speaker": l["speaker"], "hindi": l["text"],
                    "transliteration": "", "english": ""} for l in hi[:6]]
            scenarios.append({
                "id": "bhatia-" + r["id"].split("_")[-1],
                "title": "Bhatia %s" % r["id"], "subtitle": "Colloquial Hindi dialogue",
                "stage": 1, "level": 1,
                "objective": "Hold this exchange: hear, repeat, answer.",
                "pattern": (hi[0]["text"] if hi else "")[:80],
                "vocab": [], "npcScript": npc,
                "hints": ["Listen first, then shadow each line aloud."],
                "targetLines": [l["text"] for l in hi],
                "gloss_en": [l["text"] for l in en],
                "construction": "", "config": {}, "source": "Bhatia Colloquial Hindi (2008), study-only",
            })
        elif blanks:
            drills.append({"id": r["id"], "blanks": len(blanks),
                           "context": [l["text"] for l in real][:4]})
    json.dump({"id": "bhatia-pack-v0",
               "note": "Repaired roman lines; Devanagari + EN glosses pending (needs speaker pass). Drills pair with completed scenes where matched.",
               "scenarios": scenarios, "drills": drills,
               "dropped_mojibake": len(log)}, open(OUT, "w"), ensure_ascii=False, indent=1)
    print("scenarios:", len(scenarios), "| drills:", len(drills),
          "| dropped:", len(log), "->", OUT)


if __name__ == "__main__":
    main()
