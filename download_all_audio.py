#!/usr/bin/env python3
"""
Download all Sanskrit phoneme audio files from GitHub repository
"""
import os
import urllib.request
import urllib.error
from pathlib import Path

# Create phonemes directory if it doesn't exist
phonemes_dir = Path("public/audio/phonemes")
phonemes_dir.mkdir(parents=True, exist_ok=True)

# List of all audio files from GitHub repository
audio_files = [
    "R.OGG", "RR.OGG", "a.OGG", "aa.OGG", "ai.OGG", "anusvara.OGG",
    "au.OGG", "ba.OGG", "bha.OGG", "ca.OGG", "cha.OGG", "da.OGG",
    "da1.OGG", "dha.OGG", "dha1.OGG", "e.OGG", "ga.OGG", "gha.OGG",
    "ha.OGG", "hma.OGG", "i.OGG", "ii.OGG", "ja.OGG", "jha.OGG",
    "jna.OGG", "ka.OGG", "kha.OGG", "la.OGG", "ma.OGG", "na.OGG",
    "na1.OGG", "na_j.OGG", "na_k.OGG", "o.OGG", "pa.OGG", "pha.OGG",
    "ra.OGG", "sa.OGG", "sha.OGG", "shha.OGG", "ta.OGG", "ta1.OGG",
    "tha.OGG", "tha1.OGG", "u.OGG", "uu.OGG", "va.OGG", "visarga.OGG",
    "ya.OGG"
]

# GitHub raw URL base
BASE_URL = "https://raw.githubusercontent.com/sanskrit/learnsanskrit.org/main/lso/static/audio/"

def download_file(filename):
    """Download a single audio file from GitHub"""
    url = BASE_URL + filename
    output_filename = filename.lower().replace('.ogg', '.ogg')
    output_path = phonemes_dir / output_filename

    try:
        print(f"Downloading: {filename} -> {output_filename}")
        with urllib.request.urlopen(url) as response:
            content = response.read()

        # Save the file
        with open(output_path, 'wb') as f:
            f.write(content)

        print(f"  ✓ Downloaded: {output_filename} ({len(content)} bytes)")
        return True, len(content)

    except Exception as e:
        print(f"  ✗ Error downloading {filename}: {e}")
        return False, 0

# Download all audio files
print(f"Starting download to: {phonemes_dir.absolute()}")
print(f"Total audio files to download: {len(audio_files)}")
print("-" * 70)

success_count = 0
failed = []
total_bytes = 0

for filename in audio_files:
    success, size = download_file(filename)
    if success:
        success_count += 1
        total_bytes += size
    else:
        failed.append(filename)
    print()

print("-" * 70)
print(f"Download complete!")
print(f"Successfully downloaded: {success_count}/{len(audio_files)}")
print(f"Total size: {total_bytes:,} bytes ({total_bytes / 1024 / 1024:.2f} MB)")

if failed:
    print(f"\nFailed downloads ({len(failed)}):")
    for f in failed:
        print(f"  - {f}")
