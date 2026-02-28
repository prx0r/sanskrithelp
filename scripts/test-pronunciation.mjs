#!/usr/bin/env node
/**
 * Internal test: pronunciation page + TTS API
 * Run: node scripts/test-pronunciation.mjs
 */
const BASE = "http://localhost:3003";

async function test(name, fn) {
  try {
    const start = Date.now();
    await fn();
    console.log(`✓ ${name} (${Date.now() - start}ms)`);
    return true;
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log("Testing pronunciation flow...\n");

  let ok = await test("1. Home page loads", async () => {
    const r = await fetch(`${BASE}/`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  });

  ok = (await test("2. Pronunciation page loads", async () => {
    const r = await fetch(`${BASE}/learn/pronunciation`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    if (!html.includes("Śabdakrīḍā")) throw new Error("Page content missing");
  })) && ok;

  ok = (await test("3. TTS API (proxy to Sabdakrida:8010)", async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
    const r = await fetch(`${BASE}/api/sabdakrida/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "namaste", style: "narration" }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j?.error || `HTTP ${r.status}`);
    }
    const blob = await r.blob();
    if (blob.size < 100) throw new Error(`Small response: ${blob.size} bytes`);
  })) && ok;

  console.log(ok ? "\n✓ All tests passed." : "\n⚠ Some tests failed. See above.");
  process.exit(ok ? 0 : 1);
}

main();
