"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { BookOpen, Clock, Flame, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardOverview } from "@/hooks/useDashboardOverview";

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
      <div className="flex flex-1 items-center justify-center">
        <div className="neo-surface flex h-14 w-14 items-center justify-center rounded-2xl">
          <span className="skeuo-gold flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold">
            T
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 sm:py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(212,175,55,0.08),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(212,175,55,0.05),transparent_24%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-7">
        <section className="neo-surface rounded-3xl p-6">
          <h3 className="text-2xl font-bold text-foreground">
            {getTimeGreeting(overview?.greetingName ?? user?.name)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This is your overview page. Use Created Courses and Enrollments for full lists.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {stats.map(({ label, value, icon: Icon, suffix }) => (
              <div key={label} className="rounded-2xl border border-border/80 bg-card/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <div className="neo-inset flex h-8 w-8 items-center justify-center rounded-lg">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-foreground">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{suffix}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Link href="/dashboard/courses" className="motion-card rounded-2xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-primary/75">Created Courses</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{overview?.ownedCourses.length ?? 0}</p>
              <p className="mt-1 text-sm text-muted-foreground">Manage authored courses and publishing.</p>
            </Link>

            <Link href="/dashboard/enrollments" className="motion-card rounded-2xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-primary/75">Enrollments</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{overview?.enrolledCourses.length ?? 0}</p>
              <p className="mt-1 text-sm text-muted-foreground">Continue learner courses and certificates.</p>
            </Link>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loadingOverview ? (
          <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">Loading dashboard...</div>
        ) : (
          <div className="neo-surface rounded-2xl p-6">
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

