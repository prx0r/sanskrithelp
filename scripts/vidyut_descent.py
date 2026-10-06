#!/usr/bin/env python3
"""Vidyut descent: Devanagari -> SLP1 -> tokens w/ lemma+morphology -> JSON.
The deterministic Sanskrit analysis service behind the Constructicon.
Usage: python3 scripts/vidyut_descent.py भवति
Requires: pip install vidyut + VIDYUT_DATA dir (download_data).
"""
import json, os, sys

DATA = os.environ.get("VIDYUT_DATA", "/tmp/opencode/vidyut-data")

def main():
    from vidyut.vidyut import lipi, cheda
    S = lipi.Scheme
    text = sys.argv[1] if len(sys.argv) > 1 else "भवति"
    slp1 = lipi.transliterate(text, S.Devanagari, S.Slp1)
    c = cheda.Chedaka(DATA)
    tokens = []
    for t in c.run(slp1):
        s = str(t)
        tokens.append({
            "text": getattr(t, "text", ""),
            "lemma": getattr(t, "lemma", ""),
            "info": s[:400],
        })
    print(json.dumps({"surface": text, "slp1": slp1, "tokens": tokens},
                     ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
