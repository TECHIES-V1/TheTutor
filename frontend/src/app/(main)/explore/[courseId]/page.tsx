"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CoursePreviewResponse } from "@/types/course";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, BookCopy } from "lucide-react";

export default function ExploreCourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params.courseId;

  const [data, setData] = useState<CoursePreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/courses/${courseId}/preview`);
      if (!response.ok) {
        throw new Error("Failed to load course preview");
      }

      const payload = (await response.json()) as CoursePreviewResponse;
      setData(payload);
    } catch {
      setError("Could not load this course preview.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleEnroll = async () => {
    setEnrolling(true);
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
      setError("Enrollment failed. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">Loading preview...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-6 py-8">
        <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">
          {error ?? "Course not found."}
        </div>
      </div>
    );
  }

  const currentLessonId = data.course.enrollment?.currentLessonId ?? null;

  return (
    <div className="relative px-6 py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(212,175,55,0.08),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(212,175,55,0.05),transparent_24%)]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl space-y-6">
        <div className="neo-surface rounded-3xl p-6">
          <p className="text-xs uppercase tracking-wide text-primary/80">Course Preview</p>
          <h1 className="mt-2 font-playfair text-3xl font-bold text-foreground">{data.course.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{data.course.description}</p>

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

          {error && (
            <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
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
            ) : data.access.canEnroll ? (
              <Button
                onClick={handleEnroll}
                disabled={enrolling}
                className="skeuo-gold rounded-full hover:!opacity-100"
              >
                {enrolling ? "Enrolling..." : "Enroll for Free"}
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
        </div>

        <section className="neo-surface rounded-3xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <BookCopy className="h-5 w-5 text-primary" />
            <h2 className="font-playfair text-2xl font-bold text-foreground">Curriculum Outline</h2>
          </div>

          <div className="space-y-4">
            {data.curriculumOutline.map((module) => (
              <div key={module.moduleId} className="rounded-2xl border border-primary/15 bg-card/60 p-4">
                <p className="text-xs uppercase tracking-wide text-primary/80">Module {module.order}</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{module.title}</h3>
                <ul className="mt-3 space-y-2">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.lessonId} className="rounded-xl border border-border/80 bg-background/40 p-3">
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
      </div>
    </div>
  );
}
