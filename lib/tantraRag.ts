/**
 * Tantra RAG — keyword search over Tantraloka, Layayoga, Vijñāna Bhairava texts.
 * Chunks and indexes the corpus at startup. No external API or vector DB needed.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

interface Chunk {
  text: string;
  source: string;
}

let corpus: Chunk[] | null = null;

function loadCorpus(): Chunk[] {
  if (corpus) return corpus;

  const ragDir = join(process.cwd(), "data", "rag");
  const chunks: Chunk[] = [];

  // Load .txt and .md files
  for (const f of ["layayoga.txt", "vijnana-bhairava.txt", "tantraloka-reference.md", "layayoga-reference.md", "tantraloka-decoded.md", "vijnana-bhairava-mapping.md", "36-tattvas.md", "tantrica2.md", "curriculum.md"]) {
    const path = join(ragDir, f);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf-8");
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 50);
    for (const p of paragraphs) {
      chunks.push({ text: p.trim(), source: f });
    }
  }

  // Load RO JSON files
  const rosDir = join(ragDir, "ros");
  if (existsSync(rosDir)) {
    for (const roDir of readdirSync(rosDir)) {
      const roPath = join(rosDir, roDir, "ro.json");
      if (!existsSync(roPath)) continue;
      try {
        const ro = JSON.parse(readFileSync(roPath, "utf-8"));
        const passages = ro.passages || ro.extracts || [];
        for (const p of passages) {
          const text = p.text || p.content || "";
          if (text.length > 50) {
            chunks.push({ text: text.trim(), source: `ro:${ro.id || roDir}` });
          }
        }
      } catch {}
    }
  }

  corpus = chunks;
  return chunks;
}

export interface RagResult {
  text: string;
  source: string;
  score: number;
}

export function searchTantra(query: string, maxResults = 5): RagResult[] {
  const chunks = loadCorpus();
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  if (terms.length === 0) return [];

  const scored: RagResult[] = chunks.map((c) => {
    const lower = c.text.toLowerCase();
    let score = 0;
    for (const term of terms) {
      const count = (lower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
      score += count;
    }
    // Boost for title/term matches in first 200 chars
    const header = lower.slice(0, 200);
    for (const term of terms) {
      if (header.includes(term)) score += 2;
    }
    return { text: c.text, source: c.source, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

export function getRagContext(query: string, maxResults = 3): string {
  const results = searchTantra(query, maxResults);
  if (results.length === 0) return "";

  return results
    .map((r) => `[Source: ${r.source}]\n${r.text.slice(0, 2000)}`)
    .join("\n\n---\n\n");
}
