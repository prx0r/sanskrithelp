#!/usr/bin/env python3
"""
Sanskrit RAG Knowledge Base — Build Script
Sources:
  Tier 1: Whitney, Pāṇini, Dhātupāṭha, Monier-Williams (Cologne), Vākyapadīya
  Tier 2: Abhinavagupta (optional, from rag/data/)
Embeddings: Chutes.ai Qwen3 Embedding (instruction-tuned for retrieval)
Vector DB: ChromaDB (local, persistent)
"""
import os
from pathlib import Path

# Load .env.local (Next.js convention) so CHUTES_API_KEY is available
_env_local = Path(__file__).resolve().parent.parent / ".env.local"
if _env_local.exists():
    for line in _env_local.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
import re
import time
import json
import requests
from bs4 import BeautifulSoup
import chromadb

# ── CONFIG ────────────────────────────────────────────────────────
CHUTES_API_KEY = os.environ.get("CHUTES_API_KEY") or os.environ.get("CHUTES_API_TOKEN", "")
EMBED_URL = "https://chutes-qwen-qwen3-embedding-8b.chutes.ai"
EMBED_MODEL = "Qwen/Qwen3-Embedding-8B"
EMBED_DIMS = 4096

# ── WHITNEY CHAPTERS (Wikisource flat structure) ───────────────────
WHITNEY_CHAPTERS = [
    ("intro", "Sanskrit_Grammar_(Whitney)/Introduction"),
    ("ch1", "Sanskrit_Grammar_(Whitney)/Chapter_I"),
    ("ch2", "Sanskrit_Grammar_(Whitney)/Chapter_II"),
    ("ch3", "Sanskrit_Grammar_(Whitney)/Chapter_III"),
    ("ch4", "Sanskrit_Grammar_(Whitney)/Chapter_IV"),
    ("ch5", "Sanskrit_Grammar_(Whitney)/Chapter_V"),
    ("ch6", "Sanskrit_Grammar_(Whitney)/Chapter_VI"),
    ("ch7", "Sanskrit_Grammar_(Whitney)/Chapter_VII"),
    ("ch8", "Sanskrit_Grammar_(Whitney)/Chapter_VIII"),
    ("ch9", "Sanskrit_Grammar_(Whitney)/Chapter_IX"),
    ("ch10", "Sanskrit_Grammar_(Whitney)/Chapter_X"),
    ("ch11", "Sanskrit_Grammar_(Whitney)/Chapter_XI"),
    ("ch12", "Sanskrit_Grammar_(Whitney)/Chapter_XII"),
    ("ch13", "Sanskrit_Grammar_(Whitney)/Chapter_XIII"),
    ("ch14", "Sanskrit_Grammar_(Whitney)/Chapter_XIV"),
    ("ch15", "Sanskrit_Grammar_(Whitney)/Chapter_XV"),
    ("ch16", "Sanskrit_Grammar_(Whitney)/Chapter_XVI"),
    ("ch17", "Sanskrit_Grammar_(Whitney)/Chapter_XVII"),
    ("ch18", "Sanskrit_Grammar_(Whitney)/Chapter_XVIII"),
]

PARA_RE = re.compile(r"(?m)^(\d{1,4}[a-e]?)\.\s+")

# Data paths (relative to project root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent
PANINI_DATA = PROJECT_ROOT / "panini_data"
RAG_DATA = Path(__file__).resolve().parent / "data"
MW_DATA = RAG_DATA / "mw"
XML_ROOT = PROJECT_ROOT / "xml"  # Cologne mw.xml often in ./xml/

