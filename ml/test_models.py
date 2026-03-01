#!/usr/bin/env python3
"""
Sanity test models before converting to TF.js.
Run from ml/: python test_models.py
"""

import sys
from pathlib import Path

import numpy as np

ML_DIR = Path(__file__).resolve().parent
DHCD_DIR = ML_DIR / "dhcd"
WORD_DIR = ML_DIR / "word"


def test_char_model():
    model_path = DHCD_DIR / "model_char.h5"
    if not model_path.exists():
        print(f"Skip char: {model_path} not found")
        return False
    import tensorflow as tf
    model = tf.keras.models.load_model(model_path)
    dummy = np.random.rand(1, 32, 32, 1).astype(np.float32)
    pred = model.predict(dummy)
    print(f"Char model output shape: {pred.shape}")  # (1, 46)
    assert pred.shape == (1, 46), f"Expected (1, 46), got {pred.shape}"
    print("  OK")
    return True


def test_word_model():
    model_path = WORD_DIR / "model_word.h5"
    if not model_path.exists():
        print(f"Skip word: {model_path} not found")
        return False
    import tensorflow as tf
    # Word model uses custom CTC loss; load with compile=False
    model = tf.keras.models.load_model(model_path, compile=False)
    dummy = np.random.rand(1, 32, 128, 1).astype(np.float32)
    pred = model.predict(dummy)
    print(f"Word model output shape: {pred.shape}")  # (1, timesteps, charset_size)
    assert len(pred.shape) == 3, f"Expected 3D, got {pred.shape}"
    assert pred.shape[0] == 1 and pred.shape[1] > 0 and pred.shape[2] > 0
    print("  OK")
    return True


def main():
    print("Testing models...")
    ok = test_char_model()
    ok = test_word_model() or ok
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
