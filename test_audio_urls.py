#!/usr/bin/env python3
"""
Test different URL patterns for phoneme audio files
"""
import urllib.request
import urllib.error

# Test different URL patterns based on the a.ogg file the user found
test_urls = [
    # Direct patterns
    "https://www.learnsanskrit.org/audio/a.ogg",
    "https://www.learnsanskrit.org/a.ogg",
    "https://www.learnsanskrit.org/sounds/a.ogg",
    "https://www.learnsanskrit.org/sounds/audio/a.ogg",
    # With subdirectories for vowels
    "https://www.learnsanskrit.org/sounds/vowels/a.ogg",
    "https://www.learnsanskrit.org/sounds/vowels/simple/a.ogg",
    # Different base URLs
    "https://learnsanskrit.org/audio/a.ogg",
    "https://learnsanskrit.org/a.ogg",
    # Try mp3 format
    "https://www.learnskrit.org/audio/a.mp3",
    "https://www.learnsanskrit.org/sounds/a.mp3",
]

import sys

# Set UTF-8 encoding for output
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

print("Testing URL patterns for phoneme audio files...")
print("-" * 70)

for url in test_urls:
    try:
        with urllib.request.urlopen(url) as response:
            size = len(response.read())
            print(f"[SUCCESS] {url}")
            print(f"  Size: {size} bytes")
            print()
            break
    except urllib.error.HTTPError as e:
        print(f"[FAILED] {url}: HTTP {e.code}")
    except Exception as e:
        print(f"[FAILED] {url}: {e}")

print("-" * 70)
