> ANNEX to awesomevision.md (canonical) — five layers + voice stack. Status: ACTIVE.

Yes. The clean architecture is now visible: **Sanskrit/Trika provides what you talk about; Hindi is learned almost entirely by talking about it and navigating real-life situations.** Reading/writing Hindi can stay secondary. Sanskrit gets the deep literacy treatment.

I would build this as five coupled layers.

### 1. The content spine: what your mind is being built around

For now:

**Mātṛkā → Śiva Sūtras → Vijñānabhairava → later Tantrasāra/Tantrāloka**

Śiva Sūtras gives the conceptual world. VBT later makes that world operational through practices.

For each sūtra you hear Sanskrit, read it, write it, decompile it, hear Hindi commentary, understand the concept, and then **discuss that concept aloud in Hindi**.

So Sanskrit study creates the semantic territory in which Hindi develops.

### 2. The Hindi Constructicon: the actual language syllabus

This remains independent of the text sequence.

We maintain your growing graph of:

**ISLANDS → MACHINES → SLOTS/PLUGINS → CONNECTORS → MUTATIONS**

For example:

```text
QUESTION ISLAND

यहाँ X का अर्थ क्या है?
X और Y में क्या अंतर है?
X को Y क्यों कहा गया है?
क्या इसका मतलब यह है कि X?
X का अभ्यास कैसे करें?
```

Then:

```text
REASON
[X] क्योंकि [Y]

CONTRAST
[X] लेकिन [Y]

CONDITION
अगर [X], तो [Y]

EXPLANATION
X का अर्थ है कि [Y]
```

The AI knows precisely which constructions you've acquired.

That means it does **not** simply "speak beginner Hindi."

It has a representation such as:

```text
known:
  progressive
  want-to
  ability
  kyunki
  lekin
  X का अर्थ क्या है?
  X और Y में क्या अंतर है?

learning:
  अगर X तो Y

vocabulary:
  326 active
  611 recognized
```

Its conversations are generated around that state.

This is where the usage-based / Construction Grammar / Verb-Island work we found becomes practically useful.

---

# 3. Gemini Live should be the conversation engine

And the current stack is considerably better than I expected.

As of September 2026, Google's stable **Gemini 3.8 Live** is explicitly designed for low-latency audio-to-audio dialogue, supports function calling and mid-session context updates, and Hindi is one of the 99 officially supported Live languages. [Google AI for Developers](https://ai.google.dev/gemini-api/docs/models?hl=en\&utm_source=chatgpt.com)

For normal Hindi conversation I would use:

**Gemini 3.8 Live**

For moments where the teacher needs to inspect a Sanskrit passage, query your sources, compare commentaries, or reason about your learning state:

**Gemini 3.8 Live Extended Thinking**

