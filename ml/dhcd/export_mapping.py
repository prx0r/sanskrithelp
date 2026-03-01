#!/usr/bin/env python3
"""Export DHCD class mapping to JSON for use in recognize.js."""

import json
from pathlib import Path

from class_mapping import DHCD_CLASSES

PUBLIC = Path(__file__).resolve().parent.parent.parent / "public" / "dhcd"
PUBLIC.mkdir(parents=True, exist_ok=True)
# class_labels.json: index → character
with (PUBLIC / "class_labels.json").open("w", encoding="utf-8") as f:
    json.dump(DHCD_CLASSES, f, ensure_ascii=False, indent=0)
with (PUBLIC / "classes.json").open("w", encoding="utf-8") as f:
    json.dump(DHCD_CLASSES, f, ensure_ascii=False, indent=0)
print("Exported to public/dhcd/class_labels.json and classes.json")
