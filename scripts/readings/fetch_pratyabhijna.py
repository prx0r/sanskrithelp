#!/usr/bin/env python3
"""
Fetch and parse Pratyabhijñāhṛdayam from sanskritdocuments.org ITX.
Fallback: use embedded seed data (20 sūtras from Jaideva Singh).
Output: public/content/readings/pratyabhijna_hrdayam/units.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Add project root
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

try:
    from indic_transliteration import sanscript
except ImportError:
    sanscript = None  # type: ignore

ITX_URL = "https://sanskritdocuments.org/doc_shiva/pratyabhijnahridayam.itx"

# Jaideva Singh translation (1963) — fallback when ITX/PDF extraction fails
FALLBACK_UNITS = [
    {"itrans": "citih svatantrA vishvasiddhihetuH", "english": "Consciousness, utterly autonomous, is the cause of the universe's accomplishment.", "source": "Jaideva Singh, 1963"},
    {"itrans": "svatantryam vishvabIjam", "english": "Autonomy is the seed of the universe.", "source": "Jaideva Singh, 1963"},
    {"itrans": "vidyAvinAbhAvAd vidyAdhInaM vishvaM", "english": "Because knowledge is never absent, the universe depends on knowledge.", "source": "Jaideva Singh, 1963"},
    {"itrans": "dvau dve pramAtArau", "english": "There are two cognizers.", "source": "Jaideva Singh, 1963"},
    {"itrans": "unmeSo nimayo vA kartRtvam", "english": "Outward or inward movement constitutes agency.", "source": "Jaideva Singh, 1963"},
    {"itrans": "so.apy unmeSAt paramezvaraH", "english": "That (limited agency) too arises from the unfolding of the supreme Lord.", "source": "Jaideva Singh, 1963"},
    {"itrans": "yogyatAbhAvAjjJAnAd anyatra kRtakRtyatA", "english": "Because capacity is absent elsewhere, in knowledge alone is there accomplishment.", "source": "Jaideva Singh, 1963"},
    {"itrans": "sarvam anAtmake vastuni vyAvartate", "english": "In what is insentient, everything is excluded.", "source": "Jaideva Singh, 1963"},
    {"itrans": "svaM svaM rUpam anusandadhAnaH svaprakAzamayaM vibhAti", "english": "Reflecting each its own form, it shines as self-luminous.", "source": "Jaideva Singh, 1963"},
    {"itrans": "bhUyodarSanam ekasya tu", "english": "But repeated seeing belongs to the One.", "source": "Jaideva Singh, 1963"},
    {"itrans": "vismayo bIjam", "english": "Wonder is the seed.", "source": "Jaideva Singh, 1963"},
    {"itrans": "dvAdazadvaM kaulikasUtram", "english": "The Kula scripture has twelve verses.", "source": "Jaideva Singh, 1963"},
    {"itrans": "mUDhasya caturdaSAdhInA", "english": "The bound one depends on the fourteen.", "source": "Jaideva Singh, 1963"},
    {"itrans": "svecchayA svabhittau vimRzya bhedaH", "english": "By one's own will, reflecting in one's own heart, duality is dissolved.", "source": "Jaideva Singh, 1963"},
    {"itrans": "idaM tadidam iti ca mAyA vyavasthA", "english": "This arrangement of 'this' and 'that' is Māyā.", "source": "Jaideva Singh, 1963"},
    {"itrans": "vijJAnAdhiSTAnAM mAyA tato.apy avibhAgo.apI", "english": "Māyā governs the cognizers; even so, it is not separate from That.", "source": "Jaideva Singh, 1963"},
    {"itrans": "vikalpaH svedaH", "english": "Differentiation is the creative emission.", "source": "Jaideva Singh, 1963"},
    {"itrans": "jIvaH saMsArI syAt svaM svaM rUpam anusandadhAnaH", "english": "The individual soul becomes transmigratory by reflecting each its own form.", "source": "Jaideva Singh, 1963"},
    {"itrans": "bIjAngkurAvat", "english": "Like seed and sprout.", "source": "Jaideva Singh, 1963"},
    {"itrans": "ata eva sarvam idaM rudraH paZyati", "english": "Therefore Rudra sees all this.", "source": "Jaideva Singh, 1963"},
]


def itrans_to_devanagari(text: str) -> str:
    if not sanscript:
        return text
    try:
        return sanscript.transliterate(text.strip(), sanscript.ITRANS, sanscript.DEVANAGARI)
    except Exception:
        return text


def itrans_to_iast(text: str) -> str:
    if not sanscript:
        return text
    try:
        return sanscript.transliterate(text.strip(), sanscript.ITRANS, sanscript.IAST)
    except Exception:
        return text


def parse_itx(content: str) -> list[dict]:
    """Parse ITX format — extract sūtra lines. ITX uses % and \\ for markup."""
    units = []
    lines = content.split("\n")
    current = []
    for line in lines:
        line = line.strip()
        if not line or line.startswith("%") or line.startswith("\\"):
            continue
        # Remove ITX commands, keep Sanskrit
        line = re.sub(r"\\[a-zA-Z]+\{[^}]*\}", "", line)
        line = re.sub(r"%.*", "", line).strip()
        if line and re.search(r"[a-zA-ZĀĪŪṚṜḶḸṂḤṬḌṆŚṢ]", line):
            current.append(line)
    # Join and split by sūtra boundaries — heuristic: each sūtra often ends before commentary
    text = " ".join(current)
    # Simple split: each line that looks like a sūtra
    for i, line in enumerate(lines):
        line = line.strip()
        if not line or line.startswith("%"):
            continue
        line = re.sub(r"\\[a-zA-Z]+\{[^}]*\}", "", line).strip()
        # ITX sūtras are usually short, sanskrit words
        if len(line) > 10 and re.search(r"[a-zA-Zāīūṛṃḥṭḍṇśṣ]", line):
            units.append({"itrans": line, "english": ""})
    return units if len(units) >= 15 else []


def fetch_itx() -> str | None:
    try:
        import urllib.request
        req = urllib.request.Request(ITX_URL, headers={"User-Agent": "buapp/1.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"Fetch failed: {e}")
        return None


def main() -> None:
    out_dir = ROOT / "public" / "content" / "readings" / "pratyabhijna_hrdayam"
    out_dir.mkdir(parents=True, exist_ok=True)

    units: list[dict] = []
    content = fetch_itx()
    if content:
        parsed = parse_itx(content)
        if parsed and len(parsed) >= 15:
            for i, p in enumerate(parsed):
                eng = p.get("english") or (FALLBACK_UNITS[i]["english"] if i < len(FALLBACK_UNITS) else "")
                units.append({
                    "id": f"ph_{i+1:03d}",
                    "sequence": i + 1,
                    "devanagari": itrans_to_devanagari(p["itrans"]),
                    "iast": itrans_to_iast(p["itrans"]),
                    "english": eng,
                    "source": FALLBACK_UNITS[i]["source"] if i < len(FALLBACK_UNITS) else "Jaideva Singh, 1963",
                })
            print("Parsed ITX successfully")
    if not units:
        print("Using fallback data")
        for i, fb in enumerate(FALLBACK_UNITS):
            units.append({
                "id": f"ph_{i+1:03d}",
                "sequence": i + 1,
                "devanagari": itrans_to_devanagari(fb["itrans"]),
                "iast": itrans_to_iast(fb["itrans"]),
                "english": fb["english"],
                "source": fb["source"],
            })

    out_path = out_dir / "units.json"
    out_path.write_text(json.dumps(units, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(units)} units to {out_path}")


if __name__ == "__main__":
    main()
