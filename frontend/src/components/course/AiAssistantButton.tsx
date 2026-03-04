"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Sparkles, X, ArrowUp } from "lucide-react";
import { api } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiAssistantButtonProps {
  courseId: string;
  lessonId: string;
  lessonTitle?: string;
  lessonContent?: string;
}

export function AiAssistantButton({ courseId, lessonId, lessonTitle, lessonContent }: AiAssistantButtonProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    // Add empty assistant bubble to stream into
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const lessonContext = [
        lessonTitle ? `Title: ${lessonTitle}` : "",
        lessonContent ? `Content: ${lessonContent}` : "",
      ].filter(Boolean).join("\n");

      const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/assistant`, {
        messages: nextMessages,
        lessonContext,
      });

      if (!response.ok || !response.body) throw new Error("assistant failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const dataLine = part.match(/^data: (.+)/m);
          if (!dataLine) continue;
          try {
            const json = JSON.parse(dataLine[1]);
            if (json.text) {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return [...prev.slice(0, -1), { ...last, content: last.content + json.text }];
                }
                return prev;
              });
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) {
          return [...prev.slice(0, -1), { ...last, content: "I'm unable to help right now. Please try again." }];
        }
        return prev;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[60]">
      {open && (
        <div
          className="absolute bottom-16 left-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          style={{ width: "min(380px, calc(100vw - 3rem))", maxHeight: "70vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">AI Tutor</span>
              {lessonTitle && (
                <span className="truncate text-xs text-muted-foreground">— {lessonTitle}</span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-2 flex-shrink-0 rounded-lg p-1 transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 p-4" style={{ minHeight: 0 }}>
            {messages.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Ask anything about this lesson
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "skeuo-gold rounded-tr-sm"
                      : "rounded-tl-sm border border-border/50 bg-card text-foreground"
                  }`}
                >
                  {msg.content || (streaming && msg.role === "assistant" ? (
                    <span className="flex h-4 items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                    </span>
                  ) : "")}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-border p-3">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 transition-colors focus-within:border-primary/40">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this lesson..."
                disabled={streaming}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
                style={{ maxHeight: "96px", minHeight: "24px" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                className="skeuo-gold flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="skeuo-gold flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>
    </div>
  );
}
