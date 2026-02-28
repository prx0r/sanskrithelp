import { readFileSync } from "fs";
import { join } from "path";

const CHUNK_SIZE = 600;
const MAX_CHUNKS = 3;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";
  for (const p of paragraphs) {
    if (current.length + p.length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += (current ? "\n\n" : "") + p;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function searchSource(query: string): string[] {
  try {
    const sourcePath = join(process.cwd(), "source.txt");
    const text = readFileSync(sourcePath, "utf-8");
    const chunks = chunkText(text);
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);
    if (terms.length === 0) return [];

    const scored = chunks.map((chunk) => {
      const lower = chunk.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (lower.includes(term)) score += 1;
      }
      return { chunk, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CHUNKS)
      .map((s) => s.chunk);
  } catch {
    return [];
  }
}
