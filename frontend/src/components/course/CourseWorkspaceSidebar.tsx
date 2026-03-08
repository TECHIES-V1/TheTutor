"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  CirclePlay,
  BookCopy,
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
  return canOpenLessons ? `/learn/${courseId}/lessons/${lessonId}` : `#lesson-${lessonId}`;
}

export function CourseWorkspaceSidebar({
  courseId,
  title,
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
    curriculum.find((m) => m.lessons.some((l) => l.lessonId === focusLessonId)) ?? null;
  const currentLesson =
    currentModule?.lessons.find((l) => l.lessonId === focusLessonId) ?? null;

  const [openModules, setOpenModules] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (currentModule) s.add(currentModule.moduleId);
    return s;
  });

  const toggleModule = (id: string) =>
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const shortcutLink = (
    href: string,
    icon: React.ReactNode,
    label: string,
    view: ActiveCourseView
  ) => (
    <Link
      href={href}
      onClick={() => { if (!canOpenLessons) onToggle(); }}
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
        activeView === view
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      <span className="flex items-center gap-2.5">{icon}{label}</span>
      <ArrowUpRight className="h-3.5 w-3.5 opacity-50" />
    </Link>
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/45 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onToggle}
      />

      {/* Panel */}
      <aside
        className={`neo-surface overflow-y-auto
          fixed inset-x-0 bottom-0 z-50 max-h-[82vh] rounded-t-3xl border-t border-[var(--glass-border)] p-4 transition-transform duration-300
          lg:static lg:max-h-[calc(100svh-7rem)] lg:w-full lg:max-w-none lg:self-start lg:rounded-2xl lg:border lg:border-[var(--glass-border)] lg:translate-y-0 lg:transition-none
          ${isOpen ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Drag handle (mobile only) */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/25 lg:hidden" />

        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">
              {level} · {moduleCount}m · {lessonCount}L
            </p>
            <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-foreground">
              {title}
            </h2>
          </div>
          <button
            onClick={onToggle}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        {hasProgress && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">Progress</p>
              <p className="text-[11px] font-semibold text-primary">
                {Math.round(progressPercent ?? 0)}%
              </p>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(Math.max(progressPercent ?? 0, 0), 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Current lesson context */}
        {currentModule && currentLesson && (
          <div className="mb-3 rounded-xl border border-[var(--glass-border)] bg-primary/8 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">Now</p>
            <p className="mt-0.5 text-xs font-medium text-primary line-clamp-1">{currentModule.title}</p>
            <p className="text-[11px] text-primary/70">
              Lesson {currentLesson.order} of {currentModule.lessons.length}
            </p>
          </div>
        )}

        {/* Shortcuts */}
        <div className="mb-3 space-y-0.5">
          {focusLessonId && shortcutLink(
            `/learn/${courseId}/lessons/${focusLessonId}`,
            <CirclePlay className="h-4 w-4" />,
            "Current Lesson",
            "lesson"
          )}
          {focusLessonId && shortcutLink(
            `/learn/${courseId}/lessons/${focusLessonId}/quiz`,
            <BookOpenCheck className="h-4 w-4" />,
            "Lesson Quiz",
            "quiz"
          )}
          {shortcutLink(
            `/learn/${courseId}/complete`,
            <CheckCircle2 className="h-4 w-4" />,
            "Completion",
            "complete"
          )}
          {shortcutLink(
            `/explore/${courseId}`,
            <BookCopy className="h-4 w-4" />,
            "Course Details",
            "preview"
          )}
        </div>

        {/* Divider */}
        <div className="mb-3 h-px bg-border/40" />

        {/* Curriculum */}
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Curriculum
        </p>
        <div className="space-y-1">
          {curriculum.map((module) => {
            const isCurrentMod = module.moduleId === currentModule?.moduleId;
            const isExpanded = openModules.has(module.moduleId);
            return (
              <div
                key={module.moduleId}
                className={`rounded-xl border transition-colors ${
                  isCurrentMod ? "border-[var(--glass-border)] bg-primary/5" : "border-border/50 bg-card/40"
                }`}
              >
                <button
                  onClick={() => toggleModule(module.moduleId)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                >
                  <span className={`text-xs font-semibold line-clamp-1 ${isCurrentMod ? "text-primary" : "text-foreground"}`}>
                    {module.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground/60">
                    {module.lessons.length}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>

                {isExpanded && (
                  <div className="space-y-0.5 px-2 pb-2">
                    {module.lessons.map((lesson) => {
                      const isActive = lesson.lessonId === focusLessonId;
                      return (
                        <Link
                          key={lesson.lessonId}
                          href={lessonHref({ courseId, lessonId: lesson.lessonId, canOpenLessons })}
                          onClick={() => { if (canOpenLessons) onToggle(); }}
                          className={`block rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                            isActive
                              ? "bg-primary/12 font-medium text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <span className="line-clamp-2">
                            {lesson.order}. {lesson.title}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
