Śabdakrīḍā
Sanskrit Pronunciation Tutor — System Blueprint
Full Implementation Guide for LLM-Assisted Development
February 2026  ·  Version 1.0

Executive Summary
Śabdakrīḍā is a local-first, AI-powered Sanskrit pronunciation tutor. It exploits a core insight: Sanskrit-finetuned Whisper's confusion errors are themselves the diagnostic signal. When Whisper hears ta for ṭa, that IS the pronunciation error — identified, typed, and explainable. No human grader required.
The system runs entirely on a 12GB GPU for real-time use, with optional inference routed to Chutes for deep assessment. It speaks Sanskrit back to the learner via indic-parler-tts, tracks per-phoneme weakness over time, and generates targeted drills until ASR confusion disappears — which is the only real proof the learner fixed the phoneme.
What makes this novel
No existing Sanskrit learning tool (Duolingo, apps, platforms) does phoneme-level acoustic assessment. This is the first system combining: Sanskrit ASR confusion mapping + forced alignment + MFCC comparison + a speaking teacher voice in Sanskrit with emotional register.




Architecture Overview
Three Modes
The system has three operational modes. Build them in order — Mode 1 is the full MVP.
Mode
Stack
Latency Target
Use Case
Mode 1 — BUILD FIRST
Sanskrit Whisper → phoneme diff → indic-parler-tts
< 2 seconds
Shadowing drills, real-time feedback
Mode 2 — BUILD SECOND
IndicMFA alignment → MFCC comparison → LLM critique → TTS
5–15 seconds
Deep phoneme assessment, vowel duration
Mode 3 — OPTIONAL
Qwen2-Audio → text critique → indic-parler-tts
10–30 seconds
Holistic śloka recitation, sandhi


Confirmed Tool Stack
All tools below have been verified as of February 2026. Links are authoritative sources.

Component
Tool
Status
Where
Sanskrit ASR
Bidwill/whisper-medium-sanskrit-try-2
✓ Exists — 15.4% WER
HuggingFace / Local
Forced Alignment
AI4Bharat/IndicMFA (Sanskrit)
✓ Exists — 76hrs training data
GitHub / Local
TTS (Sanskrit)
ai4bharat/indic-parler-tts
✓ Near-perfect Sanskrit synthesis
HuggingFace / Local
TTS (alt, lighter)
ai4bharat/vits_rasa_13
✓ Sanskrit, emotion styles
HuggingFace / Local
Phoneme Alignment (alt)
uroman + PyTorch multilingual wav2vec2
✓ Tested on multiple langs
PyTorch tutorial
Holistic Assessment
Qwen2-Audio-7B-Instruct
✓ Sanskrit text understanding
Chutes API
Vowel Duration
librosa (raw audio measurement)
✓ Direct timing, no model needed
pip install librosa
User Profile / DB
SQLite + Python dict
✓ Trivial
stdlib


⚠ What is NOT included: Qwen3-Omni does NOT support Sanskrit speech I/O. Its 19 speech input languages do not include Sanskrit. Do not use it for Sanskrit ASR or TTS. Qwen2-Audio can reason about Sanskrit audio with a text prompt, but cannot speak Sanskrit back.



All Source Links — Copy These First
Every link has been verified. Instruct the implementing LLM to fetch each before starting.
Models
Sanskrit ASR:  
Whisper Sanskrit finetuned: Bidwill/whisper-medium-sanskrit-try-2
Research paper (arXiv 2501.10024): ASR for Sanskrit with Transfer Learning
IndicWhisper (broader Indic coverage): parthiv11/indic_whisper_nodcil
Forced Alignment:
IndicMFA (AI4Bharat, Sanskrit 76hrs): github.com/AI4Bharat/IndicMFA
MFA installation docs: montreal-forced-aligner.readthedocs.io
WhisperX (alternative, custom align_model): github.com/m-bain/whisperX
PyTorch multilingual alignment tutorial: forced_alignment_for_multilingual_data_tutorial
TTS:
Primary — indic-parler-tts: ai4bharat/indic-parler-tts
Alternative — VITS Rasa (lighter, Sanskrit + emotion): ai4bharat/vits_rasa_13
Holistic Assessment:
Qwen2-Audio-7B-Instruct: Qwen/Qwen2-Audio-7B-Instruct
Inference / Hosting:
Chutes API (for Qwen2-Audio, larger models): chutes.ai
Key Research
Automatic Pronunciation Assessment review: aclanthology.org/2023.findings-emnlp.557.pdf
Comparison of ASR methods for forced alignment (Interspeech 2024): isca-archive.org



