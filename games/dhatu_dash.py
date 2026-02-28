"""
Dhātu Dash — Start at the root. Every turn, produce a valid derived form.
Timer. The tree grows visually. Multiplayer: two players race to exhaust a root.

One generative rule, explored exhaustively through play, builds intuition faster than any drill.
"""

from __future__ import annotations

import json
import random
import uuid
from pathlib import Path
from dataclasses import dataclass, field

from .engine.core import CoreEngine, Challenge, EvalResult
from .user_profile import UserProfile


def _normalize_iast(s: str) -> str:
    """Normalize IAST for comparison: strip, lowercase (but preserve diacritics)."""
    return s.strip().lower()


@dataclass
class DhatuSession:
    """In-memory state for one Dhātu Dash session (one root)."""
    root_id: str
    root_iast: str
    root_meaning: str
    root_devanagari: str
    valid_forms: list[str]  # All valid derived forms (IAST)
    tree: set[str]  # Forms already produced this session (includes root)
    challenge_count: int = 0

    def unused_forms(self) -> list[str]:
        return [f for f in self.valid_forms if f not in self.tree]

    def is_exhausted(self) -> bool:
        return len(self.unused_forms()) == 0


def _load_dhatus() -> list[dict]:
    """Load roots and derived forms from data/dhatus.json."""
    path = Path(__file__).resolve().parent.parent / "data" / "dhatus.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data.get("data", [])


def _build_valid_forms(dhatu: dict) -> list[str]:
    """Extract all valid IAST forms for a root (root + derived)."""
    forms = [dhatu.get("iast", "")]
    for df in dhatu.get("derivedForms", []):
        f = df.get("form", "")
        if f and f not in forms:
            forms.append(f)
    # Also check derivesTo for any we might have missed
    for name in dhatu.get("derivesTo", []):
        norm = _normalize_iast(name)
        if norm and norm not in {_normalize_iast(f) for f in forms}:
            forms.append(name)
    return forms


