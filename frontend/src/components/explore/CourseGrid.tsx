"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Course } from "@/types/explore";
import { CourseCard } from "./CourseCard";

interface CourseGridProps {
    courses: Course[];
    onClearFilters: () => void;
}

export function CourseGrid({ courses, onClearFilters }: CourseGridProps) {
    if (courses.length === 0) {
        return (
            <div className="neo-surface flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 px-8 py-20 text-center">
                <div className="neo-inset mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
                    <Search className="h-6 w-6 text-primary/50" />
                </div>
                <h3 className="font-playfair text-lg font-bold text-foreground">No courses found</h3>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                    Try adjusting your search or filters to find what you&apos;re looking for.
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    className="mt-6 text-primary hover:bg-primary/10"
                    onClick={onClearFilters}
                >
                    Clear all filters
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
            ))}
        </div>
    );
}