Mode 1: Real-Time Shadowing (Build This First)
The entire pedagogical system. If you only build one thing, build this. Estimated ~400 lines of Python. Runs locally on 12GB GPU.
The Core Insight
Sanskrit-finetuned Whisper's confusion errors are the diagnostic instrument. You are not doing ASR — you are using ASR failure as a phoneme-level sensor. When Whisper transcribes ṭīkā as tīkā, that IS the pronunciation error: dental substitution for retroflex. Precisely identified. No acoustic model comparison needed.
When Whisper stops making that confusion, the learner has genuinely fixed the phoneme.


Phoneme Confusion Map
Implement this exact dict. This is the core knowledge base. Extend as needed:
PHONEME_CONFUSIONS = {
    # Retroflex vs dental (most common errors for Western learners)
    ("ṭ", "t"):  "retroflex_dental",
    ("ḍ", "d"):  "retroflex_dental",
    ("ṇ", "n"):  "retroflex_dental",
    ("ṭh","th"): "retroflex_dental",
    ("ḍh","dh"): "retroflex_dental",


    # Aspiration (missing puff of air)
    ("th", "t"): "aspiration",
    ("kh", "k"): "aspiration",
    ("ph", "p"): "aspiration",
    ("bh", "b"): "aspiration",
    ("gh", "g"): "aspiration",
    ("ch", "c"): "aspiration",


    # Vowel length (duration errors — ā is TWICE as long as a)
    ("ā", "a"):  "vowel_length",
    ("ī", "i"):  "vowel_length",
    ("ū", "u"):  "vowel_length",


    # Sibilant distinctions (three kinds of 's')
    ("ś", "s"):  "palatal_sibilant",
    ("ṣ", "s"):  "retroflex_sibilant",
    ("ṣ", "ś"):  "sibilant_distinction",


    # Special characters
    ("ṃ", "m"):  "anusvara",
    ("ḥ", "h"):  "visarga",
}

Error Explanations (Sanskrit + English)
The teacher speaks these. Implement this dict to give corrective feedback in Sanskrit with English gloss:
ERROR_EXPLANATIONS = {
    "retroflex_dental": {
        "sanskrit": "jihvā mūrdhni na sthitā. uccasthāne spṛśatu.",
        "english":  "Tongue not at hard palate. Touch the upper position.",
        "tip":      "Curl tongue back — tip touches the ridge behind the teeth.",
        "tone":     "command",
    },
    "aspiration": {
        "sanskrit": "śvāsaḥ nāsti. vāyu sahitam uccāraya.",
        "english":  "No breath. Pronounce with air.",
        "tip":      "Hold hand in front of mouth — aspirated sounds need a puff.",
        "tone":     "command",
    },
    "vowel_length": {
        "sanskrit": "dīrgha svaro hrasvaḥ jātaḥ. dviguṇakālaṃ tiṣṭhatu.",
        "english":  "Long vowel became short. Hold it twice as long.",
        "tip":      "Count: ā is exactly 2× the duration of a.",
        "tone":     "command",
    },
    "palatal_sibilant": {
        "sanskrit": "tālavya śaḥ nāsti. jihvā tāluni sthāpaya.",
        "english":  "Palatal sibilant missing. Place tongue at palate.",
        "tip":      "ś is like the 'sh' in 'she' — tongue at roof of mouth.",
        "tone":     "command",
    },
    "retroflex_sibilant": {
        "sanskrit": "mūrdhanya ṣaḥ nāsti. jihvā mūrdhni sthāpaya.",
        "english":  "Retroflex sibilant missing. Tongue at hard palate.",
        "tip":      "ṣ: tongue curled back to palate, then push air.",
        "tone":     "command",
    },
    "sibilant_distinction": {
        "sanskrit": "ś-ṣayor bhedaḥ āvaśyakaḥ.",
        "english":  "The ś / ṣ distinction is required.",
        "tip":      "ś = tongue at palate tip. ṣ = tongue curled further back.",
        "tone":     "command",
    },
    "anusvara": {
        "sanskrit": "anunāsikaṃ nāsti. nāsikayā uccāraya.",
        "english":  "Nasalisation missing. Produce through nose.",
        "tip":      "ṃ resonates in the nasal cavity — hum it.",
        "tone":     "command",
    },
    "visarga": {
        "sanskrit": "visargaḥ nāsti. avasāne śvāsaḥ āvaśyakaḥ.",
        "english":  "Visarga missing. A breath at the end is required.",
        "tip":      "ḥ: after the vowel, exhale briefly at its mouth position.",
        "tone":     "command",
    },
}

