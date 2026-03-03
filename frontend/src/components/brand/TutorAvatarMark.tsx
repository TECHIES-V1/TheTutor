"use client";

import { TutorAvatar } from "./TutorAvatar";

export function TutorAvatarMark({
  size = 40,
  className,
  animated = false,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  return (
    <TutorAvatar
      variant="mark"
      size={size}
      animated={animated}
      className={className}
    />
  );
}

