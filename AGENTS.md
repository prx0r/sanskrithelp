# AGENTS.md — sanskrithelp

> Daytime Sanskrit laptop app. Pāṇini machine UI + tantra practice + readings.
> Night engine: Stonedoorway. Memory engine: Bruno (linked, not merged).

## Product split

| Repo | Role |
|------|------|
| **This app** | Frontend: zones, games, drills, VBT/tantra practice, audio, readings |
| **bruno** | Memory OS: Caelum, wheels, Notoria shell, Pāṇini traces |
| **stoned** / **stoneseed** | Night imaginal runtime + kernel protocols |
| **ochema.co** | Faculty, sky, ritual timing, diary |
| **grimoirer** | Grimoire practice assets |

## Read first

- `worlds-stub/SANSKRITHELP-BRUNO-SYNTHESIS.md` — product contract
- `worlds-stub/FOUR-LAYER-PLAN.md` — earlier build plan
- `docs/PANINI-PALACE-NOTORIA-TANTRALOKA.md` — palace zones
- bruno `CANONICAL-SANSKRIT-PATH-V1.md` — syllabus

## How to work here

1. **Day app is the frontend** — do not build a parallel Bruno UI here.
2. Zones + audio + tantra practice are the substrate; Bruno plugs in via JSON contracts (`phoneme-object`, day protocol, handoff card).
3. Night = Stonedoorway protocols (`matrika-night`, Routine X) — handoff payload, not audio engine here.
4. No Hz-per-phoneme doctrine. Provenance: SOURCE_ATTESTED vs PEDAGOGICAL.
5. Games: scenes exist; wire routes when adding game pages.

## Day protocol target

See synthesis contract: shadow → scriptorium → zone drill → Bruno recall/predict → night handoff.

## Data

`data/phonemes.json` · `pratyaharas.json` · `sandhi-rules.json` · `dhatus.json` · `rag/vijnana-bhairava*` · `worlds-stub/*`
