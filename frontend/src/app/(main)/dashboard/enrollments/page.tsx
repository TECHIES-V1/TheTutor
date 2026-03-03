"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { DashboardCourseCard } from "@/components/dashboard/DashboardCourseCard";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";

export default function DashboardEnrollmentsPage() {
  const { isLoading } = useAuth();
  const { overview, loading, error } = useDashboardOverview(isLoading);

  if (isLoading || loading) {
    return (
      <div className="px-6 py-8">
        <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">Loading enrollments...</div>
      </div>
    );
  }

  return (
    <div className="relative px-6 py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(212,175,55,0.08),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(212,175,55,0.05),transparent_24%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6">
        <section className="neo-surface rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-primary/75">Dashboard</p>
              <h1 className="mt-1 text-3xl font-bold text-foreground">Enrollments</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Continue your learner courses and finish certificates.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="ghost" className="rounded-full border border-border">
                <Link href="/dashboard">Overview</Link>
              </Button>
              <Button asChild className="skeuo-gold rounded-full hover:!opacity-100">
                <Link href="/explore">Explore Courses</Link>
              </Button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {overview?.enrolledCourses.length ? (
          <div className="grid gap-4">
            {overview.enrolledCourses.map((course) => (
              <DashboardCourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">
            No enrollments yet. Explore published courses and enroll for free.
          </div>
        )}
      </div>
    </div>
  );
}

