"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "./ChatInput";
import { MessageField } from "./MessageField";
import { Message } from "@/types";
import { api } from "@/lib/api";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

type LiveCurriculumModule = {
  index: number;
  title: string;
  status: "building" | "done";
};

export function ChatMessage({ initialConversationId }: { initialConversationId?: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [isFinalConfirmation, setIsFinalConfirmation] = useState(false);
  const [suggestedSubject, setSuggestedSubject] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("Preparing your course...");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [liveTitle, setLiveTitle] = useState<string | null>(null);
  const [curriculumModules, setCurriculumModules] = useState<LiveCurriculumModule[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load the specific conversation passed from the parent (if any).
  // null / undefined = fresh new chat, nothing to load.
  useEffect(() => {
    if (!initialConversationId) return;

    async function loadConversation() {
      try {
        const res = await api.get(`/chat/conversation/${initialConversationId}`);
        if (!res.ok) return;
        const data = await res.json() as {
          conversation: {
            id: string;
            status: string;
            messages: Array<{ id: string; role: string; content: string }>;
            confirmationAttempts: number;
            courseId?: string;
          };
        };
        const conv = data.conversation;
        setConversationId(conv.id);
        setMessages(
          conv.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "tutor",
            content: m.content,
          }))
        );
        if (conv.confirmationAttempts >= 1) setIsFinalConfirmation(true);
        if (conv.status === "completed" || conv.courseId) setIsReadOnly(true);
      } catch {
        // Silently fail — treat as fresh start
      }
    }
    loadConversation();
  }, [initialConversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isGenerating]);

  const appendTutorMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "tutor", content },
    ]);
  };

  const handleSend = async (content: string) => {
    if (requiresConfirmation || isGenerating || isReadOnly) return;

    setSubmitError(null);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content },
    ]);
    setIsTyping(true);

    try {
      const res = await api.post("/chat/message", { message: content, conversationId });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to send message");
      }

      const data = await res.json() as {
        conversationId: string;
        message: { content: string };
        requiresConfirmation: boolean;
        isFinalConfirmation: boolean;
        suggestedSubject?: string;
      };

      setConversationId(data.conversationId);
      appendTutorMessage(data.message.content);

      if (data.requiresConfirmation) {
        setSuggestedSubject(data.suggestedSubject ?? null);
        setRequiresConfirmation(true);
        setIsFinalConfirmation(data.isFinalConfirmation);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirm = async () => {
    if (!conversationId) return;
    setSubmitError(null);
    setRequiresConfirmation(false);

    try {
      const res = await api.post("/chat/confirm-subject", { conversationId, confirmed: true });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to confirm subject");
      }

      setGenerationStatus("Preparing your course...");
      setLiveTitle(null);
      setCurriculumModules([]);
      setIsGenerating(true);
      await startGeneration(conversationId);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const handleReject = async () => {
    if (!conversationId) return;
    setSubmitError(null);

    try {
      const res = await api.post("/chat/confirm-subject", { conversationId, confirmed: false });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to update conversation");
      }

      const data = await res.json() as { message?: string };
      setRequiresConfirmation(false);
      setSuggestedSubject(null);
      setIsFinalConfirmation(false);

      if (data.message) {
        appendTutorMessage(data.message);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const handleRestart = async () => {
    try {
      const res = await api.post("/chat/restart", { conversationId });
      const data = await res.json() as { newConversationId?: string };
      setConversationId(data.newConversationId ?? null);
    } catch {
      setConversationId(null);
    }
    setMessages([]);
    setRequiresConfirmation(false);
    setIsFinalConfirmation(false);
    setSuggestedSubject(null);
    setSubmitError(null);
    setIsGenerating(false);
    setIsReadOnly(false);
    setLiveTitle(null);
    setCurriculumModules([]);
    setGenerationStatus("Preparing your course...");
  };

  const startGeneration = async (convId: string) => {
    try {
      setGenerationStatus("Preparing your course...");
      setLiveTitle(null);
      setCurriculumModules([]);

      const res = await fetch(`${BACKEND}/course/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Course generation failed to start");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const eventMatch = part.match(/^event: (.+)/m);
          const dataMatch = part.match(/^data: (.+)/m);
          if (!eventMatch || !dataMatch) continue;

          const eventType = eventMatch[1].trim();
          let data: Record<string, unknown> = {};
          try { data = JSON.parse(dataMatch[1].trim()); } catch { continue; }

          if (eventType === "status") setGenerationStatus(String(data.message ?? "Working..."));
          else if (eventType === "tool_call") setGenerationStatus("Discovering learning resources...");
          else if (eventType === "tool_result") setGenerationStatus("Processing resources...");
          else if (eventType === "course_chunk") setGenerationStatus("Building your course...");
          else if (eventType === "course_title") {
            const title = String(data.title ?? "").trim();
            if (title) setLiveTitle(title);
          }
          else if (eventType === "module_started") {
            const indexValue = Number(data.index);
            setCurriculumModules((prev) => {
              const index = Number.isFinite(indexValue) ? indexValue : prev.length;
              const title = String(data.title ?? `Module ${index + 1}`).trim() || `Module ${index + 1}`;
              const next = prev.map((mod) =>
                mod.status === "building" ? { ...mod, status: "done" as const } : mod
              );
              const existingIndex = next.findIndex((mod) => mod.index === index);
              if (existingIndex >= 0) {
                next[existingIndex] = {
                  ...next[existingIndex],
                  title,
                  status: "building" as const,
                };
              } else {
                next.push({ index, title, status: "building" as const });
              }
              return [...next].sort((a, b) => a.index - b.index);
            });
          }
          else if (eventType === "module_complete") {
            const indexValue = Number(data.index);
            if (!Number.isFinite(indexValue)) continue;
            const index = indexValue;
            const title = String(data.title ?? `Module ${index + 1}`).trim() || `Module ${index + 1}`;
            setCurriculumModules((prev) => {
              const existingIndex = prev.findIndex((mod) => mod.index === index);
              if (existingIndex === -1) {
                return [...prev, { index, title, status: "done" as const }].sort(
                  (a, b) => a.index - b.index
                );
              }
              return prev.map((mod) =>
                mod.index === index ? { ...mod, title, status: "done" as const } : mod
              );
            });
          }
          else if (eventType === "error") throw new Error(String(data.message ?? "Course generation failed"));
          else if (eventType === "complete") {
            setCurriculumModules((prev) =>
              prev.map((mod) =>
                mod.status === "building" ? { ...mod, status: "done" as const } : mod
              )
            );
            const courseId = String(data.courseId ?? "").trim();
            router.push(courseId ? `/explore/${courseId}` : "/dashboard");
            return;
          }
        }
      }
    } catch (err) {
      setIsGenerating(false);
      setSubmitError(err instanceof Error ? err.message : "Course generation failed. Please try again.");
    }
  };

  // ── Generation Screen ───────────────────────────────────────────────────
  if (isGenerating) {
    return (
      <div className="relative z-10 mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-6 px-4">
        <div className="w-full animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
            </div>
            <h2 className="text-xl font-medium text-foreground">
              {liveTitle
                ? `Building "${liveTitle}"`
                : suggestedSubject
                ? `Creating "${suggestedSubject}"`
                : "Building your course"}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">{generationStatus}</p>
          </div>

          {curriculumModules.length > 0 && (
            <div className="mt-6 w-full rounded-2xl border border-border bg-card/40 p-4">
              <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                Course Outline
              </p>
              <div className="space-y-2">
                {curriculumModules.map((mod) => (
                  <div
                    key={mod.index}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      mod.status === "building"
                        ? "border border-primary/20 bg-primary/10"
                        : "bg-muted/30"
                    }`}
                  >
                    {mod.status === "building" ? (
                      <span className="h-4 w-4 flex-shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ) : (
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary">
                        OK
                      </span>
                    )}
                    <span
                      className={`truncate text-sm ${
                        mod.status === "building"
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      Module {mod.index + 1}: {mod.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {submitError && (
          <div className="w-full rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {submitError}
          </div>
        )}
      </div>
    );
  }

  // ── Chat Screen ─────────────────────────────────────────────────────────
  return (
    <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      <div ref={scrollRef} className="mt-4 flex-1 min-h-0 overflow-y-auto px-4 no-scrollbar md:mt-6">
        <div className="flex flex-col pb-6 max-w-2xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center pt-10 md:pt-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h1 className="text-2xl md:text-4xl text-foreground font-medium mb-4 tracking-tight">
                {getGreeting()}
              </h1>
              <p className="text-muted-foreground text-sm md:text-xl max-w-md">
                Hi! I&apos;m your AI tutor. What would you like to learn today?
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageField key={msg.id} id={msg.id} role={msg.role} content={msg.content} />
            ))
          )}

          {isTyping && (
            <div className="flex w-full py-5 justify-start">
              <div className="p-3 rounded-2xl bg-muted/40 text-muted-foreground flex items-center gap-1.5 h-11">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
              </div>
            </div>
          )}

          {requiresConfirmation && !isTyping && (
            isFinalConfirmation ? (
              // Round 2+ — only "Go" + start new chat
              <div className="flex flex-col items-start gap-3 mt-4">
                <button
                  onClick={handleConfirm}
                  className="skeuo-gold px-6 py-3 rounded-xl text-sm font-medium text-background hover:opacity-90 transition-opacity"
                >
                  Go — Create my course
                </button>
                <button
                  onClick={handleRestart}
                  className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  Start a new chat instead
                </button>
              </div>
            ) : (
              // Round 1 — Yes / No
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleConfirm}
                  className="skeuo-gold px-5 py-2.5 rounded-xl text-sm font-medium text-background hover:opacity-90 transition-opacity"
                >
                  Yes, that&apos;s it!
                </button>
                <button
                  onClick={handleReject}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  No, let me clarify
                </button>
              </div>
            )
          )}

          {submitError && (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}
        </div>
      </div>

      {isReadOnly ? (
        <div className="px-4 py-3 text-center text-xs text-muted-foreground border-t border-border bg-background/60">
          This course has already been created. Use the sidebar to start a new chat.
        </div>
      ) : (
        <ChatInput onSend={handleSend} disabled={isTyping || requiresConfirmation || isGenerating} />
      )}
    </div>
  );
}
