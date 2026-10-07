#!/usr/bin/env python3
"""Normalize data/hxrmxs-missing-corpus/ -> data/hxrmxs-missing-normalized.jsonl.

Schemas (see missing-corpus README):
  A. [PEDAGOGY] messages  -> exemplars (annotated:true, full fields)
  B. transcript[]         -> turns with speaker->role map (annotated:false,
     Jev-annotation backlog)
  C. gold/diamond turns   -> user/hxrmxs pairs + intention (annotated:partial)
Speaker maps per README: Th/Teacher/Socrates/U.G./K = teacher;
Pt/Student/Q/MENO/King Milinda = student; unknown -> other (context only).
Output episodes: {id, lineage, source_file, turns[{role,text,speaker}],
annotated, pedagogy?}. Prints depth stats.
"""
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data/hxrmxs-missing-corpus")
OUT = os.path.join(ROOT, "data/hxrmxs-missing-normalized.jsonl")

TEACHERS = {"th", "teacher", "socrates", "u.g.", "ug", "k", "krishnamurti",
            "nagasena", "buddha", "the buddha", "master", "seung sahn", "soen-sa",
            "maharaj", "epictetus", "nagarjuna", "rinpoche", "diogenes",
            "visitor-teacher"}
STUDENTS = {"pt", "student", "q", "q.", "meno", "king milinda", "milinda",
            "questioner", "monk", "user", "saccaka", "visakha", "dhammadinna",
            "dighanakha", "vacchagotta", "malunkyaputta", "kaccanagotta",
            "consular", "magistrate"}


def role_of(speaker):
    s = (speaker or "").strip().lower()
    if s in TEACHERS:
        return "assistant"
    if s in STUDENTS:
        return "user"
    return "other"


def split_pedagogy(content):
    m = re.search(r'\[PEDAGOGY\](.*?)\[/PEDAGOGY\](.*)', content, re.S)
    if not m:
        return {}, content.strip()
    fields = {}
    for line in m.group(1).splitlines():
        mm = re.match(r'^\s*([a-z_]+):\s*(.+)$', line)
        if mm:
            fields[mm.group(1)] = mm.group(2).strip()[:300]
    if "function_id" in fields:
        fields["function_id"] = fields["function_id"].replace("META_", "ME_")
    return fields, m.group(2).replace('\\"', '"').strip()


def load_json(path):
    """Tolerant loader: strips prose prefixes, multi-doc concat, lax strings."""
    raw = open(path, encoding="utf8", errors="replace").read()
    start = raw.find("{")
    if start == -1:
        return None
    raw = raw[start:]
    dec = json.JSONDecoder(strict=False)
    docs, idx, n = [], 0, len(raw)
    while idx < n:
        while idx < n and raw[idx] not in "[{":
            idx += 1
        if idx >= n:
            break
        try:
            obj, end = dec.raw_decode(raw, idx)
            docs.append(obj)
            idx = end
        except Exception:
            idx += 1
    if not docs:
        return None
    merged: dict = {"episodes": []}
    for d in docs:
        if isinstance(d, dict) and "seed_question" in d:
            merged.setdefault("gold", []).append(d)
        elif isinstance(d, dict) and "episodes" in d:
            merged["episodes"].extend(d["episodes"])
        elif isinstance(d, dict) and "transcript" in d:
            merged["episodes"].append(d)
    return merged


def main():
    eps = []
    for path in sorted(glob.glob(os.path.join(SRC, "**/*.txt"), recursive=True)):
        if "/analysis/" in path:
            continue
        d = load_json(path)
        if d is None:
            continue
        rel = os.path.relpath(path, SRC)
        # shape C: gold/diamond single-episode dicts
        for gd in d.get("gold", []):
            turns = []
            for t in gd.get("turns", []):
                if isinstance(t, dict) and "user" in t:
                    turns.append({"role": "user", "text": t["user"]})
                    if t.get("hxrmxs"):
                        turns.append({"role": "assistant", "text": t["hxrmxs"],
                                      "intention": t.get("intention", "")})
            if turns:
                eps.append({"id": gd.get("episode_id", os.path.basename(path)),
                            "lineage": "Modern", "source_file": rel, "turns": turns,
                            "annotated": "partial"})
        episodes = d.get("episodes", []) if isinstance(d, dict) else []
        for ep in episodes:
            if not isinstance(ep, dict):
                continue
            turns = []
            annotated = True
            # shape A or messages
            msgs = ep.get("messages")
            if isinstance(msgs, list):
                for m in msgs:
                    if not isinstance(m, dict):
                        continue
                    if m.get("role") == "user":
                        turns.append({"role": "user", "text": str(m.get("content", ""))})
                    elif m.get("role") == "assistant":
                        f, sp = split_pedagogy(str(m.get("content", "")))
                        turns.append({"role": "assistant", "text": sp, "fields": f})
                        if not f:
                            annotated = "partial"
            # shape B: transcript[] or student/teacher_turns
            for key in ("transcript",):
                for t in ep.get(key, []) or []:
                    if not isinstance(t, dict):
                        continue
                    r = role_of(t.get("speaker", ""))
                    if t.get("text"):
                        turns.append({"role": r, "text": t["text"],
                                      "speaker": t.get("speaker", "")})
                    annotated = False
            for sk, tk in (("student_turns", "user"), ("teacher_turns", "assistant")):
                for t in ep.get(sk, []) or []:
                    txt = t.get("text", "") if isinstance(t, dict) else str(t)
                    if txt:
                        turns.append({"role": tk, "text": txt})
                    annotated = False
            if turns:
                eps.append({"id": ep.get("episode_id", os.path.basename(path)),
                            "lineage": ep.get("lineage", "Unknown"),
                            "source_file": rel, "turns": turns,
                            "annotated": annotated})
    # dedup by id
    seen, out = set(), []
    for e in eps:
        if e["id"] in seen:
            continue
        seen.add(e["id"])
        out.append(e)
    with open(OUT, "w") as f:
        for e in out:
            f.write(json.dumps(e, ensure_ascii=False) + "\n")
    # depth stats (assistant turns)
    from collections import Counter
    dist = Counter()
    longest = []
    for e in out:
        na = sum(1 for t in e["turns"] if t["role"] == "assistant")
        dist[na] += 1
        longest.append((na, e["id"][:50], e["lineage"]))
    longest.sort(reverse=True)
    print("episodes:", len(out))
    print("assistant-turn dist:", sorted(dist.items()))
    print("top 8 longest:", longest[:8])
    print("lineages:", Counter(e["lineage"] for e in out).most_common(10))
    print("->", OUT)


if __name__ == "__main__":
    main()
