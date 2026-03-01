#!/usr/bin/env python3
"""
Check embedding dimensions from Chutes Qwen3-Embedding-0.6B.
Run from project root: python scripts/check_embed_dims.py
Requires: CHUTES_API_KEY or CHUTES_API_TOKEN in .env.local or env
"""
import os
import json
import urllib.request

# Load .env.local (project root = parent of scripts/)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_env = os.path.join(_PROJECT_ROOT, ".env.local")
if os.path.exists(_env):
    with open(_env) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

API_KEY = os.environ.get("CHUTES_API_KEY") or os.environ.get("CHUTES_API_TOKEN")
if not API_KEY:
    print("Set CHUTES_API_KEY or CHUTES_API_TOKEN in .env.local")
    exit(1)

URL = "https://chutes-qwen-qwen3-embedding-0-6b.chutes.ai/v1/embeddings"
req = urllib.request.Request(
    URL,
    data=json.dumps({"input": "test", "model": None}).encode(),
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    method="POST",
)

with urllib.request.urlopen(req) as r:
    data = json.loads(r.read().decode())

emb = data.get("data", [{}])[0].get("embedding", [])
dims = len(emb)
print(f"Embedding dimensions: {dims}")
print(f"First 3 values: {emb[:3]}")
if dims:
    print("\n-> Set EMBED_DIMS =", dims, "in rag config and games/user_profile.py")
