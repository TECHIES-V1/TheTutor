"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CourseSummary } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";

const LEVELS: Array<CourseSummary["level"] | "all"> = ["all", "beginner", "intermediate", "advanced"];

export default function ExplorePage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");

  useEffect(() => {
    let cancelled = false;

    const loadCourses = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/courses/explore");
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }

        const data = (await response.json()) as { courses: CourseSummary[] };
        if (!cancelled) {
          setCourses(data.courses ?? []);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load marketplace courses.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      const queryMatch =
        !query.trim() ||
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase()) ||
        course.topic.toLowerCase().includes(query.toLowerCase()) ||
        course.ownerName.toLowerCase().includes(query.toLowerCase());

      const levelMatch = level === "all" || course.level === level;
      return queryMatch && levelMatch;
    });
  }, [courses, query, level]);

  return (
    <div className="relative min-h-full px-6 py-6 sm:py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(212,175,55,0.08),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(212,175,55,0.05),transparent_24%)]" />

      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-8 sm:mb-10">
          <h3 className="font-playfair text-2xl font-bold text-foreground sm:text-3xl">Explore Courses</h3>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Discover courses published by other learners and enroll for free during the hackathon.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="neo-inset relative flex-1 rounded-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, topic, or owner"
              className="h-11 w-full rounded-xl bg-transparent pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {LEVELS.map((item) => (
              <button
                key={item}
                onClick={() => setLevel(item)}
                className={`rounded-full border px-3 py-2 text-xs capitalize transition ${
                  level === item
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">Loading courses...</div>
        ) : filtered.length === 0 ? (
          <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">
            No courses found with the current filters.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((course) => {
              const continueHref = course.enrollment?.currentLessonId
                ? `/learn/${course.id}/lessons/${course.enrollment.currentLessonId}`
                : `/explore/${course.id}`;

              return (
                <article key={course.id} className="neo-surface flex flex-col rounded-2xl p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary capitalize">
                      {course.level}
                    </span>
                    <span className="text-xs text-muted-foreground">By {course.ownerName}</span>
                  </div>
                  <h4 className="font-playfair text-lg font-bold text-foreground">{course.title}</h4>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {course.moduleCount} modules • {course.lessonCount} lessons • Free
                  </p>

                  <div className="mt-4 flex gap-2">
                    <Button asChild size="sm" variant="ghost" className="rounded-full border border-border">
                      <Link href={`/explore/${course.id}`}>View Curriculum</Link>
                    </Button>
                    <Button asChild size="sm" className="skeuo-gold rounded-full hover:!opacity-100">
                      <Link href={continueHref}>
                        {course.enrollment ? "Continue" : "Open"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
