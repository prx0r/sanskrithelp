# Sanskrit Learning Web App — Full Build Instructions

## What You're Building

A Progressive Web App (PWA) that teaches Sanskrit through Pāṇini's own logical system — not rote memorisation of an alphabet, but a journey through the formal grammar engine he invented ~400 BCE. The app treats Sanskrit as a computable system: roots + operators + phonological laws = infinite valid Sanskrit.

The pedagogical sequence is non-negotiable: phonological physics first, then vowel gradation (guṇa/vṛddhi), then sandhi laws, then roots (dhātus), then suffixes as operators, then case semantics (kārakas), then verbal conjugation, then compounding, then reading. Every concept is introduced with its *reason* before its form.

---

## Tech Stack

**Frontend**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- Use `output: 'export'` in `next.config.ts` for static PWA export
- Deploy to Vercel (free tier sufficient for v1)
- Mobile-first, thumb-reachable UI throughout — this is primarily a phone app

**Database**: Supabase (Postgres)
- Free tier sufficient for v1
- Tables: `users`, `card_states`, `session_history`, `rule_graph`
- Start with `localStorage` for card state, migrate to Supabase when adding auth

**Spaced Repetition**: `ts-fsrs` npm package
- FSRS algorithm (current best-in-class, used by modern Anki)
- Track per-card: `stability`, `difficulty`, `due_date`, `reps`, `lapses`
- Track per drill-mode separately (recognition / listen / draw)

**AI Layer**: Chutes.ai API via Next.js API routes
- Model: any strong instruct model available on Chutes (deepseek-r1, llama-3.3-70b, etc.)
- Use for: contextual explanations, derivation chain queries, sandhi rule explainers
- Always server-side (Next.js API route) — never expose API keys to client

**TTS**: See full TTS section below

**PWA**: `next-pwa` library
- `manifest.json` with app icons
- Service worker for offline support of pre-cached audio

---

## TTS Strategy & Audio — Read This Carefully

Sanskrit audio quality is the make-or-break factor for phonetics learning. Here is the full decision tree, in order of quality:

### Option A — Pre-recorded MP3s (BEST QUALITY, Recommended for Phoneme Module)

The 49 Sanskrit phonemes don't change. Recording them once and bundling them is dramatically better than any TTS for two reasons: (1) TTS models still struggle with retroflex consonants (ṭ, ḍ, ṇ, ṭha, ḍha), and (2) offline support is trivial when audio is bundled.

**Recommended source — Samskrita Bharati audio resources:**
- Website: https://www.samskritabharati.in
- They have freely available pronunciation guides
- Contact them directly for educational use permission

**Alternative sources for phoneme MP3s:**
- https://www.learnsanskrit.org — has individual phoneme audio per letter
- https://sanskritdocuments.org/learning_tools/index.html
- YouTube channel "Sanskrit with Suresh" — individual phoneme videos you can extract audio from with `yt-dlp`

**What the user/developer needs to do:**
1. Go to https://www.learnsanskrit.org/sounds/ — every phoneme has a playable audio clip
2. Use browser dev tools (Network tab, filter by `.mp3` or `.wav`) to identify the audio file URLs
3. Download each file and rename to a consistent scheme: `phoneme_ka.mp3`, `phoneme_kha.mp3`, etc.
4. Place them in `/public/audio/phonemes/`
5. Alternatively, use `yt-dlp` to extract from YouTube pronunciation videos:
   ```bash
   pip install yt-dlp
   yt-dlp -x --audio-format mp3 "https://youtube.com/watch?v=VIDEOID" -o "phoneme_%(title)s.%(ext)s"
   ```
6. For a clean complete set: the "Sanskrit Pronunciation" playlist by Acharya Vāgīśa on YouTube covers all 49 phonemes with native speaker quality

**Store all phoneme audio in**: `/public/audio/phonemes/[phoneme_iast].mp3`
Example filenames: `a.mp3`, `aa.mp3`, `i.mp3`, `ii.mp3`, `ka.mp3`, `kha.mp3`, `ga.mp3`, `gha.mp3`, `nga.mp3` etc.