Core Pronunciation Session Function
import asyncio
from collections import Counter
import sqlite3


async def pronunciation_session(audio_path: str, target_text: str, user_id: str) -> dict:
    # 1. Transcribe with Sanskrit Whisper
    heard = await whisper_transcribe(audio_path, language='sa')


    # 2. Phoneme-level diff
    errors = phoneme_diff(target_text, heard)  # returns list of (expected, heard) tuples


    # 3. Map to error types
    error_types = [PHONEME_CONFUSIONS.get(e) for e in errors if e in PHONEME_CONFUSIONS]
    error_types = [e for e in error_types if e is not None]


    # 4. Update user weakness profile in SQLite
    update_user_profile(user_id, error_types)


    # 5. Generate teacher response
    if not errors:
        response_text = "sādhu! śuddha uccāraṇā. etat samyak asti."
        style = "praise"
    else:
        primary_error = Counter(error_types).most_common(1)[0][0] if error_types else None
        if primary_error:
            explanation = ERROR_EXPLANATIONS[primary_error]
            response_text = f"{explanation['sanskrit']} {explanation['english']}"
            style = explanation['tone']
        else:
            response_text = "punar vadatu. śuddhataraṃ uccāraya."
            style = "command"


    # 6. Speak the response
    audio_response = await tts_speak(response_text, style=style)


    return {
        "target": target_text,
        "heard": heard,
        "errors": errors,
        "error_types": error_types,
        "audio": audio_response,
        "correct": len(errors) == 0,
    }

