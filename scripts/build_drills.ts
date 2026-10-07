import { readFileSync, writeFileSync } from "node:fs";
import { decompileHindi } from "../lib/memory/hindiDecompile";

const rows = readFileSync("data/language-resources/extracted/jiniac_commands.jsonl", "utf8")
  .trim().split("\n").map((l) => JSON.parse(l));
const drills: any[] = [];
const gaps: Record<string, number> = {};
for (const r of rows) {
  const d = decompileHindi(r.hindi);
  const machine = d.frameId ?? d.phraseId ?? d.constructionId ?? null;
  if (machine) {
    drills.push({ hindi: r.hindi, machine, verb: d.verbId, question: d.question });
  } else {
    const key = r.hindi.split(" ").slice(-2).join(" ");
    gaps[key] = (gaps[key] ?? 0) + 1;
  }
}
writeFileSync("public/memory/hindi/drills.json",
  JSON.stringify({ id: "jiniac-drills-v1", count: drills.length, drills }, null, 1));
const topGaps = Object.entries(gaps).sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log("drills:", drills.length, "/", rows.length);
console.log("top gap tails:", JSON.stringify(topGaps).slice(0, 400));
