"use client";

import { useState, useMemo } from "react";
import { COURSES } from "@/utils/dummyCourses";
import { SearchBar } from "@/components/explore/SearchBar";
import { FilterPanel } from "@/components/explore/FilterPanel";
import { CourseGrid } from "@/components/explore/CourseGrid";

export default function ExplorePage() {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [level, setLevel] = useState("All");
    const [sort, setSort] = useState("popular");

    const filtered = useMemo(() => {
        let result = COURSES.filter((c) => {
            const matchesQuery =
                query.trim() === "" ||
                c.title.toLowerCase().includes(query.toLowerCase()) ||
                c.description.toLowerCase().includes(query.toLowerCase()) ||
                c.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
            const matchesCategory = category === "All" || c.category === category;
            const matchesLevel = level === "All" || c.level === level;
            return matchesQuery && matchesCategory && matchesLevel;
        });

        if (sort === "popular") result = [...result].sort((a, b) => b.students - a.students);
        else if (sort === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
        // "newest" — sort by id descending
        else result = [...result].sort((a, b) => b.id - a.id);

        return result;
    }, [query, category, level, sort]);

    function clearFilters() {
        setQuery("");
        setCategory("All");
        setLevel("All");
        setSort("popular");
    }

    return (
        <div className="relative min-h-full px-6 py-6 sm:py-8">
            {/* Radial gradient accents */}
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(212,175,55,0.08),transparent_28%),radial-gradient(circle_at_84%_16%,rgba(212,175,55,0.05),transparent_24%)]" />

            <div className="relative z-10 w-full max-w-5xl">
                {/* Page Header */}
                <div className="mb-8 sm:mb-10">
                    <h3 className="font-playfair text-2xl font-bold text-foreground sm:text-3xl">
                        Explore Courses
                    </h3>
                    <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
                        Discover expert-curated courses to accelerate your learning journey.
                    </p>
                </div>

                {/* Search + Filters */}
                <div className="mb-6 flex flex-col gap-3 lg:mb-8 lg:flex-row lg:items-center lg:gap-4">
                    <SearchBar value={query} onChange={setQuery} />
                    <FilterPanel
                        category={category}
                        level={level}
                        sort={sort}
                        onCategoryChange={setCategory}
                        onLevelChange={setLevel}
                        onSortChange={setSort}
                    />
                </div>

                {/* Results count */}
                <p className="mb-4 text-sm text-muted-foreground sm:mb-5">
                    Showing{" "}
                    <span className="font-semibold text-primary">{filtered.length}</span>{" "}
                    {filtered.length === 1 ? "course" : "courses"}
                    {category !== "All" && ` in ${category}`}
                    {level !== "All" && ` · ${level}`}
                </p>

                {/* Course Grid */}
                <CourseGrid courses={filtered} onClearFilters={clearFilters} />
            </div>
        </div>
    );
}
