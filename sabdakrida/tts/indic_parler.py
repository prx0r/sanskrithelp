"""
Sanskrit TTS — indic-parler-tts wrapper with style prompts.

Model expects Devanagari input for best results. IAST is converted automatically.
"""

import asyncio
import io
import os
import re
import tempfile
from functools import partial

import numpy as np
import soundfile as sf

from indic_transliteration import sanscript
import torch
from transformers import AutoTokenizer

_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]+")
# Punctuation that signals end of utterance (reduce TTS continuation/hallucination)
_END_PUNCT = set(".!?।॥,;:")
# Max sec per character — trim audio if model generates way beyond this
_SEC_PER_CHAR = 0.2


def _to_devanagari(text: str) -> str:
    """Convert IAST to Devanagari. indic-parler-tts works best with Devanagari."""
    text = text.strip()
    if not text:
        return text
    if _DEVANAGARI_RE.search(text) and not re.search(r"[a-zA-Zāīūṛṝḷḹṃḥṭḍṇśṣ]", text):
        return text  # Already Devanagari
    try:
        return sanscript.transliterate(text, sanscript.IAST, sanscript.DEVANAGARI)
    except Exception:
        return text  # Fallback: use as-is


# Aryan voice — single consistent speaker for Sanskrit (indic-parler-tts speaker description)
# See: https://huggingface.co/ai4bharat/indic-parler-tts
# Use explicit male speaker + fixed traits to avoid voice switching across calls
ARYAN_VOICE = (
    "A male speaker named Aryan with a clear, measured voice. "
    "Ideal for Sanskrit recitation. Very close recording, almost no background noise. "
    "Consistent tone and timbre throughout."
)

STYLE_PROMPTS = {
    "command": f"{ARYAN_VOICE} Firm, authoritative tone.",
    "praise": f"{ARYAN_VOICE} Warm, encouraging tone.",
    "narration": f"{ARYAN_VOICE} Clear, measured pace for demonstration.",
}

_model = None
_tokenizer = None
_description_tokenizer = None

# Cache (text, style) -> WAV bytes — feedback phrases repeat, cache avoids slow TTS
_tts_cache: dict[tuple[str, str], bytes] = {}


def _load_tts():
    global _model, _tokenizer, _description_tokenizer
    if _model is None:
        from parler_tts import ParlerTTSForConditionalGeneration

        device = "cuda" if torch.cuda.is_available() else "cpu"
        _model = ParlerTTSForConditionalGeneration.from_pretrained(
            "ai4bharat/indic-parler-tts"
        ).to(device)
        _tokenizer = AutoTokenizer.from_pretrained("ai4bharat/indic-parler-tts")
        _description_tokenizer = AutoTokenizer.from_pretrained(
            _model.config.text_encoder._name_or_path
        )
    return _model, _tokenizer, _description_tokenizer


def _synthesize_sync(text: str, style: str = "command", save: bool = False):
    model, tokenizer, desc_tokenizer = _load_tts()
    description = STYLE_PROMPTS.get(style, STYLE_PROMPTS["narration"])
    device = next(model.parameters()).device

    devanagari_text = _to_devanagari(text)
    # For short prompts without end punctuation, add Devanagari danda to reduce TTS continuation
    text_stripped = text.strip()
    if (
        len(text_stripped) < 25
        and text_stripped
        and text_stripped[-1] not in _END_PUNCT
    ):
        devanagari_text = (devanagari_text.rstrip() + " ।").strip()

    desc_inputs = desc_tokenizer(description, return_tensors="pt").to(device)
    prompt_inputs = tokenizer(devanagari_text, return_tensors="pt").to(device)

    with torch.no_grad():
        generation = model.generate(
            input_ids=desc_inputs.input_ids,
            attention_mask=desc_inputs.attention_mask,
            prompt_input_ids=prompt_inputs.input_ids,
            prompt_attention_mask=prompt_inputs.attention_mask,
        )

    audio_arr = np.asarray(generation.cpu().numpy().squeeze(), dtype=np.float32)
    if audio_arr.ndim < 2:
        audio_arr = np.reshape(audio_arr, (-1, 1))  # (n,) or scalar -> (n, 1) for soundfile
    sr = model.config.sampling_rate

    # Trim hallucinated tail: for short text, cap duration to avoid random extra speech
    n_samples = audio_arr.shape[0]
    max_samples = int((0.5 + _SEC_PER_CHAR * max(1, len(text_stripped))) * sr)
    if n_samples > max_samples:
        audio_arr = audio_arr[:max_samples]

    if save:
        fd, out_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)
        sf.write(out_path, audio_arr, sr)
        return out_path

    buf = io.BytesIO()
    sf.write(buf, audio_arr, sr, format="WAV")
    return buf.getvalue()


async def tts_speak(text: str, style: str = "command", save: bool = False) -> bytes | str:
    """Synthesize Sanskrit text to speech. Returns WAV bytes or path if save=True."""
    key = (text.strip(), style)
    if not save and key in _tts_cache:
        return _tts_cache[key]
    loop = asyncio.get_event_loop()
    out = await loop.run_in_executor(
        None, partial(_synthesize_sync, text, style, save)
    )
    if not save and isinstance(out, bytes):
        _tts_cache[key] = out
    return out
