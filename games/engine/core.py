"""
CoreEngine — unified game engine for all 5 Sanskrit games.

Every game is a different UI over this engine:
  - generate(user_profile, difficulty) → Challenge
  - evaluate(input, challenge, corpus) → EvalResult
  - updateProfile(user_profile, result) → UserProfile
  - speak(text) → AudioBlob
  - explain(rule_id, corpus) → {Whitney, Pāṇini, example}
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Protocol

from ..user_profile import UserProfile


@dataclass
class Challenge:
    """A single game challenge — structure varies by game type."""
    challenge_id: str
    game_type: str
    prompt: str
    correct_answer: str | list[str]  # May accept multiple valid forms
    source_chunk_ids: list[str] = None
    topic: str = "dhatu"
    difficulty: float = 0.5
    meta: dict[str, Any] = None

    def __post_init__(self) -> None:
        if self.source_chunk_ids is None:
            self.source_chunk_ids = []
        if self.meta is None:
            self.meta = {}


@dataclass
class EvalResult:
    """Result of evaluating player input against a challenge."""
    correct: bool
    rule_id: str | None = None
    explanation: str = ""
    feedback: str = ""
    chunk_id: str = ""


class CorpusProvider(Protocol):
    """Protocol for corpus/ChromaDB access — can be real or mock."""

    def retrieve(self, query: str, n: int = 5) -> list[dict]:
        ...

    def get_embedding(self, chunk_id: str) -> list[float] | None:
        ...

    def query_by_embedding(
        self, embedding: list[float], n: int = 20, topic_filter: list[str] | None = None
    ) -> list[dict]:
        ...


class TTSProvider(Protocol):
    """Protocol for TTS — sabdakrida or chutes API."""

    def speak(self, text: str, style: str = "narration") -> bytes | str:
        ...


class CoreEngine(ABC):
    """
    Abstract base for all game engines.
    Each game (Dhātu Dash, Sandhi Forge, etc.) implements generate + evaluate.
    """

    game_type: str = "base"

    def __init__(
        self,
        corpus: CorpusProvider | None = None,
        tts: TTSProvider | None = None,
    ) -> None:
        self.corpus = corpus
        self.tts = tts

    @abstractmethod
    def generate(
        self,
        user_profile: UserProfile,
        difficulty: float | None = None,
    ) -> Challenge:
        """Generate a challenge grounded in corpus."""
        ...

    @abstractmethod
    def evaluate(
        self,
        player_input: str,
        challenge: Challenge,
    ) -> EvalResult:
        """Evaluate player input against the challenge."""
        ...

    def update_profile(
        self,
        profile: UserProfile,
        challenge: Challenge,
        result: EvalResult,
        learner_answer: str,
    ) -> UserProfile:
        """
        Update user profile after a drill interaction.
        Override in subclasses for game-specific logic.
        """
        from ..user_profile import update_profile, save_profile

        chunk_id = result.chunk_id or (challenge.source_chunk_ids[0] if challenge.source_chunk_ids else "")
        if not chunk_id:
            return profile

        embedding = []
        if self.corpus:
            emb = self.corpus.get_embedding(chunk_id)
            if emb:
                embedding = emb

        update_profile(
            profile,
            chunk_id=chunk_id,
            chunk_embedding=embedding,
            correct=result.correct,
            topic=challenge.topic,
            learner_answer=learner_answer,
        )
        save_profile(profile)
        return profile

    def speak(self, text: str, style: str = "narration") -> bytes | str | None:
        """Generate audio for Sanskrit text."""
        if self.tts:
            return self.tts.speak(text, style=style)
        return None

    def explain(self, rule_id: str) -> dict[str, str]:
        """Fetch Whitney/Pāṇini explanation for a rule. Override with corpus lookup."""
        if self.corpus:
            chunks = self.corpus.retrieve(f"Pāṇini sūtra {rule_id} Whitney", n=2)
            if chunks:
                return {
                    "source": chunks[0].get("meta", {}).get("source", "corpus"),
                    "text": chunks[0].get("text", ""),
                    "ref": chunks[0].get("meta", {}).get("ref", ""),
                }
        return {"source": "", "text": "", "ref": ""}
