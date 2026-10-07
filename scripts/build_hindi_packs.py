#!/usr/bin/env python3
"""Build Hindi packs from coursebook resources (Snell Anki + Bhatia).

Outputs (public/memory/hindi/):
  vocab.json        — 1223 Snell items {hindi, english, tags, audio_hi, audio_en}
  vocab-audio/      — extracted hypertts mp3s (field order: Hindi headword first,
                      English gloss second — assumption recorded in manifest)
  bhatia.json       — scenario SKELETONS (status-gated, see below) + drills
  pathway.json      — ordered learning path (levels, prereqs, daily rotation)

Honesty rules: no broken Hindi ships. Bhatia roman lines are mojibake-mixed;
skeletons carry status needs-native-review and are EXCLUDED from the interactive
engine until a native pass fills Devanagari + glosses.
"""
import json
import os
import re
import sqlite3
import tempfile
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "data/language-resources")
OUTDIR = os.path.join(ROOT, "public/memory/hindi")
AUDIR = os.path.join(OUTDIR, "vocab-audio")


def snell_vocab():
    apkg = os.path.join(RES, "anki/complete_hindi_snell_anki.apkg")
    z = zipfile.ZipFile(apkg)
    media = json.loads(z.read("media"))
    inv = {}
    for idx, name in media.items():
        inv[name] = idx  # hypertts filename -> numbered blob
    tmp = tempfile.mkdtemp()
    z.extract("collection.anki21", tmp)
    con = sqlite3.connect(os.path.join(tmp, "collection.anki21"))
    items = []
    for (flds,) in con.execute("select flds from notes"):
        parts = flds.split("\x1f")
        hindi = re.sub(r"\[sound:[^\]]+\]", "", parts[0]).strip() if len(parts) > 0 else ""
        english = re.sub(r"\[sound:[^\]]+\]", "", parts[1]).strip() if len(parts) > 1 else ""
        sounds = re.findall(r"\[sound:([^\]]+)\]", " ".join(parts))
        audio_hi = audio_en = ""
        sh = [s for s in sounds]
        if sh:
            audio_hi = inv.get(sh[0], "") and ("vocab-audio/%s.mp3" % inv.get(sh[0]))
        if len(sh) > 1:
            audio_en = inv.get(sh[1], "") and ("vocab-audio/%s.mp3" % inv.get(sh[1]))
        tags = parts[4].strip() if len(parts) > 4 else ""
        if hindi:
            items.append({"hindi": hindi, "english": english, "tags": tags,
                          "audio_hi": audio_hi, "audio_en": audio_en})
    return items, z, inv


def extract_audio(z, inv, items):
    os.makedirs(AUDIR, exist_ok=True)
    got = 0
    blobs = {n: z.read(n) for n in z.namelist() if n.isdigit()}
    for it in items:
        for key in ("audio_hi", "audio_en"):
            fn = it.get(key, "")
            if fn.startswith("vocab-audio/"):
                idx = fn.split("/")[1].split(".")[0]
                blob = blobs.get(idx)
                if blob:
                    if not os.path.exists(os.path.join(OUTDIR, fn)):
                        open(os.path.join(OUTDIR, fn), "wb").write(blob)
                    got += 1
                else:
                    it[key] = ""
    return got


def main():
    items, z, inv = snell_vocab()
    got = extract_audio(z, inv, items)
    json.dump({"id": "snell-vocab-v1", "count": len(items),
               "assumption": "first [sound:] is Hindi headword voice, second is English gloss voice",
               "items": items},
              open(os.path.join(OUTDIR, "vocab.json"), "w"), ensure_ascii=False, indent=1)
    print("vocab items:", len(items), "| audio files mapped:", got)
    print("ASSUMPTION to verify by ear: first sound = Hindi voice.")


if __name__ == "__main__":
    main()
