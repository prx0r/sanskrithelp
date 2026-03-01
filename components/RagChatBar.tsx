"use client";

import { useState, useRef } from "react";
import { Send, X, Loader2, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function RagChatBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [overlayExpanded, setOverlayExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setContent("");
    setLastQuestion(q);
    setOverlayExpanded(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: q }],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? `Request failed: ${res.status}`);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        setError("No response stream");
        return;
      }

      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed?.choices?.[0]?.delta?.content;
              if (delta) {
                full += delta;
                setContent(full);
                contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: "smooth" });
              }
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasResult = content !== "" || loading;
  const showOverlay = hasResult && overlayExpanded;

  return (
    <>
      {/* Hologram overlay */}
      {hasResult && (
        <div
          className="fixed inset-0 z-30"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 80px)", pointerEvents: showOverlay ? "auto" : "none" }}
        >
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 transition-all duration-300 ease-out",
              showOverlay ? "top-0 opacity-100" : "top-full opacity-0 pointer-events-none"
            )}
            style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(45,27,78,0.85) 30%, rgba(30,20,50,0.92) 100%)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "inset 0 0 60px rgba(120,80,200,0.15)",
            }}
          >
            <div className="max-w-4xl mx-auto px-4 pt-16 pb-4 h-full flex flex-col">
              {lastQuestion && (
                <p className="text-sm text-muted-foreground/90 mb-2 truncate">
                  {lastQuestion}
                </p>
              )}
              <div
                ref={contentRef}
                className="flex-1 overflow-y-auto text-sm font-display leading-relaxed whitespace-pre-wrap min-h-0"
                style={{
                  fontFamily: "var(--font-display), serif",
                  textShadow: "0 0 20px rgba(200,180,255,0.3)",
                }}
              >
                {loading && !content ? (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking…
                  </span>
                ) : (
                  content
                )}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setContent("");
                    setLastQuestion(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 pointer-events-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle - wide ^ between overlay and bar */}
      {hasResult && (
        <button
          type="button"
          onClick={() => setOverlayExpanded((e) => !e)}
          className="fixed left-0 right-0 z-40 flex justify-center py-2 pointer-events-auto touch-target"
          style={{
            bottom: "calc(env(safe-area-inset-bottom) + 56px)",
            background: "transparent",
          }}
          aria-label={overlayExpanded ? "Collapse" : "Expand"}
        >
          <ChevronUp
            className={cn(
              "w-8 h-8 text-muted-foreground/80 transition-transform duration-300",
              !overlayExpanded && "rotate-180"
            )}
          />
        </button>
      )}

      {/* Search bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-card/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 p-3 max-w-4xl mx-auto w-full"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything…"
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="touch-target px-4 py-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 shrink-0"
            aria-label="Send"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {error && (
        <div
          className="fixed bottom-24 left-4 right-4 z-[60] max-w-md mx-auto rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}
    </>
  );
}

