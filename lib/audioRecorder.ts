/**
 * Voice-recording with optional VAD (1s silence auto-stop).
 * Outputs WAV base64 for Whisper compatibility.
 */

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

export interface RecorderOpts {
  sampleRate?: number;
  silenceThreshold?: number;
  silenceDurationMs?: number;
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private analyser: AnalyserNode | null = null;
  private silenceCheckInterval: ReturnType<typeof setInterval> | null = null;
  private onStop: ((b64: string) => void) | null = null;
  private opts: Required<RecorderOpts>;

  constructor(opts: RecorderOpts = {}) {
    this.opts = {
      sampleRate: opts.sampleRate ?? 16000,
      silenceThreshold: opts.silenceThreshold ?? 0.01,
      silenceDurationMs: opts.silenceDurationMs ?? 1000,
    };
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    source.connect(this.analyser);

    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start(100);
  }

  stop(onResult: (b64: string) => void): void {
    this.onStop = onResult;
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") return;
    this.mediaRecorder.onstop = () => this.processChunks();
    this.mediaRecorder.stop();
  }

  /** Auto-stop when silence detected for opts.silenceDurationMs */
  startVAD(onResult: (b64: string) => void): void {
    this.onStop = onResult;
    let lastSoundTime = Date.now();
    this.silenceCheckInterval = setInterval(() => {
      if (!this.analyser) return;
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
      if (avg > this.opts.silenceThreshold) lastSoundTime = Date.now();
      if (Date.now() - lastSoundTime >= this.opts.silenceDurationMs) {
        this.cancelVAD();
        this.stop(onResult);
      }
    }, 200);
  }

  cancelVAD(): void {
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
  }

  private async processChunks(): Promise<void> {
    this.cancelVAD();
    this.stream?.getTracks().forEach((t) => t.stop());
    if (!this.chunks.length || !this.onStop) return;

    const blob = new Blob(this.chunks, { type: "audio/webm" });
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    const wav = encodeWav(audioBuffer.getChannelData(0), audioBuffer.sampleRate);
    const bytes = new Uint8Array(wav);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const b64 = btoa(binary);
    this.onStop(b64);
  }
}
