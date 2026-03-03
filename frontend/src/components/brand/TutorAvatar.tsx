"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TutorAvatarEmotion =
  | "encouraging"
  | "happy"
  | "thinking"
  | "sad"
  | "surprised"
  | "explaining";

export type TutorAvatarVariant = "mark" | "full" | "loader";

export interface TutorAvatarProps {
  variant?: TutorAvatarVariant;
  emotion?: TutorAvatarEmotion;
  size?: number;
  animated?: boolean;
  className?: string;
}

const EMOTION = {
  encouraging: { eyeScale: 1, mouthCurve: 6, browTilt: 0, bodyLean: 0, armLift: 0 },
  happy: { eyeScale: 0.72, mouthCurve: 11, browTilt: -4, bodyLean: -2, armLift: -8 },
  thinking: { eyeScale: 0.86, mouthCurve: 2, browTilt: 6, bodyLean: 4, armLift: -2 },
  sad: { eyeScale: 0.82, mouthCurve: -5, browTilt: 7, bodyLean: 4, armLift: 4 },
  surprised: { eyeScale: 1.24, mouthCurve: 0, browTilt: -8, bodyLean: -2, armLift: -6 },
  explaining: { eyeScale: 1, mouthCurve: 5, browTilt: -2, bodyLean: 2, armLift: -10 },
} satisfies Record<
  TutorAvatarEmotion,
  {
    eyeScale: number;
    mouthCurve: number;
    browTilt: number;
    bodyLean: number;
    armLift: number;
  }
>;

function MarkVariant({ animated }: { animated: boolean }) {
  const MotionGroup = animated ? motion.g : "g";

  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mark-gold" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F1DA99" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#A87917" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#FCFAF2" stroke="url(#mark-gold)" strokeWidth="2.4" />
      <MotionGroup
        animate={animated ? { rotate: [0, -2, 2, 0] } : undefined}
        transition={animated ? { duration: 4, ease: "easeInOut", repeat: Infinity } : undefined}
        style={{ transformOrigin: "32px 34px" }}
      >
        <circle cx="27.5" cy="19.2" r="6.4" fill="#121212" />
        <path
          d="M18.3 40.2C18.3 31.8 22.6 26.2 29.4 26.2C35.4 26.2 39.5 30.6 39.5 36.8V47.7H20.8C19.4 47.7 18.3 46.6 18.3 45.2V40.2Z"
          fill="#121212"
        />
        <path
          d="M30.7 29.6C38.8 29.6 45.1 25.1 48.3 16.6"
          stroke="#121212"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </MotionGroup>
    </svg>
  );
}

function FullVariant({
  emotion,
  animated,
  loaderMode,
}: {
  emotion: TutorAvatarEmotion;
  animated: boolean;
  loaderMode: boolean;
}) {
  const expr = EMOTION[emotion];
  const MotionGroup = animated ? motion.g : "g";
  const MotionPath = animated ? motion.path : "path";
  const MotionCircle = animated ? motion.circle : "circle";

  const mouthPath =
    expr.mouthCurve === 0
      ? "M58 58 a4 4 0 1 1 8 0 a4 4 0 1 1 -8 0"
      : `M56 58 Q62 ${58 + expr.mouthCurve} 68 58`;

  return (
    <svg viewBox="0 0 124 178" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="full-gold" x1="12" y1="12" x2="112" y2="166" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F1DA99" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#A87917" />
        </linearGradient>
        <linearGradient id="robe-gold" x1="25" y1="45" x2="95" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAF3DE" />
          <stop offset="1" stopColor="#E9D7A4" />
        </linearGradient>
      </defs>

      <ellipse cx="62" cy="164" rx="44" ry="11" fill="url(#full-gold)" opacity="0.9" />

      <MotionGroup
        animate={
          animated
            ? {
                y: [0, -2, 0],
                rotate: [0, expr.bodyLean * 0.25, 0],
              }
            : undefined
        }
        transition={
          animated
            ? { duration: loaderMode ? 1.5 : 2.2, ease: "easeInOut", repeat: Infinity }
            : undefined
        }
        style={{ transformOrigin: "62px 98px" }}
      >
        <path
          d="M34 145V88C34 72.2 46.2 60 62 60C77.8 60 90 72.2 90 88V145H34Z"
          fill="url(#robe-gold)"
          stroke="#121212"
          strokeWidth="2.8"
        />
        <path
          d="M49 145V98L62 86L75 98V145"
          stroke="#121212"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <MotionPath
          d="M34 95L18 116"
          stroke="#121212"
          strokeWidth="3"
          strokeLinecap="round"
          animate={animated ? { y: [0, expr.armLift * 0.06, 0] } : undefined}
          transition={animated ? { duration: 1.8, repeat: Infinity } : undefined}
        />
        <circle cx="17" cy="118" r="4.8" fill="#121212" />

        <MotionPath
          d="M90 95L107 79"
          stroke="#121212"
          strokeWidth="3"
          strokeLinecap="round"
          animate={animated ? { y: [0, expr.armLift * 0.04, 0] } : undefined}
          transition={animated ? { duration: 1.6, repeat: Infinity } : undefined}
        />
        <circle cx="108" cy="78" r="4.8" fill="#121212" />

        <circle cx="62" cy="43.5" r="18" fill="#FFF8E6" stroke="#121212" strokeWidth="2.8" />
        <MotionCircle
          cx="56.3"
          cy="43"
          r="2.4"
          fill="#121212"
          animate={animated ? { scaleY: [expr.eyeScale, Math.max(0.2, expr.eyeScale * 0.12), expr.eyeScale] } : undefined}
          transition={animated ? { duration: 3.4, times: [0, 0.06, 0.12], repeat: Infinity } : undefined}
          style={{ transformOrigin: "56.3px 43px" }}
        />
        <MotionCircle
          cx="67.7"
          cy="43"
          r="2.4"
          fill="#121212"
          animate={animated ? { scaleY: [expr.eyeScale, Math.max(0.2, expr.eyeScale * 0.12), expr.eyeScale] } : undefined}
          transition={animated ? { duration: 3.4, times: [0, 0.06, 0.12], repeat: Infinity } : undefined}
          style={{ transformOrigin: "67.7px 43px" }}
        />

        <path d="M53 35L57 33.8" stroke="#121212" strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${expr.browTilt} 55 34)`} />
        <path d="M67 33.8L71 35" stroke="#121212" strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${-expr.browTilt} 69 34)`} />
        <path d={mouthPath} stroke="#121212" strokeWidth="2.4" strokeLinecap="round" />
      </MotionGroup>

      {loaderMode && (
        <motion.circle
          cx="62"
          cy="100"
          r="56"
          stroke="#D4AF37"
          strokeWidth="2.8"
          strokeDasharray="24 12"
          fill="none"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, ease: "linear", repeat: Infinity }}
          style={{ transformOrigin: "62px 100px" }}
          opacity="0.45"
        />
      )}
    </svg>
  );
}

export function TutorAvatar({
  variant = "full",
  emotion = "encouraging",
  size = 64,
  animated = true,
  className,
}: TutorAvatarProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animated && !reduceMotion;
  const style = { width: size, height: size };

  return (
    <div
      className={cn("inline-flex items-center justify-center", className)}
      style={style}
      role="img"
      aria-label="TheTutor avatar"
    >
      {variant === "mark" ? (
        <MarkVariant animated={shouldAnimate} />
      ) : (
        <FullVariant emotion={emotion} animated={shouldAnimate} loaderMode={variant === "loader"} />
      )}
    </div>
  );
}