# ── TOPIC INFERENCE ─────────────────────────────────────────────────
TOPIC_KEYWORDS = {
    "sandhi": ["sandhi", "euphonic", "combination", "junction", "vowel+", "consonant+"],
    "dhatu": ["root", "dhātu", "verb root", "gaṇa", "class"],
    "suffix": ["suffix", "kṛt", "taddhita", "affix", "primary", "secondary"],
    "karaka": [
        "kāraka", "nominative", "accusative", "instrumental", "dative",
        "ablative", "genitive", "locative", "case",
    ],
    "compound": ["compound", "samāsa", "tatpuruṣa", "bahuvrīhi", "dvandva", "avyayībhāva"],
    "conjugation": [
        "conjugation", "tense", "mood", "present", "perfect", "aorist",
        "future", "passive", "ātmanepada", "parasmaipada",
    ],
    "declension": ["declension", "stem", "gender", "number", "singular", "dual", "plural"],
    "phonology": [
        "vowel", "consonant", "phoneme", "accent", "pitch", "quantity",
        "guṇa", "vṛddhi", "retroflex", "palatal", "guttural",
    ],
}


def infer_topic(text: str) -> str:
    t = text.lower()
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(k in t for k in keywords):
            return topic
    return "general"


# ── WHITNEY SCRAPER ──────────────────────────────────────────────────
def scrape_whitney() -> list[dict]:
    chunks = []
    for chapter_id, slug in WHITNEY_CHAPTERS:
        url = f"https://en.wikisource.org/wiki/{slug}"
        try:
            r = requests.get(url, headers={"User-Agent": "sanskrit-rag/1.0"}, timeout=30)
            soup = BeautifulSoup(r.text, "html.parser")
            content = soup.find("div", {"class": "mw-parser-output"})
            if not content:
                continue
            for tag in content.find_all(["table", "div"], class_=["NavFrame", "reflist"]):
                tag.decompose()
            text = content.get_text(separator="\n", strip=True)
            parts = PARA_RE.split(text)
            if len(parts) >= 3:
                wi = 0
                for i in range(1, len(parts) - 1, 2):
                    num = parts[i].strip()
                    body = parts[i + 1].strip()
                    if len(body) < 40:
                        continue
                    # Full document: no truncation
                    wi += 1
                    chunks.append({
                        "id": f"whitney_{chapter_id}_{wi}_{num.replace('.', '_').replace(' ', '_')}",
                        "text": f"Whitney {num}: {body}",
                        "meta": {
                            "source": "whitney",
                            "type": "explanation",
                            "ref": f"§{num}",
                            "chapter": chapter_id,
                            "topic": infer_topic(body),
                        },
                    })
            else:
                # Fallback for Intro etc: chunk by paragraph
                paras = [p.strip() for p in text.split("\n\n") if len(p.strip()) >= 80]
                for idx, body in enumerate(paras[:80]):
                    # Full document: no truncation
                    chunks.append({
                        "id": f"whitney_{chapter_id}_p{idx}_{abs(hash(body)) % 100000}",
                        "text": f"Whitney {chapter_id} p{idx + 1}: {body}",
                        "meta": {
                            "source": "whitney",
                            "type": "explanation",
                            "ref": f"{chapter_id}",
                            "chapter": chapter_id,
                            "topic": infer_topic(body),
                        },
                    })
            print(f"  whitney/{chapter_id}: {len(chunks)} total chunks")
        except Exception as e:
            print(f"  whitney/{chapter_id}: error {e}")
        time.sleep(0.8)
    return chunks


# ── PĀṆINI LOADER (ashtadhyayi-com/data) ───────────────────────────
def load_panini(data_dir: str = "./panini_data") -> list[dict]:
    """Load sūtras from sutraani/data.txt and sutrartha_english.txt."""
    chunks = []
    data_path = Path(data_dir)
    data_file = data_path / "sutraani" / "data.txt"
    gloss_file = data_path / "sutraani" / "sutrartha_english.txt"

    if not data_file.exists():
        print(f"  !! Panini data not found at {data_file}")
        print("     git clone https://github.com/ashtadhyayi-com/data ./panini_data")
        return []

    raw = json.loads(data_file.read_text(encoding="utf-8"))
    sutras = raw.get("data", [])

    glosses = {}
    if gloss_file.exists():
        glosses = json.loads(gloss_file.read_text(encoding="utf-8"))

    for s in sutras:
        a, p, n = s.get("a", ""), s.get("p", ""), s.get("n", "")
        ref = f"{a}.{p}.{n}"
        skt = s.get("s", "")
        gloss = glosses.get(s.get("i", ""), "").strip()
        topic = infer_topic(gloss) if gloss else infer_topic(skt)

        text = f"Pāṇini {ref} [{topic}]: {skt}"
        if gloss:
            text += f" — {gloss}"

        chunks.append({
            "id": f"panini_{ref.replace('.', '_')}",
            "text": text,
            "meta": {
                "source": "panini",
                "type": "sutra",
                "ref": ref,
                "chapter": f"ch{a}",
                "topic": topic,
            },
        })

    print(f"  panini: {len(chunks)} sutras loaded", flush=True)
    return chunks