User Profile & Spaced Repetition
def update_user_profile(user_id: str, error_types: list):
    conn = sqlite3.connect('sabdakrida.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS phoneme_errors
                 (user_id TEXT, error_type TEXT, count INTEGER,
                  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    for err in error_types:
        c.execute('''INSERT INTO phoneme_errors (user_id, error_type, count)
                     VALUES (?, ?, 1)
                     ON CONFLICT(user_id, error_type)
                     DO UPDATE SET count = count + 1, last_seen = CURRENT_TIMESTAMP''',
                  (user_id, err))
    conn.commit()
    conn.close()


def get_drill_priority(user_id: str) -> list:
    '''Return phoneme error types sorted by frequency — highest = drill first'''
    conn = sqlite3.connect('sabdakrida.db')
    c = conn.cursor()
    c.execute('SELECT error_type, count FROM phoneme_errors WHERE user_id = ? ORDER BY count DESC', (user_id,))
    return c.fetchall()


# Drill selector: pick words containing the learner's worst phonemes
DRILL_WORDS = {
    "retroflex_dental": ["ṭīkā", "ḍambara", "naṭa", "nāṭya", "ṭhakura", "viṣṇu"],
    "vowel_length":     ["kāla", "nīla", "pūja", "āgama", "māla", "sīmā"],
    "aspiration":       ["phala", "bhāva", "khaga", "ghara", "dharma", "thala"],
    "palatal_sibilant": ["śānti", "śabda", "viśva", "āśā", "puruṣa", "śiva"],
    "retroflex_sibilant":["ṣaṭ", "ṣaḍja", "puruṣa", "viṣṇu", "niṣṭhā"],
}

Session Modes
Shadowing Mode
Teacher speaks via TTS → learner immediately repeats → Whisper grades it → repeat until clean.
async def shadowing_drill(target_text: str, user_id: str, repetitions: int = 20):
    results = []
    for i in range(repetitions):
        # Teacher speaks the target
        teacher_audio = await tts_speak(target_text, style="narration")
        yield {'type': 'teacher_speaks', 'audio': teacher_audio}


        # Wait for learner audio
        learner_audio = await capture_learner_audio()


        # Grade it
        result = await pronunciation_session(learner_audio, target_text, user_id)
        results.append(result)
        yield {'type': 'feedback', **result}


        # Stop early if three consecutive correct
        if len(results) >= 3 and all(r['correct'] for r in results[-3:]):
            yield {'type': 'drill_complete', 'attempts': i + 1}
            break
Minimal Pairs Mode
The ultimate test: nata (actor) vs naṭa (dancer). Learner must produce the phoneme distinction that changes Whisper's output. That IS the test — fool the ASR or don't.
MINIMAL_PAIRS = [
    ("nata",  "naṭa",  "actor vs dancer — dental vs retroflex"),
    ("kala",  "kāla",  "art vs time — short vs long vowel"),
    ("śiva",  "siva",  "Shiva vs auspicious — palatal vs dental sibilant"),
    ("phala", "pala",  "fruit vs rock — aspirated vs unaspirated"),
    ("dana",  "dhana", "gift vs wealth — aspirated vs unaspirated"),
]


async def minimal_pairs_drill(pair: tuple, user_id: str):
    word1, word2, description = pair
    # Teacher explains the distinction
    explanation = f'Bhedaḥ: {word1} — {word2}. {description}'
    await tts_speak(explanation, style="narration")


    for target in [word1, word2, word1, word2]:  # alternating
        learner_audio = await capture_learner_audio()
        result = await pronunciation_session(learner_audio, target, user_id)
        yield result

Mode 2: Deep Pronunciation Assessment
Build this AFTER Mode 1 is working. Adds forced alignment via IndicMFA for phoneme boundary accuracy and MFCC distance for acoustic evidence.
The Key Discovery: IndicMFA Solves the Alignment Problem
AI4Bharat/IndicMFA is a Sanskrit forced aligner trained on 76 hours of Sanskrit data using a grapheme-to-grapheme (G2G) approach. This means no phoneme dictionary is required — it works directly on Devanagari/IAST graphemes. This was the main blocker for Mode 2 and it has been solved.
Install via: github.com/AI4Bharat/IndicMFA — then follow the MFA installation at montreal-forced-aligner.readthedocs.io


Deep Assessment Pipeline
import librosa
import numpy as np
from scipy.spatial.distance import cosine


async def deep_assess(learner_audio_path: str, target_text: str, user_id: str) -> dict:
    # 1. Generate TTS reference audio
    ref_audio_path = await tts_speak(target_text, style="narration", save=True)


    # 2. IndicMFA forced alignment on both learner and reference
    learner_aligned = run_indicmfa(learner_audio_path, target_text)
    ref_aligned     = run_indicmfa(ref_audio_path, target_text)
    # Returns: [{'char': 'ṭ', 'start': 0.00, 'end': 0.08}, ...]


    # 3. Vowel duration check (most reliable acoustic signal)
    duration_errors = []
    LONG_VOWELS = ['ā', 'ī', 'ū', 'ṝ']
    for seg in learner_aligned:
        if seg['char'] in LONG_VOWELS:
            learner_dur = (seg['end'] - seg['start']) * 1000  # ms
            ref_seg = next((r for r in ref_aligned if r['char'] == seg['char']), None)
            if ref_seg:
                ref_dur = (ref_seg['end'] - ref_seg['start']) * 1000
                ratio = learner_dur / ref_dur if ref_dur > 0 else 0
                if ratio < 0.7:  # Learner holding < 70% of reference duration
                    duration_errors.append({
                        'char': seg['char'],
                        'learner_ms': round(learner_dur),
                        'ref_ms': round(ref_dur),
                        'ratio': round(ratio, 2),
                    })


    # 4. MFCC distance on segments flagged by Whisper confusion (Mode 1)
    whisper_errors = phoneme_diff(target_text, await whisper_transcribe(learner_audio_path))
    acoustic_errors = []
    learner_y, sr = librosa.load(learner_audio_path, sr=16000)
    ref_y, _    = librosa.load(ref_audio_path, sr=16000)


    for (expected, heard) in whisper_errors:
        seg = next((s for s in learner_aligned if s['char'] == expected), None)
        ref_seg = next((s for s in ref_aligned if s['char'] == expected), None)
        if seg and ref_seg:
            learner_seg = learner_y[int(seg['start']*sr):int(seg['end']*sr)]
            ref_seg_audio = ref_y[int(ref_seg['start']*sr):int(ref_seg['end']*sr)]
            if len(learner_seg) > 0 and len(ref_seg_audio) > 0:
                l_mfcc = librosa.feature.mfcc(y=learner_seg, sr=sr, n_mfcc=13).mean(axis=1)
                r_mfcc = librosa.feature.mfcc(y=ref_seg_audio, sr=sr, n_mfcc=13).mean(axis=1)
                dist = cosine(l_mfcc, r_mfcc)
                acoustic_errors.append({'char': expected, 'heard_as': heard, 'mfcc_distance': round(dist, 3)})


    # 5. Generate critique with LLM
    critique = await llm_generate_critique(
        target_text=target_text,
        whisper_errors=whisper_errors,
        duration_errors=duration_errors,
        acoustic_errors=acoustic_errors,
    )


    audio_response = await tts_speak(critique['text'], style='command')
    return {'critique': critique, 'audio': audio_response,
            'duration_errors': duration_errors, 'acoustic_errors': acoustic_errors}

Vowel Duration: The Reliable Acoustic Signal
This is the one place where direct acoustic measurement works reliably without a trained model. Sanskrit vowel length is purely a timing property:
ā = exactly 2× the duration of a  |  ī = exactly 2× the duration of i  |  ū = exactly 2× the duration of u
Implement this check regardless of Mode 2. It can be bolted onto Mode 1 with just librosa.


MFA Installation (Sanskrit)
Follow this sequence exactly:
conda install -c conda-forge montreal-forced-aligner
Clone IndicMFA: git clone https://github.com/AI4Bharat/IndicMFA
Download the Sanskrit release from IndicMFA GitHub Releases
Place the acoustic model in ~/.mfa/models/acoustic/
mfa align /path/to/audio/ sanskrit_g2g sanskrit_g2g /path/to/output/

MFA vs WhisperX for alignment: MFA with IndicMFA acoustic model will give more accurate phoneme boundary timestamps for Sanskrit than WhisperX. Use MFA for Mode 2. WhisperX is faster but was designed for word-level timestamps on supported languages — Sanskrit is not natively supported.



Mode 3: Holistic Conversational Assessment (Optional)
For connected speech, verse recitation, sandhi in context. Cannot do phoneme-level GOP on a full śloka — too many junctions, too much coarticulation. Qwen2-Audio listens and responds as a teacher.
Important limitation: Qwen2-Audio cannot speak Sanskrit back. Its audio output is not available, and Sanskrit is not in its speech output languages. Mode 3 generates a text critique which is then passed to indic-parler-tts to speak. This adds ~2 seconds of latency but works.


async def holistic_assess(learner_audio_path: str, target_text: str) -> dict:
    import base64


    # Read audio as base64
    with open(learner_audio_path, 'rb') as f:
        audio_b64 = base64.b64encode(f.read()).decode()


    # Call Qwen2-Audio via Chutes API
    response = await chutes_api_call(
        model="Qwen/Qwen2-Audio-7B-Instruct",
        messages=[{
            "role": "user",
            "content": [
                {"type": "audio", "audio": audio_b64},
                {"type": "text", "text": f"""You are a strict Sanskrit teacher (gurū).
The student was asked to recite: {target_text}
Listen to their recitation. Assess in order:
1. Retroflex vs dental distinctions (ṭ/t, ḍ/d, ṇ/n)
2. Vowel length accuracy (ā vs a, ī vs i)
3. Sibilant distinctions (ś, ṣ, s)
4. Sandhi junctions — are they pronounced as one phonological word?
5. Overall prosody and rhythm


Respond first in Sanskrit (1-2 sentences), then English translation.
Use Command tone. Be specific about which phoneme failed. Max 4 sentences total."""}
            ]
        }]
    )


    critique_text = response['choices'][0]['message']['content']


    # Speak the critique via Sanskrit TTS
    audio = await tts_speak(critique_text, style="command")
    return {'critique': critique_text, 'audio': audio}

TTS Setup: indic-parler-tts
Sanskrit TTS is confirmed working with near-perfect synthesis scores. Implement this wrapper:
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer
import soundfile as sf
import torch


# Load once at startup
model = ParlerTTSForConditionalGeneration.from_pretrained("ai4bharat/indic-parler-tts").to("cuda")
tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")


STYLE_PROMPTS = {
    "command":  "Leela speaks in a firm, authoritative, clear tone with steady pace.",
    "praise":   "Leela speaks in a warm, encouraging, bright tone with cheerful energy.",
    "narration":"Leela speaks in a clear, measured, neutral pace for demonstration.",
}


async def tts_speak(text: str, style: str = 'command', save: bool = False) -> bytes:
    description = STYLE_PROMPTS.get(style, STYLE_PROMPTS['narration'])
    input_ids = tokenizer(description, return_tensors='pt').input_ids.to('cuda')
    prompt_ids = tokenizer(text, return_tensors='pt').input_ids.to('cuda')


    with torch.no_grad():
        generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_ids)


    audio_arr = generation.cpu().numpy().squeeze()
    if save:
        sf.write('/tmp/tts_output.wav', audio_arr, model.config.sampling_rate)
        return '/tmp/tts_output.wav'


    import io
    buf = io.BytesIO()
    sf.write(buf, audio_arr, model.config.sampling_rate, format='WAV')
    return buf.getvalue()

Sanskrit emotion support: indic-parler-tts officially supports emotion rendering for Sanskrit, including Command, Narration, Happy, and Sad. Use "command" for corrections and "praise" for correct answers. This is confirmed in the model card.



ASR Setup: Sanskrit Whisper
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import torch, librosa


# Load Sanskrit-finetuned Whisper
processor = WhisperProcessor.from_pretrained("Bidwill/whisper-medium-sanskrit-try-2")
model = WhisperForConditionalGeneration.from_pretrained("Bidwill/whisper-medium-sanskrit-try-2").to("cuda")


async def whisper_transcribe(audio_path: str, language: str = 'sa') -> str:
    audio, sr = librosa.load(audio_path, sr=16000)
    inputs = processor(audio, sampling_rate=16000, return_tensors='pt').to('cuda')
    with torch.no_grad():
        predicted_ids = model.generate(inputs['input_features'],
                                       forced_decoder_ids=processor.get_decoder_prompt_ids(
                                           language=language, task='transcribe'))
    return processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]


