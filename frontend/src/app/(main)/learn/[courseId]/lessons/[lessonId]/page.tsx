"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { LessonDetailResponse } from "@/types/course";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ChevronDown, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useCoursePreview } from "@/hooks/useCoursePreview";
import { CourseWorkspaceSidebar } from "@/components/course/CourseWorkspaceSidebar";
import { useCoursePanelState } from "@/hooks/useCoursePanelState";
import { AiAssistantButton } from "@/components/course/AiAssistantButton";
import { MarkdownContent } from "@/components/ui/markdown-content";
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
      if (parsed.pathname.startsWith("/embed/")) return url;
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
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/courses/${courseId}/lessons/${lessonId}`);
        if (!res.ok) throw new Error("failed");
        const payload = (await res.json()) as LessonDetailResponse;
        if (!cancelled) setData(payload);
      } catch {
        if (!cancelled) setError("Could not load this lesson.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [courseId, lessonId]);

  if (loading) {
    return (
      <div className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <PageLoader title="Loading lesson..." subtitle="Preparing lesson content, videos, and citations." />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">{error ?? "Lesson not found."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-6 sm:py-8">
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className={`grid w-full gap-6 ${isCoursePanelOpen ? "lg:grid-cols-[1fr_21.5rem]" : "lg:grid-cols-1"}`}>

          {/* Main content */}
          <div className="space-y-0">
            <article className="neo-surface rounded-3xl p-5 sm:p-6 border-0 sm:border">
              {/* Header row */}
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-widest text-primary/70">
                    {data.course.title}
                  </p>
                  <h1 className="mt-1.5 text-xl font-bold text-foreground sm:text-2xl">
                    {data.lesson.title}
                  </h1>
                  {data.lesson.summary && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {data.lesson.summary}
                    </p>
                  )}
                </div>
                <button
                  onClick={toggleCoursePanel}
                  className="mt-1 shrink-0 rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  title={isCoursePanelOpen ? "Hide course panel" : "Show course panel"}
                >
                  {isCoursePanelOpen
                    ? <PanelRightClose className="h-4 w-4" />
                    : <PanelRightOpen className="h-4 w-4" />}
                </button>
              </div>

              {/* Video */}
              {data.lesson.videoUrl && (
                <div className="mt-5 overflow-hidden rounded-2xl border border-border/60">
                  <iframe
                    src={toEmbedUrl(data.lesson.videoUrl)}
                    title={data.lesson.title}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Content */}
              <div className="mt-6 text-sm leading-relaxed text-muted-foreground">
                <MarkdownContent>{data.lesson.contentMarkdown}</MarkdownContent>
              </div>

              {/* Video References */}
              {data.lesson.videoReferences.length > 0 && (
                <Accordion label="Video References">
                  <ul className="space-y-2">
                    {data.lesson.videoReferences.map((video, i) => (
                      <li key={`${video.url}-${i}`} className="card-leather rounded-lg p-3">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {video.title || `Reference Video ${i + 1}`}
                        </a>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {video.channelName || "Unknown channel"}
                          {video.queryUsed ? ` — "${video.queryUsed}"` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Accordion>
              )}

              {/* Citations */}
              {data.lesson.citations.length > 0 && (
                <Accordion label="APA Citations">
                  <ul className="space-y-2">
                    {data.lesson.citations.map((c, i) => (
                      <li key={`${c.citationKey}-${i}`} className="card-leather rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">{c.citationText}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                          {c.sourceTitle || "Unknown"} —{" "}
                          {c.authors.length > 0 ? c.authors.join(", ") : "Unknown author"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Accordion>
              )}

              {/* Module Checkpoint */}
              {data.navigation.isLastLessonInModule && data.lesson.moduleQuiz && (
                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-4">
                  <h3 className="text-sm font-semibold text-primary">Module Checkpoint</h3>
                  <p className="mt-1 text-xs text-primary/80">
                    You&apos;ve finished this module&apos;s lessons. Take the checkpoint quiz to lock in your progress.
                  </p>
                  <Link
                    href={`/learn/${courseId}/modules/${data.navigation.moduleId}/quiz`}
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    Take Module Quiz
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              {/* Navigation — merged into article card */}
              <div className="mt-6 border-t border-border/40 pt-4">
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="ghost" className="rounded-full border border-border">
                    <Link href="/dashboard">
                      <ArrowLeft className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  {data.navigation.previousLessonId && (
                    <Button asChild variant="ghost" className="rounded-full border border-border">
                      <Link href={`/learn/${courseId}/lessons/${data.navigation.previousLessonId}`}>
                        <ArrowLeft className="h-4 w-4" />
                        Previous
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
            </article>
          </div>

          {/* Course sidebar — now inside the grid */}
          {preview && (
            <CourseWorkspaceSidebar
              courseId={preview.course.slug || preview.course.id}
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

      <AiAssistantButton
        courseId={courseId}
        lessonId={lessonId}
        lessonTitle={data.lesson.title}
        lessonContent={String(data.lesson.contentMarkdown ?? data.lesson.summary ?? "")}
      />
    </div>
  );
}

function Accordion({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-leather mt-6 rounded-2xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground"
      >
        {label}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
