#!/usr/bin/env python3
"""Convert Keras .h5 models to TF.js format using tensorflowjs_converter."""
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
PUBLIC = PROJECT / "public" / "dhcd"


def convert(keras_path: Path, out_path: Path):
    """Run tensorflowjs_converter."""
    cmd = [
        sys.executable, "-m", "tensorflowjs_converter",
        "--input_format", "keras",
        str(keras_path),
        str(out_path),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr)
        return False
    print(f"Converted {keras_path.name} -> {out_path}")
    return True


def main():
    dhcd = PROJECT / "ml" / "dhcd"
    word = PROJECT / "ml" / "word"

    ok = True
    if (dhcd / "model_char.h5").exists():
        ok = convert(dhcd / "model_char.h5", PUBLIC / "tfjs_model") and ok
    if (word / "model_word.h5").exists():
        ok = convert(word / "model_word.h5", PUBLIC / "word_tfjs_model") and ok
        if (word / "charlist.json").exists():
            import shutil
            shutil.copy(word / "charlist.json", PUBLIC / "charlist.json")
            print(f"Copied charlist.json -> {PUBLIC}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
