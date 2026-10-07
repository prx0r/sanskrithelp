#!/usr/bin/env python3
"""Build public/memory/syllabus.json — the course as STRUCTURED DATA.

Every unit REFERENCES material (docs/data/audio/routes); no content is copied.
Content generation (Audio 00-19 scripts, per-pair lessons) renders FROM this.
Regenerate: python3 scripts/build_syllabus.py (also runs validation).
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public/memory/syllabus.json")

def U(id, title, phase, track, sources, practice_ref, exit, prereqs,
      status, blocks_on=None, note=""):
    return {"id": id, "title": title, "phase": phase, "track": track,
            "sources": sources, "practice_ref": practice_ref, "exit": exit,
            "prereqs": prereqs, "status": status,
            "blocks_on": blocks_on or [], "note": note}

def S(kind, ref, note=""):
    return {"kind": kind, "ref": ref, "note": note}

DOC = "doc"
DATA = "data"
AUDIO = "audio"
ROUTE = "route"

UNITS = [
 # ---- Phase 0: install ----
 U("m00", "Orientation: what you are constructing", 0, "matrka",
   [S(DOC, "docs/visions/awesomecurriculum.md#audio-00", "Audio 00 spec"),
    S(DOC, "public/memory/canonical/TA15_TABLE.html", "frozen v2, verse vs apparatus"),
    S(DOC, "public/memory/canonical/THEORY_SHELF.html", "Journey first")],
   "awesomecurriculum:Audio 00", "can state the map doctrine (verse vs apparatus, ours vs textual)",
   [], "live"),
 U("m01", "Vowels install, Audio 01 pair template (Nights 1-8)", 0, "matrka",
   [S(DATA, "public/memory/data/matrika_body_map.json", "vowels 1-16, v2"),
    S(AUDIO, "public/memory/audio/cycle_vowels_v2.mp3", "14 slots; ḷ/ḹ silent"),
    S(ROUTE, "/memory/practice-chart.html", "Tonight 50")],
   "nightly pair script = Audio 01 template (awesomecurriculum)", "Ckpt 0: reproduce 16 vowels + loci accurately",
   ["m00"], "live"),
 U("m02", "Ka/ca install, Audio 01 pairs (limb contrast)", 0, "matrka",
   [S(DATA, "public/memory/data/matrika_body_map.json", "ka/ca vargas 17-26"),
    S(AUDIO, "public/memory/audio/cycle_consonants_v2.mp3", "v2 loci"),
    S(ROUTE, "/memory/bruno-50/", "varna formation")],
   "nightly pair script", "ka→shoulder … ña→nails without traversal",
   ["m01"], "live"),
 U("m03", "Ṭa/ta/pa/deep install, Audio 01 pairs (rest of 50)", 0, "matrka",
   [S(DATA, "public/memory/data/matrika_body_map.json", "27-50"),
    S(ROUTE, "/memory/body-diagram.html", "full figure"),
    S(AUDIO, "public/memory/audio/cycle_full_starter_v2.mp3", "26-slot loop")],
   "nightly pair script", "all 50 phoneme→locus placed",
   ["m02"], "partial", note="24 slots lack cycle coverage; chart covers all 50"),
 U("m04", "Checkpoint 1 exam: navigate (Audio 04 body answers)", 0, "matrka",
   [S(DOC, "docs/visions/awesomecurriculum.md#checkpoint-1", "45/50, ~1s, direct addressing"),
    S(ROUTE, "/memory/bruno", "locus quiz"), S(ROUTE, "/memory/night", "morning recall check")],
   "random prompts both directions (Audio 04 phoneme-only/locus-only tracks)", "45/50 correct, ~1s access, no sequential traversal",
   ["m03"], "live"),
 # ---- Phase 1: internalize ----
 U("m05", "Evoke + silent, Audio 02 + Audio 05 (Ckpt 2, Ckpt 3)", 1, "matrka",
   [S(AUDIO, "public/memory/audio/night1_guided_circuit_v2.mp3", "steps 4-5 pattern for a/ā"),
    S(DOC, "docs/padoux.md#2-levels-of-the-word", "vaikhari→madhyama→paśyantī")],
   "think phoneme → locus salience; locus → silent phoneme",
   "bidirectional without touch or overt speech", ["m04"], "partial",
   note="guided pattern exists for a/ā only; generalize per varga"),
 U("m06", "Random access, Audio 06 breaking the alphabet (Ckpt 4)", 1, "matrka",
   [S(ROUTE, "/memory/bruno-50/", "randomize"), S(ROUTE, "/memory/matrka-wheel/integrated.html", "scramble rings")],
   "teleport drills (ma → ṛ → kha → ṣa)", "no alphabetic dependency",
   ["m05"], "live"),
 U("m07", "Sṛṣṭi/apyaya runs, Audio 08 + Audio 09 (Ckpt 5)", 1, "matrka",
   [S(DOC, "docs/padoux.md#3-phonematic-emanation", "one visarga pulsation, kṣa→a liberation direction")],
   "forward build + reverse resolve, then as visualization", "full sequence both ways without aids",
   ["m06"], "planned"),
 U("m08", "Collective field, Audio 07 fields + Audio 10 whole Mātṛkā (Ckpt 6)", 1, "matrka",
   [S(DOC, "docs/padoux.md#4-sixfold-course", "81-pada counter-clockwise walk; sarvasarvātmakatā")],
   "hold varga → region → whole body as one configuration", "field available simultaneously",
   ["m07"], "planned"),
 # ---- Phase 2: breath/sound ----
 U("b01", "Uccāra: impulse before sound, Audio 03 + Audio 11 (Ckpt 7)", 2, "breath",
   [S(DOC, "docs/visions/awesomecurriculum.md#audio-03", "2s wait-slots"),
    S(DOC, "docs/padoux.md#1-manifestation-of-sound", "hamsa, self-uttered")],
   "sustained vowel; notice intention→breath→sound→fading", "clearly perceive the arising chain",
   ["m06"], "partial", note="method in nightly script; dedicated tracks missing"),
 U("b02", "Uccāra II + dhvani, Audio 12 + Audio 13", 2, "breath",
   [S(DOC, "docs/padoux.md#1-manifestation-of-sound", "nādānta/nirodhinī/ardhacandra grades")],
   "phoneme without glyph; auditory character primary", "felt signature experiential",
   ["b01"], "planned"),
 U("b03", "VBT daily dhāraṇā", 2, "breath",
   [S(DATA, "public/memory/vbt-daily.json", "65 mapped of 112"),
    S(ROUTE, "/memory/night", "Today's dhāraṇā + transcribed five")],
   "sit with today's dhāraṇā before silence", "daily rotation sustained",
   ["m04"], "live"),
 U("b04", "OM spine + amṛta down-flood", 2, "breath",
   [S(DOC, "docs/padoux.md#5-mantra", "A-U-MA-bindu-…-unmanā + Netra down-flood")],
   "nightly ascent heart→dvādaśānta, flood down", "spine runnable from memory",
   ["b01"], "planned"),
 # ---- Phase 3: reconfigure ----
 U("x01", "Mālinī second map, Audio 14 + Audio 15 (Ckpt 8)", 3, "malini",
   [S(DATA, "public/memory/data/malini_order.json", "na→pha; loci UNVERIFIED"),
    S(DOC, "docs/padoux.md#3-phonematic-emanation", "bhinnayoni, best for nyāsa")],
   "same body, different ordering; keep maps distinct", "both maps navigable, never merged",
   ["m06"], "blocked", blocks_on=["verify malini loci vs MV 3.37-41 Sanskrit"]),
 U("x02", "Wheel II: phoneme×locus×Śakti", 3, "malini",
   [S(DOC, "docs/TRANSLATION_FRONTIER.md#2-kularatnoddyota", "Sprint 1: KuRatnUdd 5.84-101 → 50 Śaktis")],
   "populate loci with presiding powers (post-Mālinī-stable)", "Śakti layer installed",
   ["x01"], "blocked", blocks_on=["Sprint 1 translation data"]),
 U("x03", "SAUH/KHPHREM hearts", 3, "mantra",
   [S(DOC, "docs/padoux.md#5-mantra", "sṛṣṭi-heart vs saṃhāra-heart; kānda→dvādaśānta route")],
   "hold cosmos in heart (SAUH); dissolve (KHPHREM)", "both hearts runnable",
   ["b04"], "planned"),
 # ---- Phase 4: language ----
 U("p01", "Pratyāhāra selection ops, Audio 16", 4, "panini",
   [S(ROUTE, "/memory/panini", "expanders, varga wheels"),
    S(DOC, "docs/padoux.md#8-curriculum-wiring", "varga origins are phonetic")],
   "ac/hal as selections over embodied field", "pratyāhāras read off the body",
   ["m06"], "live"),
 U("p02", "Transformations, Audio 17 (sandhi/guṇa)", 4, "panini",
   [S(DOC, "docs/visions/awesomecurriculum.md#audio-17", "A→operator→B state change")],
   "run derivations spatially (Bruno operator)", "forms derived without destroying base map",
   ["p01"], "partial"),
 U("p03", "Text Mode triliteral", 4, "hindi",
   [S(ROUTE, "/memory/hindi/text-mode", "Osho anchors + assess"),
    S(ROUTE, "/memory/hindi/scenarios", "field scenarios + hint ladders")],
   "see/hear/write/decompile/discuss per sūtra", "sūtra explainable in simple Hindi",
   [], "live"),
 U("p04", "Hindi daily loop", 4, "hindi",
   [S(ROUTE, "/memory/hindi", "Today's Hindi card"),
    S(DATA, "public/memory/hindi/scenarios.json", "3 staged scenarios"),
    S(DATA, "public/memory/hindi/corpus.json", "Dataset Zero status")],
   "one line daily → scenarios → logged in sadhana log", "streak sustained; Osho 02-10 anchored",
   ["p03"], "partial", note="Osho talks 02-10 anchors missing; TTS scoring needs Chrome/mic"),
 U("p05", "No wheel: direct call, Audio 18 (Ckpt 9)", 4, "panini",
   [S(DOC, "docs/visions/awesomecurriculum.md#audio-18", "close the visual machine")],
   "sound calls body+grammar directly", "relations without visualizing",
   ["p02", "m06"], "planned"),
 # ---- Phase 5: dissolve + research ----
 U("d01", "Nothing required, Audio 19 (Ckpt 10)", 5, "dissolve",
   [S(DOC, "docs/visions/awesomecurriculum.md#audio-19", "sparse by definition; record late")],
   "phoneme arises, passes; structure available, undeployed", "availability without deployment",
   ["p05", "b02"], "planned"),
 U("d02", "T8 universe-into-body", 5, "t8",
   [S(DOC, "docs/padoux.md#4-sixfold-course", "kala frame first, then tattvas/bhuvanas inside kalās"),
    S(DOC, "docs/STONEDOORWAY-TANTRA-BODY.md", "phased build, Mātṛkā-only first")],
   "install kalās head-to-foot, then worlds inside", "cosmos navigable on the skeleton",
   ["m08", "x01"], "planned", blocks_on=["kala charts (SP3); Stonedoorway body world"]),
 U("r01", "Sprint 1 translation (KuRatnUdd 5.84-101)", 5, "research",
   [S(DOC, "docs/TRANSLATION_FRONTIER.md#first-concrete-sprint", "~18 verses → 50/50/50 + Five Maps product")],
   "Pāṭala protocol per verse (source→audit→human edit)", "Five Medieval Maps dataset + page",
   [], "planned"),
 U("r02", "Triśirobhairava reconstruction", 5, "research",
   [S(DOC, "docs/TRANSLATION_FRONTIER.md#8-triśirobhairava", "Jayaratha + KMT17 + MVT3 + SYM3 + TSB3")],
   "stemmatic/comparative reconstruction", "paper-worthy comparative text",
   ["r01"], "planned"),
 U("r03", "Śrīmatottara 7 flagship (Wheel II data)", 5, "research",
   [S(DOC, "docs/TRANSLATION_FRONTIER.md#1-śrīmatottara", "50 Śaktis + iconography → interactive body")],
   "Sanskrit→translation→phoneme→locus→Śakti→iconography", "Wheel II populated",
   ["r01"], "planned"),
]

CHECKPOINTS = ["Ckpt0 Sound", "Ckpt1 Navigate", "Ckpt2 Evoke", "Ckpt3 Internalize",
               "Ckpt4 Random access", "Ckpt5 Srsti/apyaya", "Ckpt6 Collective field",
               "Ckpt7 Uccara", "Ckpt8 Malini", "Ckpt9 Operators", "Ckpt10 Dissolve scaffold"]
AUDIOS = ["Audio%02d" % i for i in range(20)]


def validate(units):
    errors = []
    ids = [u["id"] for u in units]
    if len(ids) != len(set(ids)):
        errors.append("duplicate unit ids")
    # prereq DAG: refs exist + acyclic
    seen = {}
    def visit(uid, stack):
        if uid in stack:
            errors.append("cycle: %s" % "->".join(stack + [uid]))
            return
        if uid in seen:
            return
        seen[uid] = True
        u = next(x for x in units if x["id"] == uid)
        for p in u["prereqs"]:
            if p not in ids:
                errors.append("%s prereq missing: %s" % (uid, p))
            else:
                visit(p, stack + [uid])
    for uid in ids:
        visit(uid, [])
    # refs resolve (repo-relative files; routes checked as public paths)
    for u in units:
        for s in u["sources"]:
            ref = s["ref"].split("#")[0]
            if s["kind"] in ("doc", "data", "audio"):
                if not os.path.exists(os.path.join(ROOT, ref)):
                    errors.append("%s ref missing: %s" % (u["id"], ref))
            elif s["kind"] == "route":
                # public html or app route dir
                cand = [os.path.join(ROOT, "public", ref.lstrip("/")),
                        os.path.join(ROOT, "app", ref.lstrip("/").split("#")[0].strip("/"))]
                if not any(os.path.exists(c) for c in cand):
                    errors.append("%s route missing: %s" % (u["id"], ref))
    # coverage: every checkpoint + audio mentioned somewhere
    blob = json.dumps(units).lower().replace(" ", "")
    for i in range(11):
        if ("ckpt%d" % i) not in blob:
            errors.append("checkpoint uncovered: Ckpt%d" % i)
    for i in range(20):
        if ("audio%02d" % i) not in blob:
            errors.append("audio uncovered: Audio%02d" % i)
    return errors


def main():
    errs = validate(UNITS)
    if errs:
        print("SYLLABUS ERRORS:")
        for e in errs:
            print(" -", e)
        sys.exit(1)
    json.dump({"id": "matrka-course-v1",
               "note": "Structure only: units reference material, none copied. Content renders FROM this.",
               "units": UNITS, "checkpoints": CHECKPOINTS, "audios": AUDIOS},
              open(OUT, "w"), ensure_ascii=False, indent=1)
    print("syllabus ok: %d units -> %s" % (len(UNITS), OUT))
    build_html(UNITS)


STATUS_COLOR = {"live": "#7dcea0", "partial": "#c9a45c", "planned": "#5ec4b6", "blocked": "#d4899a"}
PHASE_NAMES = {0: "Phase 0 — Install", 1: "Phase 1 — Internalize", 2: "Phase 2 — Breath & sound",
               3: "Phase 3 — Reconfigure", 4: "Phase 4 — Language", 5: "Phase 5 — Dissolve + research"}


def build_html(units):
    import html as H
    parts = ["""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Course Syllabus — structure (matrka-course-v1)</title>