---

### Option B — Google Cloud TTS (Good for Dynamic Content)

Use this for anything that isn't the 49 core phonemes: sandhi examples, dhātu derivation trees, full sentences, text-to-speech for arbitrary Sanskrit input.

**Setup:**
1. Create a Google Cloud project at https://console.cloud.google.com
2. Enable the Cloud Text-to-Speech API
3. Create a service account → download JSON credentials
4. Set env var: `GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json`
5. Install: `npm install @google-cloud/text-to-speech`

**Free tier**: 4 million characters/month — more than sufficient for a learning app

**The correct voice configuration for Sanskrit:**
```typescript
// In your Next.js API route: /app/api/tts/route.ts
import textToSpeech from '@google-cloud/text-to-speech';

const client = new textToSpeech.TextToSpeechClient();

export async function POST(req: Request) {
  const { text, isDevanagari } = await req.json();
  
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'hi-IN',  // Hindi voice, closest to Sanskrit
      name: 'hi-IN-Chirp3-HD-Aoife',  // Highest quality Chirp3 voice
      // Alternative: 'hi-IN-Standard-A' for lower latency
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.85,  // Slightly slower for learning
      pitch: 0,
    },
  });
  
  return new Response(response.audioContent, {
    headers: { 'Content-Type': 'audio/mpeg' }
  });
}
```

**Important**: Google TTS with `hi-IN` voice handles Devanāgarī input directly. Feed it Devanāgarī script for best results, not IAST transliteration.

**Cache all TTS responses**: Sanskrit phonological forms are deterministic. Once generated, cache in `/public/audio/generated/[hash].mp3` so you never hit the API twice for the same string.

---

### Option C — ai4bharat/indic-parler-tts (Best Neural Quality, Self-Hosted)

This model scored 99.79 MOS (Mean Opinion Score) on Sanskrit — genuinely impressive.

**Hugging Face**: https://huggingface.co/ai4bharat/indic-parler-tts

**The catch**: Requires self-hosting. Not practical for v1 unless the developer has a GPU server.

**For v2 consideration**: Deploy on Hugging Face Spaces (free GPU tier available) or RunPod (~$0.20/hr for an A10G).

```python
# Example inference code (Python, for self-hosted setup)
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf

model = ParlerTTSForConditionalGeneration.from_pretrained("ai4bharat/indic-parler-tts")
tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")

prompt = "कः त्वम्"  # "Who are you?" in Sanskrit
description = "A male speaker delivers Sanskrit text in a clear, measured pace with authentic pronunciation."

input_ids = tokenizer(description, return_tensors="pt").input_ids
prompt_ids = tokenizer(prompt, return_tensors="pt").input_ids
generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_ids)
```

**Recommendation**: Use Option A (pre-recorded) for the 49 phonemes, Option B (Google Cloud) for everything else. Upgrade to Option C for v2 if audio quality is a user complaint.

---

### Option D — ElevenLabs

**Do NOT use ElevenLabs for Sanskrit.** They support 32 languages and Sanskrit is not among them. Any Sanskrit text fed to ElevenLabs will be mispronounced, particularly retroflexes.

---

## Project Structure

