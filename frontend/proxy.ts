import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED = ["/create-course", "/dashboard", "/learn", "/settings"];
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
      // Invalid or expired token, treat as unauthenticated
    }
  }

  const isAuthenticated = !!user;
  const onboardingCompleted = user?.onboardingCompleted === true;
  const pathname = req.nextUrl.pathname;

  if (PROTECTED.some((path) => pathname.startsWith(path)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
  }

  if (pathname.startsWith("/dashboard") && isAuthenticated && !onboardingCompleted) {
    return NextResponse.redirect(new URL("/create-course", req.nextUrl));
  }

  if (AUTH_ONLY.some((path) => pathname.startsWith(path)) && isAuthenticated) {
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
