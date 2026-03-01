# Voice & TTS Stack — What's Built

## Summary

| Component | Where | Model | Sanskrit | English |
|-----------|-------|------|----------|---------|
| **Voice input (ASR)** | Next.js `/api/transcribe` | Chutes Whisper large-v3 | ✓ (language param) | ✓ |
| **Voice input (ASR)** | sabdakrida mode1 | Bidwill whisper-medium-sanskrit (local) | ✓ (finetuned) | — |
| **Sanskrit TTS** | sabdakrida `/tts` | indic-parler-tts (local) | ✓ Aryan voice | — |
| **English/general TTS** | Next.js `/api/tts` | Chutes Kokoro | — | ✓ (hf_alpha) |

**Not uniform across the board.** Two Whisper paths; two TTS paths. Sanskrit gets Sanskrit-specific models where available.

---

## Voice Input (Whisper)

### 1. Chutes Whisper (Next.js → `/api/transcribe`)

- **Model:** `chutes-whisper-large-v3.chutes.ai`
- **Used by:** RecordButton, PhonemeCard, pronunciation page (when frontend sends audio)
- **Language:** Optional `language` param; can pass `"sa"` for Sanskrit
- **Output:** Text transcript

### 2. Local Sanskrit Whisper (sabdakrida mode1)

- **Model:** `Bidwill/whisper-medium-sanskrit-try-2` (HuggingFace, local)
- **Used by:** Pronunciation assessment (`/session/mode1`) — transcribe learner, phoneme_diff, score
- **Why separate:** Sanskrit-finetuned for better phoneme diagnostics (ṭ vs t, aspiration, etc.)
- **Output:** Devanagari transcript

**Clarification:** Pronunciation page sends audio to `/api/sabdakrida/session` (mode1) → sabdakrida uses **local Sanskrit Whisper**. The Next.js `/api/transcribe` (Chutes Whisper) is used by RecordButton, PhonemeCard on drill/guided-lesson pages.

---

## TTS

### 1. Sanskrit TTS — indic-parler-tts (local)

- **Model:** `ai4bharat/indic-parler-tts` (local, PyTorch)
- **Route:** sabdakrida `POST /tts` → Next.js proxy `/api/sabdakrida/tts`
- **Voice:** Aryan (single consistent Sanskrit speaker)
- **Input:** Devanagari preferred; IAST converted to Devanagari
- **Used by:** Pronunciation drills, feedback-audio, playSanskritTTS()

### 2. English / General TTS — Chutes Kokoro

- **Model:** `chutes-kokoro.chutes.ai`
- **Route:** Next.js `POST /api/tts`
- **Voice:** `hf_alpha` (default)
- **Used by:** playTTSAudio() — phoneme fallback, general playback
- **English:** Kokoro is multilingual; works for English

**No dedicated English-only TTS.** Kokoro handles both. For Qwen replies in English, Kokoro can read them. Same for mixed Sanskrit+English if Kokoro supports Devanagari/hindi.

---

## LLM (Current vs Planned)

| Current | Planned |
|--------|---------|
| MiMo-V2-Flash-TEE (tutor, rag-ask, etc.) | **Qwen/Qwen3.5-397B-A17B-TEE** |
| — | Better Sanskrit understanding |

**Chutes chat:** `https://llm.chutes.ai/v1/chat/completions`  
**Planned model:** `Qwen/Qwen3.5-397B-A17B-TEE`

---

## Kokoro for Qwen Replies

Use Kokoro to speak the Qwen response:

```
Qwen (Qwen3.5-397B) → text reply → Chutes Kokoro /speak → audio
```

- **Endpoint:** `POST https://chutes-kokoro.chutes.ai/speak`
- **Body:** `{ "text": "...", "speed": 1, "voice": "af_heart" }` (or other voice)
- **Works for:** English, mixed content. For Sanskrit-heavy replies, may need to check Kokoro’s Sanskrit quality vs indic-parler.

---

## PersonaPlex — Role & Voice Control

**Model:** `nvidia/personaplex-7b-v1` (HuggingFace)

**What it is:** Full-duplex speech-to-speech. Listens and speaks at the same time, natural turn-taking, persona control via voice + text prompts.

**Requirements:**

- PyTorch
- NVIDIA GPU (H100 or A100)
- Linux
- No Chutes-style API — run locally or on your own GPU cloud
- Input: 24 kHz WAV
- Output: 24 kHz audio

**Integration paths:**

1. **Self-host:** Run PersonaPlex on a machine with H100/A100. Expose HTTP API. Call from your app.
2. **Cloud GPU:** Run on RunPod, Lambda, etc. Same idea.
3. **Wait for hosted:** If Chutes or another provider adds PersonaPlex, use their API.

**No managed PersonaPlex API today.** Requires custom deployment.

---

## Recommended Setup (Short Term)

| Use case | Choice |
|----------|--------|
| User voice input | Chutes Whisper (with `language: "sa"` for Sanskrit) |
| Sanskrit TTS | indic-parler (local) |
| English TTS (Qwen replies) | Chutes Kokoro |
| LLM | Qwen3.5-397B-A17B-TEE |
| PersonaPlex | Plan for later when you have GPU capacity |

**Simple flow:** User speaks → Whisper → Qwen → text reply → Kokoro TTS → play audio.