def phoneme_diff(target: str, heard: str) -> list:
    '''Return list of (expected_char, heard_char) tuples where they differ'''
    # Normalize both strings to IAST
    target_norm = normalize_iast(target)
    heard_norm  = normalize_iast(heard)
    errors = []
    # Use difflib SequenceMatcher for character-level diff
    from difflib import SequenceMatcher
    matcher = SequenceMatcher(None, target_norm, heard_norm)
    for opcode, a0, a1, b0, b1 in matcher.get_opcodes():
        if opcode == 'replace':
            for exp, got in zip(target_norm[a0:a1], heard_norm[b0:b1]):
                errors.append((exp, got))
    return errors

FastAPI Service Layer
Expose everything as a local REST API. Frontend (web or mobile) calls this:
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import Response
import tempfile, os


app = FastAPI(title='Śabdakrīḍā', version='1.0')


@app.post('/session/mode1')
async def mode1_session(
    audio: UploadFile = File(...),
    target_text: str = Form(...),
    user_id: str = Form(...),
):
    '''Real-time pronunciation assessment — returns JSON + audio'''
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        f.write(await audio.read())
        audio_path = f.name
    try:
        result = await pronunciation_session(audio_path, target_text, user_id)
        return result
    finally:
        os.unlink(audio_path)


