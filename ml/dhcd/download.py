#!/usr/bin/env python3
"""
Download DHCD dataset for Devanagari character recognition.

Primary: Google Drive (no Kaggle account needed)
  Train: https://drive.google.com/file/d/1egHJ3E6ivL5355OVJypYmAGvYATQyYHL/view
  Test:  https://drive.google.com/file/d/1N7R-S5B9RMdUYa0sWiIgRMScrcy9lb_B/view

Fallback: GitHub NPZ (~95MB)

Run: python download.py
Output: data/dataset.npz or data/train/, data/test/ (folder structure)
"""

import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"
NPZ_PATH = DATA_DIR / "dataset.npz"
GITHUB_NPZ = "https://raw.githubusercontent.com/Prasanna1991/DHCD_Dataset/master/dataset/dataset.npz"

# Google Drive file IDs (ashokpant/devanagari-character-dataset)
GDRIVE_TRAIN_ID = "1egHJ3E6ivL5355OVJypYmAGvYATQyYHL"
GDRIVE_TEST_ID = "1N7R-S5B9RMdUYa0sWiIgRMScrcy9lb_B"


def download_gdrive(file_id: str, dest: Path) -> bool:
    """Download from Google Drive using gdown."""
    try:
        import gdown
        url = f"https://drive.google.com/uc?id={file_id}"
        gdown.download(url, str(dest), quiet=False)
        return dest.exists()
    except ImportError:
        print("Install gdown: pip install gdown")
        return False
    except Exception as e:
        print(f"gdown failed: {e}")
        return False


def download_github() -> bool:
    """Download dataset.npz from GitHub."""
    import urllib.request
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print("Downloading DHCD from GitHub (~95MB)...")
    try:
        urllib.request.urlretrieve(GITHUB_NPZ, NPZ_PATH)
        print(f"Saved to {NPZ_PATH}")
        return True
    except Exception as e:
        print(f"Download failed: {e}")
        return False


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if NPZ_PATH.exists():
        print(f"Dataset already exists at {NPZ_PATH}")
        return 0

    # Try GitHub first (single NPZ, no auth)
    if download_github():
        return 0

    # Fallback: Google Drive (pip install gdown)
    print("Trying Google Drive...")
    train_zip = DATA_DIR / "train.zip"
    if download_gdrive(GDRIVE_TRAIN_ID, train_zip):
        print("Downloaded train.zip. Extract and run train.py with --data-dir pointing to extracted folders.")
        return 0

    print("\nManual: Download dataset.npz from GitHub or Google Drive, place in ml/dhcd/data/")
    return 1


if __name__ == "__main__":
    sys.exit(main())
