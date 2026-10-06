> ANNEX to awesomevision.md (canonical) — Constructicon formalism. Status: ACTIVE.

Yes. The research gives us a much cleaner formal theory for what we’ve been inventing. The missing object is a **Constructicon**: a database of reusable form↔meaning constructions. Bruno becomes the learner-facing manipulation/memory layer, while the Constructicon becomes the actual linguistic substrate.

And there is an almost ridiculous coincidence: linguistics already has a **Verb Island Hypothesis**. Early language knowledge can be item-based around particular predicates, with argument positions gradually becoming slots; broader grammar emerges as the learner generalizes across overlapping islands. That work is originally about first-language child acquisition, so it is not evidence that an adult L2 syllabus should literally imitate children—but the structural analogy to our **island → machine → plugin → abstraction** model is extremely strong. [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S088520149380001A?utm_source=chatgpt.com)

## The theoretical machine we were missing

I would formalize `sanskrithelp` around these ideas:

| Research idea | Our object | Why it matters |
|---|---|---|
| Construction Grammar | **MACHINE** | A construction is a conventional form↔meaning pairing |
| Verb Islands | **ISLAND** | Start specific, then generalize once enough related exemplars exist |
| Formulaic language | **CHUNK** | Learn useful multiword units before atomizing everything |
| Frame Semantics / PropBank | **SEMANTIC WHEEL** | who did what, to whom, where, why |
| Collostructional analysis | **PLUGIN RANKER** | determines which words naturally occupy a construction's slots |
| UCxn | **MACHINE ANNOTATION FORMAT** | represents constructions on top of dependency parses |
| Processing Instruction | **DECOMPILE DRILL** | force learner to notice grammatical cues while understanding audio |
| Skill Acquisition | **COMPILE DRILL** | explicit → procedural → automatic |
| Nation's Four Strands | **SYLLABUS BALANCER** | stops us becoming a grammar/memory app with no actual language use |
| Bruno | **MANIPULATION + MEMORY UI** | makes abstract dimensions spatial/combinatorial |
| Pāṇini | **SANSKRIT COMPILER** | deterministic derivation/validation for Sanskrit |

