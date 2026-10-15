#!/usr/bin/env python3
"""Free-lane Fish renderer for Hindi scenario lines — $0, never metered.

Uses fish-audio-sdk with model=s2.1-pro-free (see voiceagent/adapters/fish_tts.py).
Needs FISH_API_KEY in env (key required, renders bill $0 on the free model).

Casting (mirrors lib/hindi/fishVoices.ts — keep in sync):
  npc  -> conversation voice (normal back-and-forth)
  npc-slow -> slow voice (easy level variant of each NPC line)
  you  -> female voice (learner model lines)

Usage:
  FISH_API_KEY=... python3 scripts/fish_render_free.py [--dry-run] [scenario-id]

Skips files that already exist. Updates public/memory/hindi/scenes/voices.json
so the scenarios page `hear()` picks Fish files up with zero code changes.
"""
import json
import os
import sys

VOICES = {
    "conversation": os.getenv("NEXT_PUBLIC_FISH_VOICE_CONVERSATION",
                              "0de8162a9e384545a0106046b57488a7"),
    "slow": os.getenv("NEXT_PUBLIC_FISH_VOICE_SLOW",
                      "06134e9a49cb4a36997b75402c8a0621"),
    "female": os.getenv("NEXT_PUBLIC_FISH_VOICE_FEMALE",
                        "1021386b765a4c25bd3e167c1a552875"),
}
MODEL_FREE = "s2.1-pro-free"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCEN_PATH = os.path.join(ROOT, "public/memory/hindi/scenes")
os.makedirs(SCEN_PATH, exist_ok=True)


def plan():
    d = json.load(open(os.path.join(ROOT, "public/memory/hindi/scenarios.json")))
    jobs = []
    for s in d["scenarios"]:
        sid = s["id"]
        for i, n in enumerate(s.get("npcScript", [])):
            jobs.append((sid, f"fish-{sid}-npc-{i}.mp3", n["hindi"], "conversation"))
            jobs.append((sid, f"fish-{sid}-npc-slow-{i}.mp3", n["hindi"], "slow"))
        for i, t in enumerate(s.get("targetLines", [])):
            jobs.append((sid, f"fish-{sid}-you-{i}.mp3", t, "female"))
    return jobs


def main():
    dry = "--dry-run" in sys.argv
    want = next((a for a in sys.argv[1:] if not a.startswith("--")), None)
    jobs = [j for j in plan() if not want or j[0] == want]
    # files that don't exist or are tiny
    missing = []
    for j in jobs:
        p = os.path.join(SCEN_PATH, j[1])
        if not os.path.exists(p) or os.path.getsize(p) < 2000:
            missing.append(j)
    total_bytes = sum(len(t.encode("utf-8")) for _, _, t, _ in missing)
    print(f"scenarios: {len(set(j[0] for j in jobs))}, lines: {len(jobs)}, "
          f"to render: {len(missing)}, bytes: {total_bytes} (model {MODEL_FREE} = $0)")
    if dry:
        for sid, f, t, role in missing:
            print(f"  [{role}] {f} :: {t[:60]}")
        return
    if not missing:
        print("nothing to do.")
        return
    key = os.getenv("FISH_API_KEY", "").strip()
    if not key:
        print("FISH_API_KEY not set — copy .env.example to .env and add it. No renders run.")
        sys.exit(2)
    from fishaudio import FishAudio
    client = FishAudio(api_key=key)
    try:
        vpath = os.path.join(SCEN_PATH, "voices.json")
        voices = json.load(open(vpath)) if os.path.exists(vpath) else {}
        # per-line files; map shape: text -> {file, slow?} so easy level can
        # pick the slow-voice variant without losing the conversation file.
        line_voice = {}
        for sid, f, t, role in missing:
            audio = client.tts.convert(text=t, reference_id=VOICES[role],
                                       format="mp3", model=MODEL_FREE)
            with open(os.path.join(SCEN_PATH, f), "wb") as fh:
                fh.write(audio)
            line_voice[t] = (f, role)
            print(f"  wrote {f} [{role}]")
        for sid, f, t, role in [(j[0], j[1], j[2], j[3]) for j in jobs]:
            e = voices.get(t, {})
            if role == "slow":
                e["slow"] = f
                e.setdefault("voice", "fish-conversation")
            elif t in line_voice and line_voice[t][0] == f:
                e["file"] = f
                e["voice"] = f"fish-{role}"
            voices[t] = e
        json.dump(voices, open(vpath, "w"), ensure_ascii=False, indent=1)
        print(f"voices.json now {len(voices)} entries.")
    finally:
        client.close()


if __name__ == "__main__":
    main()
