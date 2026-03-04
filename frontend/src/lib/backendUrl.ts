const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const isProduction = process.env.NODE_ENV === "production";

const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
const fallbackBackendUrl = "http://localhost:5000";
const resolvedBackendUrl = (rawBackendUrl ?? fallbackBackendUrl).replace(/\/+$/, "");

function parseHostname(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

if (isProduction) {
  if (!rawBackendUrl) {
    throw new Error("Missing NEXT_PUBLIC_BACKEND_URL in production.");
  }

  const hostname = parseHostname(resolvedBackendUrl);
  if (!hostname) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is invalid.");
  }

  if (LOCALHOST_HOSTS.has(hostname)) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL cannot point to localhost in production.");
  }
}

export const BACKEND_URL = resolvedBackendUrl;
