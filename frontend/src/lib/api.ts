import { BACKEND_URL } from "@/lib/backendUrl";

const TIMEOUT = 30_000;

export const api = {
  get: (path: string) =>
    fetch(`${BACKEND_URL}${path}`, {
      credentials: "include",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT),
    }),

  post: (path: string, body: unknown) =>
    fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT),
    }),

  put: (path: string, body: unknown) =>
    fetch(`${BACKEND_URL}${path}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT),
    }),

  patch: (path: string, body: unknown) =>
    fetch(`${BACKEND_URL}${path}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT),
    }),
};