Google specifically positions ordinary 3.8 Live for language practice and rapid conversation, while Extended Thinking is for more complex tool-using reasoning. [Google AI for Developers](https://ai.google.dev/gemini-api/docs/live-api/thinking?utm_source=chatgpt.com)

And I would put **LiveKit around Gemini**, rather than wiring the web client directly to Gemini forever.

LiveKit gives us:

- interruption/barge-in handling,
- audio rooms,
- turn detection,
- transcripts/traces,
- agent orchestration,
- Node and Python support,
- ability to swap Gemini for another realtime model later,
- separate STT/TTS components when desired. [LiveKit Docs](https://docs.livekit.io/agents/?utm_source=chatgpt.com)

So:

```text
BROWSER
 microphone / speaker
       │
       ↓
    LIVEKIT
       │
       ↓
 GEMINI 3.8 LIVE
       │
       ├── Hindi conversation
       ├── roleplay
       ├── corrections
       └── tool calls
               │
               ↓
       SANSKRITHELP ENGINE
```

That separation is important.

**Gemini is the actor. Sanskrithelp is the teacher.**

The model should not decide your syllabus on the fly.

---

# 4. Give the voice agent tools rather than an enormous prompt

This is where it gets very good.

Gemini Live supports function calls during voice sessions. [Google AI for Developers](https://ai.google.dev/gemini-api/docs/live-api/tools?utm_source=chatgpt.com)

Give it tools such as:

```text
get_current_sutra()
get_sutra_vocabulary()
get_trika_commentary()
get_known_hindi_constructions()
get_due_constructions()
get_known_vocabulary()
introduce_next_construction()
score_user_turn()
record_encounter()
get_roleplay_scenario()
get_audio_example()
lookup_sanskrit_word()
```

Imagine you're studying:

**चैतन्यमात्मा**

You press **Talk**.

AI teacher speaks mostly Hindi:

> इस सूत्र में “चैतन्य” शब्द आया है।  
> आपको क्या लगता है — यहाँ चैतन्य का अर्थ क्या है?

You stumble:

> चैतन्य मतलब… consciousness… आत्मा?

It doesn't immediately give you a grammar lecture.

It responds:

> हाँ। आप हिंदी में कह सकते हैं:  
> **“चैतन्य का अर्थ चेतना है।”**  
> अब फिर से कहिए।

You repeat it.

Then:

> अच्छा। अब मुझे बताइए —  
> **चैतन्य और मन में क्या अंतर है?**

Now you've been forced to use another known machine:

**X और Y में क्या अंतर है?**

Then perhaps you're stuck.

You say:

> English please.

It temporarily switches:

> He's asking you to distinguish consciousness from mind. Try starting with `मुझे लगता है कि...`

Then immediately return to Hindi.

That's the teacher I want.

---

# 5. Roleplay is a separate Hindi world

The spiritual syllabus can't cover everything you'll need.

So beside **TEXT WORLDS**, we have **LIFE WORLDS**.

For example:

```text
ARRIVING AT AN ASHRAM

enter gate
↓
greet somebody
↓
ask where reception is
↓
explain why you're here
↓
ask whether you can stay
↓
ask price
↓
ask where toilet is
↓
find teacher
↓
ask about satsang time
```

Gemini acts as everyone.

You literally hear:

> नमस्ते, आपको किससे मिलना है?

You respond.

The scenario branches naturally.

Another:

**TEA STALL**

**TRAIN STATION**

**RENTING A ROOM**

**KUMBH CAMP**

**MEETING A SADHU**

**BHU OFFICE**

**FIRST MEETING WITH SANSKRIT TEACHER**

And eventually the especially interesting one:

### TALK TO TEACHER AFTER PRACTICE

You actually do a VBT practice.

Then return to the app.

Teacher:

> अभ्यास कैसा रहा?

You explain what happened in Hindi.

The model asks:

> सांस पर ध्यान रखते समय क्या हुआ?

Now your meditation experience itself is generating language.

If necessary:

> How do I say "my attention kept moving away?"

The app teaches you exactly that construction, and because it arose out of a **real experience you just had**, it has an exceptionally strong memory hook.

That is where this stops feeling like language software.

---

## The language-learning algorithm during conversation

The model shouldn't correct every mistake. That would destroy conversation.

I'd implement three intervention levels.

**Green — understood and acceptable**

Conversation simply continues.

**Amber — understood, but target construction wrong**

AI naturally **recasts**:

You:

> मैं संस्कृत सीख रहा है.

AI:

> अच्छा, **आप संस्कृत सीख रहे हैं**। कितने समय से?

You hear the correction without derailing communication.

After the conversation, the app says:

```text
TARGET
आप ... रहे हैं

you produced
मैं ... रहा है

2 occurrences
→ 90-second agreement drill
```

**Red — misunderstanding**

Stop, switch briefly to English or very simple Hindi, expose the wheel, repair it, then immediately return to the conversation.

That preserves **meaning-focused communication** while still giving deliberate grammar practice.

---

# Processing Instruction can happen inside live conversation

This is another excellent feature.

The AI deliberately asks questions where understanding depends on the thing you're learning.

Suppose today is **gender agreement**.

AI says:

> मेरी बहन संस्कृत पढ़ती है।

Then asks:

> संस्कृत कौन पढ़ता है — भाई या बहन?

To answer correctly you must hear **पढ़ती**.

Not memorize the grammar rule.

Or it says:

> वे कल आश्रम गए थे।

and asks when/how many people.

The conversation itself becomes the perceptual training that VanPatten-style Processing Instruction calls for.

---

# Sanskrit needs a different audio stack

Here's the important Gemini limitation.

**Hindi is officially supported by Gemini Live. Sanskrit is not in Google's current 99-language Live list.** [Google AI for Developers](https://ai.google.dev/gemini-api/docs/live-api/capabilities)

So I would **not trust Gemini Live as your Sanskrit pronunciation authority**.

It can likely handle Sanskrit text reasonably well, but I also would not make a free-running LLM our authoritative translator for Abhinavagupta.

Instead:

```text
SANSKRIT TEXT
     │
     ├── Vidyut → morphology/derivation
     ├── canonical translations/commentary → RAG
     ├── Gemini text model → explanation/synthesis
     └── dedicated Sanskrit audio engine
```

For Sanskrit speech we have a much better option than I realized:

**AI4Bharat Indic Parler-TTS officially supports Sanskrit.** Its published model supports 21 languages including Sanskrit, and the training data contains about **143 hours of Sanskrit / 63,908 utterances**. [Hugging Face](https://huggingface.co/ai4bharat/indic-parler-tts-pretrained?utm_source=chatgpt.com)

So we can test:

**Indic Parler-TTS → Sanskrit recitation/synthesis**

while keeping your genuine human recordings as the gold standard.

AI4Bharat also has **IndicConformer ASR models specifically for Sanskrit and Hindi**, so we can score/transcribe your attempts independently of Gemini. [GitHub](https://github.com/AI4Bharat/IndicConformerASR?utm_source=chatgpt.com)

That produces a lovely division:

```text
                 SPEAKING

Hindi
Gemini Live ←→ you
     │
IndicConformer verification

Sanskrit
human reference / Indic Parler TTS
     ↓
you recite
     ↓
IndicConformer Sanskrit ASR
     ↓
phoneme / Mātṛkā comparison
```

And for Sanskrit↔Hindi textual translation we can optionally use **IndicTrans2**, which explicitly supports both `san_Deva` and `hin_Deva`, as another signal alongside the stronger contextual model. [GitHub](https://github.com/ai4bharat/IndicTrans2?utm_source=chatgpt.com)

---

# So I wouldn't build one AI teacher

I'd give it **modes**, all sharing one learner state.

| Mode | Language | Purpose |
|---|---|---|
| **Satsang** | mostly Hindi | discuss current Śiva Sūtra |
| **Socratic** | Hindi | AI keeps asking conceptual questions |
| **Roleplay** | Hindi | real India scenarios |
| **Free talk** | Hindi | normal conversation constrained to known constructions |
| **Repair** | Hindi + English | fix things you're repeatedly getting wrong |
| **Śāstra** | Sanskrit + Hindi/English | Sanskrit text analysis |
| **Recitation** | Sanskrit | hear → recite → ASR/check |
| **Practice** | Sanskrit instructions/Hindi discussion | do VBT practice, then discuss experience |

The really important thing is **all of those write back into the same learner model**.

If you learn:

`X और Y में क्या अंतर है?`

during Śiva Sūtra study, it's now available in the train-station conversation if appropriate.

If you learn:

`कहाँ है?`

during toilet roleplay, it appears naturally later:

> Śiva Sūtra में “उद्यम” कहाँ समझाया गया है?

Language knowledge is global.

Contexts are just islands in which it gets exercised.

---

## The stack I'd choose now

**Frontend:** your existing Next.js `sanskrithelp`

**Realtime media/orchestration:** LiveKit Agents

**Hindi voice intelligence:** `gemini-3.8-live`

**Deep teacher mode:** `gemini-3.8-live-extended-thinking`

**Hindi/Sanskrit ASR + offline verification:** AI4BHarat IndicConformer

**Sanskrit generated speech:** AI4BHarat Indic Parler-TTS + human reference recordings

**Sanskrit analysis:** Vidyut + DCS + your existing Pāṇini machinery

**Trika knowledge:** source-controlled RAG over Śiva Sūtras/Lakshmanjoo/Dyczkowski/etc., with provenance

**Language model:** our Constructicon + wheels + FSRS skill state

That is better than “Gemini language tutor.”

Gemini is just the **realtime mouth and conversational intelligence** attached to a much more constrained cognitive architecture.

And because Gemini 3.8 Live supports full session content updates, we can literally change the agent's active language constraints during the call as you demonstrate mastery rather than reconnecting every few minutes. [Google AI for Developers](https://ai.google.dev/gemini-api/docs/changelog?utm_source=chatgpt.com)

The product loop ultimately becomes:

**study sūtra → hear Hindi about it → talk to teacher about it → discover missing Hindi → install construction → roleplay it → return to sūtra → practise → discuss your experience → repeat.**

That's the complete system.