# ── DHĀTUPĀṬHA (panini_data/dhatu) ───────────────────────────────────
def load_dhatupatha(data_dir: str | Path | None = None) -> list[dict]:
    """Load verb roots with gaṇa, artha, commentary from ashtadhyayi-com/dhatu."""
    chunks = []
    data_path = Path(data_dir) if data_dir else PANINI_DATA
    dhatu_file = data_path / "dhatu" / "data.txt"
    if not dhatu_file.exists():
        print(f"  !! Dhātupāṭha not found at {dhatu_file}")
        return []
    raw = json.loads(dhatu_file.read_text(encoding="utf-8"))
    entries = raw.get("data", [])
    for e in entries:
        dhatu = e.get("dhatu", "")
        gana = e.get("gana", "")
        artha = e.get("artha", "")
        artha_en = e.get("artha_english", "")
        pada = e.get("pada", "")
        note = e.get("dhaturoopnandini_note", "")
        text_parts = [f"Dhātupāṭha: {dhatu} (gaṇa {gana}, {pada})"]
        if artha:
            text_parts.append(f" — {artha}")
        if artha_en:
            text_parts.append(f". {artha_en}")
        if note:
            text_parts.append(f" Commentary: {note}")
        text = "".join(text_parts)
        topic = infer_topic(text)
        chunks.append({
            "id": f"dhatu_{e.get('i', e.get('baseindex', str(len(chunks)))).replace('.', '_').replace(' ', '_')}",
            "text": text,
            "meta": {"source": "dhatupatha", "type": "dhatu", "gana": gana, "topic": topic},
        })
    print(f"  dhatupatha: {len(chunks)} roots loaded", flush=True)
    return chunks


# ── VĀKYAPADĪYA (panini_data/vakyapadeeyam) ───────────────────────────
def load_vakyapadiya(data_dir: str | Path | None = None) -> list[dict]:
    """Load Bhartṛhari's Vākyapadīya (Brahmakāṇḍa etc.) and Helārāja commentary."""
    chunks = []
    data_path = Path(data_dir) if data_dir else PANINI_DATA
    main_file = data_path / "vakyapadeeyam" / "data.txt"
    comment_file = data_path / "vakyapadeeyam" / "swopajna.txt"
    if not main_file.exists():
        print(f"  !! Vākyapadīya not found at {main_file}")
        return []
    raw = json.loads(main_file.read_text(encoding="utf-8"))
    verses = raw.get("data", [])
    commentary = {}
    if comment_file.exists():
        commentary = json.loads(comment_file.read_text(encoding="utf-8")).get("data", {})
    kanda_count = {}
    for idx, v in enumerate(verses):
        kid = str(v.get("kanda", "1"))
        kanda_count[kid] = kanda_count.get(kid, 0) + 1
        v_idx = kanda_count[kid]
        num = v.get("num", v.get("id", str(idx + 1)))
        text_sk = v.get("text", "")
        artha = v.get("artha", "")
        comm = commentary.get(f"{kid}.{v_idx}", "")
        text = f"Vākyapadīya Kāṇḍa {kid} [{num}]: {text_sk}"
        if artha:
            text += f" — {artha}"
        if comm:
            text += f" [Helārāja: {comm}]"
        chunks.append({
            "id": f"vakyapadiya_{kid}_{num.replace('.', '_')}_{abs(hash(text)) % 100000}",
            "text": text,
            "meta": {"source": "vakyapadiya", "type": "philosophy", "kanda": kid, "topic": "sabdadvaita"},
        })
    print(f"  vakyapadiya: {len(chunks)} verses loaded", flush=True)
    return chunks


