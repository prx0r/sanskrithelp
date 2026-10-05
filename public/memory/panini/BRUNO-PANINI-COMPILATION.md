# Bruno × Pāṇini — optimal compilation strategy

> Built 2026-10-05 from all prior work: `PANINI-PALACE-NOTORIA-TANTRALOKA.md` ·
> `PANINI-ABHINAVAGUPTA-SYNTHESIS.md` · `GREER-PROVENANCE-BRUNO-PANINI.md` ·
> `BRUNO-WHEELS-IMAGINAL-COMPILER.md` · bruno lab runtime · sanskrithelp simulator v2 ·
> peer review (cognitive machine).
>
> **Name you meant:** Aṣṭādhyāyī (Pāṇini’s 8-chapter grammar / sūtrapāṭha).
> Also useful: Laghu Kaumudī / Kāśikā (commentaries — construction order, not raw 4k flashcards).

---

## What we already have (do not rebuild)

| Asset | Path | Scale |
|-------|------|-------|
| Vidyut sūtrapāṭha | `bruno/sources/panini/vidyut/sutrapatha.tsv` | **3983 sūtras** code+IAST/HK |
| GRETIL JSONL | `bruno/sources/panini/astadhyayi/sa_panini_astadhyayi.jsonl` | ~3950 |
| GRETIL HTML | `bruno/sources/panini/gretil/` | ordered + alphabetical |
| SanskritDocuments ITX | `bruno/sources/panini/downloads/aShTAdhyAyI.itx` | clean sūtra path (new) |
| ashtadhyayi.com JSON | `bruno/sources/panini/downloads/ashtadhyayi_com_sutras.json` | structured (new) |
| Lab runtime | `bruno/sanskrit/lab/panini_runtime.py` | 3983 rules · pratyāhāra · teaching traces |
| Pratyāhāras / Maheshvara | `lab/data/` + sanskrithelp Memory | already interactive |
| Simulator v2 | `sanskrit.help/memory/simulator` | state → operator → Pāṇini physics |
| Synthesis docs | bruno/sanskrit/PANINI-*.md | palace zones · dual-layer · provenance |

**Honesty (from lab README):** derivation traces are teaching runtimes over real corpus — not full computational Aṣṭādhyāyī fidelity.

---

## The core insight (already in your docs)

> **Do not make a palace *about* Pāṇini. Make a palace that *behaves like* Pāṇini.**

Bruno’s job is **not** “image every sūtra.”  
Bruno’s job is **compile knowledge into an executable imaginal world** that Pāṇini’s transformations can run on.

From synthesis:

| Layer | Language |
|-------|----------|
| Pāṇini | how Sanskrit is **generated** |
| Abhinavagupta | what sound/mantra **is** |
| Bruno | how to build an **internal symbolic machine** for it |
| Notoria | prepares the faculty that runs the machine |

---

## Optimal compilation order (structures first)

Do **not** start at Aṣṭādhyāyī 1.1.1 and walk 3983 sūtras as cards.

Construction order = **working subsystems** (Laghu Kaumudī style):

```text
1. Sound system          Maheshvara · vargas · guṇa · pratyāhāra handles
2. Sandhi gates          sound meeting sound
3. Root forest           dhātupāṭha as living agents
4. Verb engine           root + operator → form
5. Nominal morphology    subanta / case
6. Kāraka court          semantic roles
7. Compounds / derivation
8. Aṣṭādhyāyī addresses  overlay rule numbers onto zones you already know
```

This matches `PANINI-PALACE` zones and the simulator’s four modes.

---

## What Bruno actually compiles

### 1. Operators, not flashcards (basis set)

Peer review + simulator already encode this:

| Operator | Bruno image | Pāṇinian work |
|----------|-------------|----------------|
| Aspiration | wind explosion | k→kh, g→gh |
| Voicing | illumination | k→g, t→d |
| Nasalization | nasal chamber | k→ṅ |
| Causative ṇic | another agent responsible | root + agent |
| kta | event → resultant | result nominal |

Learn the **transformation once**. Phoneme/morphology = coordinates in latent space.