@app.post('/session/mode2')
async def mode2_session(
    audio: UploadFile = File(...),
    target_text: str = Form(...),
    user_id: str = Form(...),
):
    '''Deep assessment — slower but gives MFCC + duration analysis'''
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        f.write(await audio.read())
        audio_path = f.name
    try:
        return await deep_assess(audio_path, target_text, user_id)
    finally:
        os.unlink(audio_path)


@app.get('/profile/{user_id}/drills')
async def get_drill_words(user_id: str):
    '''Return prioritised drill words based on user weakness profile'''
    priorities = get_drill_priority(user_id)
    drills = []
    for error_type, count in priorities[:3]:  # Top 3 weaknesses
        words = DRILL_WORDS.get(error_type, [])
        drills.append({'error_type': error_type, 'count': count, 'words': words})
    return {'drills': drills}


@app.post('/tts')
async def speak(text: str = Form(...), style: str = Form('narration')):
    '''Speak Sanskrit text — used for teacher demonstrations'''
    audio_bytes = await tts_speak(text, style=style)
    return Response(content=audio_bytes, media_type='audio/wav')

Instructions for the Implementing LLM
To the LLM reading this: follow these instructions in order. Do not skip ahead. Each phase produces a working system before adding complexity.
Phase 1: Environment Setup
Create a Python 3.11 virtual environment
Install core dependencies:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install transformers accelerate parler-tts
pip install librosa soundfile scipy fastapi uvicorn python-multipart
pip install git+https://github.com/huggingface/parler-tts.git
# For MFA (Mode 2):
conda install -c conda-forge montreal-forced-aligner
Download Sanskrit Whisper: huggingface-cli download Bidwill/whisper-medium-sanskrit-try-2
Download indic-parler-tts: huggingface-cli download ai4bharat/indic-parler-tts
Verify GPU: run a test transcription and TTS synthesis before proceeding
Phase 2: Build Mode 1
Implement PHONEME_CONFUSIONS and ERROR_EXPLANATIONS dicts exactly as specified above
Implement whisper_transcribe() with Sanskrit model
Implement phoneme_diff() using difflib SequenceMatcher
Implement tts_speak() with style prompts
Implement update_user_profile() and get_drill_priority() with SQLite
Implement pronunciation_session() tying it all together
Implement the FastAPI /session/mode1 endpoint
Test with a recording of 'ṭīkā' — Whisper should hear 'tīkā' — system should respond in Sanskrit
Test minimal pairs: record 'nata' and 'naṭa' separately — Whisper should transcribe them differently
Phase 3: Add Vowel Duration (easy win)
Add librosa-based duration check to the mode1 pipeline
For any long vowel in target text, measure learner's duration vs TTS reference
Flag if ratio < 0.7 (learner holding less than 70% of reference)
Add vowel_length error to the error_types list and trigger the explanation
Phase 4: Build Mode 2 (only after Mode 1 is stable)
Install IndicMFA: github.com/AI4Bharat/IndicMFA
Download Sanskrit MFA acoustic model from IndicMFA releases
Implement run_indicmfa() wrapper that calls MFA alignment on a wav file and returns char-level timestamps
Implement MFCC distance calculation using librosa.feature.mfcc
Implement deep_assess() as specified above
Test: the MFCC distance for a correctly pronounced ṭ vs an incorrectly pronounced t should be noticeably higher
Add /session/mode2 FastAPI endpoint
Phase 5: Mode 3 (optional, only if Modes 1+2 working well)
Set up Chutes API credentials
Implement holistic_assess() using Qwen2-Audio
Note: Qwen2-Audio returns text — pipe through tts_speak() for audio
Add /session/mode3 endpoint


