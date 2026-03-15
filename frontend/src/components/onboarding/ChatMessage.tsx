"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { MessageField } from "./MessageField";
import { Iridescence } from "@/components/landing/iridescence";
import { Message, RelatedCoursePreview } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";

interface ChatMessageProps {
  initialConversationId?: string | null;
  onScrollDirectionChange?: (visible: boolean) => void;
}

function getGreeting(name?: string) {
  const hour = new Date().getHours();
  const firstName = name?.split(" ")[0];
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return firstName ? `${greeting}, ${firstName}.` : `${greeting}.`;
}

type LiveCurriculumModule = {
  index: number;
  title: string;
  lessonCount: number;
  completedLessons: number;
  status: "pending" | "building" | "done";
};

type ConversationPhase =
  | "onboarding"
  | "resource_retrieval"
  | "course_generation"
  | "completed";

export function ChatMessage({ initialConversationId, onScrollDirectionChange }: ChatMessageProps) {
  const { user } = useAuth();
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
  const [createdCourseSlug, setCreatedCourseSlug] = useState<string | null>(null);
  const [liveTitle, setLiveTitle] = useState<string | null>(null);
  const [curriculumModules, setCurriculumModules] = useState<LiveCurriculumModule[]>([]);
  const [awaitingCourseGenerationDecision, setAwaitingCourseGenerationDecision] = useState(false);
  const jobIdRef = useRef<string | null>(null);
  const jobStreamRef = useRef<EventSource | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const router = useRouter();

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !onScrollDirectionChange) return;
    const st = scrollRef.current.scrollTop;
    if (Math.abs(st - lastScrollTop.current) < 5) return;
    onScrollDirectionChange(st < lastScrollTop.current);
    lastScrollTop.current = st;
  }, [onScrollDirectionChange]);

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      if (jobStreamRef.current) {
        jobStreamRef.current.close();
        jobStreamRef.current = null;
      }
    };
  }, []);

  // Load a specific conversation when the prop changes
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
              metadata?: { relatedCourses?: RelatedCoursePreview[] };
            }>;
            confirmationAttempts: number;
            courseId?: string;
          };
        };
        const conv = data.conversation as typeof data.conversation & { courseSlug?: string };
        setConversationId(conv.id);
        setConversationPhase(conv.phase as ConversationPhase);

        const mappedMessages = conv.messages.map((m) => ({
          id: m.id,
          role: (m.role === "assistant" ? "tutor" : "user") as "user" | "tutor",
          content: m.content,
          relatedCourses: Array.isArray(m.metadata?.relatedCourses)
            ? m.metadata!.relatedCourses
            : [],
        }));
        setMessages(mappedMessages);

        const hasPendingRelatedCourses = mappedMessages.some(
          (message) => (message.relatedCourses?.length ?? 0) > 0
        );
        setAwaitingCourseGenerationDecision(
          conv.phase === "resource_retrieval" &&
          hasPendingRelatedCourses &&
          !(conv.status === "completed" || conv.courseId)
        );

        // If generation was in progress, reconnect to job stream
        if (conv.phase === "course_generation" && conv.status === "active" && !conv.courseId) {
          setIsGenerating(true);
          setGenerationStatus("Reconnecting to course generation...");
          setGenerationProgress(10);

          try {
            const statusRes = await api.get(`/course/generation-status/${conv.id}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json() as {
                status: string;
                jobId?: string;
                courseId?: string;
                slug?: string;
              };
              if (statusData.jobId) {
                jobIdRef.current = statusData.jobId;
                connectToJobStream(statusData.jobId);
              } else if (statusData.courseId) {
                // Already completed while we were away
                setCreatedCourseId(statusData.courseId);
                if (statusData.slug) setCreatedCourseSlug(statusData.slug);
                setGenerationProgress(100);
                setConversationPhase("completed");
                router.push(`/explore/${statusData.slug || statusData.courseId}`);
              }
            }
          } catch (err) {
            console.error("[TheTutor] Failed to reconnect to generation:", err);
          }
        }

        if (conv.confirmationAttempts >= 1) setIsFinalConfirmation(true);
        if (conv.status === "completed" || conv.courseId) {
          setIsReadOnly(true);
          if (conv.courseId) setCreatedCourseId(conv.courseId);
          if (conv.courseSlug) setCreatedCourseSlug(conv.courseSlug);
        }
      } catch (err) {
        console.error("[TheTutor] Failed to load conversation:", err);
      }
    }

    loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      lastScrollTop.current = el.scrollHeight - el.clientHeight;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isTyping, isGenerating]);

  const connectToJobStream = (jId: string) => {
    if (jobStreamRef.current) {
      jobStreamRef.current.close();
      jobStreamRef.current = null;
    }

    const es = new EventSource(`/api/proxy/course/jobs/${jId}/events`);
    jobStreamRef.current = es;

    es.addEventListener("job_state", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as {
          status: string;
          completedLessonCount: number;
          totalLessonCount: number;
          progressPercent?: number;
          modules?: Array<{ index: number; title: string; lessonCount: number }>;
          lessonSlots?: Array<{ moduleIndex: number; title: string; status: string }>;
        };
        if (data.progressPercent != null) {
          setGenerationProgress(Math.min(data.progressPercent, 95));
        }
        if (data.totalLessonCount > 0) {
          const pct = Math.round((data.completedLessonCount / data.totalLessonCount) * 80) + 10;
          setGenerationProgress((prev) => Math.max(prev, Math.min(pct, 95)));
        }
        // Reconstruct module progress from slots
        if (Array.isArray(data.lessonSlots) && data.lessonSlots.length > 0) {
          setCurriculumModules((prev) => {
            if (prev.length === 0) {
              // outline_done was missed — reconstruct from modules in job_state
              if (!Array.isArray(data.modules) || data.modules.length === 0) return prev;
              return data.modules.map((m) => {
                const modSlots = (data.lessonSlots ?? []).filter((s) => s.moduleIndex === m.index);
                const completed = modSlots.filter((s) => s.status === "done").length;
                const building = modSlots.some((s) => s.status === "generating");
                return {
                  index: m.index,
                  title: m.title,
                  lessonCount: m.lessonCount,
                  completedLessons: completed,
                  status: (completed >= m.lessonCount ? "done" : building ? "building" : "pending") as "pending" | "building" | "done",
                };
              });
            }
            return prev.map((mod) => {
              const modSlots = data.lessonSlots!.filter((s) => s.moduleIndex === mod.index);
              const completed = modSlots.filter((s) => s.status === "done").length;
              const building = modSlots.some((s) => s.status === "generating");
              return {
                ...mod,
                completedLessons: completed,
                status: completed >= mod.lessonCount ? "done" : building ? "building" : mod.status,
              };
            });
          });
        }
      } catch (err) { console.error("[TheTutor] SSE parse error:", err); }
    });

    es.addEventListener("outline_done", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as {
          modules: Array<{ title: string; lessonCount: number }>;
          totalLessons: number;
        };
        setGenerationStatus("Building lessons...");
        setGenerationProgress((prev) => Math.max(prev, 10));
        if (Array.isArray(data.modules)) {
          setCurriculumModules(
            data.modules.map((m, i) => ({
              index: i,
              title: m.title,
              lessonCount: m.lessonCount,
              completedLessons: 0,
              status: "pending" as const,
            }))
          );
        }
      } catch (err) { console.error("[TheTutor] SSE parse error:", err); }
    });

    es.addEventListener("lesson_started", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { moduleIndex: number; title: string };
        setGenerationStatus(`Writing: ${data.title}`);
        setCurriculumModules((prev) =>
          prev.map((mod) =>
            mod.index === data.moduleIndex && mod.status !== "done"
              ? { ...mod, status: "building" as const }
              : mod
          )
        );
      } catch (err) { console.error("[TheTutor] SSE parse error:", err); }
    });

    es.addEventListener("lesson_done", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as {
          moduleIndex?: number;
          completedCount: number;
          totalCount: number;
        };
        const pct = Math.round((data.completedCount / data.totalCount) * 80) + 10;
        setGenerationProgress(Math.min(pct, 93));
        setGenerationStatus(
          `Lessons: ${data.completedCount} / ${data.totalCount}`
        );
        if (data.moduleIndex != null) {
          setCurriculumModules((prev) =>
            prev.map((mod) => {
              if (mod.index !== data.moduleIndex) return mod;
              const newCompleted = mod.completedLessons + 1;
              return {
                ...mod,
                completedLessons: newCompleted,
                status: newCompleted >= mod.lessonCount ? "done" : "building",
              };
            })
          );
        }
      } catch (err) { console.error("[TheTutor] SSE parse error:", err); }
    });

    es.addEventListener("enrichment_done", () => {
      setGenerationStatus("Adding video references...");
      setGenerationProgress((prev) => Math.max(prev, 95));
    });

    es.addEventListener("complete", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { courseId: string; slug?: string };
        es.close();
        jobStreamRef.current = null;
        setCurriculumModules((prev) =>
          prev.map((mod) => ({ ...mod, status: "done" as const }))
        );
        setGenerationProgress(100);
        setConversationPhase("completed");
        router.push(`/explore/${data.slug || data.courseId}`);
      } catch (err) { console.error("[TheTutor] SSE parse error:", err); }
    });

    // Server-sent error events (distinct from connection errors)
    es.addEventListener("error", (e: Event) => {
      const me = e as MessageEvent;
      if (me.data) {
        // Generation error from server
        try {
          const data = JSON.parse(me.data) as { courseId?: string; slug?: string };
          if (data.courseId) setCreatedCourseId(data.courseId);
          if (data.slug) setCreatedCourseSlug(data.slug);
        } catch (err) { console.error("[TheTutor] SSE parse error:", err); }
        es.close();
        jobStreamRef.current = null;
        setIsGenerating(false);
        setConversationPhase("resource_retrieval");
        setSubmitError("Something went wrong while creating your course. Please try again.");
      } else {
        // Connection-level error — EventSource will auto-reconnect
        setGenerationStatus("Reconnecting...");
      }
    });
  };

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
      isReadOnly ||
      conversationPhase !== "onboarding"
    ) return;

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
          metadata?: { relatedCourses?: RelatedCoursePreview[] };
        };
        requiresConfirmation: boolean;
        isFinalConfirmation: boolean;
        suggestedSubject?: string;
      };

      // Update URL when first conversation is created (without causing remount)
      if (typeof window !== "undefined" && !conversationId && data.conversationId) {
        window.history.replaceState({}, "", `/create-course/${data.conversationId}`);
      }
      setConversationId(data.conversationId);

      appendTutorMessage(
        data.message.content,
        Array.isArray(data.message.metadata?.relatedCourses)
          ? data.message.metadata!.relatedCourses
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
    setIsTyping(true);
    appendTutorMessage("Looking for recommended courses on this topic...");

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
      setIsTyping(false);
      const relatedCourses = Array.isArray(data.relatedCourses) ? data.relatedCourses : [];

      if ((data.hasRelatedCourses ?? relatedCourses.length > 0) && relatedCourses.length > 0) {
        appendTutorMessage(
          data.message ?? "I found some similar courses you might like.",
          relatedCourses
        );
        setAwaitingCourseGenerationDecision(true);
        return;
      }

      setGenerationStatus("Preparing your course...");
      setGenerationProgress(2);
      setLiveTitle(suggestedSubject);
      setCurriculumModules([]);
      setIsGenerating(true);
      await startGeneration(conversationId);
    } catch {
      setIsTyping(false);
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

      if (data.message) appendTutorMessage(data.message);
    } catch {
      setSubmitError("Couldn't process your response. Please try again.");
    }
  };

  const handleRestart = async () => {
    if (jobStreamRef.current) {
      jobStreamRef.current.close();
      jobStreamRef.current = null;
    }
    try {
      const res = await api.post("/chat/restart", { conversationId });
      const data = await res.json() as { newConversationId?: string };
      const newId = data.newConversationId ?? null;
      setConversationId(newId);
      if (typeof window !== "undefined" && newId) {
        window.history.replaceState({}, "", `/create-course/${newId}`);
      } else if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/create-course/new");
      }
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
    jobIdRef.current = null;
    setGenerationStatus("Preparing your course...");
    setGenerationProgress(0);
    setCreatedCourseSlug(null);
  };

  const handleCreateCourseAnyway = async () => {
    if (!conversationId) return;
    setSubmitError(null);
    setAwaitingCourseGenerationDecision(false);
    setConversationPhase("resource_retrieval");
    setGenerationStatus("Preparing your course...");
    setGenerationProgress(2);
    setLiveTitle(suggestedSubject);
    setCurriculumModules([]);
    setIsGenerating(true);
    await startGeneration(conversationId);
  };

  const startGeneration = async (convId: string) => {
    // Close any existing EventSource before starting a new one
    if (jobStreamRef.current) {
      jobStreamRef.current.close();
      jobStreamRef.current = null;
    }
    jobIdRef.current = null;

    try {
      setConversationPhase("course_generation");
      setGenerationStatus("Discovering learning resources...");
      setGenerationProgress(5);

      const res = await fetch(`/api/proxy/course/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to start generation");
      }

      const data = await res.json() as { jobId: string };
      jobIdRef.current = data.jobId;
      connectToJobStream(data.jobId);
    } catch (err) {
      setIsGenerating(false);
      setConversationPhase("resource_retrieval");
      setSubmitError(
        err instanceof Error && err.message.length < 200
          ? err.message
          : "Something went wrong while creating your course. Please try again."
      );
    }
  };

  // ── Generation Screen ────────────────────────────────────────────────────
  if (isGenerating) {
    const genPhases = [
      { label: "Discovering",  minProgress: 5  },
      { label: "Outlining",    minProgress: 10 },
      { label: "Writing",      minProgress: 15 },
      { label: "Finalizing",   minProgress: 93 },
    ];
    const activePhase = genPhases.filter(p => generationProgress >= p.minProgress).length - 1;
    const circumference = 2 * Math.PI * 52;
    const courseTitle = liveTitle || suggestedSubject || null;

    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden lg:flex-row">
        {/* Iridescent WebGL background */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <Iridescence speed={0.6} amplitude={0.08} mouseReact={false} />
        </div>

        {/* Main progress */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-4 py-8 sm:gap-7 sm:px-8 sm:py-10">

          {/* SVG circular progress */}
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center animate-in fade-in duration-700 sm:h-28 sm:w-28">
            <svg viewBox="0 0 120 120" className="h-24 w-24 -rotate-90 sm:h-28 sm:w-28" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--glass-border)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="url(#goldGrad)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - Math.min(Math.max(generationProgress, 0), 100) / 100)}
                style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
              />
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--accent-strong)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-primary sm:text-2xl">{Math.round(generationProgress)}%</span>
              <span className="text-[8px] uppercase tracking-widest text-muted-foreground/50 sm:text-[9px]">building</span>
            </div>
          </div>

          {/* Course title + status */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 text-center space-y-1.5 px-2">
            {courseTitle ? (
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                &ldquo;{courseTitle}&rdquo;
              </h2>
            ) : (
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">Building your course</h2>
            )}
            <p className="text-xs text-muted-foreground sm:text-sm">{generationStatus}</p>
          </div>

          {/* Phase tracker */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 animate-in fade-in duration-700 delay-200 sm:gap-0 sm:flex-nowrap">
            {genPhases.map((phase, i) => (
              <div key={phase.label} className="flex items-center">
                <div
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-all duration-500 sm:px-3 sm:py-1 sm:text-xs ${
                    i < activePhase
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : i === activePhase
                        ? "bg-primary/20 text-primary border border-primary/35 shadow-[0_0_8px_var(--glass-border)]"
                        : "bg-muted/20 text-muted-foreground/40 border border-border/20"
                  }`}
                >
                  {i < activePhase && <span className="mr-1">✓</span>}
                  {phase.label}
                </div>
                {i < genPhases.length - 1 && (
                  <div className={`hidden h-px w-4 shrink-0 transition-colors duration-500 sm:block ${i < activePhase ? "bg-primary/30" : "bg-border/20"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Error state */}
          {submitError && (
            <div className="neo-surface w-full max-w-sm space-y-3 rounded-2xl border border-[var(--glass-border)] p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-foreground">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Something went wrong</p>
              </div>
              <p className="text-xs text-muted-foreground">{submitError}</p>
              <div className="flex items-center justify-center gap-2">
                {createdCourseId && (
                  <Link
                    href={`/explore/${createdCourseSlug || createdCourseId}`}
                    className="skeuo-gold inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium"
                  >
                    Go to Course <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <button
                  onClick={handleRestart}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — curriculum panel (desktop) */}
        <div className="relative z-10 hidden w-72 shrink-0 flex-col border-l border-border/40 bg-card/60 backdrop-blur-md lg:flex">
          <div className="flex-shrink-0 border-b border-border/40 px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50">Course Outline</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {curriculumModules.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center">
                <p className="text-xs text-muted-foreground/40">Modules will appear as your course is built…</p>
              </div>
            ) : (
              <div className="space-y-1">
                {curriculumModules.map((mod, i) => (
                  <div
                    key={mod.index}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-1 ${
                      mod.status === "building"
                        ? "border border-primary/20 bg-primary/10"
                        : mod.status === "done"
                          ? "border border-transparent bg-primary/5"
                          : "border border-transparent bg-muted/5"
                    }`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {mod.status === "building" ? (
                      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                        <span className="absolute h-4 w-4 rounded-full border border-primary/50 animate-ping" />
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      </span>
                    ) : mod.status === "done" ? (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">✓</span>
                    ) : (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border/30 text-[9px] text-muted-foreground/30">{mod.index + 1}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className={`block truncate text-xs ${mod.status === "building" ? "font-medium text-foreground" : mod.status === "done" ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                        {mod.index + 1}. {mod.title}
                      </span>
                      {mod.lessonCount > 0 && (
                        <span className="text-[10px] text-muted-foreground/40">
                          {mod.completedLessons}/{mod.lessonCount} lessons
                        </span>
                      )}
                    </div>
                    {mod.status === "building" && (
                      <span className="shrink-0 text-[9px] text-primary/50 animate-pulse">…</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile curriculum chips */}
        {curriculumModules.length > 0 && (
          <div className="relative z-20 border-t border-border/40 bg-card/80 backdrop-blur-md px-4 py-3 lg:hidden">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50">Course Outline</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {curriculumModules.map((mod) => (
                <div
                  key={mod.index}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                    mod.status === "building"
                      ? "border border-primary/25 bg-primary/10 text-foreground font-medium"
                      : mod.status === "done"
                        ? "border border-primary/15 bg-primary/5 text-muted-foreground"
                        : "border border-border/30 bg-muted/30 text-muted-foreground/40"
                  }`}
                >
                  {mod.status === "building" ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  ) : mod.status === "done" ? (
                    <span className="text-[8px] text-primary">✓</span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
                  )}
                  {mod.index + 1}. {mod.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Chat Screen ──────────────────────────────────────────────────────────
  return (
    <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      <div ref={scrollRef} onScroll={handleScroll} className="mt-4 flex-1 min-h-0 overflow-y-auto px-4 no-scrollbar md:mt-6">
        <div className="flex flex-col pb-6 max-w-2xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center pt-10 md:pt-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h1 className="text-2xl md:text-4xl text-foreground font-medium mb-4 tracking-tight">
                {getGreeting(user?.name)}
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

          {/* Confirmation buttons now rendered inline in ChatInput */}

          {/* "Create a New Course Anyway" now rendered inline in ChatInput */}

          {submitError && (
            <div className="neo-surface mt-4 space-y-3 rounded-2xl border border-[var(--glass-border)] p-4">
              <div className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-primary" />
                <p className="text-sm font-medium">Something went wrong</p>
              </div>
              <p className="text-xs text-muted-foreground">{submitError}</p>
              {createdCourseId && (
                <Link
                  href={`/explore/${createdCourseSlug || createdCourseId}`}
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
              href={`/explore/${createdCourseSlug || createdCourseId}`}
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
          confirmation={
            requiresConfirmation && !isTyping
              ? {
                  type: isFinalConfirmation ? "final" : "subject",
                  onConfirm: handleConfirm,
                  onReject: handleReject,
                  onRestart: handleRestart,
                }
              : awaitingCourseGenerationDecision && !isTyping
                ? {
                    type: "create_anyway" as const,
                    onConfirm: handleCreateCourseAnyway,
                  }
                : null
          }
        />
      )}
    </div>
  );
}
