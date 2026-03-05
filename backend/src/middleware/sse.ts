import type { Request, Response, NextFunction } from "express";

// ── SSE Headers Middleware ────────────────────────────────────────────────

export function sseHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();
  next();
}

// ── SSE Helper Functions ──────────────────────────────────────────────────

export function sendSSE(
  res: Response,
  event: string,
  data: Record<string, unknown>
): void {
  if (res.writableEnded || res.destroyed) return;
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    // Ignore write failures after client disconnect.
  }
}

export function sendSSEComment(res: Response, comment: string): void {
  if (res.writableEnded || res.destroyed) return;
  try {
    res.write(`: ${comment}\n\n`);
  } catch {
    // Ignore write failures after client disconnect.
  }
}

export function endSSE(res: Response): void {
  if (res.writableEnded || res.destroyed) return;
  try {
    res.end();
  } catch {
    // Ignore close failures after disconnect.
  }
}

// ── Keep-Alive Utility ────────────────────────────────────────────────────

export function startKeepAlive(res: Response, intervalMs: number = 15000): NodeJS.Timeout {
  return setInterval(() => {
    sendSSEComment(res, "keepalive");
  }, intervalMs);
}

export function stopKeepAlive(interval: NodeJS.Timeout): void {
  clearInterval(interval);
}