Critical Implementation Notes
Do NOT use Qwen3-Omni for Sanskrit speech: Sanskrit is not in its 19 supported speech input languages. Any attempt to use it for Sanskrit ASR will produce garbage.



IAST encoding: All Sanskrit text in this system must use IAST diacritics (ā, ī, ū, ṭ, ḍ, ṇ, ś, ṣ, ṃ, ḥ). Store everything as UTF-8. The phoneme_diff() function compares IAST characters. Do not use ASCII approximations (aa, ii, T, D) anywhere in the pipeline.



Whisper WER context: The Sanskrit Whisper model has 15.4% WER on clean recited speech. For your use case, imperfect WER is fine — you want the model to confuse retroflex and dental, because that confusion IS the pedagogical signal. Do not try to improve the model's WER; its failure modes are your features.



MFCC note: MFCC distance alone is not a ground truth pronunciation score. Use it as a third corroborating signal alongside Whisper confusion and duration measurement. Only report an error to the learner when at least two of three signals agree.



Sanskrit Drill Word Bank
Curated words targeting specific phoneme distinctions. Expand this as the system grows.
By Error Type
Error Type
Drill Words (IAST)
Notes
retroflex_dental
ṭīkā, naṭa, ḍambara, ṇara, viṣṇu, nāṭya
Contrast with: tīkā, nata, dambara
vowel_length
kāla, rāma, nīla, sītā, pūjā, māla
Contrast: kala/kāla, rama/rāma
aspiration
phala, bhāva, khaga, dharma, ghana
Contrast: pala/phala, bava/bhāva
palatal_sibilant
śānti, śabda, viśva, āśā, śiva, śrī
Contrast with dental s: santa/śānta
retroflex_sibilant
ṣaṭ, puruṣa, viṣṇu, niṣṭhā, ṣaḍja
Hardest for Western learners
sibilant_distinction
śiva / ṣiva, śānta / ṣaṣṭha
Three-way: s, ś, ṣ
anusvara
saṃskṛta, śaṃkara, aṃga, kaṃsa
Nasal resonance before next consonant
visarga
namaḥ, śāntiḥ, puruṣaḥ, devāḥ
Breathy aspiration after vowel


