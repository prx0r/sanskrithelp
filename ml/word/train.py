#!/usr/bin/env python3
"""
Train CRNN + CTC on IIIT-HW-Dev for Devanagari word recognition.

Architecture: CNN feature extractor → reshape → BiLSTM x2 → Dense → CTC decode
Input: 128×32 grayscale (variable-width images resized)
Output: sequence of character indices, decoded via CTC

Run: python download.py && python train.py
Output: model_word.h5, charlist.json
Convert: tensorflowjs_converter --input_format keras model_word.h5 ./tfjs_model
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
except ImportError:
    print("Install: pip install tensorflow")
    sys.exit(1)

DATA_DIR = Path(__file__).resolve().parent / "data"
# IIIT-HW-Dev may extract as IIIT-HW-Dev/ or have train/val/test at root
POSSIBLE_ROOTS = [
    DATA_DIR / "IIIT-HW-Dev",
    DATA_DIR / "synthetic_words",
    DATA_DIR,
]
IMG_H = 32
IMG_W = 128  # fixed width for TF.js compatibility
MODEL_PATH = Path(__file__).resolve().parent / "model_word.h5"
CHARSET_PATH = Path(__file__).resolve().parent / "charlist.json"


def find_dataset():
    """Locate train_gt.txt and images folder."""
    for root in POSSIBLE_ROOTS:
        for sub in ["train", "Train", ""]:
            base = root / sub if sub else root
            gt = base / "train_gt.txt"
            if not gt.exists():
                continue
            img_dir = base / "images"
            if not img_dir.exists():
                img_dir = base
            return root, str(gt), str(img_dir)
    return None, None, None


def load_iiit_hw_dev():
    """Load IIIT-HW-Dev: parse train_gt.txt, load images. Returns (images, labels, char2idx, ...)."""
    root, gt_path, img_dir = find_dataset()
    if not root:
        print(f"Dataset not found. Run download.py. Looked in {POSSIBLE_ROOTS}")
        sys.exit(1)

    # Build charset from ground truth
    all_chars = set()
    pairs = []
    with open(gt_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if "\t" not in line:
                continue
            fname, label = line.split("\t", 1)
            label = label.strip()
            if not label:
                continue
            all_chars.update(label)
            pairs.append((fname, label))

    # CTC blank = index 0; pad labels with 0
    chars = ["<blank>"] + sorted(all_chars)
    char2idx = {c: i for i, c in enumerate(chars)}
    num_classes = len(chars)

    # Debug: print first 5 parsed lines (path separator / vs nested folders)
    print("First 5 train_gt.txt entries:")
    for fname, label in pairs[:5]:
        print(f"  {fname!r} -> {len(label)} chars")

    # Load images
    img_root = Path(img_dir)
    if not img_root.exists():
        img_root = Path(gt_path).parent / "images"
    X, y, label_len = [], [], []
    max_label_len = 0
    for fname, label in pairs[:5000]:  # Limit for quick training; use full set for production
        # Handle path separators: gt may use / but we're on Windows
        fname_clean = fname.replace("\\", "/").split("/")[-1]
        path = img_root / fname_clean
        if not path.exists():
            path = img_root / (fname_clean + ".jpg")
        if not path.exists():
            path = img_root / (fname_clean + ".png")
        if not path.exists():
            continue
        try:
            img = Image.open(path).convert("L")
        except Exception:
            continue
        arr = np.array(img)
        if arr.size == 0:
            continue
        # Resize to IMG_H x IMG_W
        img_resized = Image.fromarray(arr).resize((IMG_W, IMG_H), Image.Resampling.LANCZOS)
        arr = np.array(img_resized, dtype=np.float32) / 255.0
        arr = np.expand_dims(arr, axis=-1)  # (H, W, 1)
        X.append(arr)
        indices = [char2idx[c] for c in label]
        y.append(indices)
        label_len.append(len(indices))
        max_label_len = max(max_label_len, len(indices))

    if not X:
        print("No images loaded. Check dataset structure.")
        sys.exit(1)

    X = np.array(X)
    # Pad labels with 0 (blank); CTC uses label_length to ignore padding
    y_padded = np.zeros((len(y), max_label_len), dtype=np.int32)
    for i, seq in enumerate(y):
        y_padded[i, : len(seq)] = seq
    label_len = np.array(label_len, dtype=np.int32)

    print(f"Loaded {len(X)} images, {num_classes} chars")
    return X, y_padded, label_len, char2idx, chars, max_label_len


def ctc_loss(y_true, y_pred):
    """CTC loss. y_true: (batch, max_label_len), y_pred: (batch, time, num_classes)."""
    batch_size = tf.shape(y_pred)[0]
    input_length = tf.fill([batch_size], tf.shape(y_pred)[1])
    label_length = tf.reduce_sum(tf.cast(tf.not_equal(y_true, 0), tf.int32), axis=1)
    # Use tf.nn.ctc_loss (blank index 0)
    logits = y_pred
    labels = tf.cast(y_true, tf.int32)
    loss = tf.nn.ctc_loss(
        labels=labels,
        logits=logits,
        label_length=label_length,
        logit_length=input_length,
        blank_index=0,
        logits_time_major=False,
    )
    return tf.reduce_mean(loss)


def build_model(num_classes: int):
    """CRNN: CNN → reshape → BiLSTM x2 → Dense(num_classes)."""
    inp = layers.Input(shape=(IMG_H, IMG_W, 1), name="image")
    x = layers.Conv2D(64, 3, activation="relu", padding="same")(inp)
    x = layers.MaxPool2D(2)(x)
    x = layers.Conv2D(128, 3, activation="relu", padding="same")(x)
    x = layers.MaxPool2D(2)(x)
    x = layers.Conv2D(256, 3, activation="relu", padding="same")(x)
    x = layers.MaxPool2D(2)(x)
    x = layers.Conv2D(256, 3, activation="relu", padding="same")(x)
    x = layers.MaxPool2D((2, 1))(x)  # (batch, 2, 8, 256)
    x = layers.Reshape((-1, 256))(x)
    x = layers.Bidirectional(layers.LSTM(128, return_sequences=True))(x)
    x = layers.Bidirectional(layers.LSTM(128, return_sequences=True))(x)
    out = layers.Dense(num_classes, name="logits")(x)
    return keras.Model(inp, out)


def main():
    print("Loading IIIT-HW-Dev...")
    X, y_padded, label_len, char2idx, chars, max_label_len = load_iiit_hw_dev()
    num_classes = len(chars)

    model = build_model(num_classes)
    model.compile(optimizer="adam", loss=ctc_loss)
    print(model.summary())

    # Train
    print("Training (CTC)...")
    model.fit(X, y_padded, epochs=5, batch_size=32)

    model.save(MODEL_PATH)
    with open(CHARSET_PATH, "w", encoding="utf-8") as f:
        json.dump(chars, f, ensure_ascii=False)
    print(f"Saved {MODEL_PATH}, {CHARSET_PATH}")
    print("Convert: tensorflowjs_converter --input_format keras model_word.h5 ./tfjs_model")


if __name__ == "__main__":
    main()
