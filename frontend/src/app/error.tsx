"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TheTutor] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="neo-surface mx-auto w-full max-w-md rounded-3xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
          <span className="text-xl text-primary">!</span>
        </div>

        <h1 className="font-playfair mb-2 text-2xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          We hit a bump. This has been logged and we&apos;re on it.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="skeuo-gold rounded-xl px-5 py-2.5 text-sm font-semibold">
            Try Again
          </button>
          <Link href="/" className="skeuo-outline rounded-xl px-5 py-2.5 text-sm font-semibold text-center">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
