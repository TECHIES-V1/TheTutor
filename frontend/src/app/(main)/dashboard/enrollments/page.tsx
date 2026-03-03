"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { DashboardCourseCard } from "@/components/dashboard/DashboardCourseCard";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";
import { PageLoader } from "@/components/ui/PageLoader";

export default function DashboardEnrollmentsPage() {
  const { isLoading } = useAuth();
  const { overview, loading, error } = useDashboardOverview(isLoading);

  if (isLoading || loading) {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <PageLoader
          title="Loading enrollments..."
          subtitle="Syncing your active courses and progress."
        />
      </div>
    );
  }

  return (
    <div className="relative px-4 py-6 sm:px-6 sm:py-8">

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6">
        <section className="neo-surface rounded-3xl p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-primary/75">Dashboard</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-foreground">Enrollments</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Continue your learner courses and finish certificates.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button asChild variant="ghost" className="rounded-full border border-border text-sm" size="sm">
                <Link href="/dashboard">Overview</Link>
              </Button>
              <Button asChild className="skeuo-gold rounded-full hover:!opacity-100 text-sm" size="sm">
                <Link href="/explore">Explore Courses</Link>
              </Button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 sm:px-4 py-3 text-sm text-destructive">
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
          <div className="neo-surface rounded-2xl p-4 sm:p-6 text-sm text-muted-foreground">
            No enrollments yet. Explore published courses and enroll for free.
          </div>
        )}
      </div>
    </div>
  );
}
