/**
 * Sanskrit RAG — ChromaDB retrieval + Chutes Qwen3-Embedding-0.6B (1024 dims)
 * Requires: Chroma server running (chroma run --path ./sanskrit_db)
 * Env: CHUTES_API_KEY, CHROMA_URL (default http://localhost:8000)
 */

const EMBED_URL = "https://chutes-qwen-qwen3-embedding-0-6b.chutes.ai";
const EMBED_MODEL = "Qwen/Qwen3-Embedding-0.6B";
const QUERY_INSTRUCTION =
  "Given a question about Sanskrit grammar, retrieve the most relevant rule or explanation";

export type SanskritChunk = {
  text: string;
  meta: Record<string, string | number>;
  distance?: number;
};

export async function embedQuery(text: string): Promise<number[]> {
  const apiKey = process.env.CHUTES_API_KEY ?? process.env.CHUTES_API_TOKEN;
  if (!apiKey) throw new Error("CHUTES_API_KEY or CHUTES_API_TOKEN not configured");
  const prefixed = `Instruct: ${QUERY_INSTRUCTION}\nQuery: ${text}`;
  const payloads = [
    { input: prefixed, model: null },
    { input: [prefixed], model: EMBED_MODEL },
    { input: [prefixed], model: null },
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
  options?: { zone?: string; filter?: Record<string, string> }
): Promise<SanskritChunk[]> {
  const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";
  const zone = options?.zone ?? options?.filter?.zone;

  const embedding = await embedQuery(query);

  try {
    const { ChromaClient } = await import("chromadb");
    const client = new ChromaClient({ path: chromaUrl });
    const collection = await client.getCollection({ name: "sanskrit" });
    const where = zone ? { zone } : undefined;
    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: n,
      // @ts-expect-error chromadb IncludeEnum type mismatch; runtime accepts these
      include: ["documents", "metadatas", "distances"],
      ...(where && { where }),
    });

    const ids = results.ids?.[0] ?? [];
    const documents = results.documents?.[0] ?? [];
    const metadatas = results.metadatas?.[0] ?? [];
    const distances = results.distances?.[0] ?? [];

    return ids.map((_id: string, i: number) => ({
      text: documents[i] ?? "",
      meta: (metadatas[i] as Record<string, string | number>) ?? {},
      distance: distances[i] as number | undefined,
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("fetch") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("Failed to fetch")
    ) {
      throw new Error(
        "Chroma not reachable. Run: chroma run --path ./sanskrit_db"
      );
    }
    throw err;
  }
}