```
/
├── app/
│   ├── api/
│   │   ├── tts/route.ts              # Google Cloud TTS endpoint
│   │   ├── feedback/route.ts         # Chutes.ai explanation endpoint
│   │   └── derivation/route.ts       # Dhātu tree query endpoint
│   ├── learn/
│   │   ├── phonetics/page.tsx        # Chapter 2: The Phoneme Grid
│   │   ├── compression/page.tsx      # Chapter 1: Pratyāhāras
│   │   ├── gradation/page.tsx        # Chapter 3: Guṇa/Vṛddhi
│   │   ├── sandhi/page.tsx           # Chapter 4: Euphonic Laws
│   │   ├── roots/page.tsx            # Chapter 5: Dhātu System
│   │   ├── suffixes/page.tsx         # Chapter 6: Operators
│   │   ├── karakas/page.tsx          # Chapter 7: Semantic Roles
│   │   ├── verbs/page.tsx            # Chapter 8: Conjugation
│   │   ├── compounds/page.tsx        # Chapter 9: Samāsa
│   │   └── reading/page.tsx          # Chapter 10: Reverse Engineering
│   ├── drill/
│   │   └── page.tsx                  # FSRS drill session
│   ├── layout.tsx
│   └── page.tsx                      # Chapter 0: The Question
├── components/
│   ├── PhonemeGrid.tsx               # Interactive 5×5 phonetic grid
│   ├── AudioPlayer.tsx               # Plays phoneme/TTS audio
│   ├── DerivationTree.tsx            # Visual dhātu derivation tree
│   ├── SandhiDrill.tsx               # Two-word → combined form drill
│   ├── GunaDrill.tsx                 # Vowel grade scale UI
│   ├── DrillCard.tsx                 # FSRS flashcard component
│   ├── RuleContext.tsx               # Shows parent/child rules (anuvṛtti)
│   └── ParseSentence.tsx             # Tap-to-parse reading UI
├── lib/
│   ├── fsrs.ts                       # ts-fsrs wrapper
│   ├── sandhi.ts                     # Sandhi rule engine
│   ├── derivation.ts                 # Dhātu tree traversal
│   └── audio.ts                      # Audio loading + caching
├── data/
│   ├── phonemes.json                 # 49 phonemes with grid positions
│   ├── pratyaharas.json              # Shiva Sutra groupings
│   ├── sandhi-rules.json             # All sandhi rules as structured data
│   ├── dhatus.json                   # 800 roots with gaṇa, meaning, IE cognates
│   ├── suffixes.json                 # kṛt + taddhita suffixes with semantics
│   ├── karakas.json                  # 6 kāraka definitions
│   └── texts/                        # Authentic text sentences for Chapter 10
│       ├── gita-selections.json
│       ├── panchatantra.json
│       └── hitopadesha.json
└── public/
    └── audio/
        ├── phonemes/                 # Pre-recorded MP3s (see TTS section)
        │   ├── a.mp3
        │   ├── aa.mp3
        │   └── ... (49 files total)
        └── generated/               # Cached Google TTS outputs
```

---

## Core Data Structures

### Phoneme Node
```typescript
type Phoneme = {
  id: string
  devanagari: string
  iast: string
  audioFile: string              // '/audio/phonemes/ka.mp3'
  
  // Grid position
  place: 'velar' | 'palatal' | 'retroflex' | 'dental' | 'labial' | 'other'
  manner: 'unvoiced_stop' | 'unvoiced_aspirate' | 'voiced_stop' | 'voiced_aspirate' | 'nasal' | 'semivowel' | 'sibilant' | 'vowel' | 'other'
  
  // Vowel-specific
  vowelGrade?: 'zero' | 'guna' | 'vrddhi'
  gunaPair?: string              // id of guṇa equivalent
  vrddhiPair?: string            // id of vṛddhi equivalent
  
  // Phonological behaviour
  participatesInSandhi: string[] // sandhi rule IDs
  pratyaharas: string[]          // pratyāhāra IDs this phoneme belongs to
}
```

### Linguistic Node (unified graph node)
```typescript
type LinguisticNode = {
  id: string
  type: 'phoneme' | 'dhatu' | 'pratyaya' | 'pada' | 'samasa' | 'sentence'
  devanagari: string
  iast: string
  meaning: string
  
  // Relationships
  derivedFrom: string[]          // parent node IDs
  derivesTo: string[]            // child node IDs  
  
  // For dhātus
  gana?: 1|2|3|4|5|6|7|8|9|10
  voice?: 'parasmaipada' | 'atmanepada' | 'ubhayapada'
  ieCognates?: string[]          // English/Latin/Greek cognates
  
  // For suffixes  
  suffixType?: 'krt' | 'taddhita' | 'vibhakti' | 'tin'
  semanticRole?: string          // what relationship this suffix encodes
  
  // For sandhi
  sandhiRules?: string[]         // rule IDs triggered by this node
  
  // FSRS state (per user, stored in Supabase)
  fsrs?: FSRSState
}
```

