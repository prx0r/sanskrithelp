#!/usr/bin/env python3
"""
Run Śabdakrīḍā API server.
Usage: from buapp root: python sabdakrida/run.py
Or: python -m uvicorn sabdakrida.main:app --reload --port 8010
"""
import sys
from pathlib import Path

# Ensure buapp root on path
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "sabdakrida.main:app",
        host="127.0.0.1",
        port=8010,
        reload=True,
    )
