"use client";

import { useState } from "react";
import { Search, X, Loader2, ChevronDown } from "lucide-react";

export function RagChatBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [ragContent, setRagContent] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rag-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      if (data.error) {
        setError(data.error);
        setRagContent(null);
      } else {
        setRagContent(data.content ?? "No response.");
        setLastQuestion(q);
        setExpanded(true);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasResult = ragContent !== null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur flex flex-col"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          maxHeight: hasResult && expanded ? "min(40vh, 280px)" : "auto",
        }}
      >
        {hasResult && (
          <div className="flex-1 min-h-0 flex flex-col border-b border-border">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center justify-between px-4 py-2 text-left hover:bg-accent/50 touch-target"
            >
              <span className="text-xs font-medium text-muted-foreground truncate flex-1 mr-2">
                {lastQuestion ?? "Answer"}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRagContent(null);
                    setLastQuestion(null);
                  }}
                  className="p-1 rounded hover:bg-accent"
                  aria-label="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </button>
            {expanded && (
              <div className="flex-1 overflow-y-auto px-4 py-3 text-sm font-display leading-relaxed whitespace-pre-wrap">
                {ragContent}
              </div>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 p-3 max-w-4xl mx-auto w-full shrink-0">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Pāṇini or Whitney…"
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="touch-target px-4 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 shrink-0"
            aria-label="Search"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {error && (
        <div
          className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}
    </>
  );
}