### Sandhi Rule
```typescript
type SandhiRule = {
  id: string
  name: string                   // e.g., "Grassmann's Law"
  paniniReference?: string       // e.g., "8.4.54"
  category: 'vowel' | 'visarga' | 'consonant' | 'aspiration'
  
  // The rule as a function signature (for display)
  signature: string              // e.g., "bh + t → b + dh (Bartholomae)"
  
  // Plain English explanation
  mechanism: string              // the phonological *force* operating
  
  // Examples
  examples: Array<{
    input: [string, string]      // two forms before sandhi
    output: string               // result
    annotation: string           // why
  }>
  
  // Graph
  dependsOn: string[]            // rule IDs that must apply first
  enables: string[]              // rule IDs that apply after this one
}
```

### FSRS Card State
```typescript
type FSRSState = {
  cardId: string
  userId: string
  mode: 'recognition' | 'listen' | 'draw' | 'production' | 'parse'
  
  stability: number
  difficulty: number
  dueDate: Date
  lastReview: Date
  reps: number
  lapses: number
}
```

---

## Curriculum Architecture — The 10 Chapters

Build in this exact order. Do not skip chapters. Each chapter's data unlocks the next.

### Chapter 0 — The Question (Landing/Onboarding)
- Single page, no drilling yet
- Present the core philosophical question: "How do sounds become meaning?"
- Show a Devanāgarī word, play audio, reveal meaning, then ask: "What just happened?"
- Sets the frame for everything that follows
- CTA: "Begin the journey"

### Chapter 1 — The Compressor's Problem (Pratyāhāras)
- Introduce Pāṇini as an engineer solving a compression problem
- Interactive: given 5 sounds, find the pratyāhāra that names them
- Teach the Shiva Sutras as a data structure, not a mantra
- Drill: pratyāhāra → list of sounds it contains
- Milestone: learner understands why the Shiva Sutras are ordered as they are

### Chapter 2 — The Phoneme as Atom (Phoneme Grid)
- Build the 5×5 consonant grid interactively (place × manner)
- Add vowels separately with their short/long pairs
- Retroflexes get special attention: ṭ ṭh ḍ ḍh ṇ — these are the ones TTS butchers
- Every phoneme cell: click to hear audio, see articulation diagram, see grid coordinates
- Drill modes:
  - Recognition: see Devanāgarī → rate familiarity (FSRS Mode 1)
  - Listen: hear phoneme → identify from grid (FSRS Mode 2)
  - Draw: IAST label → draw Devanāgarī on canvas (FSRS Mode 3)
- Each phoneme card shows: "This phoneme belongs to pratyāhāras: [list]"

### Chapter 3 — Vowel Grades (Guṇa/Vṛddhi)
- The three-level energy scale: zero → guṇa → vṛddhi
- Interactive scale UI: slide vowel up/down between grades
- Show the operation as addition of 'a': i + a → e, i + ā → ai
- Indo-European hook: "sing/sang/sung is the same system — Sanskrit made it explicit"
- Drill: given zero-grade vowel → produce guṇa; given guṇa → produce vṛddhi
- Show how this appears in real words immediately: √bhū → bho (guṇa) → bhau (vṛddhi)
- Connect to Aṣṭādhyāyī rules 1.1.1 and 1.1.2 — "These are Pāṇini's first two rules. He defined these before anything else."

### Chapter 4 — Euphonic Laws (Sandhi)
Teach in this sub-order:

**4.1 Vowel Sandhi**
- Identical vowels: a+a → ā (transparent, just combination)
- Different vowels + guṇa/vṛddhi mechanism: a+i → e (this IS guṇa)
- Semivowel substitution: i before vowel → y (palatal short-circuit)

