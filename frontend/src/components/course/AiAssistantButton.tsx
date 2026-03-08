"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { Sparkles, X, ArrowUp, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { BACKEND_URL } from "@/lib/backendUrl";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useAssistantTTS } from "@/hooks/useAssistantTTS";

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
  const abortRef = useRef<AbortController | null>(null);
  const prevStreamingRef = useRef(false);

  // Voice hooks
  const { isListening, transcript, isSupported: micSupported, startListening, stopListening } = useVoiceInput();
  const { isSpeaking, autoSpeak, toggleAutoSpeak, speakResponse, stopSpeaking } = useAssistantTTS();

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Abort stream on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Append voice transcript to input when recognition ends
  useEffect(() => {
    if (!isListening && transcript) {
      setInput(prev => (prev ? prev + " " + transcript : transcript));
    }
  }, [isListening, transcript]);

  // Auto-speak when streaming finishes
  useEffect(() => {
    if (prevStreamingRef.current && !streaming && autoSpeak) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant" && lastMsg.content) {
        speakResponse(lastMsg.content);
      }
    }
    prevStreamingRef.current = streaming;
  }, [streaming, autoSpeak, messages, speakResponse]);

  // Stop TTS when panel closes
  useEffect(() => {
    if (!open) {
      stopSpeaking();
    }
  }, [open, stopSpeaking]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;

    // Stop any ongoing TTS
    stopSpeaking();

    // Abort any in-flight stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

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

      const response = await fetch(`${BACKEND_URL}/courses/${courseId}/lessons/${lessonId}/assistant`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, lessonContext }),
        signal: abortRef.current.signal,
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
          } catch (err) { console.error("[TheTutor] Assistant SSE parse error:", err); }
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
  }, [streaming, messages, stopSpeaking, lessonTitle, lessonContent, courseId, lessonId]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {open && (
        <div
          className="absolute bottom-16 right-0 flex flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-2xl"
          style={{ width: "min(380px, calc(100vw - 3rem))", maxHeight: "70vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground">AI Tutor</span>
              {lessonTitle && (
                <span className="truncate text-xs text-muted-foreground">— {lessonTitle}</span>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <button
                onClick={toggleAutoSpeak}
                className="rounded-lg p-1 transition-colors hover:bg-muted"
                title={autoSpeak ? "Disable auto-speak" : "Enable auto-speak"}
              >
                {autoSpeak
                  ? <Volume2 className="h-3.5 w-3.5 text-primary" />
                  : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
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
                      : "rounded-tl-sm border border-[var(--glass-border)] bg-card text-foreground"
                  }`}
                >
                  {msg.content ? (
                    msg.role === "assistant" ? (
                      <MarkdownContent compact>{msg.content}</MarkdownContent>
                    ) : (
                      msg.content
                    )
                  ) : (streaming && msg.role === "assistant" ? (
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
          <div className="flex-shrink-0 border-t border-[var(--glass-border)] p-3">
            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="mb-2 flex items-center gap-2 text-xs text-primary">
                <Volume2 className="h-3 w-3 animate-pulse" />
                <span>Speaking...</span>
                <button onClick={stopSpeaking} className="ml-auto text-muted-foreground hover:text-foreground">
                  Stop
                </button>
              </div>
            )}
            <div className={`flex items-end gap-2 rounded-xl border bg-transparent px-3 py-2 transition-colors focus-within:border-primary/40 ${
              isListening ? "border-primary/60 shadow-[0_0_8px_rgba(212,175,55,0.3)]" : "border-[var(--glass-border)]"
            }`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Ask about this lesson..."}
                disabled={streaming}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
                style={{ maxHeight: "96px", minHeight: "24px" }}
              />
              {micSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={streaming}
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    isListening
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={isListening ? "Stop listening" : "Voice input"}
                >
                  {isListening
                    ? <MicOff className="h-3.5 w-3.5" />
                    : <Mic className="h-3.5 w-3.5" />}
                </button>
              )}
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
