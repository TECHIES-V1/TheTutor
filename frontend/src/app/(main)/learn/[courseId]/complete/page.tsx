"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { CertificateSummary } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Award, ArrowLeft, Download } from "lucide-react";

interface CompletionResponse {
  completedAt: string;
  certificate: CertificateSummary;
}

export default function CourseCompletePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

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
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(212,175,55,0.08),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(212,175,55,0.05),transparent_24%)]" />

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <div className="neo-surface rounded-3xl p-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
            <Award className="h-7 w-7 text-primary" />
          </div>

          <h1 className="mt-4 text-center font-playfair text-3xl font-bold text-foreground">Course Completion</h1>
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
                    const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
                    window.location.href = `${backend}/courses/${courseId}/certificate/download`;
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
      </div>
    </div>
  );
}