**4.2 Visarga Sandhi**
- Visarga (ḥ) is the chameleon — context-dependent transformation
- Before voiceless stops: stays as ḥ
- Before voiced: becomes o (with -aḥ stems) or drops
- Before vowels: drops
- Chart the behaviour from the phoneme grid — each outcome is phonetically motivated

**4.3 Consonant Sandhi (Assimilation)**
- Voiced before voiced → both voiced
- Voiceless before voiceless → both voiceless
- Final consonant before nasal → takes nasal of its own column

**4.4 Aspiration Laws** — treat these as named forces
- **Grassmann's Law**: "A word cannot carry two aspirates — the first drops"
  - Named for Hermann Grassmann (1863), but described by Pāṇini
  - Mnemonic: "Aspiration conservation — the budget is one per word"
  - Interactive: show a root with initial aspirate + aspirated suffix → watch the root's aspiration drop
- **Bartholomae's Law**: "Voiced aspirate before voiceless → the aspiration jumps forward"
  - "The Buddha Rule" (√bhudh + ta → buddha)
  - Mnemonic: "Aspiration is contagious — it infects what follows"
  - Interactive: trace the transformation step by step

Drill mode for all sandhi: show two forms → learner produces the combined form → learner names the rule that fired.

### Chapter 5 — The Root (Dhātu System)
- Introduce the dhātu as semantic atom
- Start with 10 high-frequency roots: √bhū, √kṛ, √gam, √vac, √dṛś, √śru, √jñā, √sthā, √nī, √labh
- For each root, show the full derivation tree immediately — don't wait
- The 10 gaṇas as stem-formation algorithms, not arbitrary classes
- IE cognates for each root (memory hooks):
  - √jñā → "know" (Proto-IE *ǵneh₃)
  - √sthā → "stand/station/status" (Latin stare)
  - √dṛś → "drastic" (via Indo-European)
  - √gam → "come" (Latin venire, but cognate structure: cf. Greek bainō)
- Drill: root → identify derived words in family; word → identify root

### Chapter 6 — Suffixes as Operators (kṛt suffixes first)
Primary derivatives (kṛt, added directly to root):
```
-tṛ    → agent noun   (kartṛ: "doer")
-ta    → past passive participle (kṛta: "done")  
-ana   → instrument/means noun (karaṇa: "cause, means")
-ya    → gerundive (kārya: "what must be done")
-tvā   → absolutive (kṛtvā: "having done")
-ti    → action noun (gati: "going, motion")
-man   → abstract noun (karman: "action" → karma)
```

Secondary derivatives (taddhita, from stems not roots):
```
-ika   → "relating to" (kārmika: "relating to karma")
-in    → "characterised by" (karmin: "one who acts")
-tva   → abstract quality (satitva: "truth-ness")
```

Show the two-tier tree structure visually: root → primary → secondary

### Chapter 7 — The Kāraka System (Semantic Roles)
- Introduce kārakas as semantic *slots* in an action before teaching any case endings
- The 6 kārakas with Sanskrit names, semantic meaning, and corresponding case:
  - kartṛ (agent) → nominative
  - karman (object) → accusative  
  - karaṇa (instrument/means) → instrumental
  - sampradāna (recipient/benefit) → dative
  - apādāna (source/separation) → ablative
  - adhikaraṇa (location) → locative
  (genitive encodes possessive relationship, not a kāraka per se)
- Interactive: show a sentence, learner identifies what each participant IS before seeing the case ending
- Then show the ending and trace the stem+ending sandhi

Stem classes in order: a-stems first (rāma, most common), then ā-stems, then i-stems, then consonant stems.

### Chapter 8 — Verbal Conjugation
Build conjugation as a pipeline the learner runs step by step:
1. Identify gaṇa class → determines stem formation algorithm
2. Apply guṇa/vṛddhi to root vowel (Chapter 3 paying off)
3. Add class affix (thematic `a`, nasal infix, etc.)
4. Add tiṅ ending (person × number × voice × mood)
5. Apply sandhi at every junction (Chapter 4 paying off)

