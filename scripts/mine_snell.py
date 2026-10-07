#!/usr/bin/env python3
"""Mine Snell OCR full text for dialogue blocks -> snell scenario skeletons.

Same honesty contract as repack_bhatia.py: roman lines are NOT Devanagari;
output carries status needs-native-review and stays unwired until converted.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data/language-resources/extracted/snell_full.txt")
OUT = os.path.join(ROOT, "public/memory/hindi/snell.json")

SPEAKER = re.compile(r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(.+)$")


def main():
    text = open(SRC).read()
    # drop page markers for parsing (keep page refs)
    chunks = re.split(r"===== SNELL p\.(\d+) =====", text)
    scenarios = []
    buf, pages = [], []
    cur_page = 0
    for i, ch in enumerate(chunks):
        if i % 2 == 1:
            cur_page = int(ch)
            continue
        for line in ch.splitlines():
            line = line.strip()
            if not line:
                if len(buf) >= 4:
                    scenarios.append({"page": pages[0] if pages else cur_page,
                                      "lines": buf})
                buf, pages = [], []
                continue
            m = SPEAKER.match(line)
            if m and len(line.split()) <= 14:
                buf.append({"speaker": m.group(1), "text": m.group(2).strip()})
                pages.append(cur_page)
            else:
                if len(buf) >= 4:
                    scenarios.append({"page": pages[0] if pages else cur_page,
                                      "lines": buf})
                buf, pages = [], []
    out = []
    for k, s in enumerate(scenarios):
        hi = [l for l in s["lines"]]
        out.append({
            "id": "snell-%03d" % (k + 1),
            "title": "Snell p.%d exchange" % s["page"],
            "subtitle": "Teach Yourself Hindi Conversation (2005), study-only",
            "stage": 1, "level": 1 if k < 5 else 2,
            "objective": "Hold this exchange: hear, repeat, answer.",
            "pattern": hi[0]["text"][:80] if hi else "",
            "vocab": [],
            "npcScript": [{"speaker": l["speaker"], "hindi": l["text"],
                           "transliteration": "", "english": ""} for l in hi[:8]],
            "hints": ["Listen first, then shadow each line aloud."],
            "targetLines": [l["text"] for l in hi],
            "construction": "", "config": {},
            "status": "needs-native-review",
            "source": "Snell Conversation (2005) p.%d, OCR, study-only" % s["page"],
        })
    json.dump({"id": "snell-pack-v0", "status": "needs-native-review",
               "interactive": False,
               "note": "Roman lines (standard transliteration, cleaner than Bhatia) await Devanagari conversion + native pass. NOT wired to engine.",
               "scenarios": out, "count": len(out)},
              open(OUT, "w"), ensure_ascii=False, indent=1)
    print("snell scenarios:", len(out), "->", OUT)


if __name__ == "__main__":
    main()
