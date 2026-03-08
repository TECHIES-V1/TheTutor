"use client";

import { BookOpen, Clock, BarChart2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Course, LEVEL_STYLES } from "@/types/explore";

interface CourseCardProps {
    course: Course;
}

function formatStudents(n: number) {
    return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`;
}

export function CourseCard({ course }: CourseCardProps) {
    return (
        <article className="card-leather group flex flex-col rounded-2xl p-5">
            {/* Card Header */}
            <div className="mb-3 flex items-start justify-between gap-2">
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_STYLES[course.level]}`}
                >
                    <BarChart2 className="mr-1 h-3 w-3" />
                    {course.level}
                </span>
                <span className="text-xs text-muted-foreground">{course.category}</span>
            </div>

            {/* Title */}
            <h3 className="font-playfair text-base font-bold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {course.title}
            </h3>

            {/* Description */}
            <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                {course.description}
            </p>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {course.tags.map((tag) => (
                    <span
                        key={tag}
                        className="rounded-full border border-[var(--glass-border)] bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary/80"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-[var(--glass-border)]" />

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:gap-4">
                <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary/60" />
                    {course.duration}
                </span>
                <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary/60" />
                    {formatStudents(course.students)} students
                </span>
                <span className="flex items-center gap-1 sm:ml-auto">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="font-semibold text-foreground">{course.rating}</span>
                </span>
            </div>

            {/* Instructor */}
            <p className="mt-2 text-[11px] text-muted-foreground">
                by{" "}
                <span className="font-medium text-foreground/70">{course.instructor}</span>
            </p>

            {/* Enroll Button */}
            <Button
                id={`enroll-course-${course.id}`}
                size="sm"
                className="skeuo-gold mt-4 w-full rounded-full text-xs font-semibold hover:!opacity-100"
            >
                Enroll Now
            </Button>
        </article>
    );
}
