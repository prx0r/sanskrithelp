/**
 * Sanskrit RAG — ChromaDB retrieval + Chutes embedding
 * Requires: Chroma server running (chroma run --path ./sanskrit_db)
 * Env: CHUTES_API_KEY, CHROMA_URL (default http://localhost:8000)
 */

const EMBED_URL = "https://chutes-qwen-qwen3-embedding-8b.chutes.ai";
const EMBED_MODEL = "Qwen/Qwen3-Embedding-8B";
const QUERY_INSTRUCTION =
  "Given a question about Sanskrit grammar, retrieve the most relevant rule or explanation";

export type SanskritChunk = {
  text: string;
  meta: { source: string; type: string; ref: string; chapter: string; topic: string };
  distance?: number;
};

export async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.CHUTES_API_KEY ?? process.env.CHUTES_API_TOKEN;
  if (!apiKey) throw new Error("CHUTES_API_KEY or CHUTES_API_TOKEN not configured");
  const prefixed = `Instruct: ${QUERY_INSTRUCTION}\nQuery: ${text}`;
  // Chutes 8B: model required, outputs 4096 dims; index must be built with 8B
  const payloads = [
    { input: prefixed, model: EMBED_MODEL },
    { input: [prefixed], model: EMBED_MODEL },
  ];
  let lastErr = "";
  for (const payload of payloads) {
    try {
      const res = await fetch(`${EMBED_URL}/v1/embeddings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as { data?: Array<{ embedding: number[] }> };
        const emb = data.data?.[0]?.embedding;
        if (emb) return emb;
      }
      lastErr = await res.text();
    } catch (_) {
      continue;
    }
  }
  throw new Error(`Embedding failed: ${lastErr}`);
}

export async function retrieve(
  query: string,
  n = 5,
  filter?: Record<string, string>
): Promise<SanskritChunk[]> {
  const embedding = await embedQuery(query);
  const { ChromaClient } = await import("chromadb");
  const chromaUrl = process.env.CHROMA_URL ?? "http://localhost:8000";
  const client = new ChromaClient({ path: chromaUrl });
  let col;
  try {
    col = await client.getCollection({ name: "sanskrit" });
  } catch (e) {
    const msg = String(e);
    if (msg.includes("UUID") || msg.includes("not a valid")) {
      const cols = await client.listCollections();
      col = cols.find((c) => (c as { name?: string }).name === "sanskrit");
      if (!col) throw e;
    } else {
      throw e;
    }
  }
  const where = filter ? (Object.keys(filter).length ? filter : undefined) : undefined;
  const res = await col.query({
    queryEmbeddings: [embedding],
    nResults: n,
    include: ["documents", "metadatas", "distances"],
    where,
  });
  const docs = res.documents?.[0] ?? [];
  const metas = res.metadatas?.[0] ?? [];
  const dists = res.distances?.[0] ?? [];
  return docs
    .map((text, i) => ({
      text: text ?? "",
      meta: (metas[i] ?? {}) as SanskritChunk["meta"],
      distance: dists[i] ?? undefined,
    }))
    .filter((c) => c.text.length > 0);
}
