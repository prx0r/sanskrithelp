# Pāṇini path (Bruno compilation)

> Aṣṭādhyāyī = Pāṇini’s grammar (sūtrapāṭha). We already have 3983 sūtras.
> Strategy: **structure first, operators second, images only on error.**
> Full writeup: `/root/bruno/sanskrit/BRUNO-PANINI-COMPILATION.md`

## Corpus (on disk)

| File | What |
|------|------|
| `public/memory/panini/sutrapatha.tsv` | 3983 sūtras (Vidyut) |
| `public/memory/panini/aShTAdhyAyI.itx` | SanskritDocuments clean path |
| `public/memory/panini/sutrapatha_merged.json` | Lab runtime index |
| `public/memory/panini/pratyaharas.json` | Compression handles |
| `public/memory/panini/maheshvara_sutras.json` | Śivasūtras / Māheśvara |

## Study order (not 1.1.1 → end)

1. **Sound system** — vargas · guṇa · pratyāhāra (`/memory/panini`)
2. **Operators** — simulator PLAY: aspiration/voicing/ṇic/kta
3. **Sandhi collision** — predict then collide
4. **Derivation wheel** — hide surface → predict → reverse-compile
5. **Live tools** — https://sanskrit.help/memory/simulator
6. **Rule numbers later** — overlay Aṣṭādhyāyī addresses onto zones you already know

## Bruno rule

> Compile operators, not flashcards. Image only where prediction fails.

One image per transformation (aspiration=wind explosion, ṇic=another agent…). Not 3983 pictures.

## Dual address (optional later)

Same phoneme: **Pāṇinian function** + **Trika layer** (anuttara / vāk levels). Keep provenance tags.

## What this is not

Not a full computational Aṣṭādhyāyī. Teaching runtime over real corpus + executable Bruno operators.
