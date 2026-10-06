export interface EdgeTTSOptions {
  text: string;
  voice?: string;
  rate?: number;
}

/** SSML for Edge TTS hi-IN-SwaraNeural. Pure — unit-tested. */
export function buildSSML({ text, voice = "hi-IN-SwaraNeural", rate = 0.9 }: EdgeTTSOptions): string {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="utf-8"?>
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="hi-IN">
  <voice name="${voice}">
    <prosody rate="${rate}">${esc}</prosody>
  </voice>
</speak>`;
}
