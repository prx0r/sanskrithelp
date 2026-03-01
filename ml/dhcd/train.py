#!/usr/bin/env python3
"""
Train a small CNN on DHCD for Devanagari character recognition.

Prerequisites:
  pip install -r requirements.txt
  python download.py   # or manually place dataset.npz in ml/dhcd/data/

Run: python train.py
Output: model.h5, then convert with:
  tensorflowjs_converter --input_format keras model.h5 ./tfjs_model
"""

import sys
from pathlib import Path

import numpy as np

# Add parent for imports
sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
except ImportError:
    print("Install: pip install tensorflow")
    sys.exit(1)

from class_mapping import DHCD_CLASSES

DATA_DIR = Path(__file__).resolve().parent / "data"
NPZ_PATH = DATA_DIR / "dataset.npz"
MODEL_PATH = Path(__file__).resolve().parent / "model_char.h5"
IMG_SIZE = 32
NUM_CLASSES = 46


def load_dhcd():
    """Load DHCD from dataset.npz. Returns (X_train, y_train, X_test, y_test)."""
    if not NPZ_PATH.exists():
        print(f"Dataset not found at {NPZ_PATH}")
        print("Run: python download.py")
        sys.exit(1)

    data = np.load(NPZ_PATH)
    # NPZ from GitHub/UCI: arr_0, arr_1, arr_2, arr_3
    X_train = data["arr_0"]
    y_train = np.asarray(data["arr_1"], dtype=np.int32)
    X_test = data["arr_2"]
    y_test = np.asarray(data["arr_3"], dtype=np.int32)
    # DHCD labels may be 1-46; convert to 0-45 for sparse_categorical_crossentropy
    if y_train.max() >= NUM_CLASSES:
        y_train = y_train - 1
        y_test = y_test - 1

    print(f"Train: {X_train.shape[0]} samples, Test: {X_test.shape[0]} samples")
    return X_train, y_train, X_test, y_test


def preprocess(X):
    """Normalize to [0,1] and add channel dim. DHCD is grayscale 0-255."""
    X = X.astype(np.float32) / 255.0
    X = np.expand_dims(X, axis=-1)  # (N, 32, 32, 1)
    return X


def build_model():
    """CNN: [Conv2D→MaxPool] x3 → Dropout → Dense → Softmax (46 classes)."""
    return keras.Sequential([
        layers.Input(shape=(IMG_SIZE, IMG_SIZE, 1)),
        layers.Conv2D(32, 3, activation="relu", padding="same"),
        layers.MaxPool2D(2),
        layers.Conv2D(64, 3, activation="relu", padding="same"),
        layers.MaxPool2D(2),
        layers.Conv2D(128, 3, activation="relu", padding="same"),
        layers.MaxPool2D(2),
        layers.Flatten(),
        layers.Dropout(0.5),
        layers.Dense(NUM_CLASSES, activation="softmax"),
    ])


def main():
    print("Loading DHCD...")
    X_train, y_train, X_test, y_test = load_dhcd()

    X_train = preprocess(X_train)
    X_test = preprocess(X_test)

    model = build_model()
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    print(model.summary())

    print("Training...")
    model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=15,
        batch_size=128,
    )

    print("Evaluating...")
    loss, acc = model.evaluate(X_test, y_test)
    print(f"Test accuracy: {acc:.4f}")

    model.save(MODEL_PATH)
    print(f"Saved to {MODEL_PATH}")
    print("\nConvert to TF.js:")
    print("  ./convert.sh  (or .\\convert.ps1 on Windows)")


if __name__ == "__main__":
    main()
