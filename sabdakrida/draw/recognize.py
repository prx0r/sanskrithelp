"""
Devanagari handwriting recognition — server-side, like TTS.
Uses our trained model_char.h5 from ml/dhcd/ (DHCD dataset).
Requires: tensorflow, numpy, Pillow.
"""

import io
from pathlib import Path

# DHCD: 46 classes = digits ०-९ + consonants क-ज्ञ (same order as ml/dhcd/class_mapping.py)
DHCD_LABELS = [
    "०", "१", "२", "३", "४", "५", "६", "७", "८", "९",
    "क", "ख", "ग", "घ", "ङ", "च", "छ", "ज", "झ", "ञ",
    "ट", "ठ", "ड", "ढ", "ण", "त", "थ", "द", "ध", "न",
    "प", "फ", "ब", "भ", "म", "य", "र", "ल", "व",
    "श", "ष", "स", "ह", "क्ष", "त्र", "ज्ञ",
]
assert len(DHCD_LABELS) == 46

_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model
    try:
        from tensorflow.keras.models import load_model
    except ImportError as e:
        raise ImportError("Draw recognition requires: tensorflow, numpy, Pillow") from e

    root = Path(__file__).resolve().parent.parent.parent
    model_path = root / "ml" / "dhcd" / "model_char.h5"
    if not model_path.exists():
        raise FileNotFoundError(
            f"model_char.h5 not found at {model_path}. Train with: cd ml/dhcd && python train.py"
        )
    _model = load_model(model_path)
    return _model


def recognize_devanagari(image_bytes: bytes) -> dict | None:
    """Recognize hand-drawn Devanagari from image bytes. Returns { predicted, score } or None."""
    try:
        import numpy as np
        from PIL import Image
    except ImportError as e:
        raise ImportError("Draw recognition requires: tensorflow, numpy, Pillow") from e

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("L")
    except Exception:
        return None

    arr = np.array(img)
    if arr.ndim == 3:
        arr = arr[:, :, 0]
    # DHCD: dark strokes on light background, normalize to [0,1]
    arr = np.invert(arr) if np.mean(arr) < 128 else arr
    img = Image.fromarray(arr).resize((32, 32), Image.Resampling.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = arr.reshape(1, 32, 32, 1)

    model = _load_model()
    pred = model.predict(arr, verbose=0)
    idx = int(np.argmax(pred[0]))
    score = float(pred[0][idx])
    if 0 <= idx < len(DHCD_LABELS):
        return {"predicted": DHCD_LABELS[idx], "score": score}
    return None