The three voices (parasmaipada / ātmanepada / passive) as semantic first, morphological second.

Tense order: present → imperfect → future → perfect → aorist
Mood order: indicative → optative → imperative → conditional

### Chapter 9 — Compounds (Samāsa)
Four types as semantic relationships:
- Dvandva: A and B → both referents
- Tatpuruṣa: A of/for/by B → B specifies A
- Bahuvrīhi: "having A-B" → exocentric, modifies something external
- Avyayībhāva: first member is indeclinable → whole is adverbial

Compound sandhi: same rules as regular sandhi, but final consonant of first member is treated as stem-final before vowel of second member.

Drill: decompose compound → identify type → derive meaning

### Chapter 10 — Reading (Reverse Engineering)
- Take real sentences from Bhagavad Gītā, Hitopadeśa, Pañcatantra
- Learner reads first without help
- Tap any word → full parse tree appears (derivation chain, case, sandhi splits)
- AI layer available on demand: "explain why this word looks this way"
- Goal: learner taps to verify, not to be told

---

## AI Integration (Chutes.ai)

### API Route Pattern
```typescript
// app/api/feedback/route.ts
export async function POST(req: Request) {
  const { 
    cardId, 
    cardType,       // 'phoneme' | 'sandhi' | 'dhatu' | 'suffix' | 'parse'
    userAnswer, 
    correctAnswer,
    context         // full node data including derivation chain
  } = await req.json();

  const systemPrompt = `You are a Sanskrit grammar teacher following Pāṇini's system. 
  Your explanations always:
  1. Name the phonological law or rule operating (e.g., "Grassmann's Law", "guṇa strengthening")
  2. Trace the derivation step by step
  3. Connect to something the learner has already seen (anuvṛtti — carry forward)
  4. End with one forward pointer: "This same principle will appear when you encounter [X]"
  Keep responses under 120 words.`;

  const userPrompt = buildPromptFromContext(cardType, userAnswer, correctAnswer, context);
  
  const response = await fetch('https://api.chutes.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CHUTES_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-ai/DeepSeek-R1',  // or current best available on Chutes
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.3
    })
  });

  const data = await response.json();
  return Response.json({ explanation: data.choices[0].message.content });
}
```

### Derivation Query Endpoint
```typescript
// app/api/derivation/route.ts
// Takes any Sanskrit word and returns full parse tree
// Prompt instructs model to output JSON: { root, suffixes[], sandhi_applied[], meaning }
```

---

## FSRS Implementation

```typescript
// lib/fsrs.ts
import { FSRS, createEmptyCard, Rating } from 'ts-fsrs';

const fsrs = new FSRS();

export function scheduleCard(cardState: FSRSState, rating: 1|2|3|4): FSRSState {
  const card = stateToFSRSCard(cardState);
  const scheduling = fsrs.repeat(card, new Date());
  const result = scheduling[rating].card;
  return fsrsCardToState(result);
}

// Rating mapping (show on UI as large thumb-reachable buttons):
// 1 = Again (red)    — didn't know it
// 2 = Hard (orange)  — knew it with effort  
// 3 = Good (green)   — knew it comfortably
// 4 = Easy (blue)    — trivially easy
```

---

## PWA Configuration

```typescript
// next.config.ts
import withPWA from 'next-pwa';

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /\/audio\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'audio-cache',
        expiration: { maxEntries: 500 }
      }
    }
  ]
})({
  output: 'export',
  // other Next.js config
});

export default config;
```

