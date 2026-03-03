"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { LessonDetailResponse } from "@/types/course";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useCoursePreview } from "@/hooks/useCoursePreview";
import { CourseWorkspaceSidebar } from "@/components/course/CourseWorkspaceSidebar";
import { useCoursePanelState } from "@/hooks/useCoursePanelState";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

function toEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return url;
      }
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return url;
  }
  return url;
}

// Markdown rendering moved to ReactMarkdown component

export default function LessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const { courseId, lessonId } = params;
  const { data: preview } = useCoursePreview(courseId);
  const { isOpen: isCoursePanelOpen, toggle: toggleCoursePanel } = useCoursePanelState();

  const [data, setData] = useState<LessonDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadLesson = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/courses/${courseId}/lessons/${lessonId}`);
        if (!response.ok) {
          throw new Error("failed to load lesson");
        }

        const payload = (await response.json()) as LessonDetailResponse;
        if (!cancelled) {
          setData(payload);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load this lesson.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLesson();
    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId]);

  const handleAskAssistant = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;

    setAssistantLoading(true);
    try {
      const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/assistant`, {
        question,
      });
      if (!response.ok) throw new Error("assistant failed");

      const payload = (await response.json()) as { answer: string };
      setAssistantAnswer(payload.answer);
    } catch {
      setAssistantAnswer("The assistant is unavailable right now. Please try again.");
    } finally {
      setAssistantLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">Loading lesson...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-6 py-8">
        <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">{error ?? "Lesson not found."}</div>
      </div>
    );
  }

  return (
    <div className="relative px-6 py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(212,175,55,0.08),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(212,175,55,0.05),transparent_24%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-4">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={toggleCoursePanel}
            className="rounded-full border border-border"
          >
            {isCoursePanelOpen ? "Hide Course Sidebar" : "Show Course Sidebar"}
          </Button>
        </div>

        <div className={`grid w-full gap-6 ${isCoursePanelOpen ? "lg:grid-cols-[1fr_21.5rem]" : "lg:grid-cols-1"}`}>
          <div className="space-y-6">
            <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
              <article className="neo-surface rounded-3xl p-6">
                <p className="text-xs uppercase tracking-wide text-primary/80">{data.course.title}</p>
                <h1 className="mt-2 text-3xl font-bold text-foreground">{data.lesson.title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{data.lesson.summary}</p>

                <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                  <iframe
                    src={toEmbedUrl(data.lesson.videoUrl)}
                    title={data.lesson.title}
                    className="h-64 w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="mt-6 mb-2 font-playfair text-xl font-bold text-foreground" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="mt-5 mb-2 font-playfair text-lg font-bold text-foreground" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="mt-4 mb-2 text-base font-semibold text-foreground" {...props} />,
                      h4: ({ node, ...props }) => <h4 className="mt-3 mb-1 text-sm font-semibold text-foreground" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                      ul: ({ node, ...props }) => <ul className="mb-4 ml-6 list-disc space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="mb-4 ml-6 list-decimal space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li {...props} />,
                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground" {...props} />,
                    }}
                  >
                    {data.lesson.contentMarkdown}
                  </ReactMarkdown>
                </div>

                {data.lesson.videoReferences.length > 0 && (
                  <details className="mt-6 group rounded-2xl border border-border/80 bg-card/60 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground list-none flex justify-between items-center">
                      Video References
                      <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                      </span>
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {data.lesson.videoReferences.map((video, index) => (
                        <li key={`${video.url}-${index}`} className="rounded-lg border border-border/70 bg-background/50 p-3">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {video.title || `Reference Video ${index + 1}`}
                          </a>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {video.channelName || "Unknown channel"}
                            {video.queryUsed ? ` • Query: "${video.queryUsed}"` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {data.lesson.citations.length > 0 && (
                  <details className="mt-6 group rounded-2xl border border-border/80 bg-card/60 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-foreground list-none flex justify-between items-center">
                      APA Citations
                      <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                      </span>
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {data.lesson.citations.map((citation, index) => (
                        <li key={`${citation.citationKey}-${index}`} className="rounded-lg border border-border/70 bg-background/50 p-3">
                          <p className="text-xs text-muted-foreground">
                            {citation.citationText}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-[11px] text-muted-foreground">
                              Source: {citation.sourceTitle || "Unknown"} •{" "}
                              {citation.authors.length > 0 ? citation.authors.join(", ") : "Unknown author"}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {data.navigation.isLastLessonInModule && data.lesson.moduleQuiz && (
                  <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                    <h3 className="text-sm font-semibold text-primary">Module Checkpoint</h3>
                    <p className="mt-1 text-xs text-primary/80">
                      You&apos;ve finished this module&apos;s lessons. Take the checkpoint quiz to lock in your progress.
                    </p>
                    <Link
                      href={`/learn/${courseId}/modules/${data.navigation.moduleId}/quiz`}
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      Take Module Quiz
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </article>

              <div className="fixed bottom-6 right-6 xl:static xl:block z-50">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-lg skeuo-gold xl:hidden hover:scale-105 transition-transform">
                      <Sparkles className="h-6 w-6" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md xl:hidden">
                    <DialogTitle>AI Assistant</DialogTitle>
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Ask for summary, quiz prep, or practice guidance for this lesson.
                      </p>
                      <form onSubmit={handleAskAssistant} className="space-y-3">
                        <textarea
                          value={question}
                          onChange={(event) => setQuestion(event.target.value)}
                          placeholder="Ask about this lesson..."
                          className="neo-inset min-h-28 w-full rounded-xl border border-border/70 bg-transparent p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                        />
                        <Button
                          type="submit"
                          disabled={assistantLoading || !question.trim()}
                          className="w-full rounded-full border border-primary/30 bg-primary/15 text-primary hover:bg-primary/20"
                        >
                          {assistantLoading ? "Thinking..." : "Ask Assistant"}
                        </Button>
                      </form>
                      <div className="rounded-xl border border-border/70 bg-background/40 p-4">
                        <p className="text-xs uppercase tracking-wide text-primary/70">Response</p>
                        <p className="mt-2 text-sm text-muted-foreground max-h-48 overflow-y-auto">
                          {assistantAnswer || "Assistant responses will appear here."}
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <aside className="hidden xl:block neo-surface h-fit rounded-3xl p-5 xl:sticky xl:top-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">AI Assistant</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ask for summary, quiz prep, or practice guidance for this lesson.
                  </p>

                  <form onSubmit={handleAskAssistant} className="mt-4 space-y-3">
                    <textarea
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder="Ask about this lesson..."
                      className="neo-inset min-h-28 w-full rounded-xl border border-border/70 bg-transparent p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <Button
                      type="submit"
                      disabled={assistantLoading || !question.trim()}
                      className="w-full rounded-full border border-primary/30 bg-primary/15 text-primary hover:bg-primary/20"
                    >
                      {assistantLoading ? "Thinking..." : "Ask Assistant"}
                    </Button>
                  </form>

                  <div className="mt-4 rounded-xl border border-border/70 bg-background/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-primary/70">Response</p>
                    <p className="mt-2 text-sm text-muted-foreground max-h-64 overflow-y-auto">
                      {assistantAnswer || "Assistant responses will appear here."}
                    </p>
                  </div>
                </aside>
              </div>
            </section>

            <div className="neo-surface rounded-2xl p-4">
              <div className="flex flex-wrap gap-2">
                {data.navigation.previousLessonId && (
                  <Button asChild variant="ghost" className="rounded-full border border-border">
                    <Link href={`/learn/${courseId}/lessons/${data.navigation.previousLessonId}`}>
                      <ArrowLeft className="h-4 w-4" />
                      Previous Lesson
                    </Link>
                  </Button>
                )}
                <Button asChild className="skeuo-gold rounded-full hover:!opacity-100">
                  <Link href={`/learn/${courseId}/lessons/${lessonId}/quiz`}>
                    Take Quiz
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                {data.navigation.nextLessonId && (
                  <Button asChild variant="ghost" className="rounded-full border border-border">
                    <Link href={`/learn/${courseId}/lessons/${data.navigation.nextLessonId}`}>
                      Skip to Next
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {preview ? (
            <CourseWorkspaceSidebar
              courseId={preview.course.id}
              title={preview.course.title}
              authorName={preview.course.author?.name || preview.course.ownerName}
              level={preview.course.level}
              moduleCount={preview.course.moduleCount}
              lessonCount={preview.course.lessonCount}
              curriculum={preview.curriculumOutline}
              activeView="lesson"
              activeLessonId={lessonId}
              currentLessonId={data.progress?.currentLessonId ?? preview.course.enrollment?.currentLessonId ?? null}
              progressPercent={data.progress?.progressPercent ?? preview.course.enrollment?.progressPercent ?? null}
              canOpenLessons
              isOpen={isCoursePanelOpen}
              onToggle={toggleCoursePanel}
            />
          ) : (
            isCoursePanelOpen && (
              <aside className="neo-surface hidden rounded-3xl p-4 lg:sticky lg:top-6 lg:block lg:self-start">
                <p className="text-sm text-muted-foreground">Loading course navigation...</p>
              </aside>
            )
          )}
        </div>
      </div>
    </div>
  );
}
