"""
Sanskrit TTS — indic-parler-tts wrapper with style prompts.
"""

import asyncio
import io
import os
import tempfile
from functools import partial

import numpy as np
import soundfile as sf
import torch
from transformers import AutoTokenizer

# Aryan voice — best for Sanskrit recitation (indic-parler-tts speaker description format)
# See: https://huggingface.co/ai4bharat/indic-parler-tts
ARYAN_VOICE = (
    "Aryan's voice is clear and measured, ideal for Sanskrit recitation, "
    "with a very close recording that almost has no background noise."
)

STYLE_PROMPTS = {
    "command": f"{ARYAN_VOICE} He speaks in a firm, authoritative tone.",
    "praise": f"{ARYAN_VOICE} He speaks in a warm, encouraging tone.",
    "narration": f"{ARYAN_VOICE} He speaks in a clear, measured pace for demonstration.",
}

_model = None
_tokenizer = None
_description_tokenizer = None


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

    desc_inputs = desc_tokenizer(description, return_tensors="pt").to(device)
    prompt_inputs = tokenizer(text, return_tensors="pt").to(device)

    with torch.no_grad():
        generation = model.generate(
            input_ids=desc_inputs.input_ids,
            attention_mask=desc_inputs.attention_mask,
            prompt_input_ids=prompt_inputs.input_ids,
            prompt_attention_mask=prompt_inputs.attention_mask,
        )

    audio_arr = generation.cpu().numpy().squeeze()
    if audio_arr.ndim == 1:
        audio_arr = np.expand_dims(audio_arr, axis=1)  # (n,) -> (n, 1) for soundfile
    sr = model.config.sampling_rate

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
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, partial(_synthesize_sync, text, style, save)
    )
