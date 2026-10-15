# Hindi MVP voice stack — free lane only, $0

## Casting (`lib/hindi/fishVoices.ts`)

| Role | Voice | Use |
|---|---|---|
| conversation `0de8162a…` | Narration hi male | Normal NPC back-and-forth |
| slow `06134e9a…` | Slow explainer (community Osho-style voice — roleplay label only, never worn as identity per GLOT §8) | Easy-level NPC variant |
| female `1021386b…` | anika | Learner-model lines (the voice YOU imitate) |

Levels: easy → slow NPC + female model at 0.85×; normal → conversation + female at 1.0×;
hard → same audio, transcript hidden. Difficulty changes delivery, never content.

## Render (`scripts/fish_render_free.py`, fish-audio-sdk, `model=s2.1-pro-free`)

Pre-renders every scenario line × role into `public/memory/hindi/scenes/` and
extends `scenes/voices.json` (text → file), which both the scenarios page and
the MVP read. Skips existing files. Dry run: 6 scenarios, 39 lines, ~3KB text.

```bash
python3 scripts/fish_render_free.py --dry-run   # always $0, no key needed
FISH_API_KEY=... python3 scripts/fish_render_free.py   # renders, bills $0
```

Needs `FISH_API_KEY` in `.env` (see `.env.example`). Without it nothing renders —
playback falls back to existing Edge `l*.mp3` files, then live Edge `/api/tts`,
then browser speechSynthesis. No metered Fish lane is used anywhere.

## Play (`app/memory/hindi/mvp/page.tsx`)

Scenario picker (6) → step = NPC listen card + big YOUR LINE flash + hear-model +
SpeakScore (browser mic → `/api/assess` decompile + score → sadhana log).
Full detail stays in Field Scenarios; stage1–3 scene mixes are still Edge-built
until re-rendered on the free lane.

## Sources folded in

GitHub patterns borrowed: voice-first 2-minute lessons with listen/speak/select
(indian-duolingo), one question → six exercises (Varnamala), normal+slow TTS pair,
scenario roleplay with state (Contexto, SamvadXR), localStorage progress.
Open-access lesson content: Syracuse HIN 101/201 word lists (Bhatia Colloquial
Hindi), A Door Into Hindi 24-lesson arc, UT Austin OER readers, Snell dialogue
structure (39 exchanges in `snell.json`), Bhatia skeletons only — the Routledge
PDF on disk is reference, never committed text.
