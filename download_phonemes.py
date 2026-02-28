#!/usr/bin/env python3
"""
Script to download Sanskrit phoneme audio files from learnsanskrit.org
"""
import os
import urllib.request
import urllib.error
from pathlib import Path

# Create phonemes directory if it doesn't exist
phonemes_dir = Path("public/audio/phonemes")
phonemes_dir.mkdir(parents=True, exist_ok=True)

# List of all 49 Sanskrit phonemes with their names
phonemes = [
    # Vowels
    ("a", "short a"),
    ("aa", "long aa"),
    ("i", "short i"),
    ("ii", "long ii"),
    ("u", "short u"),
    ("uu", "long uu"),
    ("r", "vocalic r"),
    ("rr", "vocalic rr"),
    ("l", "vocalic l"),
    ("e", "e"),
    ("ai", "ai"),
    ("o", "o"),
    ("au", "au"),
    ("am", "anusvara/anusvara"),
    ("ah", "visarga/visarga"),
    # Velars
    ("ka", "ka"),
    ("kha", "kha"),
    ("ga", "ga"),
    ("gha", "gha"),
    ("nga", "ga"),
    # Palatals
    ("ca", "ca"),
    ("cha", "cha"),
    ("ja", "ja"),
    ("jha", "jha"),
    ("nya", "nya"),
    # Retroflexes
    ("Ta", "ta-retro"),
    ("Tha", "tha-retro"),
    ("Da", "da-retro"),
    ("Dha", "dha-retro"),
    ("Na", "na-retro"),
    # Dentals
    ("ta", "ta"),
    ("tha", "tha"),
    ("da", "da"),
    ("dha", "dha"),
    ("na", "na"),
    # Labials
    ("pa", "pa"),
    ("pha", "pha"),
    ("ba", "ba"),
    ("bha", "bha"),
    ("ma", "ma"),
    # Semivowels
    ("ya", "ya"),
    ("ra", "ra"),
    ("la", "la"),
    ("va", "va"),
    # Sibilants
    ("sha", "sha-palatal"),
    ("Sa", "sha-retro"),
    ("sa", "sa"),
    # Other
    ("ha", "ha"),
]

# Try different URL patterns
def download_phoneme(filename, phoneme_name):
    """Try to download a phoneme audio file from different URL patterns"""
    
    # Different URL patterns to try
    patterns = [
        f"https://www.learnsanskrit.org/audio/{filename}.ogg",
        f"https://www.learnsanskrit.org/audio/{filename}.mp3",
        f"https://www.learnsanskrit.org/sounds/audio/{filename}.ogg",
        f"https://www.learnsanskrit.org/sounds/audio/{filename}.mp3",
        f"https://www.learnsanskrit.org/sounds/{filename}.ogg",
        f"https://www.learnsanskrit.org/sounds/{filename}.mp3",
    ]
    
    for url in patterns:
        try:
            print(f"Trying: {url}")
            with urllib.request.urlopen(url) as response:
                content = response.read()
                
                # Save the file
                output_path = phonemes_dir / f"{filename}.ogg"
                with open(output_path, 'wb') as f:
                    f.write(content)
                
                print(f"✓ Downloaded: {filename}.ogg ({len(content)} bytes)")
                return True
                
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            else:
                print(f"  Error downloading {url}: {e}")
                continue
        except Exception as e:
            print(f"  Error downloading {url}: {e}")
            continue
    
    print(f"✗ Could not download: {filename}")
    return False

# Download all phonemes
print(f"Starting download to: {phonemes_dir.absolute()}")
print(f"Total phonemes to download: {len(phonemes)}")
print("-" * 60)

success_count = 0
failed = []

for filename, phoneme_name in phonemes:
    if download_phoneme(filename, phoneme_name):
        success_count += 1
    else:
        failed.append(filename)
    print()

print("-" * 60)
print(f"Download complete!")
print(f"Successfully downloaded: {success_count}/{len(phonemes)}")
print(f"Failed downloads: {len(failed)}")

if failed:
    print("\nFailed phonemes:")
    for f in failed:
        print(f"  - {f}")
