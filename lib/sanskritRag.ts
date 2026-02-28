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
  _query: string,
  _n = 5,
  _filter?: Record<string, string>
): Promise<SanskritChunk[]> {
  // Embeddings/Chroma disabled for now
  return [];
}
