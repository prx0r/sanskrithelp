"""
Tutor-specific profile state — zone levels, retry counts, weekly arc.
Stored in sabdakrida.db. Complements games/user_profile.
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime
from typing import Any


def _get_db_path() -> Path:
    return Path(__file__).resolve().parent.parent / "sabdakrida" / "sabdakrida.db"


def _connect():
    conn = sqlite3.connect(_get_db_path())
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS tutor_progress (
            user_id TEXT PRIMARY KEY,
            zone_levels TEXT DEFAULT '{}',
            level_retry_counts TEXT DEFAULT '{}',
            weekly_arc TEXT,
            last_arc_generated TIMESTAMP,
            unverified_pronunciation TEXT DEFAULT '[]',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)


@dataclass
class TutorProfile:
    user_id: str
    zone_levels: dict[str, int] = field(default_factory=dict)
    level_retry_counts: dict[str, int] = field(default_factory=dict)
    weekly_arc: dict[str, Any] | None = None
    last_arc_generated: datetime | None = None
    unverified_pronunciation: set[str] = field(default_factory=set)

    def level_key(self, zone: str, level: int) -> str:
        return f"{zone}_{level}"

    def retries_for(self, zone: str, level: int) -> int:
        return self.level_retry_counts.get(self.level_key(zone, level), 0)

    def increment_retry(self, zone: str, level: int) -> int:
        key = self.level_key(zone, level)
        n = self.level_retry_counts.get(key, 0) + 1
        self.level_retry_counts[key] = n
        return n

    def clear_retry(self, zone: str, level: int) -> None:
        self.level_retry_counts.pop(self.level_key(zone, level), None)

    def pass_level(self, zone: str, level: int) -> None:
        current = self.zone_levels.get(zone, 0)
        if level > current:
            self.zone_levels[zone] = level
        self.clear_retry(zone, level)


def load_tutor_profile(user_id: str) -> TutorProfile:
    conn = _connect()
    _ensure_tables(conn)
    row = conn.execute(
        "SELECT * FROM tutor_progress WHERE user_id = ?", (user_id,)
    ).fetchone()
    conn.close()

    if row is None:
        return TutorProfile(user_id=user_id)

    def parse_json(s: str | None, default: Any) -> Any:
        if s is None or s == "":
            return default
        try:
            return json.loads(s)
        except json.JSONDecodeError:
            return default

    zone_levels = parse_json(row["zone_levels"], {})
    retry_counts = parse_json(row["level_retry_counts"], {})
    weekly_arc = parse_json(row["weekly_arc"], None)
    unverified = set(parse_json(row["unverified_pronunciation"], []))
    last_arc = row["last_arc_generated"]
    if isinstance(last_arc, str):
        try:
            last_arc = datetime.fromisoformat(last_arc.replace("Z", "+00:00"))
        except ValueError:
            last_arc = None

    return TutorProfile(
        user_id=user_id,
        zone_levels=zone_levels,
        level_retry_counts=retry_counts,
        weekly_arc=weekly_arc,
        last_arc_generated=last_arc,
        unverified_pronunciation=unverified,
    )


def save_tutor_profile(profile: TutorProfile) -> None:
    conn = _connect()
    _ensure_tables(conn)
    conn.execute(
        """
        INSERT INTO tutor_progress (
            user_id, zone_levels, level_retry_counts, weekly_arc,
            last_arc_generated, unverified_pronunciation, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            zone_levels = excluded.zone_levels,
            level_retry_counts = excluded.level_retry_counts,
            weekly_arc = excluded.weekly_arc,
            last_arc_generated = excluded.last_arc_generated,
            unverified_pronunciation = excluded.unverified_pronunciation,
            updated_at = CURRENT_TIMESTAMP
        """,
        (
            profile.user_id,
            json.dumps(profile.zone_levels),
            json.dumps(profile.level_retry_counts),
            json.dumps(profile.weekly_arc) if profile.weekly_arc else None,
            profile.last_arc_generated.isoformat() if profile.last_arc_generated else None,
            json.dumps(list(profile.unverified_pronunciation)),
        ),
    )
    conn.commit()
    conn.close()
