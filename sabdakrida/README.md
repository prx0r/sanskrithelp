# Śabdakrīḍā — Sanskrit Pronunciation Tutor

AI-powered Sanskrit pronunciation tutor. Uses Sanskrit-finetuned Whisper's confusion errors as the diagnostic signal: when Whisper hears `ta` for `ṭa`, that *is* the pronunciation error.

## Quick Start

```bash
# From project root (buapp)
cd sabdakrida

# Create venv and install (Python 3.11+)
python -m venv venv
venv\Scripts\activate   # Windows
# or: source venv/bin/activate   # Linux/Mac

# Install PyTorch with CUDA first (if you have a 12GB GPU)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install dependencies
pip install -r requirements.txt
pip install git+https://github.com/huggingface/parler-tts.git

# Run the API (from buapp root; port 8010)
cd ..   # to buapp
python -m uvicorn sabdakrida.main:app --reload --host 127.0.0.1 --port 8010
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/session/mode1` | POST | Upload audio + target_text + user_id → pronunciation assessment + base64 WAV feedback |
| `/profile/{user_id}/drills` | GET | Prioritised drill words based on weakness profile |
| `/tts` | POST | Speak Sanskrit text (text, style) |

## Mode 1 Flow

1. Teacher speaks target via TTS (or frontend plays it)
2. Learner repeats
3. Sanskrit Whisper transcribes
4. Phoneme diff identifies (expected, heard) pairs
5. PHONEME_CONFUSIONS maps to error types (retroflex_dental, aspiration, etc.)
6. User profile updated in SQLite
7. TTS speaks corrective feedback in Sanskrit + English

## Models

- **ASR**: `Bidwill/whisper-medium-sanskrit-try-2` (HuggingFace)
- **TTS**: `ai4bharat/indic-parler-tts` (HuggingFace, requires `parler-tts`)

## Mode 2 & 3

Mode 2 (IndicMFA + MFCC) and Mode 3 (Qwen2-Audio holistic) are stubbed. See `sabdo.md` for implementation phases.
