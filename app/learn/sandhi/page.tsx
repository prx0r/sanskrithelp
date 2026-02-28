"use client";

import { useState } from "react";
import Link from "next/link";
import sandhiData from "@/data/sandhi-rules.json";
import { SandhiDrill } from "@/components/SandhiDrill";
import { RuleContext } from "@/components/RuleContext";
import type { SandhiRule } from "@/lib/types";

const sandhiRules = sandhiData as SandhiRule[];

const CATEGORY_ORDER = ["vowel", "visarga", "consonant", "aspiration"] as const;
const CATEGORY_LABELS: Record<string, { name: string; desc: string }> = {
  vowel: {
    name: "Vowel sandhi",
    desc: "When vowels meet at word boundaries. Same vowel merges (a+a→ā); a+i→e, a+u→o (guṇa); ā+i→ai, ā+u→au (vṛddhi). i/u before vowels become semivowels (y/v).",
  },
  visarga: {
    name: "Visarga (ḥ)",
    desc: "The visarga adapts to what follows: stays before voiceless, becomes o before voiced/vowels.",
  },
  consonant: {
    name: "Consonant sandhi",
    desc: "Final consonants change before following sounds. Assimilation: t→d before voiced, nasals take the place of the following consonant.",
  },
  aspiration: {
    name: "Aspiration laws",
    desc: "Grassmann: no two aspirates in a row — first drops. Bartholomae: aspiration jumps forward (√budh+ta→buddha).",
  },
};

function groupRulesByCategory(rules: SandhiRule[]) {
  const byCat = new Map<string, SandhiRule[]>();
  for (const r of rules) {
    const cat = r.category || "other";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(r);
  }
  return byCat;
}

export default function SandhiPage() {
  const [activeRule, setActiveRule] = useState<SandhiRule | null>(null);
  const [showDrill, setShowDrill] = useState(false);
  const byCategory = groupRulesByCategory(sandhiRules);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Euphonic Laws (Sandhi)</h1>
        <p className="text-muted-foreground">
          Sandhi = &quot;junction.&quot; When words meet, sounds change for euphony. Learn the main types, then practice.
        </p>
        {!showDrill && (
          <button
            onClick={() => setShowDrill(true)}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Skip to drills →
          </button>
        )}
      </div>

      {/* Explainer */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-semibold">What is sandhi?</h2>
          <p className="text-sm text-muted-foreground">
            In continuous speech, Sanskrit words often merge at their boundaries. A final &quot;a&quot; + an initial &quot;a&quot; become &quot;ā&quot;. A final &quot;i&quot; before a vowel becomes &quot;y&quot;. These changes are sandhi — Pāṇini described hundreds of rules. We teach them in order: vowel → visarga → consonant → aspiration.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((cat) => {
              const meta = CATEGORY_LABELS[cat];
              if (!meta) return null;
              return (
                <div key={cat} className="p-4 rounded-lg bg-muted/50">
                  <p className="font-medium text-foreground mb-1">{meta.name}</p>
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rules by category */}
      <div className="space-y-6">
        {CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((cat) => {
          const rules = byCategory.get(cat)!;
          const meta = CATEGORY_LABELS[cat];
          return (
            <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-semibold">{meta?.name ?? cat}</h3>
                <p className="text-sm text-muted-foreground mt-1">{meta?.desc}</p>
              </div>
              <div className="divide-y divide-border">
                {rules.map((r) => (
                  <div key={r.id}>
                    <button
                      onClick={() => setActiveRule(activeRule?.id === r.id ? null : r)}
                      className="w-full text-left px-6 py-4 hover:bg-accent transition-colors flex items-center justify-between gap-4"
                    >
                      <div>
                        <span className="font-medium">{r.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">({r.paniniReference})</span>
                      </div>
                      <code className="text-sm bg-muted px-2 py-1 rounded shrink-0">{r.signature}</code>
                    </button>
                    {activeRule?.id === r.id && (
                      <div className="px-6 pb-4">
                        <RuleContext
                          rule={r}
                          dependsOn={r.dependsOn
                            .map((id) => sandhiRules.find((x) => x.id === id))
                            .filter(Boolean) as SandhiRule[]}
                          enables={r.enables
                            .map((id) => sandhiRules.find((x) => x.id === id))
                            .filter(Boolean) as SandhiRule[]}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drills */}
      {showDrill && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Practice</h2>
          <p className="text-muted-foreground text-sm">
            Given two words, produce the combined form. Rules apply automatically in speech.
          </p>
          <SandhiDrill rules={sandhiRules} />
        </div>
      )}

      {!showDrill && (
        <div className="rounded-xl border border-primary p-6 bg-primary/5">
          <p className="text-sm text-muted-foreground mb-4">Ready to practice combining words?</p>
          <button
            onClick={() => setShowDrill(true)}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            Practice with drills →
          </button>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Link href="/learn/gradation/" className="text-primary hover:underline">
          ← Guṇa/Vṛddhi
        </Link>
        <Link href="/learn/roots/" className="text-primary hover:underline">
          Next: Dhātus →
        </Link>
      </div>
    </div>
  );
}
