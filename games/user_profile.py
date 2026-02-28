"""
Unified user profile — embedding-space model for grammar/drill games.

Each user has TWO centroids in 4096-dim embedding space:
  - weakness_centroid: EMA of embeddings of chunks they got wrong → points to where to drill
  - strength_centroid: EMA of embeddings of chunks they got right → where they're solid

Query ChromaDB with weakness_centroid to find nearest unmastered chunks. No LLM needed for targeting.
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime
from typing import Any

# Default embedding dims (Qwen3-Embedding-8B)
EMBED_DIMS = 4096

# Topics for topic_mastery
DEFAULT_TOPICS = (
    "sandhi",
    "dhatu",
    "karaka",
    "suffix",
    "conjugation",
    "phonology",
)

# Chapter gates (curriculum order)
CHAPTER_ORDER = ("ch2", "ch3", "ch4", "ch5", "ch6", "ch7", "ch8", "ch9")


def _zero_vec(dims: int = EMBED_DIMS) -> list[float]:
    """Zero vector for initial centroids."""
    return [0.0] * dims


def _ema(
    current: list[float],
    new: list[float],
    alpha: float = 0.1,
) -> list[float]:
    """Exponential moving average: current * (1-alpha) + new * alpha."""
    if len(current) != len(new):
        return current
    return [
        c * (1 - alpha) + n * alpha
        for c, n in zip(current, new)
    ]


@dataclass
class UserProfile:
    """User profile for grammar/drill games — stored per user in SQLite."""

    user_id: str
    chunk_states: dict[str, dict[str, Any]] = field(default_factory=dict)
    weakness_centroid: list[float] = field(default_factory=lambda: _zero_vec())
    strength_centroid: list[float] = field(default_factory=lambda: _zero_vec())
    topic_mastery: dict[str, float] = field(default_factory=dict)
    chapter_progress: dict[str, str] = field(default_factory=dict)
    recent_errors: list[dict] = field(default_factory=list)
    seen_drill_ids: set[str] = field(default_factory=set)
    avg_recent_score: float = 0.5
    _recent_scores: list[float] = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        if not self.topic_mastery:
            self.topic_mastery = {t: 0.0 for t in DEFAULT_TOPICS}
        if not self.chapter_progress:
            self.chapter_progress = {c: "locked" for c in CHAPTER_ORDER}
            self.chapter_progress["ch2"] = "active"

    def weak_topics(self, threshold: float = 0.5) -> list[str]:
        """Topics with mastery below threshold."""
        return [t for t, s in self.topic_mastery.items() if s < threshold]

    def strong_topics(self, threshold: float = 0.7) -> list[str]:
        """Topics with mastery above threshold."""
        return [t for t, s in self.topic_mastery.items() if s >= threshold]

    def current_chapter(self) -> str:
        """First chapter that is 'active'."""
        for c in CHAPTER_ORDER:
            if self.chapter_progress.get(c) == "active":
                return c
        return CHAPTER_ORDER[-1]

    def target_difficulty(self) -> float:
        """Adaptive difficulty: stay just above comfort zone."""
        return self.avg_recent_score * 0.8 + 0.2


def get_db_path() -> Path:
    return Path(__file__).resolve().parent.parent / "sabdakrida" / "sabdakrida.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id TEXT PRIMARY KEY,
            chunk_states TEXT DEFAULT '{}',
            weakness_centroid TEXT,
            strength_centroid TEXT,
            topic_mastery TEXT,
            chapter_progress TEXT,
            recent_errors TEXT DEFAULT '[]',
            seen_drill_ids TEXT DEFAULT '[]',
            avg_recent_score REAL DEFAULT 0.5,
            recent_scores TEXT DEFAULT '[]',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)


def load_profile(user_id: str) -> UserProfile:
    """Load or create user profile."""
    conn = _connect()
    _ensure_tables(conn)
    c = conn.cursor()
    c.execute(
        "SELECT * FROM user_profiles WHERE user_id = ?",
        (user_id,),
    )
    row = c.fetchone()
    conn.close()

    if row is None:
        return UserProfile(user_id=user_id)

    def parse_json(s: str | None, default: Any) -> Any:
        if s is None or s == "":
            return default
        try:
            return json.loads(s)
        except json.JSONDecodeError:
            return default

    chunk_states = parse_json(row["chunk_states"], {})
    weakness = parse_json(row["weakness_centroid"], _zero_vec())
    strength = parse_json(row["strength_centroid"], _zero_vec())
    topic_mastery = parse_json(row["topic_mastery"], {t: 0.0 for t in DEFAULT_TOPICS})
    chapter_progress = parse_json(row["chapter_progress"], {c: "locked" for c in CHAPTER_ORDER})
    recent_errors = parse_json(row["recent_errors"], [])
    seen_ids = set(parse_json(row["seen_drill_ids"], []))
    avg_score = row["avg_recent_score"] or 0.5
    recent_scores = parse_json(row["recent_scores"], [])

    p = UserProfile(
        user_id=user_id,
        chunk_states=chunk_states,
        weakness_centroid=weakness,
        strength_centroid=strength,
        topic_mastery=topic_mastery,
        chapter_progress=chapter_progress,
        recent_errors=recent_errors[-50:],
        seen_drill_ids=seen_ids,
        avg_recent_score=avg_score,
        _recent_scores=recent_scores[-20:],
    )
    return p


def save_profile(profile: UserProfile) -> None:
    """Persist profile to SQLite."""
    conn = _connect()
    _ensure_tables(conn)
    conn.execute(
        """
        INSERT INTO user_profiles (
            user_id, chunk_states, weakness_centroid, strength_centroid,
            topic_mastery, chapter_progress, recent_errors, seen_drill_ids,
            avg_recent_score, recent_scores, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            chunk_states = excluded.chunk_states,
            weakness_centroid = excluded.weakness_centroid,
            strength_centroid = excluded.strength_centroid,
            topic_mastery = excluded.topic_mastery,
            chapter_progress = excluded.chapter_progress,
            recent_errors = excluded.recent_errors,
            seen_drill_ids = excluded.seen_drill_ids,
            avg_recent_score = excluded.avg_recent_score,
            recent_scores = excluded.recent_scores,
            updated_at = CURRENT_TIMESTAMP
        """,
        (
            profile.user_id,
            json.dumps(profile.chunk_states),
            json.dumps(profile.weakness_centroid),
            json.dumps(profile.strength_centroid),
            json.dumps(profile.topic_mastery),
            json.dumps(profile.chapter_progress),
            json.dumps(profile.recent_errors[-50:]),
            json.dumps(list(profile.seen_drill_ids)),
            profile.avg_recent_score,
            json.dumps(profile._recent_scores[-20:]),
        ),
    )
    conn.commit()
    conn.close()


def update_profile(
    profile: UserProfile,
    chunk_id: str,
    chunk_embedding: list[float],
    correct: bool,
    topic: str = "dhatu",
    learner_answer: str = "",
    alpha: float = 0.1,
) -> UserProfile:
    """
    Update profile after a drill question.
    - FSRS: simplified — we just track whether seen (full FSRS can be added later).
    - Centroids: EMA of wrong → weakness, right → strength.
    - Topic mastery: 0.9 * current + 0.1 if correct.
    - Recent errors: log for pattern detection.
    - Recent scores: for adaptive difficulty.
    """
    # 1. Chunk state (simplified — no full FSRS yet)
    if chunk_id not in profile.chunk_states:
        profile.chunk_states[chunk_id] = {
            "stability": 1.0,
            "difficulty": 0.5,
            "due": datetime.utcnow().isoformat()[:10],
        }
    # TODO: fsrs_update(profile.chunk_states[chunk_id], grade=4 if correct else 1)

    # 2. Centroids (EMA)
    if len(chunk_embedding) == EMBED_DIMS:
        if not correct:
            profile.weakness_centroid = _ema(
                profile.weakness_centroid, chunk_embedding, alpha
            )
        else:
            profile.strength_centroid = _ema(
                profile.strength_centroid, chunk_embedding, alpha
            )

    # 3. Topic mastery
    if topic in profile.topic_mastery:
        cur = profile.topic_mastery[topic]
        profile.topic_mastery[topic] = cur * 0.9 + (0.1 if correct else 0)

    # 4. Recent errors
    profile.recent_errors.append({
        "chunk_id": chunk_id,
        "learner_answer": learner_answer,
        "correct": correct,
        "timestamp": datetime.utcnow().isoformat(),
    })
    profile.recent_errors = profile.recent_errors[-50:]

    # 5. Recent scores (for adaptive difficulty)
    score = 1.0 if correct else 0.0
    profile._recent_scores.append(score)
    profile._recent_scores = profile._recent_scores[-20:]
    if profile._recent_scores:
        profile.avg_recent_score = sum(profile._recent_scores) / len(profile._recent_scores)

    return profile
