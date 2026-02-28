# Sanskrit App - Download Manifest for Build Agent

This document lists all downloaded resources and what remains to be done for the Sanskrit Learning Web App build.

## Project Overview

Building a Progressive Web App (PWA) that teaches Sanskrit through Pāṇini's own logical system.

**Tech Stack:**
- Frontend: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- Database: Supabase (Postgres)
- Spaced Repetition: ts-fsrs npm package
- AI Layer: Chutes.ai API
- TTS: Google Cloud TTS + Pre-recorded phoneme audio
- PWA: next-pwa library

---

## ✅ DOWNLOADED RESOURCES

### Audio Files (1 of 55 phonemes)
**Location:** `public/audio/phonemes/`

Downloaded:
- `a.ogg` - short vowel 'a'

**⚠️ MANUAL ACTION REQUIRED:** Download remaining 54 phoneme audio files from:
- GitHub: https://github.com/sanskrit/learnsanskrit.org/tree/main/lso/static/audio
- Script available: `download_all_audio.py` (needs to be run)

**Full list of 55 audio files needed:**
```
Vowels: a.ogg, aa.ogg, i.ogg, ii.ogg, u.ogg, uu.ogg, R.ogg, RR.ogg, e.ogg, ai.ogg, o.ogg, au.ogg, anusvara.ogg, visarga.ogg
Velars: ka.ogg, kha.ogg, ga.ogg, gha.ogg
Palatals: ca.ogg, cha.ogg, ja.ogg, jha.ogg, jna.ogg
Retroflexes: ta1.ogg, tha1.ogg, da1.ogg, dha1.ogg, na1.ogg
Dentals: ta.ogg, tha.ogg, da.ogg, dha.ogg, na.ogg
Labials: pa.ogg, pha.ogg, ba.ogg, bha.ogg, ma.ogg
Semivowels: ya.ogg, ra.ogg, la.ogg, va.ogg
Sibilants: sha.ogg, shha.ogg, sa.ogg
Other: ha.ogg, hma.ogg
```

**Naming Convention:** Convert GitHub filenames (.OGG) to lowercase (.ogg)

### Sanskrit Linguistic Data Files
**Location:** `data/`

Downloaded:
- `sandhi-rules.csv` - Sanskrit sandhi rules for Chapter 4
- `enums.csv` - Enumerations and constant values
- `verb-endings.csv` - Verb conjugation endings data
- `nominal-endings-inflected.csv` - Noun case endings
- `indeclinables.csv` - Declinable/unchangeable words
- `sanskrit-data-README.md` - Documentation for the data

**Source:** https://github.com/sanskrit/data/tree/main/learnsanskrit.org

### Reference Textbooks
**Location:** Project root

- `rupel.txt` - "The Cambridge Introduction to Sanskrit" by A.M. Ruppel (14946 lines)
  - Use as reference for pedagogical approach, particularly:
    - Phoneme introduction (Chapter 2 equivalent)
    - Vowel gradation (Chapter 3 equivalent)
    - Sandhi rules with explanations (Chapter 4 equivalent)
    - Verb conjugation (Chapter 8 equivalent)

---

## ⚠️ MANUAL ACTIONS REQUIRED

### 1. Complete Phoneme Audio Downloads
**Priority:** CRITICAL

You already have `public/audio/phonemes/a.ogg`. Download the remaining 54 files:

**Option A - Run the provided script:**
```bash
python download_all_audio.py
```

**Option B - Manual download from GitHub:**
1. Visit: https://github.com/sanskrit/learnsanskrit.org/tree/main/lso/static/audio
2. Download all .OGG files
3. Rename to lowercase and place in `public/audio/phonemes/`

### 2. Download Additional Data Files from GitHub
**Priority:** HIGH

Visit: https://github.com/sanskrit/data/tree/main/learnsanskrit.org

Download these CSV files to `data/`:
- `nouns-irregular-inflected.csv` - Irregular noun forms
- `adjectives-irregular-inflected.csv` - Irregular adjective forms
- `pronouns-inflected.csv` - Pronoun inflections
- `pronouns-compounded.csv` - Compounded pronouns
- `sarvanamas-inflected.csv` - Sarvanama (indefinite pronoun) forms
- `nominal-endings-compounded.csv` - Nominal endings for compounds
- `upasargas.csv` - Pre-verbs/upasargas

### 3. Download Whitney's Sanskrit Grammar
**Priority:** MEDIUM

