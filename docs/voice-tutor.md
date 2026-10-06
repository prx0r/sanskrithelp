# Voice Tutor — runbook (Qwen first backend)

## What exists (no keys needed)
- `lib/voice-tutor/provider.ts` — backend-neutral types + shared prompt builder.
  Same constraints on every backend: world, known constructions, one target, vocab.
- `lib/voice-tutor/qwen.ts` — QwenProvider (VAD mode, `record_turn` tool loop,
  transcripts, 24k PCM playback). Protocol per Alibaba interaction-process docs.
- `lib/voice-tutor/recordTurn.ts` — scores learner turns through `decompileHindi`;
  logs canonical dimensioned attempts; `checkAdherence` gates tutor speech.
- `lib/voice-tutor/ab.ts` — offline transcript scoring (hindi-ratio, flags, target).
- `app/api/voice-tutor/session/route.ts` — mints session params (dev-direct).
- Talk mode in Hindi lab — mic (16k PCM), playback queue, transcript log.

## Going live (Qwen)
1. Alibaba Cloud Model Studio, Singapore region → API key + workspace ID.
   Free quota: 1M tokens / 90d — covers the whole A/B.
2. Env: `QWEN_API_KEY`, `QWEN_WORKSPACE_ID`. Voice: `Tina` (Hindi confirmed).
3. Browser-direct WS exposes the key — dev only. Production: build the server
   relay before any shared deploy.
4. A/B: run identical curriculum on Qwen, score transcripts with `ab.ts`
   (natural Hindi vs translationese, recast quality, 90%-Hindi discipline,
   code-switch stability, Sanskrit-vocab pronunciation, constructicon
   adherence, tool-call reliability).

## Adding backends
Implement `VoiceProvider` (Gemini/OpenAI), reuse prompt builder + record_turn +
validation unchanged. That is the A/B fairness guarantee.
