import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"
).replace(/\/+$/, "");

/** Headers we never forward to the backend */
const STRIP_HEADERS = new Set(["host", "connection", "transfer-encoding"]);

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendPath = "/" + path.join("/");

  // Rebuild query string
  const qs = req.nextUrl.search; // includes leading "?"
  const url = `${BACKEND_URL}${backendPath}${qs}`;

  // Read the frontend-domain token cookie
  const token = req.cookies.get("token")?.value;

  // Forward relevant headers
  const headers = new Headers();
  for (const [key, value] of req.headers.entries()) {
    if (!STRIP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  // Attach auth as Bearer token
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Forward the request body for non-GET/HEAD methods
  const hasBody = !["GET", "HEAD"].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const backendRes = await fetch(url, {
    method: req.method,
    headers,
    body,
    // @ts-expect-error -- Node fetch supports duplex for streaming uploads
    duplex: hasBody ? "half" : undefined,
    cache: "no-store",
  });

  // Stream SSE responses back directly
  const contentType = backendRes.headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream") && backendRes.body) {
    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Stream binary responses (e.g. PDF certificate downloads)
  if (
    backendRes.body &&
    (contentType.includes("application/pdf") ||
      contentType.includes("application/octet-stream") ||
      contentType.includes("audio/"))
  ) {
    const resHeaders = new Headers();
    for (const key of ["content-type", "content-disposition", "content-length"]) {
      const v = backendRes.headers.get(key);
      if (v) resHeaders.set(key, v);
    }
    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: resHeaders,
    });
  }

  // Regular JSON / text responses
  const responseBody = await backendRes.arrayBuffer();
  const res = new NextResponse(responseBody, { status: backendRes.status });
  // Forward content-type
  if (contentType) {
    res.headers.set("Content-Type", contentType);
  }
  return res;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
