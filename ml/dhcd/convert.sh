#!/bin/bash
# Convert Keras model to TF.js format for browser use.
# Run from ml/dhcd/: ./convert.sh
# Output: public/dhcd/tfjs_model/ (served by Next.js)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUT_DIR="$PROJECT_ROOT/public/dhcd/tfjs_model"
cd "$SCRIPT_DIR"

if [ ! -f model_char.h5 ]; then
  echo "Run train.py first to generate model_char.h5"
  exit 1
fi

mkdir -p "$OUT_DIR"
tensorflowjs_converter --input_format keras model_char.h5 "$OUT_DIR"
echo "TF.js model saved to $OUT_DIR"
ls -la "$OUT_DIR"
