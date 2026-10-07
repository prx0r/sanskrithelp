# GLOT — language-agnostic islands with error-aware coaching

> Status: SPEC (not built). Hindi is pack one; the core applies to any language.
> Principle: difficulty changes delivery, never content. The AI sees your errors,
> documents them, and learns which associations work for YOU.

## 1. Core objects (language-agnostic)

```text
ISLAND (glot core)
├── machines[]      — constructions with slots (form ↔ meaning)
├── scenarios[]     — staged exchanges using the machines
├── modes[]         — reference → easy → medium → hard → conversation
└── learner profile — YOUR association tasted (private, local-first)

LANGUAGE PACK (hindi, …)
├── lexicon + decompile rules  — surface → machine state
├── voices                     — per-role TTS casting
└── corpus anchors              — texts the scenarios quote
```

Hindi pack today: `lib/constructicon/hindiMachines.ts` (machines/islands),
`lib/memory/hindiDecompile.ts` (parser), `public/memory/hindi/scenarios.json`
(scenarios), voices Madhur/Swara/Ryan, Osho anchors. A second pack (e.g.
Sanskrit recitation, or another language) reuses core untouched.

## 2. Modes per scenario (fixed ladder)

| Mode | Audio | Transcript | Hints | Gaps | Goal |
|---|---|---|---|---|---|
| REFERENCE | full scene, all voices | shown | — | — | hear the island alive |
| EASY | 0.85× rate | shown | auto | big | first successful say |
| MEDIUM | 1.0× | shown | manual | normal | clean production |
| HARD | 1.1× | hidden (cues only) | manual | normal | recall under pressure |
| CONVERSATION | NPC roleplay, free turns | hidden | on request | live | survive the exchange |

Stages map: stage1 = REFERENCE; stage2 ≈ EASY/MEDIUM (muted lines + chosen delivery);
stage3 ≈ HARD. CONVERSATION is new (no static track — live NPC via chat).

## 3. The smart loop (error-aware coaching)

```text
attempt (speech)
  → transcript + decompile (which slot broke? TOPIC? verb? ending? emphasis?)
  → assess (score + specific errors)            [BUILT: /api/assess]
  → log with island+scenario context            [BUILT: practiceLog tags]
  → AI reads YOUR recent errors for this island
  → AI proposes ONE association (story/image/sound-hook grounded in the miss)
  → you react ("ooh i like that" = keep; skip = drop)
  → profile learns your taste                     [TO BUILD: §4]
  → next mnemonic is shaped by taste              [TO BUILD: /api/glot/mnemonic]
```

Slot-grounding rule: the mnemonic must target the failed slot, not the whole
sentence. Wrong verb ending → hook the ending. Swapped topic → hook the topic.
Generic encouragement is banned; one specific hook per miss.

## 4. Learner association profile (private)

Stored client-side (localStorage `glot-profile`), sent with coaching requests,
never uploaded anywhere else:

```json
{
  "styles": {"story": 3, "image": 1, "sound-hook": 5, "etymology": 0},
  "kept": [{"island": "X-hii-Y-hai", "cue": "…", "text": "…", "uses": 4}],
  "dropped": ["…cue ids…"]
}
```

Scoring: explicit keep/skip (±2) + implicit reuse (saying the line clean later, +1).
Cold start: offer one of each style, watch what lands. No account, no server profile.

## 5. API surface (to build)

* `POST /api/glot/mnemonic` — in: {islandId, target, transcript, errors[], profile};
  out: {hook, style, whyThisTargetsTheMiss}. Uses free backend; deterministic
  decompile pre-check included like /api/assess.
* `POST /api/glot/converse` (or extend chat) — in: {scenarioId, history, profile};
  out: NPC next turn in persona + hidden assess of YOUR last turn. Ends with summary
  of which slots held and which broke.
* Profile writes stay client-side; server is stateless.

## 6. Conversation mode (the top rung)

NPC persona prompt is generated FROM the scenario (pattern + vocab + registers),
not hand-written per chat. Each learner turn is silently assessed (decompile first,
LLM second); the NPC reacts in character — recasts on miss, advances on hit.
Session ends with: slots held / slots broken / one hook for the worst slot.

## 7. What exists vs what builds next

BUILT: machines/islands/decompile, scenarios+levels, 3-stage audio, SpeakScore+assess,
logging with context tags, difficulty delivery, adaptation suggestions.
NEXT: (1) profile store + keep/skip UI, (2) /api/glot/mnemonic, (3) conversation mode,
(4) Hindi pack completion (Osho 02–10 anchors feed new scenarios), (5) second pack
proves language-agnosticism.

## 8. Non-goals

* No cloning real people (Osho/Lakshmanjoo voices never worn — scenarios quote text only).
* No server-side learner profiles. No streak gamification beyond the sadhana log.
* Difficulty never rewrites content — delivery only.
