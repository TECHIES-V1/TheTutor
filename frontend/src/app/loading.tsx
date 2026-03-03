import { PageLoader } from "@/components/ui/PageLoader";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <PageLoader
        title="Preparing TheTutor..."
        subtitle="Loading your workspace and learning context."
      />
    </div>
  );
}
