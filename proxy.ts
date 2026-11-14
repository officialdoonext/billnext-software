import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that do not require software authorization
  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico";

  // Check auth cookies set during login/signup
  const authCookie = request.cookies.get("billnext_auth")?.value;
  const allowedCookie = request.cookies.get("billnext_allowed")?.value;

  const isAuthenticated = authCookie === "1";
  const isAllowed = allowedCookie === "1";

  // 1. If not public and user is not authenticated -> redirect to /login
  if (!isPublicPath) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. If authenticated but status is inactive or expired -> redirect to /onboarding
    if (!isAllowed) {
      const onboardingUrl = new URL("/onboarding", request.url);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  // 3. If user is at /login but already authenticated and allowed -> send to /
  if (pathname === "/login" && isAuthenticated && isAllowed) {
    const res = NextResponse.redirect(new URL("/", request.url));
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  }

  // 4. If user is at /login and authenticated but NOT allowed -> send to /onboarding
  if (pathname === "/login" && isAuthenticated && !isAllowed) {
    const res = NextResponse.redirect(new URL("/onboarding", request.url));
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  }

  // 5. If user is at /onboarding and already authenticated and allowed -> send to /
  if (pathname === "/onboarding" && isAuthenticated && isAllowed) {
    const res = NextResponse.redirect(new URL("/", request.url));
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  }

  const response = NextResponse.next();
  // Disable caching for all responses
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