Source: https://en.wikisource.org/wiki/Sanskrit_Grammar_(Whitney)

Save to: `data/whitney-sanskrit-grammar.txt`

**Why:** Public domain reference for detailed Sanskrit grammar rules, especially useful for:
- Complete sandhi rule explanations
- Comprehensive verb paradigm tables
- Detailed stem formation rules

### 4. Download Whitney's The Roots, Verb-forms and Primary Derivatives
**Priority:** HIGH

Source: Search for "Whitney Roots Verb-forms Primary Derivatives Sanskrit 1885 public domain"

Save to: `data/whitney-roots.txt`

**Why:** Contains:
- Complete list of 2000+ dhātus (roots) with gaṇa classifications
- IE cognates for memory hooks
- Verbal conjugation patterns

**Critical for:** Chapter 5 (Dhātu System) - start with 10 high-frequency roots, expand to 50 in v1

### 5. Download Text Corpora for Chapter 10
**Priority:** MEDIUM

Save to: `data/texts/`

**Sources:**
- Bhagavad Gītā (freely available, start with Chapter 2 ślokas)
  - Download from: https://www.gita-supersite.iitk.ac.in/
- Hitopadeśa (simpler prose, good for beginners)
  - Download from: https://sanskritdocuments.org/doc_hitopadesha.html
- Pañcatantra stories (narrative prose, intermediate)
  - Download from: https://sanskritdocuments.org/doc_panchatantra.html

**Create files:** `gita-selections.json`, `hitopadesha.json`, `panchatantra.json`

---

## 📁 DIRECTORY STRUCTURE (Current State)

```
buapp/
├── public/
│   └── audio/
│       ├── phonemes/         # ⚠️ 1 of 55 files downloaded
│       │   └── a.ogg
│       └── generated/        # Empty (for TTS cache)
├── data/                     # ✅ 6 files downloaded, ~8 more needed
│   ├── sandhi-rules.csv
│   ├── enums.csv
│   ├── verb-endings.csv
│   ├── nominal-endings-inflected.csv
│   ├── indeclinables.csv
│   ├── sanskrit-data-README.md
│   └── texts/                # Create this directory
├── sanskrit-app-build-instructions.md
├── rupel.txt                 # Cambridge textbook
└── [script files]
    ├── download_all_audio.py
    ├── download_phonemes.py
    └── test_audio_urls.py
```

---

## 🔧 BUILD AGENT NEXT STEPS

After completing manual downloads above:

### Phase 1: Create JSON Data Structures
Based on the build instructions, create these JSON files in `data/`:

1. **`phonemes.json`** - 49 phonemes with grid positions
   ```typescript
   {
     "id": string,
     "devanagari": string,
     "iast": string,
     "audioFile": string,
     "place": "velar" | "palatal" | "retroflex" | "dental" | "labial" | "other",
     "manner": "unvoiced_stop" | "unvoiced_aspirate" | "voiced_stop" | "voiced_aspirate" | "nasal" | "semivowel" | "sibilant" | "vowel" | "other",
     "vowelGrade": "zero" | "guna" | "vrddhi",
     "gunaPair": string,
     "vrddhiPair": string,
     "participatesInSandhi": string[],
     "pratyaharas": string[]
   }
   ```

2. **`pratyaharas.json`** - Shiva Sutra groupings

3. **`sandhi-rules.json`** - Parse `sandhi-rules.csv` into structured JSON matching SandhiRule type

4. **`dhatus.json`** - Start with 10 roots:
   - √bhū, √kṛ, √gam, √vac, √dṛś, √śru, √jñā, √sthā, √nī, √labh
   - Expand to 50 after v1 and to 800 for v2

5. **`suffixes.json`** - kṛt + taddhita suffixes with semantics

6. **`karakas.json`** - 6 kāraka definitions

7. **`texts/gita-selections.json`**, **`texts/hitopadesha.json`**, **`texts/panchatantra.json`**

### Phase 2: Set Up Environment Variables
Create `.env.local` in project root:
```bash
# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS=./google-tts-credentials.json
GOOGLE_CLOUD_PROJECT=your-project-id

# Chutes.ai API
CHUTES_API_KEY=your-key-here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Download Google TTS credentials JSON from:
# https://console.cloud.google.com → Create project → Enable "Cloud Text-to-Speech API"
```

