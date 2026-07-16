"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Bot, User, Loader2 } from "lucide-react";

const SYSTEM_PROMPT = `You are a knowledgeable guide to Kashmir Shaivism (Tantraloka, Pratyabhijñā), Layayoga, the Mātṛkā (50 Sanskrit phonemes), the Vijñāna Bhairava (112 techniques), and the 36 tattvas. You also know Sanskrit grammar (Pāṇini), phonetics, and the relationships between these systems.

When answering:
- Cite specific tattvas, upāyas, or verses when relevant
- Use Devanagari and IAST for Sanskrit terms
- Be precise about which tradition a concept comes from
- If asked about practice, be clear about what's traditional vs modern interpretation
- Keep responses concise unless the user asks for depth`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TantraChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "I can answer questions about the Tantraloka, 36 tattvas, Mātṛkā phonemes, Layayoga, Vijñāna Bhairava, and Kashmir Shaivism. What would you like to explore?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
          messages: [...messages, { role: "user", content: q }].map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error("Chat failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      let text = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const d = JSON.parse(line.slice(6));
            const c = d.choices?.[0]?.delta?.content || d.choices?.[0]?.delta?.reasoning_content || "";
            if (c) text += c;
          } catch {}
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: text || "(no response)" }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't respond. The AI service may be unavailable." }]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-[80vh] flex flex-col py-6">
      <div className="max-w-3xl mx-auto w-full px-4 flex-1 flex flex-col">
        <Link href="/tantra" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 shrink-0">
          <ArrowLeft className="w-4 h-4" /> Back to Tantra
        </Link>

        <div className="mb-4">
          <h1 className="font-display text-2xl font-bold">Tantra Chat</h1>
          <p className="text-sm text-muted-foreground">Ask about the Tantraloka, 36 tattvas, Mātṛkā, or any Kashmir Shaivism topic</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-emerald-900/30 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user" ? "bg-primary/20 text-primary-foreground" : "bg-card border border-border"
              }`}>
                {m.content.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                ))}
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-900/30 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>
              <div className="max-w-[80%] rounded-xl px-4 py-3 bg-card border border-border">
                <p className="text-sm text-muted-foreground animate-pulse">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 pb-4 shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about the Tantraloka, tattvas, Mātṛkā, or practice..."
            className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>
    </div>
  );
}
