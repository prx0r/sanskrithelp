/** Quick smoke test for Sabdakrida + pronunciation flow */
const tests = [];

async function test(name, fn) {
  try {
    const result = await fn();
    tests.push({ name, ok: true, result });
  } catch (e) {
    tests.push({ name, ok: false, error: e.message });
  }
}

// 1. Sabdakrida backend (8010)
await test("Sabdakrida backend (8010) responds", async () => {
  const r = await fetch("http://127.0.0.1:8010/");
  if (!r.ok) throw new Error(r.status);
  return "OK";
});

// 2. TTS endpoint directly on Sabdakrida
await test("Sabdakrida TTS direct", async () => {
  const fd = new FormData();
  fd.append("text", "namaste");
  fd.append("style", "narration");
  const r = await fetch("http://127.0.0.1:8010/tts", {
    method: "POST",
    body: fd,
  });
  if (!r.ok) throw new Error(await r.text());
  const blob = await r.blob();
  return `${blob.size} bytes audio`;
});

// 3. Next.js dev server (try 3000 or 3003)
let NEXT_PORT = null;
for (const port of [3000, 3003]) {
  try {
    const r = await fetch(`http://localhost:${port}/`);
    if (r.ok) { NEXT_PORT = port; break; }
  } catch {}
}
await test("Next.js dev server responds", async () => {
  if (!NEXT_PORT) throw new Error("Next.js not on 3000 or 3003");
  return `OK (port ${NEXT_PORT})`;
});

// 4. Pronunciation page
await test("Pronunciation page loads", async () => {
  if (!NEXT_PORT) throw new Error("Next.js not running");
  const r = await fetch(`http://localhost:${NEXT_PORT}/learn/pronunciation`);
  if (!r.ok) throw new Error(r.status);
  const html = await r.text();
  return html.includes("Śabdakrīḍā") ? "OK" : "Missing expected content";
});

// 5. TTS via Next.js proxy
await test("TTS via Next.js proxy", async () => {
  const r = await fetch(`http://localhost:${NEXT_PORT}/api/sabdakrida/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "namaste", style: "narration" }),
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || r.statusText);
  }
  const blob = await r.blob();
  return `${blob.size} bytes audio`;
});

// 6. Session endpoint (Mode 1 - needs audio, so we just check it exists)
await test("Session endpoint exists", async () => {
  const fd = new FormData();
  fd.append("target_text", "namaste");
  fd.append("user_id", "test");
  const r = await fetch(`http://localhost:${NEXT_PORT}/api/sabdakrida/session`, {
    method: "POST",
    body: fd,
  });
  if (r.status === 422 || r.status === 400) return "OK (expects audio)";
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || r.statusText);
  }
  return "OK";
});

tests.forEach((t) =>
  console.log(t.ok ? "✓" : "✗", t.name, t.ok ? t.result : t.error)
);
const passed = tests.filter((t) => t.ok).length;
console.log(`\n${passed}/${tests.length} tests passed`);
