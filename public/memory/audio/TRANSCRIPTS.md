# Audio transcripts — public/memory/audio/

## V2 (current UI) — `*_v2.mp3`

Same structures, gaps and event orders as v1 below, with two changes:
- English cues (loci + guided instruction) re-rendered with **en-GB-RyanNeural**
  (Edge, keyless via edge-tts lib) replacing espeak. Phoneme clips unchanged (human gold).
- Consonant cycles use **verse-literal v2 loci** (right hand/fingers, left hand/fingers,
  left hip — NOT elbow/wrist/buttock). Vowel cycle still 14 (no ḷ/ḹ).
- Guided circuit v2: same 144 events, Ryan voice, 8:36 (slower delivery).
- Build: `/root/deitybody/scripts/build_v2_ryan_cycles.py` + `build_v2_guided_circuit.py`.
- v1 files kept alongside (espeak era, consonants teach apparatus — retired from UI).

## V1 (archived, espeak era)

> Voices: phoneme clips = human grid recordings (learnsanskrit.org set).
> Grid filename mapping (verified against their templates 2026-10-07):
> `ta1/tha1/da1/dha1/na1` = retroflex ṭa ṭha ḍa ḍha ṇa; `na_j` = ña; `na_k` = ṅa;
> `sha` = śa; `shha` = ṣa; `r` = ṛ; `hma`/`jna` = conjuncts (unused).
> Canonical clip ids live in `public/memory/clips/` (47/50; missing ḷ ḹ kṣa —
> absent upstream too). Locus cues in cycles + guided circuit = espeak en-us
> 135–140wpm (robotic, local, free). Track 1 locus cues = Ryan (human).
> No full Sanskrit TTS exists; `/api/tts` (Edge hi-IN, keyless) is available
> but unused in these tracks.

Pattern for all cycles: 1s lead → per item [clip + 0.6s + locus + gap] → tail.

## cycle_night1_a_aa.mp3 — Night 1

- [a.ogg] → “forehead” → 8.0s gap (you: say it, touch it)
- [aa.ogg] → “mouth and face” → 8.0s gap (you: say it, touch it)

Tail 4.0s. Items: 2.

## cycle_vowels.mp3 — Vowels (14 — NOTE: no ḷ/ḹ)

> ḷ ḹ have no clips and no slots here; canonical vowels are 16.

- [a.ogg] → “forehead” → 7.0s gap (you: say it, touch it)
- [aa.ogg] → “mouth and face” → 7.0s gap (you: say it, touch it)
- [i.ogg] → “right eye” → 7.0s gap (you: say it, touch it)
- [ii.ogg] → “left eye” → 7.0s gap (you: say it, touch it)
- [u.ogg] → “right ear” → 7.0s gap (you: say it, touch it)
- [uu.ogg] → “left ear” → 7.0s gap (you: say it, touch it)
- [r.ogg] → “right nostril” → 7.0s gap (you: say it, touch it)
- [rr.ogg] → “left nostril” → 7.0s gap (you: say it, touch it)
- [e.ogg] → “lower teeth” → 7.0s gap (you: say it, touch it)
- [ai.ogg] → “upper teeth” → 7.0s gap (you: say it, touch it)
- [o.ogg] → “lower lip” → 7.0s gap (you: say it, touch it)
- [au.ogg] → “upper lip” → 7.0s gap (you: say it, touch it)
- [anusvara.ogg] → “crown” → 7.0s gap (you: say it, touch it)
- [visarga.ogg] → “tongue” → 7.0s gap (you: say it, touch it)

Tail 4.0s. Items: 14.

## cycle_consonants.mp3 — Consonants (12)

> DOCTRINE FLAG: loci here follow the APPARATUS tables (elbow/wrist/buttock), not verse-literal v2 (hand/fingers/nails, hip). Rebuild pending; use Tonight 50 for install.

- [ka.ogg] → “right shoulder” → 7.0s gap (you: say it, touch it)
- [kha.ogg] → “right arm” → 7.0s gap (you: say it, touch it)
- [ga.ogg] → “right elbow” → 7.0s gap (you: say it, touch it)
- [gha.ogg] → “right wrist” → 7.0s gap (you: say it, touch it)
- [ca.ogg] → “left shoulder” → 7.0s gap (you: say it, touch it)
- [cha.ogg] → “left arm” → 7.0s gap (you: say it, touch it)
- [ja.ogg] → “left elbow” → 7.0s gap (you: say it, touch it)
- [jha.ogg] → “left wrist” → 7.0s gap (you: say it, touch it)
- [ta.ogg] → “left buttock” → 7.0s gap (you: say it, touch it)
- [tha.ogg] → “left thigh” → 7.0s gap (you: say it, touch it)
- [da.ogg] → “left knee” → 7.0s gap (you: say it, touch it)
- [dha.ogg] → “left shank” → 7.0s gap (you: say it, touch it)

