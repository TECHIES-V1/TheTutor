"use client";

import { cn } from "@/lib/utils";
import { MessageProps } from "@/types";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

export function MessageField({ role, content, relatedCourses = [] }: MessageProps) {
    const isUser = role === "user";
    const { user } = useAuth();

    return (
        <div
            className={cn(
                "flex w-full gap-3 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                isUser && "flex-row-reverse"
            )}
        >
            {/* Avatar */}
            <div className="flex-shrink-0 mt-1">
                {isUser ? (
                    user?.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={user.image}
                            alt={user.name ?? "You"}
                            className="h-9 w-9 rounded-full object-cover ring-1 ring-primary/20"
                        />
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20">
                            {user?.name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                    )
                ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src="/logo.png"
                        alt="TheTutor"
                        className="h-9 w-9 rounded-full object-contain ring-1 ring-primary/20"
                    />
                )}
            </div>

            {/* Bubble */}
            <div className={cn("flex-1 space-y-1 overflow-hidden", isUser && "text-right")}>
                <span className={cn("mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60", isUser && "text-right")}>
                    {isUser ? "You" : "TheTutor"}
                </span>
                <div
                    className={cn(
                        "inline-block max-w-[85%] whitespace-pre-wrap text-[15px] leading-relaxed md:max-w-[75%]",
                        isUser
                            ? "skeuo-gold rounded-2xl rounded-tr-sm px-4 py-3 text-left"
                            : "rounded-2xl rounded-tl-sm border border-primary/15 bg-gradient-to-br from-card/80 to-card/40 px-4 py-3 text-foreground backdrop-blur-sm"
                    )}
                >
                    {content}
                    {!isUser && relatedCourses.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {relatedCourses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/explore/${course.id}`}
                                    className="block rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 transition-all hover:border-primary/30 hover:bg-primary/10"
                                >
                                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{course.title}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {course.authorName} | {course.level} | {course.moduleCount} modules | {course.lessonCount} lessons
                                    </p>
                                    {course.description && (
                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{course.description}</p>
                                    )}
                                    <p className="mt-2 text-xs font-medium text-primary">Open Public Course</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
