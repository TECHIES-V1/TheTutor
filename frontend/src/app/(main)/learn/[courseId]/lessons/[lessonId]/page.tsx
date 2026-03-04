"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { LessonDetailResponse } from "@/types/course";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useCoursePreview } from "@/hooks/useCoursePreview";
import { CourseWorkspaceSidebar } from "@/components/course/CourseWorkspaceSidebar";
import { useCoursePanelState } from "@/hooks/useCoursePanelState";
import ReactMarkdown from "react-markdown";
import { AiAssistantButton } from "@/components/course/AiAssistantButton";
import { PageLoader } from "@/components/ui/PageLoader";

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

export default function LessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const { courseId, lessonId } = params;
  const { data: preview } = useCoursePreview(courseId);
  const { isOpen: isCoursePanelOpen, toggle: toggleCoursePanel } = useCoursePanelState();

  const [data, setData] = useState<LessonDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="px-6 py-8">
        <PageLoader
          title="Loading lesson..."
          subtitle="Preparing lesson content, videos, and citations."
        />
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
            <section className="grid gap-6 xl:grid-cols-1">
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
                      h1: (props) => <h1 className="mt-6 mb-2 font-playfair text-xl font-bold text-foreground" {...props} />,
                      h2: (props) => <h2 className="mt-5 mb-2 font-playfair text-lg font-bold text-foreground" {...props} />,
                      h3: (props) => <h3 className="mt-4 mb-2 text-base font-semibold text-foreground" {...props} />,
                      h4: (props) => <h4 className="mt-3 mb-1 text-sm font-semibold text-foreground" {...props} />,
                      p: (props) => <p className="mb-4" {...props} />,
                      ul: (props) => <ul className="mb-4 ml-6 list-disc space-y-1" {...props} />,
                      ol: (props) => <ol className="mb-4 ml-6 list-decimal space-y-1" {...props} />,
                      li: (props) => <li {...props} />,
                      blockquote: (props) => <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground" {...props} />,
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
                            {video.queryUsed ? ` - Query: "${video.queryUsed}"` : ""}
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
                              Source: {citation.sourceTitle || "Unknown"} -{" "}
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

        </div>

        <AiAssistantButton
          courseId={courseId}
          lessonId={lessonId}
          lessonTitle={data.lesson.title}
          lessonContent={data.lesson.summary ?? String(data.lesson.contentMarkdown ?? "").slice(0, 2000)}
        />

        {preview && isCoursePanelOpen && (
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
        )}
      </div>
    </div>
  );
}
