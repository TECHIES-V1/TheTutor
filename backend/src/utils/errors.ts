import type { Response } from "express";
import { logger } from "../config/logger";

/**
 * Structured application error with HTTP status code.
 * Throw from route handlers; caught by handleRouteError().
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Consistent error response for route catch blocks.
 * Logs the error with context and sends a JSON response.
 */
export function handleRouteError(
  res: Response,
  err: unknown,
  context: string
): void {
  if (err instanceof AppError) {
    logger.warn({ err, context }, `[${context}] ${err.message}`);
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  logger.error({ err }, `[${context}] Unhandled error`);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
}