# ── MONIER-WILLIAMS (Cologne XML) ────────────────────────────────────
def _strip_xml_tags(s: str) -> str:
    """Remove XML tags, collapse whitespace."""
    return re.sub(r"<[^>]+>", " ", s).strip()

def load_mw_cologne(mw_dir: str | Path | None = None) -> list[dict]:
    """Load Monier-Williams from Cologne mw.xml. Checks xml/mw.xml and rag/data/mw/."""
    chunks = []
    mw_xml = None
    for cand in [Path(mw_dir) if mw_dir else None, XML_ROOT / "mw.xml", MW_DATA / "mw.xml", PROJECT_ROOT / "mw.xml"]:
        if cand and cand.exists():
            mw_xml = cand
            break
    if not mw_xml:
        print(f"  !! Monier-Williams not found. Place mw.xml in ./xml/ or {MW_DATA}")
        return []
    raw = mw_xml.read_text(encoding="utf-8")
    # Cologne: <H1><h><key1>head</key1></h><body>...</body></H1>
    for m in re.finditer(
        r"<key1>([^<]+)</key1>[\s\S]*?<body>([\s\S]*?)</body>",
        raw,
    ):
        head = m.group(1).strip()
        body_raw = m.group(2)
        body = _strip_xml_tags(body_raw).strip()
        if head and len(chunks) < 45000:
            text = f"Monier-Williams: {head} — {body}" if body else f"Monier-Williams: {head}"
            chunks.append({
                "id": f"mw_{len(chunks)}_" + re.sub(r"[^a-zA-Z0-9_\w]", "_", head[:35]),
                "text": text,
                "meta": {"source": "mw", "type": "dictionary", "head": head[:80], "topic": "dictionary"},
            })
    print(f"  monier-williams: {len(chunks)} entries loaded", flush=True)
    return chunks


# ── ABHINAVAGUPTA (rag/data/abhinavagupta) ────────────────────────────
def load_abhinavagupta(data_dir: str | Path | None = None) -> list[dict]:
    """Load Abhinavagupta texts from rag/data/abhinavagupta/*.txt or *.md."""
    chunks = []
    base = Path(data_dir) if data_dir else RAG_DATA / "abhinavagupta"
    if not base.exists():
        return []
    for f in base.glob("**/*.txt"):
        try:
            text = f.read_text(encoding="utf-8")
            paras = [p.strip() for p in text.split("\n\n") if len(p.strip()) >= 60]
            for i, p in enumerate(paras[:100]):
                chunks.append({
                    "id": f"abhinavagupta_{f.stem}_{i}",
                    "text": f"Abhinavagupta ({f.stem}): {p}",
                    "meta": {"source": "abhinavagupta", "type": "philosophy", "file": f.name, "topic": "matrka"},
                })
        except Exception as ex:
            print(f"  !! Error reading {f}: {ex}")
    for f in base.glob("**/*.md"):
        try:
            text = f.read_text(encoding="utf-8")
            paras = [p.strip() for p in re.split(r"\n#{1,3}\s", text) if len(p.strip()) >= 60]
            for i, p in enumerate(paras[:80]):
                chunks.append({
                    "id": f"abhinavagupta_{f.stem}_md_{i}",
                    "text": f"Abhinavagupta ({f.stem}): {p}",
                    "meta": {"source": "abhinavagupta", "type": "philosophy", "file": f.name, "topic": "matrka"},
                })
        except Exception:
            pass
    if chunks:
        print(f"  abhinavagupta: {len(chunks)} chunks loaded", flush=True)
    return chunks


