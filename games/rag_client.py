"""
RAG client — queries ChromaDB for corpus retrieval and embedding lookup.
Lazy-loads when sanskrit_db exists. Falls back to no-op when unavailable.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any


class RAGClient:
    """
    Corpus provider for the game engine.
    - retrieve(query): semantic search by text (requires Chutes for embedding)
    - get_embedding(chunk_id): fetch stored embedding from ChromaDB
    - query_by_embedding(embedding): find nearest chunks (for weakness targeting)
    """

    def __init__(
        self,
        db_path: str | Path | None = None,
        embed_fn: callable | None = None,
    ) -> None:
        self._db_path = Path(db_path or Path(__file__).parent.parent / "sanskrit_db")
        self._embed_fn = embed_fn
        self._col = None

    def _get_collection(self):
        if self._col is not None:
            return self._col
        if not self._db_path.exists():
            return None
        try:
            import chromadb
            client = chromadb.PersistentClient(path=str(self._db_path))
            self._col = client.get_or_create_collection("sanskrit")
            return self._col
        except Exception:
            return None

    def retrieve(self, query: str, n: int = 5) -> list[dict]:
        """Semantic search by query text. Requires embed_fn."""
        col = self._get_collection()
        if not col or not self._embed_fn:
            return []
        try:
            emb = self._embed_fn([query], "query")[0]
            results = col.query(query_embeddings=[emb], n_results=n)
            return self._format_results(results)
        except Exception:
            return []

    def get_embedding(self, chunk_id: str) -> list[float] | None:
        """Get stored embedding for a chunk by id."""
        col = self._get_collection()
        if not col:
            return None
        try:
            results = col.get(ids=[chunk_id], include=["embeddings"])
            if results and results["embeddings"]:
                return results["embeddings"][0]
        except Exception:
            pass
        return None

    def query_by_embedding(
        self,
        embedding: list[float],
        n: int = 20,
        topic_filter: list[str] | None = None,
    ) -> list[dict]:
        """
        Find nearest chunks to embedding. Used for weakness-targeted retrieval.
        col.query(query_embeddings=[weakness_centroid]) → nearest unmastered chunks.
        """
        col = self._get_collection()
        if not col:
            return []
        try:
            where = None
            if topic_filter:
                where = {"topic": {"$in": topic_filter}}
            results = col.query(
                query_embeddings=[embedding],
                n_results=n,
                where=where,
            )
            return self._format_results(results)
        except Exception:
            return []

    def _format_results(self, results: Any) -> list[dict]:
        """Convert ChromaDB query result to list of dicts."""
        if not results or "ids" not in results:
            return []
        ids = results["ids"][0] if results["ids"] else []
        metadatas = results.get("metadatas", [[]])[0] or []
        documents = results.get("documents", [[]])[0] or []
        out = []
        for i, cid in enumerate(ids):
            out.append({
                "id": cid,
                "text": documents[i] if i < len(documents) else "",
                "meta": metadatas[i] if i < len(metadatas) else {},
            })
        return out


def get_embed_fn_from_chutes():
    """Return embed function using Chutes API if CHUTES_API_KEY is set."""
    import os
    from pathlib import Path
    _env = Path(__file__).parent.parent / ".env.local"
    if _env.exists():
        for line in _env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

    key = os.environ.get("CHUTES_API_KEY") or os.environ.get("CHUTES_API_TOKEN")
    if not key:
        return None

    import requests
    EMBED_URL = "https://chutes-qwen-qwen3-embedding-8b.chutes.ai"
    EMBED_MODEL = "Qwen/Qwen3-Embedding-8B"
    DOC_INSTRUCTION = "Represent this Sanskrit grammar rule or sūtra for retrieval"
    QUERY_INSTRUCTION = "Given a question about Sanskrit grammar, retrieve the most relevant rule or explanation"

    def embed(texts: list[str], mode: str = "doc") -> list[list[float]]:
        instruction = QUERY_INSTRUCTION if mode == "query" else DOC_INSTRUCTION
        prefixed = [f"Instruct: {instruction}\nQuery: {t}" for t in texts]
        r = requests.post(
            f"{EMBED_URL}/v1/embeddings",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={"input": prefixed, "model": EMBED_MODEL},
            timeout=60,
        )
        data = r.json() if r.text else {}
        items = data.get("data", [])
        return [x["embedding"] for x in items]

    return lambda texts, _: embed(texts, "query")
