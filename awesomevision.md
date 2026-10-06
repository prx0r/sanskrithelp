> **CANONICAL — locked 2026-10-06.** This document is the architecture constitution
> for `sanskrithelp` Hindi/Sanskrit work. Body preserved word-for-word below.
> Amendments go in dated addenda, never silent edits. Status: ACTIVE.

Yes — you mean **Anthony Metivier**, creator of the Magnetic Memory Method. I went fairly deep into his language-learning material, including a very recent September 2026 piece specifically about someone learning the **Hindi/Devanāgarī alphabet with his method**, then compared it with Tim Doner, Gabriel Wyner/Fluent Forever, formulaic-language research, the keyword method literature, and current Hindi NLP.

The conclusion is stronger than what we built yesterday:

> **The wheel should not be the memory palace.**
>
> **Audio is the reality.  
> Wheels are the grammar/decompiler.  
> Mātṛkā is the phonological coordinate system.  
> Memory palaces are sparse persistent indexes.  
> Retrieval scheduling turns the whole thing into memory.**

That gives us something much more sophisticated than Anki or a normal language app.

[Anthony Metivier — The Memory Palace for Language Learning](https://www.youtube.com/watch?v=3taeoaGe1es\&utm_source=chatgpt.com)

[Anthony Metivier — The Memory Palace for Language Learning](https://www.youtube.com/watch?v=3taeoaGe1es\&utm_source=chatgpt.com)

[youtube.com](https://www.youtube.com/watch?v=3taeoaGe1es\&utm_source=chatgpt.com)

&#x20;([image](https://img.youtube.com/vi/3taeoaGe1es/maxresdefault.jpg?utm_source=chatgpt.com))

[Anthony Metivier — How to Memorize the Vocabulary of Any Language](https://www.youtube.com/watch?v=G1VNjzx31BI\&utm_source=chatgpt.com)

[Anthony Metivier — How to Memorize the Vocabulary of Any Language](https://www.youtube.com/watch?v=G1VNjzx31BI\&utm_source=chatgpt.com)

[youtube.com](https://www.youtube.com/watch?v=G1VNjzx31BI\&utm_source=chatgpt.com)

&#x20;([image](https://img.youtube.com/vi/G1VNjzx31BI/maxresdefault.jpg?utm_source=chatgpt.com))

[Tim Doner — Breaking the Language Barrier](https://www.youtube.com/watch?v=xNmf-G81Irs\&utm_source=chatgpt.com)

[Tim Doner — Breaking the Language Barrier](https://www.youtube.com/watch?v=xNmf-G81Irs\&utm_source=chatgpt.com)

[youtube.com](https://www.youtube.com/watch?v=xNmf-G81Irs\&utm_source=chatgpt.com)

&#x20;([image](https://img.youtube.com/vi/xNmf-G81Irs/maxresdefault.jpg?utm_source=chatgpt.com))

## What Metivier is actually doing

A lot of the online summaries reduce his system to "put funny pictures in your house." That's missing most of it.

His mature language-learning system is closer to a **memory architecture**. He recommends multiple familiar Memory Palaces rather than trying to jam everything into one; natural physical routes rather than complicated imagined navigation; highly specific people/actions for mnemonic imagery rather than vague generic images; direct encoding of the foreign **sound + meaning + use** rather than constantly translating through English; active recall; spaced "Recall Rehearsal"; and eventually moving from isolated words into useful phrases. [Magnetic Memory Method](https://www.magneticmemorymethod.com/memory-palace-language-learning/)

This maps almost absurdly well onto what we've been constructing.

| Metivier principle | What it means for `sanskrithelp` |
|---|---|
| Predetermine what you're learning | Parse the audio first; know the sounds, words, chunks and grammatical operators before encoding |
| Multiple palaces | Separate **Guru / Sādhana / Kumbh / food / transport / accommodation / philosophy** worlds |
| About ~10 initial items per palace while learning the technique | Keep loci sparse; don't turn one room into a database |
| Specific mnemonic imagery | Only difficult lexical items get memorable actors/actions |
| Multisensory encoding | Audio + articulation + mouth sensation + image + movement + location |
| Encode target sound + meaning directly | Hindi audio is primary; English becomes optional scaffolding |
| Add phrases after words become stable | Store chunks like `फिर से कहिए`, not thousands of disconnected words |
| Recall in multiple orders | Forward, backward, random station, cloze, audio-first |
| Big Five | Memory + listening + speaking + reading + writing |
| Avoid "ghosting"/interference | Don't repeatedly overwrite the same loci with similar material |
| Contextual material | Mine things **you actually want to say in India** |
| Songs/chants | Rhythmically install phrases, especially Sanskrit-derived material |

Metivier explicitly describes Recall Rehearsal as traversing material in different ways—forward, backward, partial journeys and skipped stations—rather than endlessly performing the same forward traversal. [Magnetic Memory Method](https://www.magneticmemorymethod.com/memory-improvement-tips/)

That's a very important improvement for our UI. **Random access should be trained deliberately.**

### His new Hindi example is especially relevant

This appeared only on September 27, 2026. A learner named Rose describes using his system to memorize Devanāgarī. Her reported speed—48 characters in around 1h40—is anecdotal rather than a controlled result, so I wouldn't take the number seriously as a benchmark.

But her *design observations* are extremely useful.

She first worked out the exact inventory before constructing the palace. She found that putting eight substations into rooms increased mental overhead; standardizing station counts made navigation easier. She also developed stable rules for features such as nukta dots rather than inventing a new image every time. [Magnetic Memory Method](https://www.magneticmemorymethod.com/hindi/)

That is basically our **Mātṛkā matrix insight**:

**do not memorize 50 unrelated symbols.**

Learn:

**place × manner × aspiration × voicing × form**

and let the system generate the individual coordinates.

For Hindi we then attach:

**classical Mātṛkā substrate + modern Hindi deviations/extensions.**

So `ड़` shouldn't become another arbitrary thing to memorize. It is:

**retroflex family → flap → ड़ → /ɽ/ → लड़का / बड़ा**

And unlike the canonical Sanskrit phoneme, it receives **no invented Trika body locus**.

Exactly what we built.

---

# The even bigger unlock: AUDIO → WHEELS

This is where I think your idea becomes genuinely exceptional.

Imagine we feed it:

**क्या मैं आपके साथ अभ्यास कर सकता हूँ?**

Instead of showing a translation, the machine hears it and decomposes it:

```text
क्या | मैं | आपके साथ | अभ्यास | कर | सकता | हूँ
 ↓      ↓        ↓          ↓       ↓      ↓      ↓
Q     ACTOR   RELATION    OBJECT   ROOT  MODAL  AUX
                                     │      │      │
                                    do     can   1SG
                                           │
                                       MASC.SG
```

So internally:

```text
SPEECH ACT   yes/no question
ACTOR        मैं
RELATION     आपके साथ
OBJECT       अभ्यास
VERB         कर-
MODALITY     सकता
GENDER       masculine
NUMBER       singular
PERSON       first
AUX          हूँ
```

And then the wheels physically snap into those positions.

Now you've **heard Hindi and watched it compile**.

Then we reverse it.

The screen removes the sentence and leaves:

```text
QUESTION
× I
× WITH YOU
× PRACTICE
× DO
× CAN
```

You have to say:

**क्या मैं आपके साथ अभ्यास कर सकता हूँ?**

Then it can rotate exactly one wheel:

**आपके साथ → गुरुजी के साथ**

and you produce:

**क्या मैं गुरुजी के साथ अभ्यास कर सकता हूँ?**

Rotate object:

**अभ्यास → ध्यान**

→

**क्या मैं गुरुजी के साथ ध्यान कर सकता हूँ?**

Then actor:

**मैं → हम**

and agreement automatically mutates accordingly.

That isn't a flashcard.

It is **learning Hindi as a generative machine**.

And Bruno suddenly makes much more sense: the rotating wheels aren't being used to store sentences. They're being used to **expose the transformation space underlying sentences**.

---

# There should actually be three representations of every utterance

I think this is the architecture.

### A. Acoustic representation

The actual recording:

**[क्या मैं] [आपके साथ] [अभ्यास] [कर सकता हूँ]**

Waveform + word timestamps.

Tap a chunk and replay it.

Press-and-hold a word and slow it.

Then optionally descend further:

**सकता → स + क + त + ा**

and your existing Mātṛkā/sound machinery lights up.

So we're moving:

**utterance → chunk → word → phoneme → articulation**

That's one direction.

### B. Grammatical representation

The Bruno/Hindi wheel:

**speech act × participant × relation × object × root × aspect/modality × agreement × auxiliary**

So we're moving:

**surface Hindi → abstract grammar**

### C. Mnemonic/spatial representation

The *useful* chunk is situated somewhere memorable.

Suppose your "āśram palace" is your old house.

One station contains:

**आप किस परंपरा से हैं?**

But crucially the entire phrase doesn't need a gigantic mnemonic picture.

Once `आप`, `किस`, `से`, `हैं` are automatic, the mnemonic may only need to anchor:

**परंपरा — paramparā — tradition/lineage**

The grammar wheel reconstructs the rest.

That is much more efficient.

Metivier himself warns about overloading or repeatedly reusing the same loci because similar traces can interfere—what he discusses under the "Ugly Sister Effect"/ghosting. He ultimately says fresh, purpose-specific palaces plus retrieval rehearsal are often preferable to extremely elaborate reused palace systems. [Magnetic Memory Method](https://www.magneticmemorymethod.com/beginners-guide-to-overcoming-the-ugly-sister-effect/)

That's extremely relevant to Bruno.

**We should resist the temptation to encode everything combinatorially in memory.**

Let Bruno **compute**.

Let loci **remember**.

---

# Gabriel Wyner gives us the missing acoustic front-end

This is where Fluent Forever's approach fits almost perfectly.

Wyner's foundational ordering is:

**pronunciation first → vocabulary without translation → spaced repetition.**

His pronunciation method particularly emphasizes **minimal-pair discrimination**: train the ear using recordings of two acoustically close items until you can actually hear the distinction, then reproduce it. [Fluent Forever](https://blog.fluent-forever.com/chapter3/?utm_source=chatgpt.com)

This is exactly what our Mātṛkā wheel wants.

For Hindi we can build explicit contrastive exercises:

```text
ट ↔ त
ठ ↔ थ

ड ↔ द
ढ ↔ ध

ड़ ↔ ड

ख ↔ ख़
फ ↔ फ़
ज ↔ ज़
```

Audio plays one.

No text.

You identify the coordinate on the wheel:

**DENTAL / VOICELESS / ASPIRATED**

→ **थ**

or:

**RETROFLEX / VOICED / FLAP**

→ **ड़**

Then pronounce it.

That means your Mātṛkā work isn't something separate you're maintaining while learning Hindi.

It becomes your **phonological front-end to Hindi**.

Wyner specifically argues that auditory discrimination lets learners increasingly self-correct pronunciation through mimicry. [Fluent Forever](https://help.fluent-forever.com/hc/en-us/articles/360004467471-What-s-the-best-way-to-integrate-pronunciation-practice-using-a-Fluent-Forever-pronunciation-trainer?utm_source=chatgpt.com)

---

# Tim Doner gives us another wheel that I hadn't considered

This is good.

Doner described learning words in **batches of similar sounds**. In Indonesian, for example, he'd group unrelated words such as *kepala, kabar, kantor* because their acoustic resemblance caused one to cue the others. He also demonstrated using familiar Union Square locations as loci for Japanese verbs. [Singju Post](https://singjupost.com/breaking-the-language-barrier-by-tedxteen-2014-transcript/?utm_source=chatgpt.com)

So add a:

## PHONOLOGICAL NEIGHBOURHOOD WHEEL

Not:

```text
FOOD
banana
apple
rice
bread
```

but occasionally:

```text
SOUND SHAPE
___arna

करना
भरना
मरना
डरना
```

or another genuinely useful Hindi sound family.

Now hear one and predict its neighbours.

But there's a productive tension here:

**Doner:** exploit similarity because one item cues its neighbours.

**Wyner:** beware similarity because it can produce interference.

**Doner:** exploit similarity because one item cues its neighbours.

**Wyner:** deliberately contrast similar sounds until the ear distinguishes them.

Our system can combine all three.

The app intentionally clusters confusable forms **during discrimination training**, but stores them in distinctive contextual scenes so they don't collapse together.

That is substantially smarter than either "never group similar words" or "always group similar words."

---

# Another important research correction: learn chunks

This may be even more important than vocabulary wheels.

Second-language research increasingly treats **formulaic sequences**—recurrent multiword units—as an important part of fluent language processing and production. Reviews find substantial reasons for learners to accumulate a repertoire of useful chunks, with repetition, attention and deliberate memorization among the teaching approaches investigated. [Cambridge University Press](https://www.cambridge.org/core/journals/annual-review-of-applied-linguistics/article/abs/formulaic-language-and-language-teaching/9900AC257193D8E5FB86F0E4EDC04D4F?utm_source=chatgpt.com)

So our primary syllabus unit shouldn't ultimately be:

**परंपरा = tradition**

It should be:

**आप किस परंपरा से हैं?**

and learn that as a manipulable template:

```text
आप किस ____ से हैं?

परंपरा
शहर
देश
आश्रम
```

Then another:

```text
क्या मैं ____ सकता हूँ?

यहाँ बैठ
सुन
आ सकता
आपके साथ अभ्यास कर
```

You're memorizing **language Lego**, not dictionary entries.

Bruno is almost bizarrely appropriate for this.

---

# Therefore your Hindi syllabus should not be CEFR-shaped

I would make it **world-shaped**.

Your initial corpus can contain perhaps ~200 exceptionally useful recorded utterances divided across worlds such as:

| World | What you actually learn |
|---|---|
| COMPREHENSION | repeat, slower, what does X mean?, I understood/didn't |
| SELF | who I am, where I'm from, why I'm in India, Sanskrit/Hindi study |
| GURU | teacher, lineage, initiation, study, where/when taught |
| SĀDHANA | meditation, mantra, japa, breath, practice, frequency, instruction |
| ĀŚRAM | permission, schedule, meals, rooms, rules, joining activities |
| KUMBH | akhāṛās, camps, ghāts, snān, talks, directions |
| PEOPLE | names, family, origin, occupations, introductions |
| DAILY INDIA | food, rent, laundry, money, SIM, shopping |
| TRAVEL | train, bus, time, station, destination, ticket |
| PHILOSOPHY | consciousness, Śiva, Śakti, self, mind, knowledge, experience |

Each world gets a **small palace**, a set of **audio clips**, a few high-productivity **grammar wheels**, and a **lexical slot library**.

When you encounter something naturally in Hindi, it gets imported into whichever world it belongs to.

Your syllabus therefore literally **grows out of your life**.

That also agrees with Metivier's emphasis on goal-specific vocabulary and authentic interesting material. For his own Chinese sprint, he describes setting the bounded goal of about **300 words plus basic conversational phrases**, rather than "learn Chinese." [Magnetic Memory Method](https://www.magneticmemorymethod.com/memory-palace-language-learning/)

---

# The app can automatically decompile Hindi now

We don't even need the LLM to hallucinate all of the grammar.

Hindi already has a substantial Universal Dependencies treebank. The Hindi HDTB annotations include **lemma, POS, gender, person, number, case, aspect, tense, politeness, dependency relationships**, etc. Stanza exposes pretrained UD pipelines for tokenization, lemma, POS/morphological tagging and dependency parsing. [Universal Dependencies](https://universaldependencies.org/treebanks/hi_hdtb/index.html?utm_source=chatgpt.com)

So the computational pipeline should be:

```text
AUDIO
  ↓
speech recognition + timestamps
  ↓
देवनागरी transcript
  ↓
Hindi morphological/dependency parser
  ↓
lemma / POS / case / gender / aspect / person / dependency
  ↓
our deterministic Hindi compiler
  ↓
BRUNO WHEEL STATE
  ↓
LLM only resolves ambiguity / explains
```

That's important.

Don't make Gemini say:

> "I think this is probably the progressive tense..."

We can have a deterministic grammar representation underneath and let the model **teach from the parse**.

And because UD Hindi actually represents things like `Gender`, `Case`, `Aspect`, `Person`, `Polite`, etc., it's basically already giving us much of the wheel state. [Universal Dependencies](https://universaldependencies.org/treebanks/hi_hdtb/index.html?utm_source=chatgpt.com)

---

# The exercises then become insane

A single two-second Hindi clip can produce many different exercises:

**HEAR → UNDERSTAND**  
Audio only → choose meaning.

**HEAR → PARSE**  
Audio → arrange the Bruno wheels.

**HEAR → WRITE**  
Audio → type Devanāgarī.

**HEAR → SOUND**  
Tap a troublesome word → descend into Mātṛkā phoneme geometry.

**PARSE → SPEAK**  
Wheel configuration → produce Hindi.

**SCENE → SPEAK**  
"Ask a sadhu what lineage he belongs to" → generate sentence.

**CLOZE**  
`आप किस ____ से हैं?`

**MUTATE**  
Change *I* → *we*.  
Change *can* → *want*.  
Change *practice* → *read*.  
The grammar updates.

**SHADOW**  
Hear native audio → imitate rhythm/prosody immediately.

**PALACE RECALL**  
Drop the screen entirely → walk the āśram palace and speak its phrases.

**FREE CONVERSATION**  
Gemini talks in Hindi but preferentially uses structures the system knows you've installed.

That final one gives the wheel system another purpose: the AI knows your **current generative grammar**.

So rather than randomly conversing at B2 Hindi when you're A1, it can construct speech from your learned primitives plus perhaps **one novel operator per interaction**.

That is a custom syllabus in a much more literal sense.

---

# And I would change how we use FSRS

Don't schedule only the "sentence."

Track separate mastery values for:

```text
AUDIO RECOGNITION
PHONEME DISCRIMINATION
LEXICAL RECALL
GRAMMAR PARSE
PRODUCTIVE SPEECH
DEVANĀGARĪ
CHUNK AUTOMATICITY
```

You might recognize:

**आप किस परंपरा से हैं?**

perfectly while being unable to produce it.

Those are different memories.

Research on foreign-language vocabulary specifically supports **retrieval practice plus spacing**, and research on the keyword method supports acoustic/imagery association as a vocabulary strategy, though mnemonic advantages aren't uniformly identical across learner levels and tasks. [Wiley Online Library](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1944-9720.1993.tb01172.x?utm_source=chatgpt.com)

So the scheduler should know *what failed*.

Not merely:

**sentence score = 3/5.**

---

## The resulting system

This is what I now think `sanskrithelp` should become:

```text
                    ┌───────────────┐
                    │   REAL AUDIO  │
                    └───────┬───────┘
                            │
                  hear / shadow / segment
                            ↓
                   ┌─────────────────┐
                   │ HINDI UTTERANCE │
                   └────────┬────────┘
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
       MĀTṚKĀ SOUND     GRAMMAR WHEELS   CHUNKS
       coordinates       Bruno algebra    formulas
             │              │              │
             └──────────────┼──────────────┘
                            ↓
                    MEMORY PALACE
                 sparse durable anchors
                            │
                            ↓
                    RECALL REHEARSAL
                            │
                 ┌──────────┴──────────┐
                 ↓                     ↓
              SPEECH               LISTENING
                 \                     /
                  \                   /
                   └── REAL HINDI ──┘
```

And later Sanskrit slots straight into essentially the **same machine**, except the morphology engine becomes Pāṇinian and the sound layer gets the full canonical Mātṛkā/nyāsa apparatus.

So Hindi isn't distracting from the Sanskrit project.

**Hindi is where we learn to operate the machine on a living language before applying the much deeper compiler to Sanskrit.**

That's the part I think we've now got right.
