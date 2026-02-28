"""Quick setup verification for Sabdakrida."""
import sys

def main():
    errors = []
    # 1. Torch
    try:
        import torch
        print(f"[OK] torch {torch.__version__}")
    except Exception as e:
        print(f"[FAIL] torch: {e}")
        errors.append("torch")
        return 1

    # 2. Transformers
    try:
        import transformers
        print(f"[OK] transformers {transformers.__version__}")
    except Exception as e:
        print(f"[FAIL] transformers: {e}")
        errors.append("transformers")

    # 3. Parler-TTS
    try:
        import parler_tts
        print("[OK] parler_tts")
    except Exception as e:
        print(f"[FAIL] parler_tts: {e}")
        errors.append("parler_tts")

    # 4. Audio
    try:
        import librosa, soundfile, scipy
        print("[OK] librosa, soundfile, scipy")
    except Exception as e:
        print(f"[FAIL] audio libs: {e}")
        errors.append("audio")

    # 5. API
    try:
        import fastapi, uvicorn
        print("[OK] fastapi, uvicorn")
    except Exception as e:
        print(f"[FAIL] api: {e}")
        errors.append("api")

    # 6. Sabdakrida modules (phoneme_diff only - no torch deps)
    try:
        from asr.phoneme_diff import phoneme_diff
        assert phoneme_diff("kāla", "kala") == [("ā", "a")]
        print("[OK] sabdakrida asr.phoneme_diff")
    except Exception as e:
        print(f"[FAIL] phoneme_diff: {e}")
        errors.append("phoneme_diff")

    if errors:
        print(f"\nErrors: {errors}")
        return 1
    print("\nAll checks passed. Sabdakrida is ready.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
