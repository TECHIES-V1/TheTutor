import { AvatarLoader } from "@/components/ui/AvatarLoader";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <AvatarLoader
        label="Preparing TheTutor..."
        subLabel="Loading your experience"
        size={92}
        emotion="encouraging"
      />
    </div>
  );
}

