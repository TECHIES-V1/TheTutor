"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, RotateCcw, History } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { MessageField } from "./MessageField";
import { Button } from "@/components/ui/button";
import { Message, RelatedCoursePreview } from "@/types";
import { api } from "@/lib/api";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
const TRACKED_GENERATIONS_KEY = "thetutor-tracked-generations";

interface ChatMessageProps {
  initialConversationId?: string | null;
  onShowMobileHistory?: () => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

function trackGenerationConversation(conversationId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(TRACKED_GENERATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const current = Array.isArray(parsed)
      ? parsed.map((value) => String(value))
      : [];
    const next = Array.from(new Set([...current, conversationId]));
    window.localStorage.setItem(TRACKED_GENERATIONS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage issues.
  }
}

type LiveCurriculumModule = {
  index: number;
  title: string;
  status: "building" | "done";
};

type ConversationPhase =
  | "onboarding"
  | "resource_retrieval"
  | "course_generation"
  | "completed";

export function ChatMessage({ initialConversationId, onShowMobileHistory }: ChatMessageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>("onboarding");
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [isFinalConfirmation, setIsFinalConfirmation] = useState(false);
  const [suggestedSubject, setSuggestedSubject] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("Preparing your course...");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [liveTitle, setLiveTitle] = useState<string | null>(null);
  const [curriculumModules, setCurriculumModules] = useState<LiveCurriculumModule[]>([]);
  const [awaitingCourseGenerationDecision, setAwaitingCourseGenerationDecision] = useState(false);
  const generationPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
            phase: string;
            messages: Array<{
              id: string;
              role: string;
              content: string;
              metadata?: {
                relatedCourses?: RelatedCoursePreview[];
              };
            }>;
            confirmationAttempts: number;
            courseId?: string;
          };
        };
        const conv = data.conversation;
        setConversationId(conv.id);
        setConversationPhase(conv.phase as ConversationPhase);
        const mappedMessages = conv.messages.map((m) => ({
          id: m.id,
          role: (m.role === "assistant" ? "tutor" : "user") as "user" | "tutor",
          content: m.content,
          relatedCourses: Array.isArray(m.metadata?.relatedCourses)
            ? m.metadata.relatedCourses
            : [],
        }));
        setMessages(
          mappedMessages
        );
        const hasPendingRelatedCourses = mappedMessages.some(
          (message) => (message.relatedCourses?.length ?? 0) > 0
        );
        setAwaitingCourseGenerationDecision(
          conv.phase === "resource_retrieval" &&
          hasPendingRelatedCourses &&
          !(conv.status === "completed" || conv.courseId)
        );
        if (conv.phase === "course_generation" && conv.status === "active" && !conv.courseId) {
          trackGenerationConversation(conv.id);
          setIsGenerating(true);
          setGenerationStatus("Course generation is running in the background...");
          setGenerationProgress((prev) => Math.max(prev, 35));
        }
        if (conv.confirmationAttempts >= 1) setIsFinalConfirmation(true);
        if (conv.status === "completed" || conv.courseId) {
          setIsReadOnly(true);
          if (conv.courseId) setCreatedCourseId(conv.courseId);
        }
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

