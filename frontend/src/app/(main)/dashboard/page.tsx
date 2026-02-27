"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { DashboardOverview, DashboardCourseCard } from "@/types/course";
import { Flame, BookOpen, Clock, GraduationCap, ArrowRight, Globe, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

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

function CourseListCard({
  course,
  canPublish,
  onTogglePublish,
}: {
  course: DashboardCourseCard;
  canPublish?: boolean;
  onTogglePublish?: (course: DashboardCourseCard) => void;
}) {
  const continueHref = course.currentLessonId
    ? `/learn/${course.id}/lessons/${course.currentLessonId}`
    : `/explore/${course.id}`;

  return (
    <article className="neo-surface rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-playfair text-xl font-bold text-foreground">{course.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{course.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-primary">
              {course.level}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              {course.lessonCount} lessons
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              {Math.round(course.progressPercent)}% complete
            </span>
            {course.visibility === "published" ? (
              <span className="rounded-full border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-green-300">
                Published
              </span>
            ) : (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-amber-300">
                Draft
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {course.role === "owner" ? <LockKeyhole className="h-4 w-4 text-primary/70" /> : <Globe className="h-4 w-4 text-primary/70" />}
          {course.role === "owner" ? "Owned" : `By ${course.ownerName}`}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" className="skeuo-gold rounded-full hover:!opacity-100">
          <Link href={continueHref}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        {canPublish && onTogglePublish && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePublish(course)}
            className="rounded-full border border-primary/30 text-primary hover:bg-primary/10"
          >
            {course.visibility === "published" ? "Unpublish" : "Publish"}
          </Button>
        )}

        {course.certificateAvailable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
              window.location.href = `${backend}/courses/${course.id}/certificate/download`;
            }}
            className="rounded-full border border-border hover:bg-muted"
          >
            Certificate
          </Button>
        )}
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setError(null);

    try {
      const response = await api.get("/dashboard/overview");
      if (!response.ok) {
        setError("Could not load dashboard data.");
        return;
      }
      const data = (await response.json()) as DashboardOverview;
      setOverview(data);
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadOverview();
    }
  }, [isLoading, loadOverview]);

  const stats = useMemo<StatsCard[]>(() => {
    return [
      { label: "Completed Courses", value: String(overview?.stats.completedCourses ?? 0), icon: Flame, suffix: "completed" },
      { label: "Courses Enrolled", value: String(overview?.stats.enrolledCourses ?? 0), icon: BookOpen, suffix: "courses" },
      { label: "Hours Learned", value: String(overview?.stats.hoursLearned ?? 0), icon: Clock, suffix: "hours" },
    ];
  }, [overview]);

  const handlePublishToggle = useCallback(
    async (course: DashboardCourseCard) => {
      const target = course.visibility === "published" ? "draft" : "published";
      const response = await api.patch(`/courses/${course.id}/publish`, { visibility: target });
      if (response.ok) {
        await loadOverview();
      }
    },
    [loadOverview]
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="neo-surface flex h-14 w-14 items-center justify-center rounded-2xl">
          <span className="skeuo-gold flex h-9 w-9 items-center justify-center rounded-lg font-playfair font-bold text-sm">
            T
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 sm:py-8">
      {/* Gradient accent */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(212,175,55,0.08),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(212,175,55,0.05),transparent_24%)]" />

      <div className="relative z-10 w-full max-w-5xl">
        {/* Welcome heading */}
        <div className="mb-8">
          <h3 className="font-playfair text-xl md:text-2xl font-bold text-foreground">
            {getTimeGreeting(overview?.greetingName ?? user?.name)}
          </h3>
          <p className="mt-1 text-muted-foreground">
            Your courses, enrollments, and progress are synced live from the backend.
          </p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, suffix }) => (
            <div key={label} className="neo-surface rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="neo-inset flex h-8 w-8 items-center justify-center rounded-lg">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="mt-3 font-playfair text-3xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{suffix}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loadingOverview ? (
          <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">Loading dashboardâ€¦</div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-playfair text-xl font-bold text-foreground">My Created Courses</h3>
                <Button asChild size="sm" variant="ghost" className="rounded-full border border-border">
                  <Link href="/create-course">Create Course</Link>
                </Button>
              </div>
              {overview?.ownedCourses.length ? (
                <div className="grid gap-4">
                  {overview.ownedCourses.map((course) => (
                    <CourseListCard key={course.id} course={course} canPublish onTogglePublish={handlePublishToggle} />
                  ))}
                </div>
              ) : (
                <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">
                  No owned courses yet. Complete onboarding to generate your first course.
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-playfair text-xl font-bold text-foreground">My Enrollments</h3>
                <Button asChild size="sm" variant="ghost" className="rounded-full border border-border">
                  <Link href="/explore">
                    <GraduationCap className="h-4 w-4" />
                    Explore
                  </Link>
                </Button>
              </div>
              {overview?.enrolledCourses.length ? (
                <div className="grid gap-4">
                  {overview.enrolledCourses.map((course) => (
                    <CourseListCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">
                  No enrollments yet. Explore published courses and enroll for free.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