Tail 4.0s. Items: 12.

## cycle_full_starter.mp3 — Full starter (26 = 14+12)

> Same apparatus flag as consonants cycle for the 12 consonant slots.

- [a.ogg] → “forehead” → 6.0s gap (you: say it, touch it)
- [aa.ogg] → “mouth and face” → 6.0s gap (you: say it, touch it)
- [i.ogg] → “right eye” → 6.0s gap (you: say it, touch it)
- [ii.ogg] → “left eye” → 6.0s gap (you: say it, touch it)
- [u.ogg] → “right ear” → 6.0s gap (you: say it, touch it)
- [uu.ogg] → “left ear” → 6.0s gap (you: say it, touch it)
- [r.ogg] → “right nostril” → 6.0s gap (you: say it, touch it)
- [rr.ogg] → “left nostril” → 6.0s gap (you: say it, touch it)
- [e.ogg] → “lower teeth” → 6.0s gap (you: say it, touch it)
- [ai.ogg] → “upper teeth” → 6.0s gap (you: say it, touch it)
- [o.ogg] → “lower lip” → 6.0s gap (you: say it, touch it)
- [au.ogg] → “upper lip” → 6.0s gap (you: say it, touch it)
- [anusvara.ogg] → “crown” → 6.0s gap (you: say it, touch it)
- [visarga.ogg] → “tongue” → 6.0s gap (you: say it, touch it)
- [ka.ogg] → “right shoulder” → 6.0s gap (you: say it, touch it)
- [kha.ogg] → “right arm” → 6.0s gap (you: say it, touch it)
- [ga.ogg] → “right elbow” → 6.0s gap (you: say it, touch it)
- [gha.ogg] → “right wrist” → 6.0s gap (you: say it, touch it)
- [ca.ogg] → “left shoulder” → 6.0s gap (you: say it, touch it)
- [cha.ogg] → “left arm” → 6.0s gap (you: say it, touch it)
- [ja.ogg] → “left elbow” → 6.0s gap (you: say it, touch it)
- [jha.ogg] → “left wrist” → 6.0s gap (you: say it, touch it)
- [ta.ogg] → “left buttock” → 6.0s gap (you: say it, touch it)
- [tha.ogg] → “left thigh” → 6.0s gap (you: say it, touch it)
- [da.ogg] → “left knee” → 6.0s gap (you: say it, touch it)
- [dha.ogg] → “left shank” → 6.0s gap (you: say it, touch it)

Tail 5.0s. Items: 26.

## track1-installation.mp3 — Track 1 (Ryan + grid clips, 136s)

> 26 phonemes = same 14+12 as full starter. Per item: [Ryan speaks locus] + [grid clip]; 4 clipless slots (ḷ ḹ ṅa ña) hold silence for your own sound. Ryan's exact phrasing is as-recorded (no build script — re-listen to verify wording).

- [Ryan: forehead] + [a.ogg]
- [Ryan: mouth and face] + [aa.ogg]
- [Ryan: right eye] + [i.ogg]
- [Ryan: left eye] + [ii.ogg]
- [Ryan: right ear] + [u.ogg]
- [Ryan: left ear] + [uu.ogg]
- [Ryan: right nostril] + [r.ogg]
- [Ryan: left nostril] + [rr.ogg]
- [Ryan: lower teeth] + [e.ogg]
- [Ryan: upper teeth] + [ai.ogg]
- [Ryan: lower lip] + [o.ogg]
- [Ryan: upper lip] + [au.ogg]
- [Ryan: crown] + [anusvara.ogg]
- [Ryan: tongue] + [visarga.ogg]
- [Ryan: right shoulder] + [ka.ogg]
- [Ryan: right arm] + [kha.ogg]
- [Ryan: right elbow] + [ga.ogg]
- [Ryan: right wrist] + [gha.ogg]
- [Ryan: left shoulder] + [ca.ogg]
- [Ryan: left arm] + [cha.ogg]
- [Ryan: left elbow] + [ja.ogg]
- [Ryan: left wrist] + [jha.ogg]
- [Ryan: left buttock] + [ta.ogg]
- [Ryan: left thigh] + [tha.ogg]
- [Ryan: left knee] + [da.ogg]
- [Ryan: left shank] + [dha.ogg]

## night1_guided_circuit.mp3 — Guided Night 1 (espeak + clips, ordered events)

