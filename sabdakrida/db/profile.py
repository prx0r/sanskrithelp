"""
User profile & weakness tracking — SQLite + spaced repetition.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "sabdakrida.db"


def _connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def update_user_profile(user_id: str, error_types: list[str]) -> None:
    conn = _connect()
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS phoneme_errors (
            user_id TEXT NOT NULL,
            error_type TEXT NOT NULL,
            count INTEGER DEFAULT 0,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, error_type)
        )
        """
    )
    for err in error_types:
        c.execute(
            """
            INSERT INTO phoneme_errors (user_id, error_type, count)
            VALUES (?, ?, 1)
            ON CONFLICT(user_id, error_type)
            DO UPDATE SET count = count + 1, last_seen = CURRENT_TIMESTAMP
            """,
            (user_id, err),
        )
    conn.commit()
    conn.close()


def get_drill_priority(user_id: str) -> list[tuple[str, int]]:
    """Return phoneme error types sorted by frequency — highest = drill first."""
    conn = _connect()
    c = conn.cursor()
    c.execute(
        "SELECT error_type, count FROM phoneme_errors WHERE user_id = ? ORDER BY count DESC",
        (user_id,),
    )
    rows = c.fetchall()
    conn.close()
    return [(r["error_type"], r["count"]) for r in rows]


def record_pronunciation_score(
    user_id: str, target_text: str, score: float, correct: bool
) -> None:
    """Store a pronunciation attempt score for the user profile."""
    conn = _connect()
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS pronunciation_scores (
            user_id TEXT NOT NULL,
            target_text TEXT NOT NULL,
            score REAL NOT NULL,
            correct INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    c.execute(
        """
        INSERT INTO pronunciation_scores (user_id, target_text, score, correct)
        VALUES (?, ?, ?, ?)
        """,
        (user_id, target_text, score, 1 if correct else 0),
    )
    conn.commit()
    conn.close()


def get_recent_scores(user_id: str, limit: int = 20) -> list[dict]:
    """Return recent pronunciation scores for display/stats."""
    conn = _connect()
    c = conn.cursor()
    c.execute(
        """
        SELECT target_text, score, correct, created_at
        FROM pronunciation_scores
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (user_id, limit),
    )
    rows = c.fetchall()
    conn.close()
    return [
        {
            "target": r["target_text"],
            "score": r["score"],
            "correct": bool(r["correct"]),
            "created_at": r["created_at"],
        }
        for r in rows
    ]
