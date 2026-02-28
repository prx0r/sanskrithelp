#!/usr/bin/env node
/**
 * Standalone RAG test - bypasses Next.js to isolate embed + Chroma
 * Run: node scripts/test-rag.mjs "what is guna"
 */
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const EMBED_URL = "https://chutes-qwen-qwen3-embedding-8b.chutes.ai";
const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const CHUTES_KEY = process.env.CHUTES_API_KEY || process.env.CHUTES_API_TOKEN;

async function embed(text) {
  const prefixed = `Instruct: Given a question about Sanskrit grammar, retrieve the most relevant rule or explanation\nQuery: ${text}`;
  const payloads = [
    { input: prefixed, model: null },
    { input: [prefixed], model: null },
    { model: null, input: [prefixed] },
  ];
  let res;
  for (const payload of payloads) {
    res = await fetch(`${EMBED_URL}/v1/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHUTES_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) break;
  }
  if (!res.ok) throw new Error(`Embed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data?.[0]?.embedding;
}

async function main() {
  const q = process.argv[2] || "what is guna";
  if (!CHUTES_KEY) {
    console.error("Set CHUTES_API_KEY or CHUTES_API_TOKEN in .env.local");
    process.exit(1);
  }

  console.log("1. Embedding query (8B endpoint)...");
  const vec = await embed(q);
  console.log("   Embedding dim:", vec?.length);

  console.log("2. Querying Chroma (using chromadb client)...");
  const { ChromaClient } = await import("chromadb");
  const client = new ChromaClient({ path: CHROMA_URL });
  let col;
  try {
    col = await client.getCollection({ name: "sanskrit" });
  } catch (e) {
    const cols = await client.listCollections();
    col = cols.find((c) => c.name === "sanskrit");
    if (!col) throw new Error("Collection 'sanskrit' not found. Run: python rag/build_sanskrit_rag.py --build");
  }
  const res = await col.query({
    queryEmbeddings: [vec],
    nResults: 3,
    include: ["documents", "metadatas", "distances"],
  });
  const docs = res.documents?.[0] ?? [];
  console.log("\n3. Top results:", docs.length);
  docs.forEach((d, i) => console.log(`   [${i + 1}]`, d?.slice?.(0, 80) + "..."));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
