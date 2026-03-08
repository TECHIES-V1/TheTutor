"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { BookOpen, Clock, Flame, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";
import { PageLoader } from "@/components/ui/PageLoader";

function getTimeGreeting(name?: string) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${greeting}, ${name.split(" ")[0]}` : greeting;
}

interface StatsCard {
  label: string;
  value: string;
  icon: typeof Flame;
  suffix: string;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { overview, loading: loadingOverview, error } = useDashboardOverview(isLoading);

  const stats = useMemo<StatsCard[]>(() => {
    return [
      {
        label: "Completed Courses",
        value: String(overview?.stats.completedCourses ?? 0),
        icon: Flame,
        suffix: "completed",
      },
      {
        label: "Courses Enrolled",
        value: String(overview?.stats.enrolledCourses ?? 0),
        icon: BookOpen,
        suffix: "courses",
      },
      {
        label: "Hours Learned",
        value: String(overview?.stats.hoursLearned ?? 0),
        icon: Clock,
        suffix: "hours",
      },
    ];
  }, [overview]);

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8">
        <PageLoader
          title="Loading dashboard..."
          subtitle="Preparing your learning overview."
        />
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8">

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-7 px-4 sm:px-6">
        <section className="neo-surface rounded-3xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-foreground">
            {getTimeGreeting(overview?.greetingName ?? user?.name)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This is your overview page. Use Created Courses and Enrollments for full lists.
          </p>

          <div className="mt-5 grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {stats.map(({ label, value, icon: Icon, suffix }) => (
              <div key={label} className="card-leather rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <div className="neo-inset flex h-8 w-8 items-center justify-center rounded-lg">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{suffix}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 grid-cols-1 md:grid-cols-2">
            <Link href="/dashboard/courses" className="card-leather motion-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-primary/75">Created Courses</p>
              <p className="mt-2 text-xl font-bold text-foreground">{overview?.ownedCourses.length ?? 0}</p>
              <p className="mt-1 text-sm text-muted-foreground">Manage authored courses and publishing.</p>
            </Link>

            <Link href="/dashboard/enrollments" className="card-leather motion-card rounded-2xl p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-primary/75">Enrollments</p>
              <p className="mt-2 text-xl font-bold text-foreground">{overview?.enrolledCourses.length ?? 0}</p>
              <p className="mt-1 text-sm text-muted-foreground">Continue learner courses and certificates.</p>
            </Link>
          </div>
        </section>

        {error && (
          <div className="neo-surface rounded-2xl border border-[var(--glass-border)] px-5 py-4 text-center">
            <p className="text-sm font-medium text-foreground">Something went wrong</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {loadingOverview ? (
          <PageLoader
            title="Refreshing dashboard..."
            subtitle="Updating progress cards and course summaries."
          />
        ) : (
          <div className="neo-surface rounded-2xl p-4 sm:p-6">
            <p className="text-sm text-muted-foreground">Open detailed pages:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="ghost" className="rounded-full border border-border">
                <Link href="/dashboard/courses">Created Courses</Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="rounded-full border border-border">
                <Link href="/dashboard/enrollments">
                  <GraduationCap className="h-4 w-4" />
                  Enrollments
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
