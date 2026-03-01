# Trial Test Results — 2025-02-28

## Services Run

| Service      | Port | Status    | Notes                              |
|-------------|------|-----------|------------------------------------|
| Next.js dev | 3002 | OK        | Port 3000 in use, fell back to 3002 |
| Sabdakrida  | 8010 | OK        | Already running                    |
| Chroma      | 8000 | OK        | RAG index from minimal build       |

## API Test Results

| Endpoint        | Status | Result                                   |
|-----------------|--------|------------------------------------------|
| `/`             | 200    | Homepage loads                           |
| `/learn`        | 200    | Learn page with zone islands             |
| `/learn/tutor`  | 200    | Tutor chat page                          |
| `/learn/pronunciation` | 200 | Śabdakrīḍā page                   |
| `/learn/sandhi` | 200   | Sandhi zone with ZoneGate                |
| `/api/rag-ask`  | 200    | RAG retrieval + LLM works (Whitney context) |
| `/api/tts`      | 200    | Kokoro TTS works (28KB audio returned)    |
| `/api/tutor`    | 200    | Returns 200 but **content empty**        |
| Sabdakrida `/session/mode1` | 200 | Pronunciation assessment works    |

## Issues Found

### 1. Tutor API — Qwen returns empty, MiMo works
- **Symptom:** With `Qwen/Qwen3.5-397B-A17B-TEE`, tutor returns `{"content":"","tutorVoice":"af_heart"}`
- **Fix:** Set `TUTOR_MODEL=XiaomiMiMo/MiMo-V2-Flash-TEE` in `.env.local` for a working tutor
- **Verified:** MiMo returns full content (e.g. "Let's start with अ (a)...")

### 2. Sabdakrida session path
- Next.js proxies to `/session/mode1` on Sabdakrida — correct
- Direct test to `http://localhost:8010/session/mode1` with WAV: **200 OK**

## What Works for Trial

- **Zone gates:** Learn page locks/unlocks by prerequisites
- **ZoneGate component:** “I've read this” and “Ask tutor” on zone pages
- **RAG (rag-ask):** Whitney excerpts retrieved and sent to LLM
- **TTS:** Kokoro speaks text
- **Pronunciation:** Sabdakrida mode1 assessment
- **Pages:** All tested routes load (200)

## Recommendation

**Ready for trial.**

Add to `.env.local` to enable the tutor:

```
TUTOR_MODEL=XiaomiMiMo/MiMo-V2-Flash-TEE
```

Restart Next.js after changing env. All other flows (zones, RAG, TTS, pronunciation) work as-is.
