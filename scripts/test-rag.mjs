#!/usr/bin/env node
/**
 * Test Sanskrit Q&A via Chutes Qwen3.5 (no Chroma).
 * Run: node scripts/test-rag.mjs "what is guna"
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const CHUTES_KEY = process.env.CHUTES_API_KEY || process.env.CHUTES_API_TOKEN;

async function main() {
  const q = process.argv[2] || "what is guna";
  if (!CHUTES_KEY) {
    console.error("Set CHUTES_API_KEY or CHUTES_API_TOKEN in .env.local");
    process.exit(1);
  }

  console.log("Querying Qwen3.5 via Chutes...");
  const res = await fetch("https://llm.chutes.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CHUTES_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "Qwen/Qwen3.5-397B-A17B-TEE",
      messages: [
        {
          role: "system",
          content:
            "You are a Sanskrit grammar tutor. Be concise. Cite Whitney or Pāṇini when you know them.",
        },
        { role: "user", content: q },
      ],
      temperature: 0.1,
      max_tokens: 400,
    }),
  });

  if (!res.ok) {
    console.error("Error:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  console.log("\nAnswer:\n", content);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
