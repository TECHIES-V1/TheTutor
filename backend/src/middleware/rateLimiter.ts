import rateLimit from "express-rate-limit";
import type { Request } from "express";

function userKey(req: Request): string {
  return (req as any).jwtUser?.userId ?? "anon";
}

// Rate limiter for AI-touching endpoints (chat, generation, grading, assistant)
export const aiLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: 20,
  keyGenerator: userKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please wait a moment.", code: "RATE_LIMITED" },
});

// Stricter limiter for generation (expensive, long-running)
export const generateLimiter = rateLimit({
  windowMs: 5 * 60_000, // 5 minutes
  max: 5,
  keyGenerator: userKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many generation requests — please wait.", code: "RATE_LIMITED" },
});