Construction Grammar is particularly close to our idea: rather than grammar being one set of rules and vocabulary another, language is represented as a network of constructions ranging from fixed phrases to partially open templates to highly abstract patterns. Computational work is now explicitly trying to **induce these construction inventories from corpora**, including experiments across 35 languages. [arXiv](https://arxiv.org/abs/2407.07606?utm_source=chatgpt.com)

Nick Ellis's L2 research is even closer. He argues for a progression roughly from **formula → low-scope pattern → productive construction**, with learning sensitive to exemplar frequency, how reliably a form maps onto a meaning, and which words characteristically occupy a construction. His work on multiword constructions specifically treats grammar, vocabulary and semantics as inseparable. [EBSCO OpenURL](https://openurl.ebsco.com/contentitem/doi%3A10.1017/s0267190512000025?id=ebsco%3Adoi%3A10.1017/s0267190512000025\&sid=ebsco%3Aplink%3Acrawler\&utm_source=chatgpt.com)

So our old:

`mujhe ___ pasand hai`

isn't a hack.

It's basically a **low-scope construction**.

And:

`mujhe ___ pasand hai kyunki [CLAUSE]`

is a larger construction assembled from two constructional units connected by a discourse relation.

### There is already a real language-learning system based on this

This was one of the strongest finds.

**Construxercise / Russian Constructicon** contains 4,000+ documented Russian constructions and a pedagogical system with 150+ production exercises. Lessons teach small sets of reusable constructions grouped both by topic and communicative function—expressing opinions, clarifying, adding information, etc.—specifically so learners can generate their own speech rather than just memorize sentences. [GitHub](https://github.com/constructicon/construxercise-rus?utm_source=chatgpt.com)

That is basically a less computational version of what we want.

[Construxercise GitHub](https://github.com/constructicon/construxercise-rus?utm_source=chatgpt.com)

Even better, Fluid Construction Grammar already has an open computational framework, **Babel2**, for representing and manipulating constructions. I would study its data model, although I probably would **not** adopt the Lisp framework wholesale into your app. [GitHub](https://github.com/dwarfmaster/Babel2?utm_source=chatgpt.com)

[Babel2 / Fluid Construction Grammar](https://github.com/dwarfmaster/Babel2?utm_source=chatgpt.com)

## And Hindi already has construction annotations

This is possibly the most useful discovery.

The **Universal Dependencies Hindi-HDTB** treebank has about **351k tokens** with lemma, morphology and dependencies. Since UD v2.15, it also contains **UCxn construction annotations** for interrogatives, conditionals, existentials and NPN constructions. [Universal Dependencies](https://universaldependencies.org/treebanks/hi_hdtb/index.html?utm_source=chatgpt.com)

UCxn itself was designed specifically to layer meaning-bearing grammatical constructions on top of UD dependency trees. [arXiv](https://arxiv.org/abs/2403.17748?utm_source=chatgpt.com)

So we're not starting the Hindi constructicon from zero.

We can literally inspect Hindi:

```text
अगर X तो Y
क्या X ...?
X है / X मौजूद है
...
```

as **annotated constructions**, not merely sequences of POS tags.

I would adopt a simplified UCxn-compatible representation inside `sanskrithelp`.

---

# The data stack I'd actually use

### Hindi

| Resource | What we use it for |
|---|---|
| **IndicVoices** | Natural/spontaneous audio and conversational speech |
| **Kathbath Hindi** | Clean controlled audio/ASR and pronunciation work |
| **Shrutilipi** | Huge formal spoken Hindi corpus |
| **Hindi-HDTB + UCxn** | morphology + dependencies + initial construction inventory |
| **Hindi PropBank** | semantic argument frames |
| **IndicCorp Hindi** | massive frequency/construction statistics |
| **IndicConformer** | transcription |
| **Indic NLP Library** | normalization/script handling |
| **Constructicon approach** | our MACHINE schema |

IndicVoices is especially valuable because unlike a lot of ASR corpora it intentionally contains **extempore and conversational speech**; the published GitHub release describes 12,000 hours across 22 languages, predominantly extempore speech. We obviously need to select the Hindi portion rather than pretending all 12,000 hours are Hindi. [GitHub](https://github.com/AI4Bharat/IndicVoices?utm_source=chatgpt.com)

Kathbath is great for our Sanskrit/Hindi dual system because the same dataset family contains **150.2 hours of Hindi and 115.5 hours of Sanskrit**. [GitHub](https://github.com/AI4Bharat/indicSUPERB?utm_source=chatgpt.com)

Shrutilipi contains more than **6,400 hours of aligned speech across 12 Indian languages**, mined from All India Radio material. That means it's excellent for formal speech and robust ASR, though stylistically it shouldn't define our conversational syllabus. [arXiv](https://arxiv.org/abs/2208.12666?utm_source=chatgpt.com)

And AI4Bharat already ships **IndicConformer ASR models for both `hi` Hindi and `sa` Sanskrit** under MIT. [GitHub](https://github.com/AI4Bharat/IndicConformerASR?utm_source=chatgpt.com)

[IndicConformerASR](https://github.com/AI4Bharat/IndicConformerASR?utm_source=chatgpt.com)

For frequency mining, IndicCorp has **63.1 million Hindi sentences / 1.86 billion tokens**. It's enormous, although biased toward news, magazines and books and licensed NC-SA, so I'd use it for statistical discovery rather than treating it as the model of conversational Hindi. [IndicNLP](https://indicnlp.ai4bharat.org/corpora/?utm_source=chatgpt.com)

Hindi PropBank provides another crucial representation: each predicate has a frame defining its semantic arguments. Hindi PropBank is layered over the dependency treebank, and its guidelines even handle complex/light predicates such as noun + `कर`. [University of Colorado](https://www.colorado.edu/lab/clear/projects/computational-semantics/annotation?utm_source=chatgpt.com)

That gives us:

```text
surface sentence
        ↓
dependency structure
        ↓
predicate
        ↓
semantic arguments
```

which is almost exactly our semantic wheel.

---

# The Sanskrit stack is arguably even better

For Sanskrit I would make **DCS + Vidyut** the core.

The Digital Corpus of Sanskrit currently has roughly **5.66 million manually tagged words in ~755,000 lines**, sandhi-split with lexical and morphological analysis. [Sanskrit Linguistics](https://sanskrit-linguistics.org/dcs/index.php?utm_source=chatgpt.com)

There is now a very convenient 2026 GitHub mirror containing all **270 DCS texts in CoNLL-U plus restored plain text**, licensed CC BY 4.0. [GitHub](https://github.com/tokushige-koyasan/dcs-corpus?utm_source=chatgpt.com)

[DCS corpus mirror](https://github.com/tokushige-koyasan/dcs-corpus?utm_source=chatgpt.com)

Then use **Vidyut** as the deterministic grammar engine. It handles generation, reverse lookup, sandhi, segmentation and transliteration, while `vidyut-prakriya` can expose the actual sequence of Pāṇinian rules used to derive a form. [GitHub](https://github.com/ambuda-org/vidyut?utm_source=chatgpt.com)

[Vidyut](https://github.com/ambuda-org/vidyut?utm_source=chatgpt.com)

That lets us do something no normal language app can do.

Click:

**भवति**

and descend:

```text
surface
भवति

↓ analysis

lemma
√भू

↓ morphology

present · 3sg · parasmaipada

↓ Pāṇinian compiler

derivation steps

↓ Mātṛkā

भ अ व अ त इ

↓ sound/body coordinates
```

Then run it **backwards** as a reconstruction exercise.

ByT5-Sanskrit is the neural fallback. The 2024 model achieved strong results for segmentation and provides a multitask model for segmentation, lemmatization and morphosyntactic tagging derived from DCS. [arXiv](https://arxiv.org/abs/2409.13920?utm_source=chatgpt.com)

SanskritShala gives another open toolkit for word segmentation, morphology, dependency parsing and compound classification and was designed partly for pedagogical use. [GitHub](https://github.com/Jivnesh/SanskritShala?utm_source=chatgpt.com)

And Saṃsādhanī/SCL already contains a Sanskrit morphological analyzer/generator, sandhi join/split, **Sanskrit→Hindi MT**, an Aṣṭādhyāyī simulator and other classical-language tools. [GitHub](https://github.com/samsaadhanii/scl?utm_source=chatgpt.com)

So Sanskrit's version is:

```text
TEXT / AUDIO
      ↓
sandhi segmentation
      ↓
morphological analysis
      ↓
dependency / kāraka representation
      ↓
Pāṇinian derivation
      ↓
CONSTRUCTION
      ↓
BRUNO WHEELS
```

That's substantially more profound than making Sanskrit flashcards.

## And we have a corpus specifically useful for your Trika direction

This one is excellent.

A current GitHub corpus contains **499 Sanskrit Śaiva/Tantric texts from the Muktabodha Digital Library**. Its README says many were transcribed from manuscripts or KSTS editions under Mark Dyczkowski's supervision; the corpus is CC BY-NC 4.0. [GitHub](https://github.com/tokushige-koyasan/muktabodha-corpus/blob/main/README.md?utm_source=chatgpt.com)

[Muktabodha Śaiva/Tantric corpus](https://github.com/tokushige-koyasan/muktabodha-corpus/blob/main/README.md)

So eventually your curriculum doesn't need to be:

> Sanskrit lesson 47: instrumental plural.

It can be:

> **What are the 35 constructions and 500 lexical items that unlock the largest proportion of the Śaiva corpus I'm actually trying to read?**

That's a completely different objective.

---

# Collostructional analysis solves the “plugins” problem

Suppose we discover the construction:

```text
मुझे [X] करना है
```

We shouldn't simply fill X with the 100 most common nouns.

We want to ask:

> Which fillers occur **disproportionately often in this construction**?

That's what **collostructional analysis** does: quantify association strength between lexical items and grammatical constructions. [John Benjamins Publishing Catalog](https://benjamins.com/catalog/hcp.43.15hil?utm_source=chatgpt.com)

So every MACHINE can acquire a ranked plugin inventory:

```text
MACHINE
मुझे [ACTION] करना है

high-association / useful fillers:
काम
पढ़ाई
अभ्यास
तैयारी
बात
...
```

Then personalize the ranking:

```text
generic corpus utility
× conversational frequency
× learner interests
× target-world frequency
× construction association
```

For you, `अभ्यास`, `ध्यान`, `संस्कृत`, `साधना` get promoted because they're disproportionately useful in the **world you're about to inhabit**.

This is how the app stops teaching random vegetables.

---

# Processing Instruction fixes another weakness in language apps

One issue with Lego generation is that you can become good at consciously assembling sentences without becoming good at **hearing grammatical information in fast speech**.

VanPatten's Processing Instruction work explicitly attacks this: learners are given input tasks where they **must process a particular grammatical feature correctly to recover the meaning**, instead of merely hearing lots of examples or practicing output. A 2026 review summarizes decades of positive findings for this approach. [OUP Academic](https://academic.oup.com/eltj/article/61/2/161/366708?utm_source=chatgpt.com)

That gives us a killer exercise type.

Audio:

**वह संस्कृत पढ़ती है।**

Don't ask:

> “Repeat it.”

Ask:

> **Is the speaker talking about a man or a woman?**

The learner is forced to extract:

**पढ़ती**

Then:

**आप कहाँ जा रहे हैं?**

Ask:

> Is the speaker addressing someone respectfully/familiarly?

Now `आप + रहे + हैं` matters.

This creates a direct bridge:

**audio → morphological cue → meaning**

Exactly what our wheel decomposition should train.

---

# The final missing guardrail: Nation's Four Strands

This matters because our system could otherwise become an intoxicating grammar machine that the learner spends hours operating without actually speaking Hindi.

Paul Nation's current 2026 formulation still recommends roughly balancing:

**meaning-focused input / meaning-focused output / deliberate language study / fluency development.** [TESOL Union](https://www.tesolunion.org/archives-info/409?utm_source=chatgpt.com)

So our app should actively enforce that balance.

If you've just spent 20 minutes decompiling audio into wheels, it should eventually say:

**Stop analyzing. Conversation mode. Only constructions already learned.**

And another mode:

**Fluency run — zero new grammar. Say 30 known machines as fast and naturally as possible.**

That's very different from SRS.

---

# I think this should be the internal data model

Not:

```text
word
translation
example
```

but:

```text
AUDIO EXEMPLAR
      ↓
SURFACE FORM
      ↓
MORPHOLOGY
      ↓
DEPENDENCY STRUCTURE
      ↓
SEMANTIC FRAME
      ↓
CONSTRUCTION
      ↓
SLOTS
      ↓
FILLERS
      ↓
MUTATIONS
      ↓
CONNECTIONS TO OTHER CONSTRUCTIONS
      ↓
ISLAND
      ↓
MEMORY BINDINGS
      ↓
SKILL STATE
```

An individual `Construction` might look conceptually like:

```text
id: ability-question

meaning:
    ask whether actor has permission/ability to perform action

form:
    क्या [ACTOR] [COMPLEMENT] [VERB.ROOT]
    [SAK-AGREEMENT] [AUX]?

slots:
    ACTOR: human
    COMPLEMENT: action-compatible
    VERB: infinitive-capable verb

features:
    interrogative
    modality=ability
    politeness=derived-from-actor
    gender-agreement=true

connections:
    ability-affirmative
    ability-negative
    desire
    request
```

**That is the language object.**

The Bruno wheel is merely one visualization of it.

---

## How I'd generate the custom syllabus

1. **Build a target corpus**, not a generic one: conversational Hindi + your Kumbh/Rishikesh material + āśram conversations + eventually your actual recorded interactions; Sanskrit gets DCS plus the specific Trika corpus.

2. **Normalize and parse everything** into tokens, lemmas, morphological features, dependencies and—where available—semantic roles/construction annotations. Hindi-HDTB/UCxn gives the initial gold standard; DCS gives Sanskrit morphology. [GitHub](https://github.com/UniversalDependencies/UD_Hindi-HDTB/blob/master/README.md?utm_source=chatgpt.com)

3. **Canonicalize sentences into MACHINE signatures.** For example, hundreds of surface sentences become `[ACTOR] [OBJECT] V रहा AGR AUX`.

4. **Cluster related machines into islands.** Keep concrete/item-based islands first; only expose an abstract wheel after enough exemplars support the abstraction. That's our adaptation of usage-based/Verb-Island theory. [Wiley Online Library](https://onlinelibrary.wiley.com/doi/full/10.1111/cogs.12114?utm_source=chatgpt.com)

5. **Rank machines by marginal coverage:** how much new real audio/text becomes understandable if this one construction is learned? I'd combine domain frequency, productivity, semantic usefulness and complexity.

6. **Rank plug-ins inside each machine by collostructional association**, then personalize using target-world frequency. [John Benjamins Publishing Catalog](https://benjamins.com/catalog/hcp.43.15hil?utm_source=chatgpt.com)

7. **Generate multiple skills from every exemplar:** hear→meaning, hear→parse, parse→speak, scene→speak, text→sound, mutation, shadowing, dictation and rapid fluency. Track them separately.

8. **Continuously rebuild the syllabus from your real exposure.** Once you're in India, sentences you actually encounter receive massively higher weight than generic corpus material.

That's basically a **greedy coverage algorithm over a personal constructicon**.

The goal isn't:

> learn the next 20 words.

It's:

> **Which one new construction and five fillers give me the greatest increase in the percentage of my target world that I can understand and produce?**

That should be the central optimization function.

---

## The exact repo stack I would integrate first

I wouldn't ingest twenty projects immediately. First version:

| Priority | Component |
|---|---|
| 1 | **UD Hindi-HDTB + UCxn** — Hindi machine grammar |
| 2 | **IndicConformer Hindi/Sanskrit** — audio transcription |
| 3 | **IndicVoices/Kathbath** — audio exemplars |
| 4 | **Hindi PropBank concepts/frames** — semantic wheels |
| 5 | **DCS** — Sanskrit gold corpus |
| 6 | **Vidyut** — Pāṇinian compiler |
| 7 | **ByT5-Sanskrit** — neural analysis fallback |
| 8 | **Muktabodha** — your Trika target corpus |
| 9 | **Construxercise** — pedagogical/UX blueprint |
| 10 | **Indic NLP Library** — Devanāgarī normalization |

Indic NLP Library is useful at the bottom because it already handles normalization, tokenization, syllabification, transliteration and Devanāgarī-specific normalization—including nukta handling—so we shouldn't reinvent that layer. [GitHub](https://github.com/GokulNC/Indic-NLP-Library?utm_source=chatgpt.com)

One final dataset I would add later is **Jambu/CDIAL**, because it gives us historical Indo-Aryan lexical data. That could power an optional **Sanskrit → Prakrit/history → Hindi** etymological view, so Sanskrit and Hindi vocabulary stop feeling like two unrelated memorization tasks. [GitHub](https://github.com/moli-mandala/data?utm_source=chatgpt.com)

And **BhashaSutra**, published in April 2026, is worth keeping as our resource index: it surveys 200+ Indian-language datasets, 50+ benchmarks and 100+ models/tools, so we can periodically mine it instead of manually rediscovering the whole Indic NLP ecosystem. [arXiv](https://arxiv.org/abs/2604.18423?utm_source=chatgpt.com)

The deepest change I would make to what we built yesterday is therefore:

> **Don't make `HindiWheelLab` the system. Make a language-neutral `Constructicon` engine underneath it.**
>
> Hindi wheels, Sanskrit/Pāṇini wheels, Mātṛkā, Bruno, audio islands and eventually other languages become different views over the same **construction graph**.

Then `sanskrithelp` becomes something much more interesting than a Sanskrit-learning site: a **machine for discovering, installing, decomposing and recombining language structures**.
