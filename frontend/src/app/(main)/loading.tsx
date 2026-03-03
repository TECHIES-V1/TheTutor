import { AvatarLoader } from "@/components/ui/AvatarLoader";

export default function MainLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <AvatarLoader
        label="Loading your dashboard..."
        subLabel="Syncing courses and progress"
        size={88}
        emotion="thinking"
      />
    </div>
  );
}

