#!/usr/bin/env python3
"""Normalize data/hxrmxs-missing-corpus/ -> data/hxrmxs-missing-normalized.jsonl.

Schemas (see missing-corpus README):
  A. [PEDAGOGY] messages  -> exemplars (annotated:true, full fields)
  B. transcript[]         -> turns with speaker->role map (annotated:false,
     Jev-annotation backlog)
  C. gold/diamond turns   -> user/hxrmxs pairs + intention (annotated:partial)
  D. student_turns/teacher_turns annotated pass1 episodes
  E. flat turn_index/speaker/text lists (ISTDP raw cuts, nagarjuna debate)
  F. list of {messages:[...]} diary training shorts
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
            "visitor-teacher", "plato", "agathon", "realist", "nāgasena"}
STUDENTS = {"pt", "student", "q", "q.", "meno", "king milinda", "milinda",
            "questioner", "monk", "user", "saccaka", "visakha", "dhammadinna",
            "dighanakha", "vacchagotta", "malunkyaputta", "kaccanagotta",
            "consular", "magistrate", "interlocutor", "visitor", "polus",
            "euthyphro", "callias", "gorgias", "agathon", "realist-opponent",
            "buddhist", "ascetic"}


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


def turns_from_flat_list(items, rel, lineage_hint="Unknown"):
    """Group consecutive turn_index/speaker/text dicts into one episode."""
    turns = []
    for t in items:
        if not isinstance(t, dict) or "text" not in t:
            continue
        turns.append({
            "role": role_of(t.get("speaker", "")),
            "text": str(t.get("text", "")),
            "speaker": t.get("speaker", ""),
        })
    if not turns:
        return None
    speakers = {t.get("speaker", "") for t in items if isinstance(t, dict) and t.get("speaker")}
    lin = lineage_hint
    sl = {s.strip().lower() for s in speakers if s}
    if sl & {"th", "pt"} or "therapy" in rel.lower() or "psycho" in rel.lower() or "cocreating" in rel.lower() or "better" in rel.lower():
        lin = "ISTDP" if lin == "Unknown" else lin
    if sl & {"nāgasena", "nagasena", "king milinda", "milinda"}:
        lin = "Buddhist"
    if sl & {"epictetus", "interlocutor"}:
        lin = "Stoic"
    if sl & {"diogenes", "plato"} and "diogenes" in rel.lower():
        lin = "Cynic"
    if sl & {"nagarjuna", "realist"} or "nagarjuna" in rel.lower():
        lin = "Madhyamaka"
    base = os.path.basename(rel).replace(".txt", "")
    return {"id": f"{base}_flat_{len(turns)}", "lineage": lin,
            "source_file": rel, "turns": turns, "annotated": False}


def load_docs(path):
    """Tolerant multi-doc loader -> list of raw JSON values."""
    raw = open(path, encoding="utf8", errors="replace").read()
    start = min([i for i in (raw.find("{"), raw.find("[")) if i >= 0], default=-1)
    if start < 0:
        return []
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
    return docs


def load_json(path):
    """Legacy merged view for gold + episodes (kept for gold/seed path)."""
    docs = load_docs(path)
    if not docs:
        return None
    merged: dict = {"episodes": [], "docs": docs}
    for d in docs:
        if isinstance(d, dict) and "seed_question" in d:
            merged.setdefault("gold", []).append(d)
        elif isinstance(d, dict) and "episodes" in d:
            merged["episodes"].extend(d["episodes"])
        elif isinstance(d, dict) and ("transcript" in d or "episode_id" in d
                                      or "student_turns" in d or "messages" in d):
            merged["episodes"].append(d)
    return merged


def main():
    eps = []
    for path in sorted(glob.glob(os.path.join(SRC, "**/*.txt"), recursive=True)):
        if "/analysis/" in path:
            continue
        rel = os.path.relpath(path, SRC)
        docs = load_docs(path)
        if not docs:
            continue
        # Walk raw docs for schema E/F (lists) and wrap episode-like dicts
        flat_buffer = []
        for d in docs:
            if isinstance(d, list) and d and all(
                isinstance(x, dict) and ("turn_index" in x or "speaker" in x) and "text" in x
                for x in d
            ):
                flat_buffer.extend(d)
                continue
            if flat_buffer:
                ep = turns_from_flat_list(flat_buffer, rel)
                if ep:
                    eps.append(ep)
                flat_buffer = []
            if isinstance(d, list):
                # F: diary [{messages:[...]}, ...]
                for item in d:
                    if isinstance(item, dict) and isinstance(item.get("messages"), list):
                        turns = []
                        annotated = True
                        for m in item["messages"]:
                            if not isinstance(m, dict):
                                continue
                            if m.get("role") == "user":
                                turns.append({"role": "user", "text": str(m.get("content", ""))})
                            elif m.get("role") == "assistant":
                                f, sp = split_pedagogy(str(m.get("content", "")))
                                turns.append({"role": "assistant", "text": sp, "fields": f})
                                if not f:
                                    annotated = "partial"
                        if turns:
                            eps.append({
                                "id": item.get("episode_id", f"diary_{len(eps)}"),
                                "lineage": item.get("lineage", "Modern"),
                                "source_file": rel,
                                "turns": turns,
                                "annotated": annotated,
                            })
                continue
            if not isinstance(d, dict):
                continue
            # C: gold/diamond
            if "seed_question" in d:
                turns = []
                for t in d.get("turns", []):
                    if isinstance(t, dict) and "user" in t:
                        turns.append({"role": "user", "text": t["user"]})
                        if t.get("hxrmxs"):
                            turns.append({"role": "assistant", "text": t["hxrmxs"],
                                          "intention": t.get("intention", "")})
                if turns:
                    eps.append({"id": d.get("episode_id", os.path.basename(path)),
                                "lineage": d.get("topic", "Modern"),
                                "source_file": rel, "turns": turns,
                                "annotated": "partial"})
                continue
            episodes = d.get("episodes") if isinstance(d.get("episodes"), list) else None
            if episodes is None and any(k in d for k in ("episode_id", "transcript", "student_turns", "messages")):
                episodes = [d]
            if not episodes:
                continue
            for ep in episodes:
                if not isinstance(ep, dict):
                    continue
                turns = []
                annotated = True
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
                for t in ep.get("transcript") or []:
                    if not isinstance(t, dict):
                        continue
                    r = role_of(t.get("speaker", ""))
                    if t.get("text"):
                        turns.append({"role": r, "text": t["text"],
                                      "speaker": t.get("speaker", "")})
                    annotated = False
                for sk, tk in (("student_turns", "user"), ("teacher_turns", "assistant")):
                    for t in ep.get(sk) or []:
                        txt = t.get("text", "") if isinstance(t, dict) else str(t)
                        if txt:
                            turns.append({"role": tk, "text": txt})
                        annotated = False
                if turns:
                    eps.append({"id": ep.get("episode_id", os.path.basename(path)),
                                "lineage": ep.get("lineage", "Unknown"),
                                "source_file": rel, "turns": turns,
                                "annotated": annotated})
        if flat_buffer:
            ep = turns_from_flat_list(flat_buffer, rel)
            if ep:
                eps.append(ep)
    # dedup by id
    seen, out = set(), []
    for e in eps:
        key = (e["id"], e.get("source_file"), len(e["turns"]))
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
    print("lineages:", Counter(e["lineage"] for e in out).most_common(15))
    print("->", OUT)


if __name__ == "__main__":
    main()
