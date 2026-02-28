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
