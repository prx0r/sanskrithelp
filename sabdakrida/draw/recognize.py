"""
Devanagari handwriting recognition.
Requires: tensorflow, numpy, Pillow (or opencv-python).
Model: krishnamishra8848/Devanagari_Character_Recognition (32x32 grayscale).
"""

LABELS = [
    "क", "ख", "ग", "घ", "ङ", "च", "छ", "ज", "झ", "ञ",
    "ट", "ठ", "ड", "ढ", "ण", "त", "थ", "द", "ध", "न",
    "प", "फ", "ब", "भ", "म", "य", "र", "ल", "व", "श",
    "ष", "स", "ह", "क्ष", "त्र", "ज्ञ", "०", "१", "२", "३",
    "४", "५", "६", "७", "८", "९",
]


def recognize_devanagari(image_bytes: bytes) -> dict | None:
    """Recognize hand-drawn Devanagari from image bytes. Returns { predicted, score } or None."""
    try:
        import numpy as np
        from tensorflow.keras.models import load_model
        from PIL import Image
        import io
    except ImportError as e:
        raise ImportError("Draw recognition requires: tensorflow, numpy, Pillow") from e

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("L")
    except Exception:
        return None

    arr = np.array(img)
    if arr.ndim == 3:
        arr = arr[:, :, 0]
    arr = np.invert(arr) if np.mean(arr) < 128 else arr  # ensure dark on light
    img = Image.fromarray(arr).resize((32, 32), Image.Resampling.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = arr.reshape(1, 32, 32, 1)

    model = _load_model()
    pred = model.predict(arr, verbose=0)
    idx = int(np.argmax(pred[0]))
    score = float(pred[0][idx])
    if idx < len(LABELS):
        return {"predicted": LABELS[idx], "score": score}
    return None


_model = None


def _load_model():
    global _model
    if _model is not None:
        return _model
    import os
    from pathlib import Path
    model_path = Path(__file__).parent / "saved_model.keras"
    if not model_path.exists():
        import urllib.request
        url = "https://huggingface.co/krishnamishra8848/Devanagari_Character_Recognition/resolve/main/saved_model.keras"
        urllib.request.urlretrieve(url, model_path)
    _model = load_model(model_path)
    return _model
