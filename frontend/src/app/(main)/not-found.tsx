import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="neo-surface mx-auto w-full max-w-md rounded-3xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10">
          <span className="text-xl font-bold text-primary">?</span>
        </div>

        <h1 className="font-playfair mb-2 text-2xl font-bold text-foreground">
          Page not found
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link href="/dashboard" className="skeuo-gold inline-block rounded-xl px-5 py-2.5 text-sm font-semibold">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
