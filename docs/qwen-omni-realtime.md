# Qwen3.8-Omni-Flash-Realtime — import notes (fetched 2026-10-06)

Source: Alibaba Cloud Model Studio docs (model page + voice list).
Role in our stack: price/performance challenger to Gemini 3.8 Live behind the
same `VoiceTutorProvider` adapter. No code written yet — docs only.

## Model facts
- Realtime audio+video in, text/audio out; WebSocket, WebRTC, AOQ.
- Custom function calling + remote MCP tools.
- Context: 196,608 input tokens; audio history 100 turns / 600s; output 65k.
- Regions: Beijing + Singapore (use Singapore; free quota only there).
- Token rates: ~7 tok/s audio-in, ~12.5 tok/s audio-out (audio history reprocessed like Gemini).
- 60 RPM / 2M TPM limits.

## Pricing (Singapore, USD)
- Audio in $0.93/M tok; audio out $1.87/M tok; text in $0.23/M; text out $0.70/M.
- Note: speech output bills audio AND corresponding text (3.5-Omni billed audio only).
- **Free quota: 1M tokens, Singapore only, 90d** — enough for the whole A/B test free.
- Rough 30-min session math: in ≈ 30×60×7 = 12.6k tok (~$0.012); out ≈
  30×60×12.5 = 22.5k tok (~$0.042) + text — on the order of **cents**, before
  history reprocessing. Compare Gemini ≈ $0.005+$0.018/min base.

## Hindi voices (confirmed)
Default `Tina`; Hindi listed for Tina, Cindy, Liora Mira, Raymond, Zane, Katerina, Ryan,
Mia, Theo Calm, Serena, Maia, Evan … (dozens). Set via `session.audio.output.voice`.
Voice cloning available. No Indic-accented Hindi voice claimed — verify by ear in A/B.

## A/B plan (from voicetutor.md)
Same curriculum, same tool calls, same constraints (installed primitives + one
novel operator). Score: natural Indian Hindi vs translationese; recast quality;
90%-Hindi discipline; beginner-Hindi recognition; code-switch stability;
Sanskrit-vocabulary pronunciation; constructicon adherence; tool-call reliability.
Gemini expected default; Qwen the price/performance upset candidate.

## Adapter sketch (to build)
```text
VoiceTutorProvider
├── GeminiProvider   (gemini-3.8-live)
├── QwenProvider     (qwen3.8-omni-flash-realtime, Singapore endpoint)
└── OpenAIProvider   (gpt-realtime-2.1, later)
```
Shared: system-prompt builder (world + known constructions + target + rules),
`record_turn()` tool, transcript → decompileHindi validation, dimensioned attempt log.
Needs an Alibaba Cloud API key (Singapore region) — not yet provisioned.
