"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ModuleQuizResponse, ModuleQuizAttemptResult } from "@/types/course";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, RotateCcw, LayoutDashboard } from "lucide-react";
import { useCoursePreview } from "@/hooks/useCoursePreview";
import { CourseWorkspaceSidebar } from "@/components/course/CourseWorkspaceSidebar";
import { useCoursePanelState } from "@/hooks/useCoursePanelState";

export default function ModuleQuizPage() {
  const params = useParams<{ courseId: string; moduleId: string }>();
  const { courseId, moduleId } = params;
  const { data: preview } = useCoursePreview(courseId);
  const { isOpen: isCoursePanelOpen, toggle: toggleCoursePanel } = useCoursePanelState();

  const [quizData, setQuizData] = useState<ModuleQuizResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ModuleQuizAttemptResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadQuiz = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await api.get(`/courses/${courseId}/modules/${moduleId}/quiz`);
        if (!response.ok) throw new Error("load failed");
        const payload = (await response.json()) as ModuleQuizResponse;
        if (!cancelled) {
          setQuizData(payload);
          setAnswers(
            payload.questions.reduce<Record<string, string>>((acc, q) => {
              acc[q.questionId] = "";
              return acc;
            }, {})
          );
        }
      } catch {
        if (!cancelled) setLoadError("Could not load the module quiz.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadQuiz();
    return () => {
      cancelled = true;
    };
  }, [courseId, moduleId]);

  const isFormValid = useMemo(() => {
    if (!quizData) return false;
    return quizData.questions.every((q) => (answers[q.questionId] ?? "").trim().length > 0);
  }, [quizData, answers]);

  const submitQuiz = async () => {
    if (!quizData) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.post(`/courses/${courseId}/modules/${moduleId}/quiz-attempts`, {
        answers: quizData.questions.map((q) => ({
          questionId: q.questionId,
          response: answers[q.questionId] ?? "",
        })),
      });
      if (!response.ok) throw new Error("submit failed");
      const payload = (await response.json()) as ModuleQuizAttemptResult;
      setResult(payload);
    } catch {
      setSubmitError("Quiz submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const nextLessonId = preview?.course.enrollment?.currentLessonId ?? null;

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">Loading module quiz...</div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="px-6 py-8">
        <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">
          {loadError ?? "Module quiz not available."}
        </div>
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
            <section className="neo-surface rounded-3xl p-6">
              <p className="text-xs uppercase tracking-wide text-primary/80">Module Checkpoint</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">{quizData.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Demonstrate your understanding of this module. Pass score: {Math.round((result?.passThreshold ?? 0.7) * 100)}%.
              </p>

              <div className="mt-6 space-y-4">
                {quizData.questions.map((question, index) => (
                  <div key={question.questionId} className="rounded-2xl border border-border/80 bg-card/60 p-4">
                    <p className="text-sm font-medium text-foreground">
                      {index + 1}. {question.prompt}
                    </p>
                    <textarea
                      value={answers[question.questionId] ?? ""}
                      onChange={(event) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.questionId]: event.target.value,
                        }))
                      }
                      className="neo-inset mt-3 min-h-24 w-full rounded-xl border border-border/70 bg-transparent p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                      placeholder="Write your answer..."
                    />
                  </div>
                ))}
              </div>

              {submitError && (
                <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild variant="ghost" className="rounded-full border border-border">
                  <Link href={`/dashboard`}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </Button>
                <Button
                  onClick={submitQuiz}
                  disabled={submitting || !isFormValid}
                  className="skeuo-gold rounded-full hover:!opacity-100"
                >
                  {submitting ? "Submitting..." : "Submit Answers"}
                </Button>
              </div>
            </section>

            {result && (
              <section className="neo-surface rounded-3xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-2xl font-bold text-foreground">Module Feedback</h2>
                  <span
                    className={`rounded-full border px-3 py-1 text-sm ${
                      result.passed
                        ? "border-green-500/30 bg-green-500/10 text-green-700"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                    }`}
                  >
                    Score {Math.round(result.score * 100)}%
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {result.feedback.map((item, index) => (
                    <div key={item.questionId} className="rounded-xl border border-border/80 bg-background/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-primary/80">Question {index + 1}</p>
                      <p className="mt-1 text-sm text-foreground">Score: {Math.round(item.score * 100)}%</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.correctiveFeedback}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {!result.passed && (
                    <Button
                      onClick={() => setResult(null)}
                      variant="ghost"
                      className="rounded-full border border-border"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retry Quiz
                    </Button>
                  )}

                  {result.passed && nextLessonId && (
                    <Button asChild className="skeuo-gold rounded-full hover:!opacity-100">
                      <Link href={`/learn/${courseId}/lessons/${nextLessonId}`}>
                        Continue to Next Lesson
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}

                  {result.passed && (
                    <Button asChild variant="ghost" className="rounded-full border border-border">
                      <Link href="/dashboard">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                  )}
                </div>
              </section>
            )}
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
              activeView="quiz"
              activeLessonId={null}
              currentLessonId={preview.course.enrollment?.currentLessonId ?? null}
              progressPercent={preview.course.enrollment?.progressPercent ?? null}
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
