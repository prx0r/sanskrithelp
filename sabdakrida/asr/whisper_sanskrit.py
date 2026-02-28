"""
Sanskrit ASR — Bidwill/whisper-medium-sanskrit-try-2 wrapper.
Uses Whisper confusion errors as the diagnostic signal.
"""

import asyncio
from functools import partial

import librosa
import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration

# Lazy load to avoid import-time GPU allocation
_processor = None
_model = None


def _load_whisper():
    global _processor, _model
    if _processor is None:
        _processor = WhisperProcessor.from_pretrained("Bidwill/whisper-medium-sanskrit-try-2")
        _model = WhisperForConditionalGeneration.from_pretrained(
            "Bidwill/whisper-medium-sanskrit-try-2"
        ).to("cuda" if torch.cuda.is_available() else "cpu")
    return _processor, _model


def _transcribe_sync(audio_path: str, language: str = "sa") -> str:
    processor, model = _load_whisper()
    audio, sr = librosa.load(audio_path, sr=16000)
    inputs = processor(audio, sampling_rate=16000, return_tensors="pt").to(model.device)
    with torch.no_grad():
        predicted_ids = model.generate(
            inputs["input_features"],
            forced_decoder_ids=processor.get_decoder_prompt_ids(language=language, task="transcribe"),
        )
    return processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]


async def whisper_transcribe(audio_path: str, language: str = "sa") -> str:
    """Transcribe audio with Sanskrit-finetuned Whisper. Runs in thread pool to avoid blocking."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, partial(_transcribe_sync, audio_path, language)
    )
