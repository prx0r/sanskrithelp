"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export function RagChatBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const hasConversation = messages.length > 0 || loading || streamingContent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;

    setQuery("");
    setError(null);
    const userMsg: Message = { role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setStreamingContent("");
    setOverlayOpen(true);
    setLoading(true);

    try {
      const chatMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? `Request failed: ${res.status}`);
        setMessages((m) => m.slice(0, -1));
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
                setStreamingContent(full);
              }
            } catch {
              // skip
            }
          }
        }
      }
      setMessages((m) => [...m, { role: "assistant", content: full }]);
      setStreamingContent("");
      setOverlayOpen(true);
    } catch {
      setError("Something went wrong. Try again.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOverlayOpen(false);
  };

  const handleClear = () => {
    setMessages([]);
    setStreamingContent("");
    setOverlayOpen(false);
    setError(null);
  };

  return (
    <>
      {/* Overlay backdrop - tap to close */}
      {overlayOpen && hasConversation && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Compact hologram panel - same width as search bar, above it */}
      {hasConversation && (
        <div
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out",
            overlayOpen ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-2"
          )}
          style={{
            bottom: "calc(env(safe-area-inset-bottom) + 72px)",
            width: "min(100% - 2rem, 42rem)",
            maxWidth: "calc(100vw - 2rem)",
          }}
        >
          <div
            className="rounded-2xl border border-white/20 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            style={{
              boxShadow: "0 0 40px rgba(120,80,200,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <span className="text-xs text-muted-foreground">Chat</span>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground"
                aria-label="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              className="max-h-[min(40vh,280px)] overflow-y-auto px-4 py-3 space-y-3 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl px-3 py-2 max-w-[90%]",
                    m.role === "user"
                      ? "ml-auto bg-primary/20 text-primary-foreground"
                      : "mr-auto bg-muted/80"
                  )}
                >
                  <p
                    className="whitespace-pre-wrap break-words"
                    style={
                      /[\u0900-\u097F]/.test(m.content)
                        ? { fontFamily: "var(--font-devanagari), sans-serif" }
                        : undefined
                    }
                  >
                    {m.content}
                  </p>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground py-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking…</span>
                </div>
              )}
              {streamingContent && (
                <div className="rounded-xl px-3 py-2 mr-auto bg-muted/80 max-w-[90%]">
                  <p
                    className="whitespace-pre-wrap break-words"
                    style={
                      /[\u0900-\u097F]/.test(streamingContent)
                        ? { fontFamily: "var(--font-devanagari), sans-serif" }
                        : undefined
                    }
                  >
                    {streamingContent}
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-card/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {hasConversation && !overlayOpen && (
          <button
            type="button"
            onClick={() => setOverlayOpen(true)}
            className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            View conversation ({messages.length})
          </button>
        )}
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
