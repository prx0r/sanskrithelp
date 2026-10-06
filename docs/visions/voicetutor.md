> ANNEX to awesomevision.md (canonical) — provider comparison + A/B plan. Status: ACTIVE.

Yes. For **this exact project**, I’d start with **Gemini 3.8 Live**. Not because it is universally the best voice model, but because its particular feature set matches our Hindi tutor unusually well: native audio-to-audio, very low latency, Hindi officially supported, natural language-switching, asynchronous function calls, and—most importantly—**session content can be updated while the conversation is running**. That last feature means our app can dynamically tell it “Tom now knows `kyunki`; start using it”, “today's sūtra is `caitanyam ātmā`”, or “enter āśram roleplay mode” without rebuilding the whole session. [Google AI for Developers](https://ai.google.dev/gemini-api/docs/live-api/capabilities?utm_source=chatgpt.com)

Also, your `$0.05/min` figure is conservative. Google's current published Gemini 3.8 Live rates are **$0.005/min for audio input and $0.018/min for audio output** equivalents. Actual sessions can cost more because conversation history is reprocessed on later turns, so you can't simply multiply those two numbers by wall-clock time, but raw new audio is cheap. [Google AI for Developers](https://ai.google.dev/gemini-api/docs/pricing?authuser=0\&utm_source=chatgpt.com)

### The serious contenders

| Model | Why it matters for us | Current pricing | My view |
|---|---|---|---|
| **Gemini 3.8 Live** | Native Hindi, extremely low latency, tool calls, live session updates, easy Hindi↔English switching | audio input ≈ $0.005/min; output ≈ $0.018/min before accumulated-context effects | **Start here** |
| **GPT-Realtime-2.1** | Speech-to-speech reasoning model; configurable reasoning, strong instruction following, function calling, good interruption/noise handling | $32/M audio input, $64/M output | **Main quality challenger** |
| **GPT-Realtime-2.1-mini** | Same basic architecture, far cheaper | $10/M audio input, $20/M output | Potentially excellent cheap second engine |
| **GPT-Live-1** | Very natural full-duplex conversation; can keep talking while delegating hard work to another model | **$0.05/min + backend** | Interesting, but more architecture than we need initially |
| **Qwen3.8-Omni-Flash-Realtime** | Hindi speech, native audio, WebRTC, function calling, MCP, enormous context; radically cheap | Singapore: $0.93/M audio-input tokens, $1.87/M audio-output tokens | **Absolutely benchmark this** |

OpenAI's `gpt-realtime-2.1` is the one I'd compare directly against Gemini rather than old `gpt-realtime`. It's explicitly a **reasoning speech-to-speech model with tool use**, configurable reasoning effort, improved interruption handling, and a 128k context window. [OpenAI Developers](https://developers.openai.com/api/docs/models/gpt-realtime-2.1?utm_source=chatgpt.com)

`GPT-Live-1` is slightly different. OpenAI separates the **fast conversational voice layer** from a backend reasoning/tool model. It can listen and talk simultaneously while backend work occurs, which could produce a superb teacher: keep the conversation flowing while a strong reasoning model checks the Śiva Sūtra/commentary/learner state. But voice alone costs $0.05/min and delegated backend work costs extra. [OpenAI Developers](https://developers.openai.com/api/docs/models/gpt-live-1?utm_source=chatgpt.com)

For v1, that feels unnecessarily complicated compared with Gemini.

## Qwen is much more interesting than I expected

The new **`qwen3.8-omni-flash-realtime`**, released in late September 2026, is a legitimate contender rather than a toy.

It supports streaming audio, text and video input, text/audio output, **custom function calling**, remote MCP, WebRTC/WebSocket, and up to **196,608 input tokens**. [AlibabaCloud](https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash-realtime?utm_source=chatgpt.com)

And Hindi is explicitly one of its supported speech-output languages. [AlibabaCloud](https://www.alibabacloud.com/help/en/model-studio/omni-voice-list?utm_source=chatgpt.com)

The pricing is almost absurdly low. In Singapore:

`audio input = $0.93 / million tokens`

`audio output = $1.87 / million tokens`

and Qwen converts realtime audio at approximately **7 tokens/sec input and 12.5 tokens/sec output**. Like Gemini, previous conversation audio is reprocessed while it remains in context, so very long conversations compound in cost. [AlibabaCloud](https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash-realtime?utm_source=chatgpt.com)

So I would **100% implement Qwen behind the same interface**.

The uncertainty isn't capability on paper. It's whether its **Hindi teacher behavior** is as good as Gemini at the peculiar things we care about:

natural Indian Hindi rather than translationese; gently recasting mistakes; obeying “90% Hindi unless I say English”; recognizing your bad beginner Hindi; switching Hindi↔English without losing the thread; pronouncing Sanskrit-derived Hindi vocabulary properly; staying within our known Constructicon; and making reliable tool calls while talking.

Official docs can't answer those. We need an A/B test.

## I would not build a traditional STT → LLM → TTS cascade first

We *could* do:

`IndicConformer → GPT/Gemini text model → ElevenLabs/Google TTS`

and we'd get much greater control.

But we'd lose exactly what makes this concept compelling: **you speak, teacher immediately reacts, interrupts naturally, hears hesitation/prosody, and remains a person rather than a voice pipeline**.

Native audio-to-audio should therefore be the conversational layer.

The deterministic stuff remains outside it.

So Gemini receives something like:

```text
CURRENT WORLD
Śiva Sūtra 1.1

KNOWN CONSTRUCTIONS
मैं X कर रहा हूँ
मुझे X चाहिए
X का अर्थ क्या है?
मुझे लगता है कि X
X क्योंकि Y
X और Y में क्या अंतर है?

TARGET TODAY
क्या इसका मतलब यह है कि X?

KNOWN ACTIVE VOCAB
~280 items

TEACHING RULE
Keep conversation meaningful.
Prefer known constructions.
Introduce at most one target structure.
Recast minor errors.
Stop only when comprehension fails.
```

Then Gemini converses.

When you say:

> यहाँ चैतन्य मतलब consciousness है?

it can call:

`record_turn(...)`

Our language engine analyzes what you did.

And it might naturally respond:

> हाँ। लेकिन हिंदी में आप कह सकते हैं, **“यहाँ चैतन्य का अर्थ चेतना है।”** अब बताइए—चैतन्य और मन में क्या अंतर है?

That's exactly what we want.

## One thing I would keep completely separate: Sanskrit pronunciation

None of these should become authoritative merely because they can pronounce Devanāgarī.

Gemini Live's official 99-language list includes Hindi but **not Sanskrit**. [Google AI for Developers](https://ai.google.dev/gemini-api/docs/live-api/capabilities?utm_source=chatgpt.com)

So the model may read Sanskrit plausibly, particularly familiar verses, but that is not enough for the Mātṛkā/recitation side of this project.

I'd have:

**Gemini Live:** Hindi conversation and English fallback.

**Human Sanskrit recordings:** pronunciation gold standard.

**Our Sanskrit parser/Vidyut:** textual correctness.

**Mātṛkā engine:** phonological decomposition.

The voice teacher can still quote:

`चैतन्यमात्मा`

but the **Hear Sanskrit** button should come from a validated Sanskrit recording, not arbitrary Gemini speech.

---

So the v1 architecture can actually be pleasingly simple:

```text
                   SANSKRITHELP
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
  CONSTRUCTICON    ŚIVA SŪTRA     LEARNER STATE
  Hindi machines   knowledge       mastery/FSRS
        └──────────────┼──────────────┘
                       ↓
               GEMINI 3.8 LIVE
                       ↕
                      YOU
```

No LiveKit. No separate STT/TTS. Browser ↔ Gemini Live API.

Then build one adapter:

```text
VoiceTutorProvider

GeminiProvider
QwenProvider
OpenAIProvider
```

and run the same curriculum against all three.

My expected ranking **before testing** is:

**Gemini 3.8 Live → best default for v1**

**GPT-Realtime-2.1 → strongest model to A/B against it**

**Qwen3.8-Omni-Realtime → potentially ridiculous price/performance winner**

I'd actually be very interested in Qwen here. At its current pricing, if the Hindi turns out good, we could afford to make the AI **talk to you constantly** rather than rationing conversational practice—and for this particular learning theory, sheer hours of correctly constrained conversation matter enormously. [AlibabaCloud](https://www.alibabacloud.com/help/en/model-studio/qwen3-8-omni-flash-realtime?utm_source=chatgpt.com)
