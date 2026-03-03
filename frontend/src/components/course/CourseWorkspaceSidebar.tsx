"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookCopy,
  BookOpenCheck,
  CheckCircle2,
  CirclePlay,
  ListTree,
  PanelRightOpen,
  X,
} from "lucide-react";
import { CurriculumOutline } from "@/types/course";

type ActiveCourseView = "preview" | "lesson" | "quiz" | "complete";

interface CourseWorkspaceSidebarProps {
  courseId: string;
  title: string;
  authorName?: string;
  level: string;
  moduleCount: number;
  lessonCount: number;
  curriculum: CurriculumOutline[];
  activeView: ActiveCourseView;
  activeLessonId?: string | null;
  currentLessonId?: string | null;
  progressPercent?: number | null;
  canOpenLessons?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function lessonHref({
  courseId,
  lessonId,
  canOpenLessons,
}: {
  courseId: string;
  lessonId: string;
  canOpenLessons: boolean;
}) {
  if (canOpenLessons) {
    return `/learn/${courseId}/lessons/${lessonId}`;
  }
  return `#lesson-${lessonId}`;
}

export function CourseWorkspaceSidebar({
  courseId,
  title,
  authorName,
  level,
  moduleCount,
  lessonCount,
  curriculum,
  activeView,
  activeLessonId = null,
  currentLessonId = null,
  progressPercent = null,
  canOpenLessons = false,
  isOpen,
  onToggle,
}: CourseWorkspaceSidebarProps) {
  const firstLessonId = curriculum[0]?.lessons[0]?.lessonId ?? null;
  const focusLessonId = activeLessonId ?? currentLessonId ?? firstLessonId;
  const hasProgress = typeof progressPercent === "number";

  const currentModule =
    curriculum.find((module) =>
      module.lessons.some((lesson) => lesson.lessonId === focusLessonId)
    ) ?? null;
  const currentLesson =
    currentModule?.lessons.find((lesson) => lesson.lessonId === focusLessonId) ?? null;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/95 px-3 py-2 text-xs font-semibold text-primary shadow-lg shadow-black/15 backdrop-blur hover:bg-card"
          aria-label="Open course sidebar"
        >
          <PanelRightOpen className="h-4 w-4" />
          Course Panel
        </button>
      )}

      <div
        className={`fixed inset-0 z-40 bg-black/45 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onToggle}
      />

      <aside
        className={`neo-surface fixed inset-y-0 right-0 z-50 w-[20rem] max-w-[92vw] overflow-y-auto border-l border-primary/20 p-4 transition-transform duration-300 lg:sticky lg:top-6 lg:z-10 lg:max-h-[calc(100svh-7rem)] lg:w-full lg:max-w-none lg:self-start lg:rounded-3xl lg:border lg:p-4 lg:transition-none ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } ${isOpen ? "lg:block" : "lg:hidden"}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/70">
            Course Panel
          </p>
          <button
            onClick={onToggle}
            className="rounded-lg border border-border bg-card/70 p-1.5 text-muted-foreground transition hover:text-foreground"
            aria-label="Toggle course sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-primary/15 bg-background/65 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-primary/75">Course</p>
          <h2 className="mt-2 line-clamp-2 break-words text-base font-bold leading-snug text-foreground">{title}</h2>
          {authorName && (
            <p className="mt-1 text-[11px] text-muted-foreground">Created by {authorName}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-primary capitalize">
              {level}
            </span>
            <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
              {moduleCount} modules
            </span>
            <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
              {lessonCount} lessons
            </span>
          </div>
        </div>

        {currentModule && (
          <div className="mt-4 rounded-xl border border-primary/25 bg-primary/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary/80">
              Current Module
            </p>
            <p className="mt-1 line-clamp-2 break-words text-xs font-semibold text-primary">{currentModule.title}</p>
            {currentLesson && (
              <p className="mt-1 text-xs text-primary/80">
                Lesson {currentLesson.order} of {currentModule.lessons.length}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 space-y-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary/70">
            Shortcuts
          </p>

          {focusLessonId && (
            <Link
              href={`/learn/${courseId}/lessons/${focusLessonId}`}
              onClick={() => {
                if (!canOpenLessons) {
                  onToggle();
                }
              }}
              className={`motion-link flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
                activeView === "lesson"
                  ? "border-primary/40 bg-primary/12 text-primary"
                  : "border-border bg-card/70 text-foreground hover:border-primary/30"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <CirclePlay className="h-4 w-4" />
                Current Lesson
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}

          {focusLessonId && (
            <Link
              href={`/learn/${courseId}/lessons/${focusLessonId}/quiz`}
              onClick={() => {
                if (!canOpenLessons) {
                  onToggle();
                }
              }}
              className={`motion-link flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
                activeView === "quiz"
                  ? "border-primary/40 bg-primary/12 text-primary"
                  : "border-border bg-card/70 text-foreground hover:border-primary/30"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <BookOpenCheck className="h-4 w-4" />
                Lesson Quiz
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}

          <Link
            href={`/learn/${courseId}/complete`}
            className={`motion-link flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
              activeView === "complete"
                ? "border-primary/40 bg-primary/12 text-primary"
                : "border-border bg-card/70 text-foreground hover:border-primary/30"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completion
            </span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          <Link
            href={`/explore/${courseId}`}
            className={`motion-link flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
              activeView === "preview"
                ? "border-primary/40 bg-primary/12 text-primary"
                : "border-border bg-card/70 text-foreground hover:border-primary/30"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <BookCopy className="h-4 w-4" />
              Course Details
            </span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {hasProgress && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">Progress</p>
            <p className="mt-1 text-lg font-bold text-primary">{Math.round(progressPercent ?? 0)}%</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/70">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(Math.max(progressPercent ?? 0, 0), 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary/70">
            Curriculum
          </p>
          <div className="space-y-2">
            {curriculum.map((module) => {
              const isCurrentModule = module.moduleId === currentModule?.moduleId;
              return (
                <details
                  key={module.moduleId}
                  open={isCurrentModule || undefined}
                  className={`rounded-xl border bg-card/65 ${
                    isCurrentModule ? "border-primary/30" : "border-border"
                  }`}
                >
                  <summary className="cursor-pointer list-none px-3 py-2.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ListTree className={`h-4 w-4 ${isCurrentModule ? "text-primary" : "text-primary/70"}`} />
                        <span className="line-clamp-2 break-words text-xs leading-snug">{module.title}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{module.lessons.length}</span>
                    </span>
                  </summary>

                  <div className="space-y-1 px-2 pb-2">
                    {module.lessons.map((lesson) => {
                      const isActive = lesson.lessonId === focusLessonId;
                      return (
                        <Link
                          key={lesson.lessonId}
                          href={lessonHref({
                            courseId,
                            lessonId: lesson.lessonId,
                            canOpenLessons,
                          })}
                          onClick={() => {
                            if (canOpenLessons) {
                              onToggle();
                            }
                          }}
                          className={`motion-link block rounded-lg px-2.5 py-2 text-xs ${
                            isActive
                              ? "bg-primary/12 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span className="line-clamp-2 break-words">
                            Lesson {lesson.order}: {lesson.title}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
