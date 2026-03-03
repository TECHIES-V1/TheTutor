import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

/**
 * GET /api/auth/callback
 *
 * The Express backend redirects here after successful Google OAuth.
 * The httpOnly JWT cookie is already set in the browser by the backend.
 * We call /auth/me to determine where to send the user next.
 */
export async function GET(req: NextRequest) {
  const onboardingCompletedFlag = req.nextUrl.searchParams.get("onboardingCompleted");
  if (onboardingCompletedFlag === "1" || onboardingCompletedFlag === "true") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  if (onboardingCompletedFlag === "0" || onboardingCompletedFlag === "false") {
    return NextResponse.redirect(new URL("/create-course", req.nextUrl));
  }

  try {
    const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });

    if (!meRes.ok) {
      return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
    }

    const user = await meRes.json();
    const destination = user.onboardingCompleted ? "/dashboard" : "/create-course";

    return NextResponse.redirect(new URL(destination, req.nextUrl));
  } catch {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
  }
}
