#!/usr/bin/env python3
"""Corpus ingestion stage 1: mp3 -> 16k wav -> silence segments -> Vosk draft JSONL.
Usage: python3 scripts/corpus_ingest.py <input.mp3> <outdir> [--model /path/to/vosk-model]
Output: outdir/segments.jsonl [{id, start, end, text, words:[{w,start,end,conf}]}]
Draft quality: vosk-small-hi. Production transcripts via hosted Whisper.
"""
import json, os, subprocess, sys, wave

def seg_wav(src, outdir, min_sil=0.7, thresh=-38):
    os.makedirs(outdir, exist_ok=True)
    wav = os.path.join(outdir, "audio-16k.wav")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-ar", "16000",
                    "-ac", "1", wav], check=True)
    probe = subprocess.run(
        ["ffmpeg", "-v", "info", "-i", wav, "-af",
         f"silencedetect=noise={thresh}dB:d={min_sil}", "-f", "null", "-"],
        capture_output=True, text=True)
    bounds, in_sil, sil_start = [], False, 0.0
    for line in probe.stderr.splitlines():
        if "silence_start" in line:
            in_sil, sil_start = True, float(line.split("silence_start:")[1].split()[0])
        elif "silence_end" in line and in_sil:
            in_sil = False
            sil_end = float(line.split("silence_end:")[1].split()[0])
            bounds.append((sil_start, sil_end))
    # utterances = gaps between silences
    segs, prev = [], 0.0
    dur = float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", wav],
        capture_output=True, text=True).stdout.strip())
    for a, b in bounds:
        if a - prev > 1.0:
            segs.append((prev, a))
        prev = b
    if dur - prev > 1.0:
        segs.append((prev, dur))
    # merge tiny segs forward (target >= 4s where possible)
    merged = []
    for s, e in segs:
        if merged and (e - merged[-1][0]) < 25 and (s - merged[-1][1]) < 3:
            merged[-1] = (merged[-1][0], e)
        else:
            merged.append((s, e))
    return wav, merged

def transcribe(model_path, wav, segs, outdir):
    from vosk import Model, KaldiRecognizer
    wf = wave.open(wav)
    assert wf.getframerate() == 16000 and wf.getnchannels() == 1
    raw = wf.readframes(wf.getnframes())
    m = Model(model_path)
    out = []
    for i, (s, e) in enumerate(segs):
        rec = KaldiRecognizer(m, 16000)
        rec.SetWords(True)
        a, b = int(s * 16000) * 2, int(e * 16000) * 2
        chunk = raw[a:b]
        for k in range(0, len(chunk), 32000):
            rec.AcceptWaveform(chunk[k:k + 32000])
        r = json.loads(rec.FinalResult())
        words = [{"w": w["word"], "start": round(s + w["start"], 2),
                  "end": round(s + w["end"], 2),
                  "conf": round(w.get("conf", 0), 2)} for w in r.get("result", [])]
        out.append({"id": f"u{i:04d}", "start": round(s, 2), "end": round(e, 2),
                    "text": r.get("text", ""), "words": words})
    with open(os.path.join(outdir, "segments.jsonl"), "w") as f:
        for o in out:
            f.write(json.dumps(o, ensure_ascii=False) + "\n")
    return out

def main():
    src, outdir = sys.argv[1], sys.argv[2]
    model = sys.argv[3] if len(sys.argv) > 3 else "/tmp/opencode/vosk-model-small-hi-0.22"
    wav, segs = seg_wav(src, outdir)
    print(f"segments: {len(segs)}, span {segs[0][0]:.0f}s..{segs[-1][1]:.0f}s")
    out = transcribe(model, wav, segs, outdir)
    with_text = sum(1 for o in out if o["text"].strip())
    print(f"utterances with text: {with_text}/{len(out)} -> {outdir}/segments.jsonl")

if __name__ == "__main__":
    main()
