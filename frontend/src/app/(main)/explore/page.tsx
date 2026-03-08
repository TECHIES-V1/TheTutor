"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { CourseSummary } from "@/types/course";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import { PageLoader } from "@/components/ui/PageLoader";

function getLevelPillClasses(level?: string) {
  switch (level?.toLowerCase()) {
    case "beginner":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "intermediate":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "advanced":
      return "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
    default:
      return "border-primary/30 bg-primary/10 text-primary";
  }
}

export default function ExplorePage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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
    const normalizedQuery = query.trim().toLowerCase();
    return courses.filter((course) => {
      const queryMatch =
        !normalizedQuery ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.description.toLowerCase().includes(normalizedQuery) ||
        course.topic.toLowerCase().includes(normalizedQuery) ||
        course.ownerName.toLowerCase().includes(normalizedQuery);
      return queryMatch;
    });
  }, [courses, query]);

  return (
    <div className="relative min-h-full py-6 sm:py-8">

      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-8 sm:mb-10">
          <h3 className="font-playfair text-xl font-bold text-foreground sm:text-2xl">Explore Courses</h3>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Discover courses published by other learners and enroll for free during the hackathon.
          </p>
        </div>

        <div className="mb-6">
          <div className="neo-inset relative flex-1 rounded-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, topic, or author"
              className="h-11 w-full rounded-xl bg-transparent pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <PageLoader
            title="Loading courses..."
            subtitle="Fetching published courses from the marketplace."
          />
        ) : filtered.length === 0 ? (
          <div className="neo-surface rounded-2xl p-6 text-sm text-muted-foreground">
            No courses found for this search.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => {
              const continueHref = course.enrollment?.currentLessonId
                ? `/learn/${course.id}/lessons/${course.enrollment.currentLessonId}`
                : `/explore/${course.id}`;

              return (
                <article key={course.id} className="neo-surface flex flex-col rounded-2xl border-0 p-5 sm:border">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${getLevelPillClasses(course.level)}`}>
                      {course.level}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      By {course.author?.name || course.ownerName}
                    </span>
                  </div>
                  <h4 className="font-playfair text-base font-bold text-foreground">{course.title}</h4>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {course.moduleCount} modules • {course.lessonCount} lessons • Free
                  </p>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button asChild size="sm" variant="ghost" className="w-full rounded-full border border-border sm:w-auto">
                      <Link href={`/explore/${course.id}`}>View Curriculum</Link>
                    </Button>
                    <Button asChild size="sm" className="skeuo-gold w-full rounded-full hover:!opacity-100 sm:w-auto">
                      <Link href={continueHref}>
                        {course.enrollment ? "Continue" : "Enroll"}
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
