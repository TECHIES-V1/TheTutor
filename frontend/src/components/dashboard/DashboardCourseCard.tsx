"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Globe, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardCourseCard as DashboardCourseCardData } from "@/types/course";

interface DashboardCourseCardProps {
  course: DashboardCourseCardData;
  canPublish?: boolean;
  onTogglePublish?: (course: DashboardCourseCardData) => void;
}

export function DashboardCourseCard({
  course,
  canPublish,
  onTogglePublish,
}: DashboardCourseCardProps) {
  const continueHref = course.currentLessonId
    ? `/learn/${course.id}/lessons/${course.currentLessonId}`
    : `/explore/${course.id}`;

  return (
    <article className="neo-surface motion-card rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-lg font-bold text-foreground sm:text-xl">{course.title}</h4>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
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
              <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-green-700">
                Published
              </span>
            ) : (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-700">
                Draft
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {course.role === "owner" ? (
            <LockKeyhole className="h-4 w-4 text-primary/70" />
          ) : (
            <Globe className="h-4 w-4 text-primary/70" />
          )}
          {course.role === "owner" ? "Owned" : `By ${course.author?.name || course.ownerName}`}
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap items-start gap-2">
        <Button asChild size="sm" className="skeuo-gold rounded-full hover:!opacity-100 w-full sm:w-auto">
          <Link href={continueHref}>
            {course.currentLessonTitle ? "Continue Lesson" : "Enroll"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <div className="hidden sm:flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm" className="rounded-full border border-border">
            <Link href={`/explore/${course.id}`}>
              <BookOpenCheck className="h-4 w-4" />
              Curriculum
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
      </div>
    </article >
  );
}
