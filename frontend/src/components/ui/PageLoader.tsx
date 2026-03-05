"use client";

import { cn } from "@/lib/utils";

type PageLoaderProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export function PageLoader({
  title = "Loading...",
  subtitle = "Please wait while we prepare your page.",
  className,
}: PageLoaderProps) {
  return (
    <div className={cn("mx-auto w-full max-w-xl", className)}>
      <div className="neo-surface rounded-3xl p-6 md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="h-3 w-10/12 animate-pulse rounded-full bg-muted/60" />
          <div className="h-3 w-full animate-pulse rounded-full bg-muted/60" />
          <div className="h-3 w-9/12 animate-pulse rounded-full bg-muted/60" />
        </div>
      </div>
    </div>
  );
}
