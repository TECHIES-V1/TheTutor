import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

/**
 * Express middleware factory: validates req.body against a Zod schema.
 * Returns 400 with structured error on failure, calls next() on success.
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      res.status(400).json({
        error: firstIssue?.message ?? "Invalid request body",
        code: "VALIDATION_ERROR",
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ── Schemas ─────────────────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(10_000, "Message too long"),
  conversationId: z.string().optional(),
});

export const confirmSubjectSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  confirmed: z.boolean().optional(),
});

export const generateCourseSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
});

export const userPreferencesSchema = z.object({
  theme: z.enum(["light", "dark"], { message: "Invalid theme value" }),
});

export const quizAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      response: z.string().min(1),
    })
  ),
});

export const assistantMessagesSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ).min(1, "At least one message is required"),
  lessonContext: z.string().optional(),
});