class DhatuDashEngine(CoreEngine):
    """
    Dhātu Dash game engine.
    Challenge: given root and current tree, produce any valid derived form not yet in tree.
    """

    game_type = "dhatu_dash"
    _dhatus: list[dict] = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not DhatuDashEngine._dhatus:
            DhatuDashEngine._dhatus = _load_dhatus()

    def _pick_root(self, profile: UserProfile, difficulty: float) -> dict | None:
        """Pick a root — prefer common ones, can use weakness targeting later."""
        if not self._dhatus:
            return None
        # Common roots first (bhū, kṛ, gam, vac, etc.)
        common_ids = {"dhatu-bhu", "dhatu-kri", "dhatu-gam", "dhatu-vach", "dhatu-drish"}
        candidates = [d for d in self._dhatus if d.get("id") in common_ids]
        if not candidates:
            candidates = self._dhatus[:15]
        return random.choice(candidates)

    def generate(
        self,
        user_profile: UserProfile,
        difficulty: float | None = None,
        session: DhatuSession | None = None,
    ) -> Challenge:
        """
        Generate a Dhātu Dash challenge.
        If session is provided, continue that session; else start new one with a root.
        """
        diff = difficulty if difficulty is not None else user_profile.target_difficulty()

        if session is None:
            dhatu = self._pick_root(user_profile, diff)
            if not dhatu:
                raise ValueError("No dhatu data loaded. Add data/dhatus.json")
            session = DhatuSession(
                root_id=dhatu["id"],
                root_iast=dhatu["iast"],
                root_meaning=dhatu.get("meaning", "to be"),
                root_devanagari=dhatu.get("devanagari", ""),
                valid_forms=_build_valid_forms(dhatu),
                tree={dhatu["iast"]},
            )

        unused = session.unused_forms()
        if not unused:
            # Exhausted — return a "complete" challenge
            return Challenge(
                challenge_id=f"dhatu_exhausted_{uuid.uuid4().hex[:8]}",
                game_type=self.game_type,
                prompt=f"√{session.root_iast} exhausted! Tree: {', '.join(sorted(session.tree))}",
                correct_answer="__EXHAUSTED__",
                source_chunk_ids=[f"dhatu_{session.root_id}"],
                topic="dhatu",
                difficulty=diff,
                meta={"session": session, "exhausted": True},
            )

        # Pick a random unused form as the "target" for evaluation hints
        target = random.choice(unused)
        tree_str = ", ".join(sorted(session.tree))

        prompt = (
            f"√{session.root_iast} ({session.root_meaning}). "
            f"Tree so far: {tree_str}. "
            f"Produce a valid derived form not yet in the tree."
        )

        return Challenge(
            challenge_id=f"dhatu_{uuid.uuid4().hex[:8]}",
            game_type=self.game_type,
            prompt=prompt,
            correct_answer=unused,  # Any of these is correct
            source_chunk_ids=[f"dhatu_{session.root_id}"],
            topic="dhatu",
            difficulty=diff,
            meta={"session": session, "valid_forms": unused},
        )

    def evaluate(
        self,
        player_input: str,
        challenge: Challenge,
    ) -> EvalResult:
        """Check if player's input is a valid derived form not yet in tree."""
        meta = challenge.meta or {}
        session: DhatuSession | None = meta.get("session")
        valid_forms: list[str] = meta.get("valid_forms", [])

        if meta.get("exhausted"):
            return EvalResult(
                correct=False,
                explanation="This root is exhausted. Start a new game!",
                feedback="Start a new root.",
            )

        if not session or not valid_forms:
            return EvalResult(
                correct=False,
                explanation="Invalid challenge state.",
                feedback="Try again.",
            )

        normalized = _normalize_iast(player_input)

        # Check: must be valid and not already in tree
        if normalized in session.tree:
            return EvalResult(
                correct=False,
                rule_id="dhatu_repeat",
                explanation=f"You already used {player_input}. Produce a different form.",
                feedback="That form is already in the tree.",
                chunk_id=challenge.source_chunk_ids[0] if challenge.source_chunk_ids else "",
            )

        # Match against valid forms (normalize both)
        for vf in valid_forms:
            if _normalize_iast(vf) == normalized:
                # Correct! Add to tree for next challenge
                session.tree.add(normalized)
                session.challenge_count += 1
                # Find the form info for explanation
                dhatu = next((d for d in self._dhatus if d.get("id") == session.root_id), {})
                form_info = next(
                    (f for f in dhatu.get("derivedForms", []) if _normalize_iast(f.get("form", "")) == normalized),
                    {},
                )
                suffix = form_info.get("suffix", "")
                meaning = form_info.get("meaning", "")

                return EvalResult(
                    correct=True,
                    rule_id="dhatu_valid",
                    explanation=f"Correct. {player_input} = {suffix} → {meaning}" if suffix else f"Correct. {player_input}",
                    feedback="sādhu!",
                    chunk_id=challenge.source_chunk_ids[0] if challenge.source_chunk_ids else "",
                )

        return EvalResult(
            correct=False,
            rule_id="dhatu_invalid",
            explanation=f"'{player_input}' is not a valid derived form of √{session.root_iast}. Valid unused: {', '.join(valid_forms[:5])}...",
            feedback="punar vadatu. Try another form.",
            chunk_id=challenge.source_chunk_ids[0] if challenge.source_chunk_ids else "",
        )

    def get_session_from_challenge(self, challenge: Challenge) -> DhatuSession | None:
        """Extract session from challenge meta for stateful play."""
        return (challenge.meta or {}).get("session")


def create_dhatu_dash(corpus=None, tts=None) -> DhatuDashEngine:
    """Factory for Dhātu Dash engine."""
    return DhatuDashEngine(corpus=corpus, tts=tts)
