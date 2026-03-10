/**
 * SSE Broadcaster — manages live Server-Sent Events connections per generation job.
 *
 * Lifecycle: registerClient() when a client connects to /course/jobs/:jobId/events,
 * unregisterClient() on disconnect, unregisterJob() when the job finishes to free memory.
 * getBroadcaster() returns a fire-and-forget interface used by jobRunner to push events
 * to all connected clients for a given job.
 */
import type { Response } from "express";
import { sendSSE } from "../../middleware/sse";

export interface SSEBroadcaster {
  send(eventType: string, data: Record<string, unknown>, eventId?: number): void;
}

// In-memory map: jobId -> Set of active Response objects
const jobClients = new Map<string, Set<Response>>();

export function registerClient(jobId: string, res: Response): void {
  if (!jobClients.has(jobId)) {
    jobClients.set(jobId, new Set());
  }
  jobClients.get(jobId)!.add(res);
}

export function unregisterClient(jobId: string, res: Response): void {
  const clients = jobClients.get(jobId);
  if (clients) {
    clients.delete(res);
    if (clients.size === 0) {
      jobClients.delete(jobId);
    }
  }
}

export function getBroadcaster(jobId: string): SSEBroadcaster {
  return {
    send(eventType: string, data: Record<string, unknown>, eventId?: number): void {
      const clients = jobClients.get(jobId);
      if (!clients || clients.size === 0) return;

      for (const res of clients) {
        if (res.writableEnded || res.destroyed) {
          clients.delete(res);
          continue;
        }
        try {
          if (eventId !== undefined) {
            res.write(`id: ${eventId}\n`);
          }
          sendSSE(res, eventType, data);
        } catch {
          clients.delete(res);
        }
      }
    },
  };
}

export function createNoOpBroadcaster(): SSEBroadcaster {
  return {
    send(_eventType: string, _data: Record<string, unknown>, _eventId?: number): void {
      // No-op: no connected clients (used for crash recovery)
    },
  };
}

/**
 * Remove all client references for a completed/failed job.
 * Called at the end of runJob() to prevent memory leaks.
 */
export function unregisterJob(jobId: string): void {
  jobClients.delete(jobId);
}
