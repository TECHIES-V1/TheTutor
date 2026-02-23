import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = ["/create-course", "/dashboard"];
const AUTH_ONLY = ["/auth/signin"];

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  let user: { onboardingCompleted?: boolean } | null = null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
      const { payload } = await jwtVerify(token, secret);
      user = payload as { onboardingCompleted?: boolean };
    } catch {
      // Invalid or expired token — treat as unauthenticated
    }
  }

  const isAuthenticated = !!user;
  const onboardingCompleted = user?.onboardingCompleted === true;
  const pathname = req.nextUrl.pathname;

  // Unauthenticated users away from protected routes
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
  }

  // Authenticated but no courses yet → can't access dashboard
  if (pathname.startsWith("/dashboard") && isAuthenticated && !onboardingCompleted) {
    return NextResponse.redirect(new URL("/create-course", req.nextUrl));
  }

  // Authenticated and has created a course → skip the create-course page (already onboarded)
  if (pathname.startsWith("/create-course") && isAuthenticated && onboardingCompleted) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Authenticated users don't need sign-in
  if (AUTH_ONLY.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    return NextResponse.redirect(
      new URL(onboardingCompleted ? "/dashboard" : "/create-course", req.nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export default proxy;
