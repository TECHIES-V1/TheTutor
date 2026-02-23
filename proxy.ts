import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/onboarding"];
const AUTH_ROUTES = ["/auth/signin"];

export default auth(function proxy(req) {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth?.user;
  const pathname = nextUrl.pathname;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Authenticated users don't need the sign-in page
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl));
  }

  // Unauthenticated users can't access protected routes
  if (isProtected && !isAuthenticated) {
    const signInUrl = new URL("/auth/signin", nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