```json
// public/manifest.json
{
  "name": "Pāṇini — Sanskrit Grammar Engine",
  "short_name": "Pāṇini",
  "description": "Learn Sanskrit through Pāṇini's own formal system",
  "start_url": "/",
  "display": "fullscreen",
  "orientation": "portrait",
  "theme_color": "#1a1a2e",
  "background_color": "#1a1a2e",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Steps the Developer/User Must Take Manually

The following cannot be automated and require manual action before the app works properly:

### Step 1 — Download Phoneme Audio Files (Critical, Do This First)
The 49 phoneme MP3s are the foundation of the entire phonetics module. Without them the app falls back to Google TTS which is noticeably worse for retroflexes.

**Action**:
1. Visit https://www.learnsanskrit.org/sounds/
2. Open browser Developer Tools → Network tab → filter by "media" or "mp3"
3. Play each phoneme audio on the page
4. Save the MP3 URLs and download each file
5. Rename and place in `/public/audio/phonemes/` following this naming scheme:

```
Vowels:
a.mp3, aa.mp3, i.mp3, ii.mp3, u.mp3, uu.mp3, 
r-vocalic.mp3, rr-vocalic.mp3, l-vocalic.mp3,
e.mp3, ai.mp3, o.mp3, au.mp3, am.mp3, ah.mp3

Velars:    ka.mp3, kha.mp3, ga.mp3, gha.mp3, nga.mp3
Palatals:  ca.mp3, cha.mp3, ja.mp3, jha.mp3, nya.mp3
Retroflexes: ta-retro.mp3, tha-retro.mp3, da-retro.mp3, dha-retro.mp3, na-retro.mp3
Dentals:   ta.mp3, tha.mp3, da.mp3, dha.mp3, na.mp3
Labials:   pa.mp3, pha.mp3, ba.mp3, bha.mp3, ma.mp3
Semivowels: ya.mp3, ra.mp3, la.mp3, va.mp3
Sibilants: sha-palatal.mp3, sha-retro.mp3, sa.mp3
Other:     ha.mp3, anusvara.mp3, visarga.mp3
```

Alternative source: https://www.omniglot.com/writing/sanskrit.htm has embedded audio for every character.

### Step 2 — Google Cloud TTS Credentials
1. Go to https://console.cloud.google.com
2. Create new project → Enable "Cloud Text-to-Speech API"
3. Go to IAM & Admin → Service Accounts → Create Service Account
4. Download JSON key file
5. In project root create `.env.local`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./google-tts-credentials.json
   GOOGLE_CLOUD_PROJECT=your-project-id
   ```
6. Place the downloaded JSON file as `google-tts-credentials.json` in project root
7. Add to `.gitignore`: `google-tts-credentials.json`, `.env.local`

### Step 3 — Chutes.ai API Key
1. Sign up at https://chutes.ai
2. Create API key in dashboard
3. Add to `.env.local`:
   ```
   CHUTES_API_KEY=your-key-here
   ```

### Step 4 — Sanskrit RAG (Optional — Grammar Q&A)
1. Clone Pāṇini data: `git clone https://github.com/ashtadhyayi-com/data ./panini_data`
2. Install Python deps: `pip install -r rag/requirements.txt`
3. Build index: `CHUTES_API_KEY=your-key python rag/build_sanskrit_rag.py --build` (~10 min)
4. Run Chroma server: `chroma run --path ./sanskrit_db` (or use default data dir)
5. Set `CHROMA_URL=http://localhost:8000` in `.env.local` if Chroma runs elsewhere
6. Query: `POST /api/rag-ask` with `{ "question": "what is guṇa?" }`

### Step 5 — Supabase Setup
1. Create project at https://supabase.com
2. Run the schema SQL (create users, card_states, session_history tables)
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Step 6 — Vercel Deployment
1. `npm install -g vercel`
2. `vercel` in project root — follow prompts
3. Add all env vars in Vercel dashboard (Settings → Environment Variables)
4. **Important**: the Google credentials JSON — either paste its contents as a single env var `GOOGLE_TTS_CREDENTIALS_JSON` and parse it in code, or use Vercel's file-based env approach

### Step 7 — iOS "Add to Home Screen" Instructions for Users
Since this is a PWA (not an App Store app), iOS users must manually add it:
1. Open Safari on iPhone (must be Safari, not Chrome)
2. Navigate to your Vercel URL
3. Tap the Share button (square with arrow pointing up)
4. Scroll down → tap "Add to Home Screen"
5. Tap "Add"

