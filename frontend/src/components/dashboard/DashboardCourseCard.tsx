"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, Globe, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardCourseCard as DashboardCourseCardData } from "@/types/course";
import { BACKEND_URL } from "@/lib/backendUrl";

interface DashboardCourseCardProps {
  course: DashboardCourseCardData;
  canPublish?: boolean;
  showVisibility?: boolean;
  onTogglePublish?: (course: DashboardCourseCardData) => void;
}

function getLevelPillClasses(level?: string) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "intermediate":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "advanced":
      return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    default:
      return "border-primary/25 bg-primary/10 text-primary";
  }
}

export function DashboardCourseCard({
  course,
  canPublish,
  showVisibility = false,
  onTogglePublish,
}: DashboardCourseCardProps) {
  const continueHref = course.currentLessonId
    ? `/learn/${course.id}/lessons/${course.currentLessonId}`
    : `/explore/${course.id}`;

  return (
    <article className="card-leather motion-card w-full min-w-0 rounded-2xl border border-primary/12 p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-lg font-bold text-foreground sm:text-xl">{course.title}</h4>
          <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">
            {course.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-2 py-0.5 font-medium ${getLevelPillClasses(course.level)}`}>
              {course.level}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              {course.lessonCount} lessons
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              {Math.round(course.progressPercent)}% complete
            </span>
            {showVisibility &&
              (course.visibility === "published" ? (
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-700 dark:text-sky-300">
                  Published
                </span>
              ) : (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300">
                  Draft
                </span>
              ))}
          </div>
        </div>

        <div className="flex min-w-0 max-w-full items-center gap-2 text-xs text-muted-foreground">
          {course.role === "owner" ? (
            <LockKeyhole className="h-4 w-4 text-primary/70" />
          ) : (
            <Globe className="h-4 w-4 text-primary/70" />
          )}
          <span className="min-w-0 break-words">
            {course.role === "owner" ? "Owned" : `By ${course.author?.name || course.ownerName}`}
          </span>
        </div>
      </div>

      <div className="mt-4 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap">
        <Button
          asChild
          size="sm"
          className="skeuo-gold w-full rounded-full whitespace-normal hover:!opacity-100 sm:w-auto sm:whitespace-nowrap"
        >
          <Link href={continueHref}>
            {course.currentLessonTitle ? "Continue Lesson" : "Enroll"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full rounded-full border border-border whitespace-normal sm:w-auto sm:whitespace-nowrap"
        >
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
            className="w-full rounded-full border border-primary/30 whitespace-normal text-primary hover:bg-primary/10 sm:w-auto sm:whitespace-nowrap"
          >
            {course.visibility === "published" ? "Unpublish" : "Publish"}
          </Button>
        )}

        {course.certificateAvailable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.location.href = `${BACKEND_URL}/courses/${course.id}/certificate/download`;
            }}
            className="w-full rounded-full border border-border whitespace-normal hover:bg-muted sm:w-auto sm:whitespace-nowrap"
          >
            Certificate
          </Button>
        )}
      </div>
    </article>
  );
}
