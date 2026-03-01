#!/bin/bash
# Convert word CRNN to TF.js
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUT_DIR="$PROJECT_ROOT/public/dhcd/word_tfjs_model"
cd "$SCRIPT_DIR"

[ -f model_word.h5 ] || { echo "Run train.py first"; exit 1; }
mkdir -p "$OUT_DIR"
tensorflowjs_converter --input_format keras model_word.h5 "$OUT_DIR"
cp charlist.json "$PROJECT_ROOT/public/dhcd/"
echo "Model: $OUT_DIR, charlist: public/dhcd/charlist.json"