### Phase 3: Initialize Next.js Project
```bash
npx create-next-app@15 . --typescript --tailwind --app
npm install ts-fsrs next-pwa shadcn/ui @google-cloud/text-to-speech
```

### Phase 4: Build Chapters in Order
0. Landing page (`app/page.tsx`)
1. Pratyāhāra interactive (`app/learn/compression/page.tsx`)
2. Phoneme grid with audio (`app/learn/phonetics/page.tsx`)
3. Guṇa/Vṛddhi drill (`app/learn/gradation/page.tsx`)
4. Vowel sandhi + Grassmann + Bartholomae (`app/learn/sandhi/page.tsx`)
5. First 10 dhātus with trees (`app/learn/roots/page.tsx`)
6-10. Scaffold routing, "coming soon" pages

---

## 📚 REFERENCE SOURCES DOCUMENTED

### Primary Sources
- **Build Instructions:** `sanskrit-app-build-instructions.md` - Complete specification
- **Pedagogy:** Ruppel's Cambridge Introduction to Sanskrit (`rupel.txt`) - Next.js setup, TypeScript patterns, shadcn/ui components
- **Reference Grammars:**
  - https://www.learnsanskrit.org - Best modern Pāṇinian curriculum
  - Whitney's Sanskrit Grammar (1889) - https://en.wikisource.org/wiki/Sanskrit_Grammar_(Whitney)
  - Monier-Williams Dictionary: https://www.sanskrit-lexicon.uni-koeln.de

### Audio Sources
- Phoneme audio: https://github.com/sanskrit/learnsanskrit.org/tree/main/lso/static/audio
- Alternative: https://www.learnsanskrit.org/sounds/ (in-browser dev tools → Network tab)
- Samskrita Bharati: https://www.samskritabharati.in (contact for permission)

### Data Sources
- Sanskrit linguistic data: https://github.com/sanskrit/data/tree/main/learnsanskrit.org
- Site source code: https://github.com/sanskrit/learnsanskrit.org

---

## 🎯 CRITICAL PATH

1. **IMMEDIATE:** Download remaining 54 phoneme audio files
2. **VERY SOON:** Download Whitney's Roots book (needed for Chapter 5)
3. **BEFORE BUILD:** Download remaining CSV files from GitHub
4. **FIRST BUILD TASK:** Create `phonemes.json` from downloaded audio files + Ruppel textbook
5. **SECOND BUILD TASK:** Create `sandhi-rules.json` from CSV + Whitney's Grammar

---

## 📝 NOTES FOR BUILD AGENT

- Audio format: OGG (Vorbis) - not MP3 as specified in instructions. GitHub uses OGG.
- All data CSVs use SLP1 transliteration - convert to IAST/Devanāgarī as needed
- The build agent should start with Chapters 0-5 only (v1 scope)
- localStorage for card states initially, migrate to Supabase when adding auth
- Use `output: 'export'` in `next.config.ts` for static PWA export
- Vercel deployment recommended (free tier sufficient)

---

## 🔍 MISSING ITEMS

The following resources mentioned in build instructions still need manual acquisition:

1. ❌ Google Cloud TTS credentials JSON (requires Google account setup)
2. ❌ Chutes.ai API key (requires account signup)
3. ❌ Supabase credentials (requires account setup)
4. ❌ Whitney's Roots book (search public domain sources)
5. ⚠️ 54/55 phoneme audio files (script ready, needs execution)
6. ⚠️ ~8 additional CSV files from GitHub (download and save)

---

## ✅ CHECKLIST FOR BUILD AGENT

Download/Acquire:
- [ ] 54 remaining phoneme audio files
- [ ] Whitney's Roots, Verb-forms and Primary Derivatives
- [ ] Remaining CSV files from GitHub
- [ ] Text corpora (Gītā, Hitopadeśa, Pañcatantra)

Setup:
- [ ] Google Cloud project + TTS credentials
- [ ] Chutes.ai API key
- [ ] Supabase project + database schema

Build:
- [ ] Initialize Next.js project
- [ ] Create JSON data structures (phonemes, dhatus, etc.)
- [ ] Build Chapters 0-5
- [ ] Implement FSRS drill system
- [ ] Create TTS API route
- [ ] Configure PWA manifest
- [ ] Deploy to Vercel

---

**Last Updated:** 2026-02-27
**Scout Agent:** Audio sources located, base data downloaded, documentation prepared
**Next Agent:** Build system