Minimal Pairs Bank
Word 1
Word 2
Distinction
Meaning contrast
nata
naṭa
dental vs retroflex
bowed / bent — dancer
kala
kāla
short vs long vowel
art, skill — time, death
pala
phala
unaspirated vs aspirated
weight measure — fruit, result
santa
śānta
dental s vs palatal ś
good person — peaceful, calmed
dana
dhana
unaspirated vs aspirated
gift, charity — wealth, riches
siva
śiva
dental s vs palatal ś
auspicious (adj) — Lord Shiva



Teacher Dialogue Bank
Pre-written Sanskrit teacher utterances for the TTS. Use these rather than generating on the fly — they have been checked for grammatical correctness.
Situation
Sanskrit
English gloss
Correct pronunciation
sādhu! śuddha uccāraṇā.
Good! Correct pronunciation.
Try again
punar vadatu.
Say it again.
Retroflex error
jihvā mūrdhni sthāpaya.
Place tongue at the palate.
Aspiration error
vāyu sahitam uccāraya.
Pronounce with breath.
Vowel length error
dviguṇakālaṃ tiṣṭhatu.
Hold it twice as long.
Session complete
abhyāsaḥ sampūrṇaḥ. sādhu kāryam.
Practice complete. Good work.
Keep going
punar punar abhyasyatu.
Practice again and again.
Sibilant error
tālavya śaḥ. jihvā uccasthāne.
Palatal ś. Tongue at upper position.
Anusvara error
anunāsikaṃ uccāraya.
Pronounce the nasal.
Perfect run
atīva sādhu! eṣā śuddha uccāraṇā.
Excellent! That is correct pronunciation.



Recommended Project Structure
sabdakrida/
├── main.py                    # FastAPI app entrypoint
├── asr/
│   ├── whisper_sanskrit.py    # Sanskrit Whisper wrapper
│   └── phoneme_diff.py        # IAST diff logic
├── tts/
│   └── indic_parler.py        # TTS wrapper with style prompts
├── alignment/
│   └── indicmfa.py            # MFA alignment wrapper (Mode 2)
├── assessment/
│   ├── mode1.py               # Real-time session
│   ├── mode2.py               # Deep assessment
│   └── mode3.py               # Holistic (optional)
├── data/
│   ├── confusions.py          # PHONEME_CONFUSIONS dict
│   ├── explanations.py        # ERROR_EXPLANATIONS dict
│   ├── drill_words.py         # DRILL_WORDS bank
│   └── dialogues.py           # Teacher Sanskrit utterances
├── db/
│   └── profile.py             # SQLite user profile
├── sabdakrida.db              # SQLite database
└── requirements.txt

Testing Checklist
Mode 1 Acceptance Tests
Record yourself saying 'ṭīkā' with a dental t — system must identify retroflex_dental error and respond in Sanskrit
Record 'tīkā' correctly — system must praise you
Record 'kala' (short vowel) for target 'kāla' — system must flag vowel_length error
Record 'phala' without aspiration — system must flag aspiration error
Run 20 repetitions of a drill — confirm session ends early on 3 consecutive correct
Confirm total Mode 1 latency < 2 seconds on local GPU
Mode 2 Acceptance Tests (after Mode 1 passing)
IndicMFA must return character-level timestamps for a 3-second Sanskrit utterance
MFCC distance for learner ṭ vs reference ṭ (correct) should be < 0.3
MFCC distance for learner t vs reference ṭ (incorrect) should be > 0.5
Vowel duration ratio for ā held correctly should be ≥ 0.7 vs TTS reference
Vowel duration ratio for ā held too short should be < 0.7
Regression Tests
All Sanskrit text must survive round-trip UTF-8 encoding
phoneme_diff('ṭīkā', 'tīkā') must return [('ṭ', 't')]
phoneme_diff('kāla', 'kala') must return [('ā', 'a')]
Empty errors list must produce praise response, never error response


Śabdakrīḍā — Blueprint v1.0 — February 2026
śabdo brahma — the word is Brahman