### 2. Pratyāhāra as compression handles

`ac`, `hal`, `yaṇ`… are Bruno-style **handles** on huge classes — the same move as a wheel cell.  
Interactive already: sanskrithelp `/memory/panini` + lab `expand_pratyahara`.

### 3. Wheels as multidimensional arrays (Greer/provenance)

Your Greer doc: Bruno wheel ≈ jagged multi-dimensional array:

```ts
WheelAxis<T> = { id, values: T[] }
WheelSystem = { alphabet, axes, constraints? }
WheelState = { selections[] }
```

**Optimal use for Pāṇini:**

| Axis | Content |
|------|---------|
| Invariant | √dhātu or pratyāhāra class |
| Semantic intent | go / cause / result… |
| Morphological op | ṇic / kta / ktvā / … |
| Phonological consequence | guṇa / sandhi / substitution |
| Surface | actual form |

**Hide ring 5** → predict. Then **reverse**: surface → peel machinery.  
That is the simulator’s derivation wheel — keep it as the main Bruno tool, not generic agent×action scenes.

### 4. Dual addresses (very Bruno, very Abhinavagupta)

Same phoneme, two linked addresses (from PANINI-ABHINAVAGUPTA-SYNTHESIS):

| Address | Question |
|---------|----------|
| **Pāṇinian** | class? pratyāhāras? operations? sandhi? |
| **Trika (optional)** | anuttara? differentiation? four levels of vāk? |

Do **not** collapse into one doctrine. Dual-layer memory object.

### 5. Imagery only where prediction fails

Greer/simulator rule: deploy Bruno images on **error signal**, not for all 3983 rules.

```text
confuses dental/retroflex  → strengthen that dimension
misses causatives          → strong ṇic transformation object
```

### 6. Pāṇini as invisible physics (simulator v2)

User mutates objects → Pāṇini returns **valid / conditional / invalid**.  
Grammar study = reverse-engineering a machine, not reading a manual.

---

## What NOT to compile first

| Avoid | Why |
|-------|-----|
| 3983 sūtra flashcards | Memorizes metalanguage, not generation |
| One image per rule | Mnemonic harder than Sanskrit (Torchia’s critique of empty Bruno images) |
| Full Kāśikā as beginner path | Commentary density ≠ executable model |
| Mixing Notoria voces into Kashmir Śaiva ritual | Functionally distinct layers (palace doc rule) |
| Claiming complete computational Aṣṭādhyāyī | Lab honesty rule |

---

## Concrete pipeline (how to compile “using Bruno to learn Pāṇini”)

```text
SOURCE (have it)
  Vidyut sutrapatha.tsv · GRETIL jsonl · ashtadhyayi.com json
        ↓
STRUCTURE (compile)
  Sound system → sandhi → dhātu → verbs → nominals → kāraka
        ↓
OPERATORS (Bruno)
  Basis set images on transformations
  Pratyāhāra handles
  Derivation wheel: invariant → op → surface (hide/reverse)
        ↓
EXECUTABLE WORLD
  sanskrithelp simulator modes + lab panini_runtime
  Rowe building floors = subsystems
        ↓
ERROR-DRIVEN MNEMONICS
  Learner state strengthens only weak dimensions
        ↓
OPTIONAL TRIKA LAYER
  Dual addresses · levels of speech · nyāsa for phonemes
```

---

## Where to study / practice (live)

| Surface | URL / path |
|---------|------------|
| Simulator (cognitive machine) | https://sanskrit.help/memory/simulator |
| Pāṇini tools page | https://sanskrit.help/memory/panini |
| Bruno wheels (old selectors) | https://sanskrit.help/memory/bruno-wheels/ |
| Lab runtime | `bruno/sanskrit/lab/daily_runtime.py panini --pratyahara ac` |
| Strategy (this file) | `bruno/sanskrit/BRUNO-PANINI-COMPILATION.md` |

---

## One-line

> **Aṣṭādhyāyī is already downloaded. Don’t flashcard it. Compile subsystems in Laghu-Kaumudī order, run them as operators in the simulator, and let Bruno images fire only where your prediction fails.**
