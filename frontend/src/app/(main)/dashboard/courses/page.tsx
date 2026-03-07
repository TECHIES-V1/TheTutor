"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { DashboardCourseCard as DashboardCourseCardData } from "@/types/course";
import { Button } from "@/components/ui/button";
import { DashboardCourseCard } from "@/components/dashboard/DashboardCourseCard";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";
import { PageLoader } from "@/components/ui/PageLoader";

export default function DashboardCoursesPage() {
  const { isLoading } = useAuth();
  const { overview, loading, error, reload } = useDashboardOverview(isLoading);

  const handlePublishToggle = useCallback(
    async (course: DashboardCourseCardData) => {
      const target = course.visibility === "published" ? "draft" : "published";
      const response = await api.patch(`/courses/${course.id}/publish`, { visibility: target });
      if (response.ok) {
        await reload();
      }
    },
    [reload]
  );

  if (isLoading || loading) {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <PageLoader
          title="Loading created courses..."
          subtitle="Fetching your authored courses and publish states."
        />
      </div>
    );
  }

  return (
    <div className="relative py-6 sm:py-8">

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6">
        <section className="neo-surface rounded-3xl border-0 p-4 sm:border sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-primary/75">Dashboard</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-foreground">Created Courses</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage publishing and continue course authoring.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button asChild variant="ghost" className="rounded-full border border-border text-sm" size="sm">
                <Link href="/dashboard">Overview</Link>
              </Button>
              <Button asChild className="skeuo-gold rounded-full hover:!opacity-100 text-sm" size="sm">
                <Link href="/create-course">Create Course</Link>
              </Button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 sm:px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {overview?.ownedCourses.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {overview.ownedCourses.map((course) => (
              <DashboardCourseCard
                key={course.id}
                course={course}
                canPublish
                showVisibility
                onTogglePublish={handlePublishToggle}
              />
            ))}
          </div>
        ) : (
          <div className="card-leather rounded-2xl p-4 sm:p-6 text-sm">
            No created courses yet. Use Create Course to bootstrap your first curriculum.
          </div>
        )}
      </div>
    </div>
  );
}
