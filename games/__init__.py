"""
Śabdakrīḍā Games — Dhātu Dash, Sandhi Forge, Kāraka Web, etc.
Shared CoreEngine, user profile (embedding-space), and corpus/RAG client.
"""

from .user_profile import (
    UserProfile,
    load_profile,
    save_profile,
    update_profile,
)
from .engine import CoreEngine, Challenge, EvalResult
from .dhatu_dash import DhatuDashEngine, DhatuSession, create_dhatu_dash
from .rag_client import RAGClient, get_embed_fn_from_chutes

__all__ = [
    "UserProfile",
    "load_profile",
    "save_profile",
    "update_profile",
    "CoreEngine",
    "Challenge",
    "EvalResult",
    "DhatuDashEngine",
    "DhatuSession",
    "create_dhatu_dash",
    "RAGClient",
    "get_embed_fn_from_chutes",
]
