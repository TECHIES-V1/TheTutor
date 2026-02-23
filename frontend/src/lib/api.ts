const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export const api = {
  get: (path: string) =>
    fetch(`${BACKEND}${path}`, {
      credentials: "include",
      cache: "no-store",
    }),

  post: (path: string, body: unknown) =>
    fetch(`${BACKEND}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  put: (path: string, body: unknown) =>
    fetch(`${BACKEND}${path}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};
