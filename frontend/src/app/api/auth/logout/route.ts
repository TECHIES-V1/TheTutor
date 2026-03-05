import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Clears the frontend-domain JWT cookie that was set by /api/auth/callback.
 * Called alongside the backend /auth/logout to ensure both domain cookies
 * are cleared in cross-origin deployments.
 */
export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("token", "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0,
    path:     "/",
  });
  return res;
}
