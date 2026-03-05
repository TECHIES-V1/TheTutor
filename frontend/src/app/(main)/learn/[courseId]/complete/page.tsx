"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { CertificateSummary } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Award, ArrowLeft, Download, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useCoursePreview } from "@/hooks/useCoursePreview";
import { CourseWorkspaceSidebar } from "@/components/course/CourseWorkspaceSidebar";
import { useCoursePanelState } from "@/hooks/useCoursePanelState";
import { BACKEND_URL } from "@/lib/backendUrl";

interface CompletionResponse {
  completedAt: string;
  certificate: CertificateSummary;
}

export default function CourseCompletePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const { data: preview } = useCoursePreview(courseId);
  const { isOpen: isCoursePanelOpen, toggle: toggleCoursePanel } = useCoursePanelState();

  const [certificate, setCertificate] = useState<CertificateSummary | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCertificate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/courses/${courseId}/certificate`);
      if (response.status === 404) {
        setCertificate(null);
        return;
      }
      if (!response.ok) {
        throw new Error("failed");
      }

      const payload = (await response.json()) as { certificate: CertificateSummary };
      setCertificate(payload.certificate);
    } catch {
      setError("Could not load completion data.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCertificate();
  }, [loadCertificate]);

  const finishCourse = async () => {
    setFinishing(true);
    setError(null);
    try {
      const response = await api.post(`/courses/${courseId}/complete`, {});
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "finish failed");
      }

      const payload = (await response.json()) as CompletionResponse;
      setCertificate(payload.certificate);
      setCompletedAt(payload.completedAt);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not finish the course.";
      setError(message);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <div className="relative px-6 py-8">

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-4">
        <div className={`grid w-full gap-6 ${isCoursePanelOpen ? "lg:grid-cols-[1fr_21.5rem]" : "lg:grid-cols-1"}`}>
          <div className="neo-surface rounded-3xl p-6 border-0 sm:border">
            <div className="flex justify-end">
              <button
                onClick={toggleCoursePanel}
                className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                title={isCoursePanelOpen ? "Hide course panel" : "Show course panel"}
              >
                {isCoursePanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </button>
            </div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
              <Award className="h-7 w-7 text-primary" />
            </div>

            <h1 className="mt-4 text-center text-3xl font-bold text-foreground">Course Completion</h1>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Finish the course and generate your completion certificate.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {loading ? (
              <div className="mt-5 text-center text-sm text-muted-foreground">Loading completion status...</div>
            ) : certificate ? (
              <div className="mt-6 space-y-4 rounded-2xl border border-primary/20 bg-primary/10 p-5">
                <p className="text-sm text-foreground">
                  Certificate #{certificate.certificateNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  Issued on {new Date(certificate.issuedAt).toLocaleDateString()}
                </p>
                {completedAt && (
                  <p className="text-xs text-muted-foreground">
                    Course marked complete on {new Date(completedAt).toLocaleDateString()}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      window.location.href = `${BACKEND_URL}/courses/${courseId}/certificate/download`;
                    }}
                    className="skeuo-gold rounded-full hover:!opacity-100"
                  >
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </Button>
                  <Button asChild variant="ghost" className="rounded-full border border-border">
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <Button onClick={finishCourse} disabled={finishing} className="skeuo-gold rounded-full hover:!opacity-100">
                  {finishing ? "Finishing..." : "Finish Course"}
                </Button>
                <Button asChild variant="ghost" className="rounded-full border border-border">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
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
              activeView="complete"
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
