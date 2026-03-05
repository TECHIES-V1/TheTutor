"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, BookCopy, PanelRightClose, PanelRightOpen, Clock, AlertTriangle } from "lucide-react";
import { useCoursePreview } from "@/hooks/useCoursePreview";
import { CourseWorkspaceSidebar } from "@/components/course/CourseWorkspaceSidebar";
import { useCoursePanelState } from "@/hooks/useCoursePanelState";
import { AiAssistantButton } from "@/components/course/AiAssistantButton";
import { PageLoader } from "@/components/ui/PageLoader";

export default function ExploreCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params.courseId;

  const [enrolling, setEnrolling] = useState(false);
  const { data, loading, error } = useCoursePreview(courseId);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const { isOpen: isCoursePanelOpen, toggle: toggleCoursePanel } = useCoursePanelState();

  const handleEnroll = async () => {
    setEnrolling(true);
    setEnrollError(null);
    try {
      const response = await api.post(`/courses/${courseId}/enroll`, {});
      if (!response.ok) {
        throw new Error("enroll failed");
      }

      const payload = (await response.json()) as {
        enrollment: { currentLessonId: string };
      };

      router.push(`/learn/${courseId}/lessons/${payload.enrollment.currentLessonId}`);
    } catch {
      setEnrollError("Enrollment failed. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <PageLoader
            title="Loading course preview..."
            subtitle="Preparing curriculum, access, and enrollment details."
          />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">
            {error ?? "Course not found."}
          </div>
        </div>
      </div>
    );
  }

  const currentLessonId = data.course.enrollment?.currentLessonId ?? null;
  const generationStatus = (data.course as { generationStatus?: string }).generationStatus ?? "ready";
  const isGenerating = generationStatus === "pending";
  const isFailed = generationStatus === "failed";

  return (
    <div className="relative py-6 sm:py-8">

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-4 px-4 sm:px-6">

        {isGenerating && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4 shrink-0" />
            This course is still being generated. Lessons will be available shortly — check back soon.
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Course generation failed. The creator may retry generating this course.
          </div>
        )}

        <div className={`grid w-full gap-6 ${isCoursePanelOpen ? "lg:grid-cols-[1fr_21.5rem]" : "lg:grid-cols-1"}`}>
          <div className="space-y-6">
            <section id="course-overview" className="neo-surface rounded-3xl p-6 border-0 sm:border">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wide text-primary/80">Course Preview</p>
                  <h1 className="mt-2 text-3xl font-bold text-foreground">{data.course.title}</h1>
                </div>
                <button
                  onClick={toggleCoursePanel}
                  className="mt-1 shrink-0 rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  title={isCoursePanelOpen ? "Hide course panel" : "Show course panel"}
                >
                  {isCoursePanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{data.course.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Created by {data.course.author?.name || data.course.ownerName}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-primary capitalize">
                  {data.course.level}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                  {data.course.moduleCount} modules
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                  {data.course.lessonCount} lessons
                </span>
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-green-700">
                  Free (Hackathon)
                </span>
              </div>

              {(error || enrollError) && (
                <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error ?? enrollError}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {currentLessonId ? (
                  <Button asChild className="skeuo-gold rounded-full hover:!opacity-100">
                    <Link href={`/learn/${data.course.id}/lessons/${currentLessonId}`}>
                      Continue Course
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : data.access.requiresAuthToEnroll ? (
                  <Button asChild className="skeuo-gold rounded-full hover:!opacity-100">
                    <Link href="/auth/signin">
                      Sign in to Enroll
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : data.access.canEnroll ? (
                  <Button
                    onClick={handleEnroll}
                    disabled={enrolling || isGenerating || isFailed}
                    className="skeuo-gold rounded-full hover:!opacity-100"
                  >
                    {enrolling ? "Enrolling..." : isGenerating ? "Generating..." : "Enroll for Free"}
                  </Button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Access already available
                  </div>
                )}

                <Button asChild variant="ghost" className="rounded-full border border-border">
                  <Link href="/explore">Back to Explore</Link>
                </Button>
              </div>
            </section>

            <section id="course-curriculum" className="neo-surface rounded-3xl p-6 border-0 sm:border">
              <div className="mb-4 flex items-center gap-2">
                <BookCopy className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Curriculum Outline</h2>
              </div>

              <div className="space-y-4">
                {data.curriculumOutline.map((module) => (
                  <div key={module.moduleId} className="rounded-2xl border border-primary/15 bg-card/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-primary/80">Module {module.order}</p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{module.title}</h3>
                    {module.moduleQuiz && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {module.moduleQuiz.title} • {module.moduleQuiz.questionCount} questions
                      </p>
                    )}
                    <ul className="mt-3 space-y-2">
                      {module.lessons.map((lesson) => (
                        <li
                          id={`lesson-${lesson.lessonId}`}
                          key={lesson.lessonId}
                          className="rounded-xl border border-border/80 bg-background/40 p-3"
                        >
                          <p className="text-sm font-medium text-foreground">
                            Lesson {lesson.order}: {lesson.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{lesson.summary}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {data.course.sourceAttribution.length > 0 && (
              <section id="course-sources" className="neo-surface rounded-3xl p-6 border-0 sm:border">
                <h2 className="text-xl font-bold text-foreground">Textbook Sources</h2>
                <ul className="mt-3 space-y-2">
                  {data.course.sourceAttribution.map((source) => (
                    <li key={`${source.title}-${source.source}`} className="rounded-xl border border-border/70 bg-card/50 p-3">
                      <p className="text-sm font-semibold text-foreground">{source.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {source.authors.length > 0 ? source.authors.join(", ") : "Unknown author"} • {source.source || "source unavailable"}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <CourseWorkspaceSidebar
            courseId={data.course.id}
            title={data.course.title}
            authorName={data.course.author?.name || data.course.ownerName}
            level={data.course.level}
            moduleCount={data.course.moduleCount}
            lessonCount={data.course.lessonCount}
            curriculum={data.curriculumOutline}
            activeView="preview"
            currentLessonId={currentLessonId}
            progressPercent={data.course.enrollment?.progressPercent ?? null}
            canOpenLessons={Boolean(data.access.isOwner || data.access.isEnrolled)}
            isOpen={isCoursePanelOpen}
            onToggle={toggleCoursePanel}
          />
        </div>

        {/* AI Assistant Button */}
        <AiAssistantButton
          courseId={data.course.id}
          lessonId={data.curriculumOutline[0]?.lessons[0]?.lessonId || ""}
        />
      </div>
    </div>
  );
}