- SILENCE: sec: floats
- SAY: text: str, rate: int = 135
- CLIP: ogg: str
- SILENCE: 2.0s
- SAY: Night one. Sanskrit phoneme practice.
- SAY: Pair: a and long a.
- SAY: Sit comfortably. Spine long. Jaw soft.
- SILENCE: 2.0s
- SAY: Nyasa means installing sound on the body. Not anatomy.
- SAY: Mouth decides how it sounds. Locus decides where it is installed.
- SAY: If short a stretches into long a, pull it back. That is the skill.
- SILENCE: 2.0s
- SAY: Step one. Breath.
- SAY: Natural breath only. No forced holds.
- SAY: Five easy breaths. I will count.
- SAY: In.
- SILENCE: 3.0s
- SAY: Out.
- SILENCE: 4.0s
- SAY: In.
- SILENCE: 3.0s
- SAY: Out.
- SILENCE: 4.0s
- SAY: In.
- SILENCE: 3.0s
- SAY: Out.
- SILENCE: 4.0s
- SAY: In.
- SILENCE: 3.0s
- SAY: Out.
- SILENCE: 4.0s
- SAY: In.
- SILENCE: 3.0s
- SAY: Out.
- SILENCE: 5.0s
- SAY: Good. Attention on mouth and breath now.
- SAY: Step two. Phonetics only.
- SAY: No touching yet. Just the mouth.
- SAY: Listen.
- CLIP: a.ogg
- SILENCE: 2.0s
- SAY: That is short a. One beat.
- SAY: Listen to long a.
- CLIP: aa.ogg
- SILENCE: 2.0s
- SAY: Same open mouth. Held longer. Two beats.
- SAY: Now say short a three times.
- SILENCE: 1.0s
- CLIP: a.ogg
- SILENCE: 4.0s
- CLIP: a.ogg
- SILENCE: 4.0s
- CLIP: a.ogg
- SILENCE: 5.0s
- SAY: Now say long a three times.
- SILENCE: 1.0s
- CLIP: aa.ogg
- SILENCE: 5.0s
- CLIP: aa.ogg
- SILENCE: 5.0s
- CLIP: aa.ogg
- SILENCE: 5.0s
- SAY: Short. Long. Same sound. Different length.
- SAY: Step three. Hear. Touch. Say.
- SAY: Touch your forehead lightly.
- SAY: Listen to short a.
- CLIP: a.ogg
- SAY: Now say a while touching forehead.
- SILENCE: 6.0s
- SAY: Again.
- CLIP: a.ogg
- SILENCE: 6.0s
- SAY: One more time.
- CLIP: a.ogg
- SILENCE: 6.0s
- SAY: Now touch mouth or face.
- SAY: Listen to long a.
- CLIP: aa.ogg
- SAY: Say long a while touching mouth.
- SILENCE: 7.0s
- SAY: Again.
- CLIP: aa.ogg
- SILENCE: 7.0s
- SAY: One more.
- CLIP: aa.ogg
- SILENCE: 7.0s
- SAY: Alternate once. Forehead, then mouth.
- CLIP: a.ogg
- SAY: Forehead. Say a.
- SILENCE: 5.0s
- CLIP: aa.ogg
- SAY: Mouth. Say long a.
- SILENCE: 6.0s
- SAY: Step four. No touching.
- SAY: Say a. Let forehead become obvious.
- CLIP: a.ogg
- SILENCE: 6.0s
- SAY: Say long a. Let mouth become obvious.
- CLIP: aa.ogg
- SILENCE: 6.0s
- SAY: Again. Short a.
- CLIP: a.ogg
- SILENCE: 5.0s
- SAY: Long a.
- CLIP: aa.ogg
- SILENCE: 5.0s
- SAY: Step five. Eyes soft. Internal only.
- SAY: Think short a. Forehead lights. No mouth movement.
- SILENCE: 7.0s
- SAY: Think long a. Mouth and face lights.
- SILENCE: 7.0s
- SAY: Think short a again.
- SILENCE: 6.0s
- SAY: Think long a.
- SILENCE: 6.0s
- SAY: Step six. Glyph, if the last step was stable.
- SAY: See the Devanagari letter A, while you say short a. Forehead.
- CLIP: a.ogg
- SILENCE: 7.0s
- SAY: See the long A letter, while you say long a. Mouth.
- CLIP: aa.ogg
- SILENCE: 7.0s
- SAY: One more each. Letter, sound, locus together.
- CLIP: a.ogg
- SILENCE: 6.0s
- CLIP: aa.ogg
- SILENCE: 6.0s
- SAY: Step seven. Aham contraction.
- SAY: Stop chanting. Natural breath.
- SILENCE: 3.0s
- SAY: A. Forehead. Emergence.
- SILENCE: 4.0s
- SAY: Ha. Terminal edge.
- SILENCE: 4.0s
- SAY: M. Bindu. Crown.
- SILENCE: 4.0s
- SAY: Let the field contract to the sense of I.
- SAY: Rest. No forcing.
- SILENCE: 20.0s
- SAY: If it rises, let the field expand once. Then stop.
- SAY: Step eight. Close.
- SAY: One line log. Pair a and long a. Was each locus clear?
- SAY: Any tension? End of night one.
- SILENCE: 3.0s
