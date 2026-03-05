import { BACKEND_URL } from "@/lib/backendUrl";

export const api = {
  get: (path: string) =>
    fetch(`${BACKEND_URL}${path}`, {
      credentials: "include",
      cache: "no-store",
    }),

  post: (path: string, body: unknown) =>
    fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  put: (path: string, body: unknown) =>
    fetch(`${BACKEND_URL}${path}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  patch: (path: string, body: unknown) =>
    fetch(`${BACKEND_URL}${path}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};
