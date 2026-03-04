const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const isProduction = process.env.NODE_ENV === "production";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withScheme.replace(/\/+$/, "");
}

function parseHostname(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isLocalhostUrl(rawUrl: string): boolean {
  const hostname = parseHostname(rawUrl);
  return Boolean(hostname && LOCALHOST_HOSTS.has(hostname));
}

function resolvePublicUrl(
  name: string,
  candidates: Array<string | undefined>,
  developmentFallback: string
): string {
  const resolvedCandidates = candidates
    .map((candidate) => candidate?.trim())
    .filter((candidate): candidate is string => Boolean(candidate))
    .map(normalizeUrl)
    .filter((candidate) => Boolean(candidate));

  if (isProduction) {
    const publicCandidate = resolvedCandidates.find((candidate) => !isLocalhostUrl(candidate));
    if (publicCandidate) return publicCandidate;

    if (resolvedCandidates.length > 0) {
      throw new Error(
        `${name} points to localhost in production. Set a public URL for ${name}.`
      );
    }

    throw new Error(`Missing ${name} in production. Set a public URL for ${name}.`);
  }

  return resolvedCandidates[0] ?? developmentFallback;
}

export function getBackendBaseUrl(): string {
  return resolvePublicUrl(
    "BACKEND_URL",
    [
      process.env.BACKEND_URL,
      process.env.RENDER_EXTERNAL_URL,
      process.env.RAILWAY_STATIC_URL,
      process.env.RAILWAY_PUBLIC_DOMAIN,
    ],
    "http://localhost:5000"
  );
}

export function getFrontendBaseUrl(): string {
  return resolvePublicUrl(
    "FRONTEND_URL",
    [
      process.env.FRONTEND_URL,
      process.env.CLIENT_URL,
      process.env.APP_URL,
      process.env.NEXT_PUBLIC_FRONTEND_URL,
    ],
    "http://localhost:3000"
  );
}

export function getGoogleCallbackUrl(): string {
  const explicitCallback = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (explicitCallback) {
    const normalized = normalizeUrl(explicitCallback);
    if (isProduction && isLocalhostUrl(normalized)) {
      throw new Error(
        "GOOGLE_CALLBACK_URL points to localhost in production. Set a public callback URL."
      );
    }
    return normalized;
  }

  return `${getBackendBaseUrl()}/auth/google/callback`;
}
