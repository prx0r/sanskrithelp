/**
 * speakHindi: neural Edge TTS first, browser speechSynthesis fallback.
 * Blob URLs cached in-session so repeated drills don't refetch.
 */

const blobCache = new Map<string, string>();

function speakBrowser(text: string, rate = 0.82): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "hi-IN";
  utter.rate = rate;
  try {
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("hi"));
    if (voices.length > 0) utter.voice = voices[0];
  } catch {}
  window.speechSynthesis.speak(utter);
}

export async function speakHindi(text: string, rate = 0.9): Promise<"edge" | "browser"> {
  if (!text) return "browser";
  try {
    let url = blobCache.get(text);
    if (!url) {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "hi-IN-SwaraNeural", rate }),
      });
      const ct = res.headers.get("Content-Type") ?? "";
      if (res.ok && ct.includes("audio")) {
        url = URL.createObjectURL(await res.blob());
        blobCache.set(text, url);
      }
    }
    if (url) {
      await new Promise<void>((resolve) => {
        const audio = new Audio(url as string);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
      return "edge";
    }
  } catch {}
  speakBrowser(text, Math.min(rate, 0.9));
  return "browser";
}

export function clearSpeakCache(): void {
  for (const url of blobCache.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }
  blobCache.clear();
}