<style>body{margin:0;background:#0b0d12;color:#f0ebe0;font:15px/1.55 Georgia,serif}
main{max-width:1100px;margin:auto;padding:1rem 1rem 4rem}.card{background:#12161f;border:1px solid #2a3142;border-radius:14px;padding:1rem;margin-bottom:1rem}
h2{color:#c9a45c;font-size:1.05rem}table{width:100%;border-collapse:collapse;font-size:.86rem}
th,td{border-bottom:1px solid #1e2430;padding:.35rem .4rem;text-align:left;vertical-align:top}
th{color:#a8a294;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em}
.dot{display:inline-block;width:.6em;height:.6em;border-radius:50%;margin-right:.3em}
code{color:#5ec4b6;font-size:.78rem}a{color:#5ec4b6}.muted{color:#a8a294}</style>
</head><body><main>
<div class="card"><h1>Course syllabus — structure, not content</h1>
<p class="muted">26 units in prerequisite order. Each unit references material; nothing is copied here.
<span class="dot" style="background:#7dcea0"></span>live <span class="dot" style="background:#c9a45c"></span>partial
<span class="dot" style="background:#5ec4b6"></span>planned <span class="dot" style="background:#d4899a"></span>blocked.
<a href="/memory">Memory</a> · source: <code>public/memory/syllabus.json</code> (built by <code>scripts/build_syllabus.py</code>)</p></div>"""]
    by_phase: dict = {}
    for u in units:
        by_phase.setdefault(u["phase"], []).append(u)
    for ph in sorted(by_phase):
        parts.append('<div class="card"><h2>%s</h2>' % PHASE_NAMES.get(ph, ph))
        parts.append("<table><tr><th>unit</th><th>exit</th><th>needs</th><th>sources</th></tr>")
        for u in by_phase[ph]:
            srcs = "<br>".join(
                '<code>%s</code> %s' % (H.escape(s["ref"].split("#")[0]), H.escape(s.get("note", "")))
                for s in u["sources"][:4])
            pre = ", ".join('<code>%s</code>' % H.escape(p) for p in u["prereqs"]) or "—"
            blk = ("<br>blocked on: %s" % H.escape(", ".join(u["blocks_on"]))) if u["blocks_on"] else ""
            parts.append(
                "<tr><td><span class=\"dot\" style=\"background:%s\"></span><strong>%s</strong><br>%s</td>"
                "<td>%s</td><td>%s%s</td><td>%s</td></tr>"
                % (STATUS_COLOR.get(u["status"], "#888"), H.escape(u["id"]), H.escape(u["title"]),
                   H.escape(u["exit"]), pre, blk, srcs))
        parts.append("</table></div>")
    parts.append("</main></body></html>")
    out = os.path.join(ROOT, "public/memory/syllabus.html")
    open(out, "w").write("\n".join(parts))
    print("syllabus html -> %s" % out)


if __name__ == "__main__":
    main()