The app will now appear on the home screen with the icon from `manifest.json`, open fullscreen, and behave like a native app. Service worker caches audio for offline use.

---

## The Rule Graph (Anuvṛtti) Data Model

Every rule or concept in the app has neighbours. The UI always shows:
- What this concept **depends on** (what you need to know first)
- What this concept **enables** (what becomes accessible once you know this)

This is implemented as a directed graph in the `rule_graph` table in Supabase:

```sql
CREATE TABLE rule_graph (
  id TEXT PRIMARY KEY,          -- e.g., 'grassmanns-law'
  name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  depends_on TEXT[],            -- array of rule IDs
  enables TEXT[],               -- array of rule IDs
  panini_reference TEXT,        -- e.g., '8.4.54'
  category TEXT NOT NULL
);
```

When the learner masters a node (FSRS stability > 7 days), the app visually unlocks its children in the graph. This makes the learning path feel like discovery, not syllabus.

---

## Design Principles

**Never show a rule without its context.** Every drill card shows: what rule is firing, what prior concept it depends on, what it enables next.

**Physics before rules.** Sandhi is introduced as phonological forces (lazy mouth, aspiration conservation, aspiration infection), not as a lookup table.

**Operations before forms.** Guṇa/vṛddhi is an operation (add 'a') before it's a paradigm. Conjugation is a pipeline before it's a table.

**Reverse engineering as the deepest learning.** Chapter 10 is the payoff: learner runs Pāṇini's machine backward.

**Indo-European connections as memory hooks.** Every major root and rule has an English/Latin/Greek cognate or parallel. These land hard and create durable memories.

**The AI explains forces, not just answers.** When the learner gets something wrong, the AI names the phonological law, traces the derivation, and ends with a forward pointer to where this will appear again.

---

## Key Reference Resources

**Pāṇini's system:**
- https://www.learnsanskrit.org — best modern Pāṇinian curriculum online
- Ruppel, *Cambridge Introduction to Sanskrit* — pedagogical approach, use throughout
- Whitney, *Sanskrit Grammar* (1889) — in public domain at https://en.wikisource.org/wiki/Sanskrit_Grammar_(Whitney)

**Audio:**
- https://www.learnsanskrit.org/sounds/ — phoneme audio
- https://sanskritdocuments.org — massive resource repository
- Samskrita Bharati YouTube channel — native speaker audio

**Text corpus for Chapter 10:**
- Bhagavad Gītā (freely available, start with Chapter 2 ślokas)
- Hitopadeśa (simpler prose, good for beginners)
- Pañcatantra stories (narrative prose, intermediate)

**Dhātu reference:**
- Monier-Williams Sanskrit Dictionary: https://www.sanskrit-lexicon.uni-koeln.de
- Whitney's *The Roots, Verb-forms and Primary Derivatives of the Sanskrit Language* (1885) — public domain, full dhātu list with gaṇas

---

## v1 Scope — Build This, Nothing Else

- [ ] Chapter 0 landing page
- [ ] Chapter 1 pratyāhāra interactive
- [ ] Chapter 2 phoneme grid with pre-recorded audio
- [ ] Chapter 3 guṇa/vṛddhi scale drill
- [ ] Chapter 4 vowel sandhi + Grassmann + Bartholomae drills
- [ ] Chapter 5 first 10 dhātus with derivation trees
- [ ] FSRS drill loop (Modes 1-2 only: recognition + listen)
- [ ] Google TTS API route for dynamic content
- [ ] Chutes.ai feedback endpoint
- [ ] PWA manifest + service worker
- [ ] Vercel deploy

**Not in v1:**
- Canvas drawing (Mode 3) — add in v2
- Chapters 6-10 — scaffold the routing but leave pages as "coming soon"
- Voice recognition / pronunciation scoring
- User accounts (use localStorage)
- Native app wrapper (Capacitor/Expo)
- Full 800 dhātu database (start with 10, expand to 50 in v1.1)
