import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backendUrl";

/**
 * GET /api/auth/callback
 *
 * The Express backend redirects here after successful Google OAuth.
 * The backend passes the JWT as a `?token=` query param so we can set it
 * as an httpOnly cookie on the *frontend* domain — enabling proxy.ts to
 * read it in cross-origin (Vercel + Render) deployments.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const flag  = req.nextUrl.searchParams.get("onboardingCompleted");

  // Primary path: backend passed us the JWT → set frontend-domain cookie
  if (token) {
    const userId = req.nextUrl.searchParams.get("userId");
    const createCoursePath = userId ? `/create-course?userId=${encodeURIComponent(userId)}` : "/create-course";
    const dest = flag === "1" ? "/dashboard" : createCoursePath;
    const res  = NextResponse.redirect(new URL(dest, req.nextUrl));
    res.cookies.set("token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   7 * 24 * 60 * 60,
      path:     "/",
    });
    return res;
  }

  // Legacy path: token not in URL — use flag directly if present
  if (flag === "1" || flag === "true") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  if (flag === "0" || flag === "false") {
    return NextResponse.redirect(new URL("/create-course", req.nextUrl));
  }

  // Fallback: ask the backend who this user is via the backend-domain cookie
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
