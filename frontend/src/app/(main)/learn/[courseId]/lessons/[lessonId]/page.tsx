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

function renderMarkdown(content: string) {
  return content.split("\n").map((line, index) => {
    const key = `${line}-${index}`;
    if (line.startsWith("# ")) {
      return (
        <h2 key={key} className="mt-4 font-playfair text-2xl font-bold text-foreground">
          {line.slice(2)}
        </h2>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h3 key={key} className="mt-4 text-lg font-semibold text-foreground">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={key} className="ml-5 list-disc text-sm text-muted-foreground">
          {line.slice(2)}
        </li>
      );
    }
    if (!line.trim()) {
      return <div key={key} className="h-2" />;
    }
    return (
      <p key={key} className="text-sm leading-relaxed text-muted-foreground">
        {line}
      </p>
    );
  });
}

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
                    src={data.lesson.videoUrl}
                    title={data.lesson.title}
                    className="h-64 w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <div className="mt-6 space-y-1">{renderMarkdown(data.lesson.contentMarkdown)}</div>
              </article>

              <aside className="neo-surface h-fit rounded-3xl p-5 xl:sticky xl:top-6">
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
                  <p className="mt-2 text-sm text-muted-foreground">
                    {assistantAnswer || "Assistant responses will appear here."}
                  </p>
                </div>
              </aside>
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
