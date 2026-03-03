import { PageLoader } from "@/components/ui/PageLoader";

export default function MainLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <PageLoader
        title="Loading your dashboard..."
        subtitle="Syncing courses, progress, and recent activity."
      />
    </div>
  );
}
