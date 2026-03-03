"use client";

import { TutorAvatar, TutorAvatarEmotion } from "@/components/brand/TutorAvatar";
import { cn } from "@/lib/utils";

export interface AvatarLoaderProps {
  label?: string;
  subLabel?: string;
  size?: number;
  emotion?: TutorAvatarEmotion;
  className?: string;
}

export function AvatarLoader({
  label = "Loading...",
  subLabel,
  size = 84,
  emotion = "encouraging",
  className,
}: AvatarLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <TutorAvatar variant="loader" size={size} emotion={emotion} />
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {subLabel ? <p className="text-xs text-muted-foreground">{subLabel}</p> : null}
      </div>
    </div>
  );
}

