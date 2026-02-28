"""
Games API router — Dhātu Dash, user profile for grammar/drill games.
Mount at /games
"""

from fastapi import APIRouter, Form
from pydantic import BaseModel

router = APIRouter(prefix="/games", tags=["games"])


class DhatuDashEvaluateRequest(BaseModel):
    user_id: str
    challenge_id: str
    prompt: str
    correct_answer: str | list[str]
    source_chunk_ids: list[str]
    topic: str
    meta: dict
    player_input: str


def _get_engine():
    """Lazy-load Dhātu Dash engine with optional RAG."""
    from games import create_dhatu_dash, RAGClient, get_embed_fn_from_chutes

    embed_fn = get_embed_fn_from_chutes()
    rag = RAGClient(embed_fn=embed_fn) if embed_fn else None
    return create_dhatu_dash(corpus=rag)


def _challenge_from_body(body: dict) -> "Challenge":
    from games.engine.core import Challenge

    ans = body.get("correct_answer")
    if isinstance(ans, list):
        pass
    else:
        ans = [ans] if ans else []
    return Challenge(
        challenge_id=body.get("challenge_id", ""),
        game_type=body.get("game_type", "dhatu_dash"),
        prompt=body.get("prompt", ""),
        correct_answer=ans,
        source_chunk_ids=body.get("source_chunk_ids", []),
        topic=body.get("topic", "dhatu"),
        meta=body.get("meta", {}),
    )


def _serialize_meta(meta: dict) -> dict:
    """Serialize challenge meta for JSON (session → dict)."""
    if not meta:
        return {}
    safe = {}
    for k, v in meta.items():
        if k == "session" and hasattr(v, "tree"):
            safe[k] = {
                "root_id": getattr(v, "root_id", ""),
                "root_iast": getattr(v, "root_iast", ""),
                "root_meaning": getattr(v, "root_meaning", ""),
                "root_devanagari": getattr(v, "root_devanagari", ""),
                "tree": list(getattr(v, "tree", set())),
                "valid_forms": list(getattr(v, "valid_forms", [])),
                "challenge_count": getattr(v, "challenge_count", 0),
            }
        elif k == "valid_forms":
            safe[k] = v
        elif k != "exhausted":
            safe[k] = v
    if meta.get("exhausted"):
        safe["exhausted"] = True
    return safe


@router.get("/dhatu-dash")
async def dhatu_dash_generate(user_id: str = "default"):
    """Generate a new Dhātu Dash challenge (or first turn of a new root)."""
    from games import create_dhatu_dash, load_profile

    engine = _get_engine()
    profile = load_profile(user_id)
    challenge = engine.generate(profile)

    safe_meta = _serialize_meta(challenge.meta or {})

    return {
        "challenge_id": challenge.challenge_id,
        "game_type": challenge.game_type,
        "prompt": challenge.prompt,
        "correct_answer": challenge.correct_answer,
        "source_chunk_ids": challenge.source_chunk_ids,
        "topic": challenge.topic,
        "meta": safe_meta,
    }


@router.post("/dhatu-dash/evaluate")
async def dhatu_dash_evaluate(
    user_id: str = Form(default="default"),
    challenge_id: str = Form(...),
    prompt: str = Form(...),
    correct_answer: str = Form(...),  # JSON array as string
    source_chunk_ids: str = Form(default="[]"),  # JSON array
    topic: str = Form(default="dhatu"),
    meta: str = Form(default="{}"),  # JSON
    player_input: str = Form(...),
):
    """Evaluate player input for Dhātu Dash. Requires full challenge state in form."""
    import json
    from games import create_dhatu_dash, load_profile, save_profile

    engine = _get_engine()

    try:
        correct_list = json.loads(correct_answer) if correct_answer.startswith("[") else [correct_answer]
    except Exception:
        correct_list = [correct_answer]

    try:
        chunk_ids = json.loads(source_chunk_ids) if isinstance(source_chunk_ids, str) else []
    except Exception:
        chunk_ids = []

    try:
        meta_dict = json.loads(meta) if isinstance(meta, str) else {}
    except Exception:
        meta_dict = {}

    from games.engine.core import Challenge

    challenge = Challenge(
        challenge_id=challenge_id,
        game_type="dhatu_dash",
        prompt=prompt,
        correct_answer=correct_list,
        source_chunk_ids=chunk_ids,
        topic=topic,
        meta=meta_dict,
    )

    # Restore session in meta for stateful evaluation
    if "session" in meta_dict and isinstance(meta_dict["session"], dict):
        from games.dhatu_dash import DhatuSession

        s = meta_dict["session"]
        challenge.meta["session"] = DhatuSession(
            root_id=s.get("root_id", ""),
            root_iast=s.get("root_iast", ""),
            root_meaning=s.get("root_meaning", ""),
            root_devanagari=s.get("root_devanagari", ""),
            valid_forms=s.get("valid_forms", []),
            tree=set(s.get("tree", [])),
            challenge_count=s.get("challenge_count", 0),
        )

    result = engine.evaluate(player_input, challenge)
    profile = load_profile(user_id)
    engine.update_profile(profile, challenge, result, player_input)

    # Return updated meta so client can continue (session.tree updated on correct)
    updated_meta = _serialize_meta(challenge.meta or {})

    return {
        "correct": result.correct,
        "explanation": result.explanation,
        "feedback": result.feedback,
        "rule_id": result.rule_id,
        "meta": updated_meta,
    }


@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    """Get user profile (topic mastery, chapter progress, weak topics)."""
    from games import load_profile

    p = load_profile(user_id)
    return {
        "user_id": p.user_id,
        "topic_mastery": p.topic_mastery,
        "chapter_progress": p.chapter_progress,
        "weak_topics": p.weak_topics(),
        "strong_topics": p.strong_topics(),
        "current_chapter": p.current_chapter(),
    }