# ── EMBED VIA CHUTES ───────────────────────────────────────────────
DOC_INSTRUCTION = "Represent this Sanskrit grammar rule or sūtra for retrieval"
QUERY_INSTRUCTION = "Given a question about Sanskrit grammar, retrieve the most relevant rule or explanation"


def embed(texts: list[str], instruction: str) -> list[list[float]]:
    prefixed = [f"Instruct: {instruction}\nQuery: {t}" for t in texts]
    headers = {
        "Authorization": f"Bearer {CHUTES_API_KEY}",
        "Content-Type": "application/json",
    }
    # Chutes 8B: { input, model: null } or { input, model }, outputs 4096 dims
    payloads = [
        {"input": prefixed, "model": None},
        {"input": prefixed, "model": EMBED_MODEL},
    ]
    last_err = ""
    for payload in payloads:
        try:
            r = requests.post(f"{EMBED_URL}/v1/embeddings", headers=headers, json=payload, timeout=180)
            data = r.json() if r.text else {}
            if r.ok:
                items = data.get("data", [])
                embs = [x["embedding"] for x in items]
                if embs and len(embs[0]) == EMBED_DIMS:
                    return embs
                last_err = f"Wrong dims: got {len(embs[0]) if embs else 0}"
            else:
                last_err = data.get("error", {}).get("message", r.text[:200]) or str(r.status_code)
        except Exception as e:
            last_err = str(e)
            continue
    raise RuntimeError(f"Embedding failed: {last_err}. Ensure {EMBED_MODEL} (4096 dims).")


# ── BUILD CHROMADB INDEX ────────────────────────────────────────────
def build_index(chunks: list[dict], db_path: str = "./sanskrit_db") -> chromadb.Collection:
    db = chromadb.PersistentClient(path=db_path)
    try:
        db.delete_collection("sanskrit")
    except Exception:
        pass
    col = db.create_collection("sanskrit", metadata={"hnsw:space": "cosine"})

    BATCH = 8  # 8B is slower; smaller batches
    for i in range(0, len(chunks), BATCH):
        batch = chunks[i : i + BATCH]
        vecs = embed([c["text"] for c in batch], DOC_INSTRUCTION)
        col.add(
            ids=[c["id"] for c in batch],
            embeddings=vecs,
            documents=[c["text"] for c in batch],
            metadatas=[c["meta"] for c in batch],
        )
        print(f"  indexed {min(i + BATCH, len(chunks))}/{len(chunks)}", flush=True)
        time.sleep(0.3)

    print(f"Index built. {len(chunks)} chunks in {db_path}/")
    return col


# ── ENTRYPOINT ──────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    if not CHUTES_API_KEY:
        print("Set CHUTES_API_KEY or CHUTES_API_TOKEN")
        sys.exit(1)

    if "--build" in sys.argv:
        print("Loading Whitney...")
        whitney_chunks = scrape_whitney()
        print("Loading Panini...")
        panini_chunks = load_panini(str(PANINI_DATA))
        print("Loading Dhatupatha...")
        dhatu_chunks = load_dhatupatha()
        print("Loading Vakyapadiya...")
        vakyapadiya_chunks = load_vakyapadiya()
        print("Loading Monier-Williams...")
        mw_chunks = load_mw_cologne()
        print("Loading Abhinavagupta...")
        abhinava_chunks = load_abhinavagupta()
        all_chunks = (
            whitney_chunks + panini_chunks + dhatu_chunks + vakyapadiya_chunks
            + mw_chunks + abhinava_chunks
        )
        print(f"\nTotal: {len(all_chunks)} chunks")
        print("Embedding and indexing (this takes several minutes)...")
        build_index(all_chunks)
    else:
        print("Usage: python rag/build_sanskrit_rag.py --build")
        print("Requires: CHUTES_API_KEY")
        print("Data: git clone https://github.com/ashtadhyayi-com/data ./panini_data")
        print("MW: download mwxml.zip from Cologne, extract to rag/data/mw/")
        print("Abhinavagupta: add .txt/.md to rag/data/abhinavagupta/")
