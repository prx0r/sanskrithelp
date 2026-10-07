#!/usr/bin/env python3
"""Build audio scenes from scenarios.json — islands as listenable scenes.

Stages mirror the removal doctrine (cf. awesomecurriculum: audio removes itself):
  stage1 FULL  — every line voiced (roles get distinct voices)
  stage2 HALF  — learner lines replaced by sized gaps (you autocomplete)
  stage3 EMPTY — all lines gaps; act the whole scene from transcript

Voices: hi-IN-MadhurNeural (role A) / hi-IN-SwaraNeural (learner model + role B),
via keyless edge-tts. Ambient: generated brown-noise bed, low under speech.
Emits public/memory/hindi/scenes/<id>_stageN.mp3 + <id>.json (slot timings).

Usage: python3 scripts/build_audio_scenes.py [scenario-id]
"""
import asyncio
import json
import os
import subprocess
import sys

import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCEN = json.load(open(os.path.join(ROOT, "public/memory/hindi/scenarios.json")))["scenarios"]
OUTDIR = os.path.join(ROOT, "public/memory/hindi/scenes")
os.makedirs(OUTDIR, exist_ok=True)

VOICE_A = "hi-IN-MadhurNeural"
VOICE_B = "hi-IN-SwaraNeural"


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(" ".join(cmd) + "\n" + r.stderr[-400:])


def dur(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", path], text=True).strip())


async def say(text, voice, out):
    if os.path.exists(out) and os.path.getsize(out) > 2000:
        return out
    await edge_tts.Communicate(text, voice, rate="-5%").save(out)
    return out


def silence(sec, out):
    run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
         "-t", str(round(sec, 2)), "-c:a", "libmp3lame", "-q:a", "6", out])


def ambient_bed(sec, out):
    if os.path.exists(out):
        return out
    run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"anoisesrc=color=brown:duration={round(sec,1)}:sample_rate=44100",
         "-af", "lowpass=f=400,volume=0.12", "-c:a", "libmp3lame", "-q:a", "6", out])
    return out


def mix(parts, out):
    lst = out + ".list.txt"
    open(lst, "w").write("\n".join("file '%s'" % p for p in parts) + "\n")
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst,
         "-c:a", "libmp3lame", "-q:a", "4", out])


async def build(s):
    sid = s["id"]
    # interleave: npc, you, npc, you...
    turns = []
    npc = list(s["npcScript"])
    you = list(s["targetLines"])
    ai = bi = 0
    flip = True
    while ai < len(npc) or bi < len(you):
        if flip and ai < len(npc):
            d = npc[ai]; ai += 1
            turns.append({"role": "A", "speaker": d["speaker"], "text": d["hindi"],
                          "voice": VOICE_A})
        elif bi < len(you):
            turns.append({"role": "YOU", "speaker": "You", "text": you[bi],
                          "voice": VOICE_B})
            bi += 1
        else:
            d = npc[ai]; ai += 1
            turns.append({"role": "A", "speaker": d["speaker"], "text": d["hindi"],
                          "voice": VOICE_A})
        flip = not flip
    # render each turn once
    tmp = os.path.join(OUTDIR, "_tmp_" + sid)
    os.makedirs(tmp, exist_ok=True)
    for i, t in enumerate(turns):
        f = os.path.join(tmp, "turn%d.mp3" % i)
        await say(t["text"], t["voice"], f)
        t["dur"] = dur(f)
        t["file"] = f
    # stages
    manifest = {"id": sid, "stages": {}}
    for stage, mute in (("stage1", set()), ("stage2", {"YOU"}), ("stage3", {"YOU", "A"})):
        parts, slots, t = [], [], 0.5
        lead = os.path.join(tmp, "%s_lead.mp3" % stage)
        silence(0.5, lead)
        parts.append(lead)
        for i, tr in enumerate(turns):
            if tr["role"] in mute:
                gap = tr["dur"] + 2.0
                g = os.path.join(tmp, "%s_gap%d.mp3" % (stage, i))
                silence(gap, g)
                parts.append(g)
                slots.append({"speaker": tr["speaker"], "text": tr["text"],
                              "start": round(t, 2), "dur": round(gap, 2), "muted": True})
                t += gap
            else:
                parts.append(tr["file"])
                slots.append({"speaker": tr["speaker"], "text": tr["text"],
                              "start": round(t, 2), "dur": round(tr["dur"], 2), "muted": False})
                t += tr["dur"]
            br = os.path.join(tmp, "%s_br%d.mp3" % (stage, i))
            silence(0.4, br)
            parts.append(br)
            t += 0.4
        # ambient bed under the whole stage
        bed = ambient_bed(t + 1, os.path.join(tmp, "%s_bed.mp3" % stage))
        dry = os.path.join(OUTDIR, "%s_%s_dry.mp3" % (sid, stage))
        mix(parts, dry)
        out = os.path.join(OUTDIR, "%s_%s.mp3" % (sid, stage))
        run(["ffmpeg", "-y", "-i", dry, "-i", bed, "-filter_complex",
             "[1]volume=0.5[bed];[0][bed]amix=inputs=2:duration=first",
             "-c:a", "libmp3lame", "-q:a", "4", out])
        manifest["stages"][stage] = {"file": "scenes/%s_%s.mp3" % (sid, stage),
                                     "slots": slots, "dur": round(t, 1)}
        print(sid, stage, "%.0fs" % t, flush=True)
    json.dump(manifest, open(os.path.join(OUTDIR, sid + ".json"), "w"),
              ensure_ascii=False, indent=1)


async def main():
    want = sys.argv[1] if len(sys.argv) > 1 else None
    for s in SCEN:
        if want and s["id"] != want:
            continue
        await build(s)

if __name__ == "__main__":
    asyncio.run(main())
