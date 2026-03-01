"use client";

import { useState } from "react";
import Link from "next/link";
import { RootCard } from "@/components/RootCard";
import { ZoneGate } from "@/components/ZoneGate";
import dhatusData from "@/data/dhatus.json";
import type { LinguisticNode } from "@/lib/types";

const dhatus = dhatusData as unknown as LinguisticNode[];

export default function RootsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(dhatus[0]?.id ?? null);
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? dhatus.filter(
        (d) =>
          d.iast.toLowerCase().includes(filter.toLowerCase()) ||
          d.meaning.toLowerCase().includes(filter.toLowerCase())
      )
    : dhatus;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold mb-2 text-amber-100">
          The Root (Dhātu)
        </h1>
        <p className="text-violet-200/80 max-w-2xl">
          Each root is a seed. Add suffixes, apply guṇa/vṛddhi, and infinite words grow.
          Select a root to see how it becomes nouns, verbs, participles.
        </p>
        <div className="mt-3">
          <ZoneGate zoneId="roots" />
        </div>
      </div>

      {/* Quick filter */}
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Search roots..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-violet-950/50 border border-violet-500/30 text-violet-100 placeholder-violet-500 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none"
        />
      </div>

      {/* Root system grid - each root is a literal root card */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <RootCard
            key={d.id}
            dhatu={d}
            expanded={expandedId === d.id}
            onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-violet-400 py-12">No roots match your search.</p>
      )}

      {/* Formation legend */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-950/30 p-6">
        <h3 className="font-display text-lg font-semibold text-amber-200 mb-4">How words form</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-amber-500/50 bg-amber-500/10" />
            <span>verb — present/future forms</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-violet-400/50 bg-violet-500/10" />
            <span>abstract noun — state, action</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-emerald-500/50 bg-emerald-500/10" />
            <span>participle — past passive (kta)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-rose-500/50 bg-rose-500/10" />
            <span>gerundive — to be done</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded border border-cyan-500/50 bg-cyan-500/10" />
            <span>agent noun — doer (tṛ)</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Link
          href="/learn/sandhi/"
          className="text-amber-400 hover:text-amber-300 hover:underline"
        >
          ← Sandhi
        </Link>
        <Link
          href="/learn/words/"
          className="text-amber-400 hover:text-amber-300 hover:underline"
        >
          Next: Words →
        </Link>
      </div>
    </div>
  );
}