  useEffect(() => {
    if (!conversationId || conversationPhase !== "course_generation") {
      if (generationPollRef.current) {
        clearInterval(generationPollRef.current);
        generationPollRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const pollGenerationStatus = async () => {
      try {
        const res = await api.get(`/course/generation-status/${conversationId}`);
        if (!res.ok || cancelled) return;
        const data = await res.json() as {
          status: "pending" | "in_progress" | "completed" | "failed";
          phase?: ConversationPhase;
          courseId?: string;
        };

        if (cancelled) return;

        if (data.status === "completed" && data.courseId) {
          setGenerationProgress(100);
          setConversationPhase("completed");
          router.push(`/explore/${data.courseId}`);
          return;
        }

        if (data.status === "in_progress") {
          setIsGenerating(true);
          setGenerationStatus("Course generation is running in the background...");
          setGenerationProgress((prev) => Math.max(prev, 35));
          return;
        }

        if (data.status === "pending" && data.phase === "resource_retrieval") {
          setIsGenerating(false);
          setConversationPhase("resource_retrieval");
        }
      } catch {
        // Keep polling quietly; transient network failures should not reset generation state.
      }
    };

    void pollGenerationStatus();
    generationPollRef.current = setInterval(() => {
      void pollGenerationStatus();
    }, 5000);

    return () => {
      cancelled = true;
      if (generationPollRef.current) {
        clearInterval(generationPollRef.current);
        generationPollRef.current = null;
      }
    };
  }, [conversationId, conversationPhase, router]);

  const appendTutorMessage = (
    content: string,
    relatedCourses: RelatedCoursePreview[] = []
  ) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "tutor", content, relatedCourses },
    ]);
  };

  const handleSend = async (content: string) => {
    if (
      requiresConfirmation ||
      awaitingCourseGenerationDecision ||
      isGenerating ||
      isReadOnly
    ) {
      return;
    }

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
        message: {
          content: string;
          metadata?: {
            relatedCourses?: RelatedCoursePreview[];
          };
        };
        requiresConfirmation: boolean;
        isFinalConfirmation: boolean;
        suggestedSubject?: string;
      };

      setConversationId(data.conversationId);
      appendTutorMessage(
        data.message.content,
        Array.isArray(data.message.metadata?.relatedCourses)
          ? data.message.metadata.relatedCourses
          : []
      );

      if (data.requiresConfirmation) {
        setSuggestedSubject(data.suggestedSubject ?? null);
        setRequiresConfirmation(true);
        setIsFinalConfirmation(data.isFinalConfirmation);
      }
    } catch {
      setSubmitError("Couldn't send your message. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirm = async () => {
    if (!conversationId) return;
    setSubmitError(null);
    setRequiresConfirmation(false);
    setAwaitingCourseGenerationDecision(false);
    setConversationPhase("resource_retrieval");

    try {
      const res = await api.post("/chat/confirm-subject", { conversationId, confirmed: true });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to confirm subject");
      }

      const data = await res.json() as {
        message?: string;
        relatedCourses?: RelatedCoursePreview[];
        hasRelatedCourses?: boolean;
      };
      const relatedCourses = Array.isArray(data.relatedCourses) ? data.relatedCourses : [];
      appendTutorMessage(
        data.message ?? "I checked for similar public courses first.",
        relatedCourses
      );

      if ((data.hasRelatedCourses ?? relatedCourses.length > 0) && relatedCourses.length > 0) {
        setAwaitingCourseGenerationDecision(true);
        return;
      }

      setGenerationStatus("Preparing your course...");
      setGenerationProgress(2);
      setLiveTitle(null);
      setCurriculumModules([]);
      setIsGenerating(true);
      await startGeneration(conversationId);
    } catch {
      setSubmitError("Something went wrong while confirming. Please try again.");
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
      setAwaitingCourseGenerationDecision(false);
      setConversationPhase("onboarding");

      if (data.message) {
        appendTutorMessage(data.message);
      }
    } catch {
      setSubmitError("Couldn't process your response. Please try again.");
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
    setConversationPhase("onboarding");
    setSubmitError(null);
    setIsGenerating(false);
    setIsReadOnly(false);
    setAwaitingCourseGenerationDecision(false);
    setLiveTitle(null);
    setCurriculumModules([]);
    setGenerationStatus("Preparing your course...");
    setGenerationProgress(0);
  };

  const handleCreateCourseAnyway = async () => {
    if (!conversationId) return;
    setSubmitError(null);
    setAwaitingCourseGenerationDecision(false);
    setConversationPhase("resource_retrieval");
    setGenerationStatus("Preparing your course...");
    setGenerationProgress(2);
    setLiveTitle(null);
    setCurriculumModules([]);
    setIsGenerating(true);
    await startGeneration(conversationId);
  };

  const startGeneration = async (convId: string) => {
    try {
      trackGenerationConversation(convId);
      setConversationPhase("course_generation");
      setGenerationStatus("Preparing your course...");
      setGenerationProgress(4);
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

          if (eventType === "status") {
            setGenerationStatus(String(data.message ?? "Working..."));
            const progress = Number(data.progress);
            if (Number.isFinite(progress)) {
              setGenerationProgress(Math.max(0, Math.min(100, progress)));
            }
          }
          else if (eventType === "tool_call") {
            setGenerationStatus("Discovering learning resources...");
            setGenerationProgress((prev) => Math.max(prev, 18));
          }
          else if (eventType === "tool_result") {
            setGenerationStatus("Processing resources...");
            setGenerationProgress((prev) => Math.max(prev, 28));
          }
          else if (eventType === "course_chunk") {
            setGenerationStatus("Building your course...");
            setGenerationProgress((prev) => Math.max(prev, 45));
          }
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
          else if (eventType === "error") {
            const courseId = String((data as Record<string, unknown>).courseId ?? "").trim();
            if (courseId) setCreatedCourseId(courseId);
            const phase = String((data as Record<string, unknown>).phase ?? "").trim();
            if (phase === "resource_retrieval") setConversationPhase("resource_retrieval");
            throw new Error("generation_failed");
          }
          else if (eventType === "complete") {
            setCurriculumModules((prev) =>
              prev.map((mod) =>
                mod.status === "building" ? { ...mod, status: "done" as const } : mod
              )
            );
            setGenerationProgress(100);
            setConversationPhase("completed");
            const courseId = String(data.courseId ?? "").trim();
            router.push(courseId ? `/explore/${courseId}` : "/dashboard");
            return;
          }
        }
      }
    } catch {
      setIsGenerating(false);
      setConversationPhase("resource_retrieval");
      setSubmitError("Something went wrong while creating your course. Please try again.");
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

          <div className="mx-auto mt-4 w-full max-w-lg">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(Math.max(generationProgress, 0), 100)}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {Math.round(generationProgress)}% complete
            </p>
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
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${mod.status === "building"
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
                      className={`truncate text-sm ${mod.status === "building"
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
          <div className="w-full space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm font-medium">{submitError}</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              {createdCourseId && (
                <Link
                  href={`/explore/${createdCourseId}`}
                  className="skeuo-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition hover:opacity-90"
                >
                  Go to Course <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" /> Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Chat Screen ─────────────────────────────────────────────────────────
  return (
    <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      {/* Mobile header with history button */}
      <div className="lg:hidden border-b border-border px-4 py-3 flex items-center justify-between">
        <Button
          onClick={onShowMobileHistory}
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          title="View chat history"
        >
          <History className="h-4 w-4" />
          <span className="text-xs font-medium">History</span>
        </Button>
        <span className="text-xs text-muted-foreground">AI Chat</span>
      </div>
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
              <MessageField
                key={msg.id}
                id={msg.id}
                role={msg.role}
                content={msg.content}
                relatedCourses={msg.relatedCourses}
              />
            ))
          )}

          {isTyping && (
            <div className="flex w-full items-start gap-3 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="TheTutor" className="mt-1 h-8 w-8 flex-shrink-0 rounded-full object-contain ring-2 ring-primary/15" />
              <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  TheTutor
                </span>
                <div className="flex h-10 items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border/40 bg-card/60 px-4 text-muted-foreground backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                </div>
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

          {awaitingCourseGenerationDecision && !isTyping && !requiresConfirmation && (
            <div className="mt-4 flex flex-col items-start gap-3">
              <button
                onClick={handleCreateCourseAnyway}
                className="skeuo-gold rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Create a New Course Anyway
              </button>
              <p className="text-xs text-muted-foreground">
                You can open any similar public course listed above, or create yours now.
              </p>
            </div>
          )}

          {conversationPhase === "resource_retrieval" &&
            !awaitingCourseGenerationDecision &&
            !requiresConfirmation &&
            !isTyping &&
            !isGenerating &&
            !isReadOnly && (
              <div className="mt-4 flex flex-col items-start gap-3">
                <button
                  onClick={handleCreateCourseAnyway}
                  className="skeuo-gold rounded-xl px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Resume Course Creation
                </button>
                <p className="text-xs text-muted-foreground">
                  Your course setup is ready. Continue generation from where you left it.
                </p>
              </div>
            )}

          {submitError && (
            <div className="mt-4 space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm font-medium">{submitError}</p>
              </div>
              {createdCourseId && (
                <Link
                  href={`/explore/${createdCourseId}`}
                  className="skeuo-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition hover:opacity-90"
                >
                  Go to Course <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {isReadOnly ? (
        <div className="mx-4 mb-4 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/60 p-6 text-center shadow-none backdrop-blur-sm">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Course Already Created</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              This conversation is complete. You can jump straight to your course or start a new chat from the sidebar.
            </p>
          </div>
          {createdCourseId && (
            <Link
              href={`/explore/${createdCourseId}`}
              className="skeuo-gold flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-95"
            >
              Go to Course
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <ChatInput
          onSend={handleSend}
          disabled={
            isTyping ||
            requiresConfirmation ||
            awaitingCourseGenerationDecision ||
            isGenerating ||
            conversationPhase !== "onboarding"
          }
        />
      )}
    </div>
  );
}
