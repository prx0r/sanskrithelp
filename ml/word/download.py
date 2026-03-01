#!/usr/bin/env python3
"""
Download IIIT-HW-Dev dataset for Devanagari word recognition.

Primary: GitHub mirror (sushant097 release)
Fallback: preon.iiit.ac.in
Synthetic: Generate from DHCD chars if both fail

Run: python download.py
Output: data/IIIT-HW-Dev/ or data/synthetic_words/
"""

import sys
import zipfile
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"
EXTRACT_DIR = DATA_DIR / "IIIT-HW-Dev"
SYNTHETIC_DIR = DATA_DIR / "synthetic_words"

# Try multiple sources (preon.iiit.ac.in is flaky)
URLS = [
    "https://cvit.iiit.ac.in/images/Projects/wordlevel-Indicscripts/IIIT-HW-Dev.zip",
    "https://cvit.iiit.ac.in/images/Projects/wordlevel-Indicscripts/IIIT-HW-Hindi_v1.tar.gz",
    "https://github.com/sushant097/Devnagari-Handwritten-Word-Recongition-with-Deep-Learning/releases/download/v1.0/IIIT-HW-Dev.zip",
    "http://preon.iiit.ac.in/~kartik/IIIT-HW-Dev.zip",
]
ZIP_PATH = DATA_DIR / "IIIT-HW-Dev.zip"
TAR_PATH = DATA_DIR / "IIIT-HW-Hindi_v1.tar.gz"


def download_url(url: str, dest: Path) -> bool:
    try:
        import urllib.request
        print(f"Trying {url[:60]}...")
        urllib.request.urlretrieve(url, dest)
        return dest.exists() and dest.stat().st_size > 1000
    except Exception as e:
        print(f"  Failed: {e}")
        return False


def download():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if EXTRACT_DIR.exists() and any(EXTRACT_DIR.iterdir()):
        print(f"Dataset already at {EXTRACT_DIR}")
        return True

    archive_path = None
    if not ZIP_PATH.exists() or ZIP_PATH.stat().st_size < 1000:
        for url in URLS:
            dest = TAR_PATH if ".tar.gz" in url else ZIP_PATH
            if download_url(url, dest):
                archive_path = dest
                break
        else:
            print("All downloads failed. Generating synthetic word images from DHCD...")
            return generate_synthetic()
    else:
        archive_path = ZIP_PATH

    if archive_path and archive_path.exists():
        print("Extracting...")
        if archive_path.suffix == ".gz":
            import tarfile
            with tarfile.open(archive_path, "r:gz") as t:
                t.extractall(DATA_DIR)
        else:
            with zipfile.ZipFile(archive_path, "r") as z:
                z.extractall(DATA_DIR)
    print(f"Extracted to {EXTRACT_DIR}")
    return True


def generate_synthetic():
    """Generate synthetic word images from DHCD characters when dataset unavailable."""
    dhcd_data = Path(__file__).resolve().parent.parent / "dhcd" / "data" / "dataset.npz"
    if not dhcd_data.exists():
        print("DHCD dataset.npz not found. Run: cd ml/dhcd && python download.py")
        return False

    import numpy as np
    from PIL import Image

    sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "dhcd"))
    from class_mapping import DHCD_CLASSES

    SYNTHETIC_DIR.mkdir(parents=True, exist_ok=True)
    train_dir = SYNTHETIC_DIR / "train"
    train_dir.mkdir(exist_ok=True)
    (train_dir / "images").mkdir(exist_ok=True)

    data = np.load(dhcd_data)
    X = data["arr_0"]  # (N, 32, 32)
    y = data["arr_1"]

    # Build per-class image list
    by_class = {}
    for i, label in enumerate(y):
        by_class.setdefault(int(label), []).append(X[i])

    pairs = []
    np.random.seed(42)
    for idx in range(500):  # 500 synthetic "words" (2-4 chars each)
        n_chars = np.random.randint(2, 5)
        indices = np.random.randint(0, len(DHCD_CLASSES), n_chars)
        word = "".join(DHCD_CLASSES[i] for i in indices)
        # Concatenate char images horizontally
        imgs = []
        for i in indices:
            pool = by_class.get(i, by_class.get(0, [X[0]]))
            img = pool[np.random.randint(0, len(pool))]
            imgs.append(img)
        combined = np.concatenate(imgs, axis=1)
        combined = np.clip(combined, 0, 255).astype(np.uint8)
        fname = f"syn_{idx:05d}.png"
        Image.fromarray(combined).save(train_dir / "images" / fname)
        pairs.append((fname, word))

    with open(train_dir / "train_gt.txt", "w", encoding="utf-8") as f:
        for fname, word in pairs:
            f.write(f"{fname}\t{word}\n")

    print(f"Generated {len(pairs)} synthetic words in {train_dir}")
    return True


def main():
    if download():
        return 0
    print("\nManual: Request access at https://cvit.iiit.ac.in/research/projects/cvit-projects/indic-hw-data")
    return 1


if __name__ == "__main__":
    sys.exit(main())
