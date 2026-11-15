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
  const roleCookie = request.cookies.get("billnext_role")?.value || "owner";
  const permsCookie = request.cookies.get("billnext_permissions")?.value;

  const isAuthenticated = authCookie === "1";
  const isAllowed = allowedCookie === "1";

  // Helper to resolve staff default redirect
  const getStaffFirstAllowedPath = (): string => {
    if (roleCookie === "staff" && permsCookie) {
      try {
        const permissions: Record<string, string> = JSON.parse(decodeURIComponent(permsCookie));
        const routeOrder = ["/billing", "/", "/sales", "/customers", "/items", "/categories", "/users", "/settings"];
        return routeOrder.find((p) => permissions[p] && permissions[p] !== "none") || "/billing";
      } catch (e) {}
    }
    return "/";
  };

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

    // 3. Granular RBAC URL-level blocking for sub-users/staff
    // Requirement: "we need to bloc from url level also"
    if (roleCookie === "staff" && permsCookie) {
      try {
        const permissions: Record<string, string> = JSON.parse(decodeURIComponent(permsCookie));
        const basePath = "/" + (pathname.split("/")[1] || "");
        const targetKey = basePath === "/" ? "/" : basePath;
        const pagePermission = permissions[targetKey];

        // Block if page access is 'none' or not permitted
        if (!pagePermission || pagePermission === "none") {
          const fallbackPath = getStaffFirstAllowedPath();
          const deniedUrl = new URL(fallbackPath, request.url);
          deniedUrl.searchParams.set("access_denied", targetKey);
          const res = NextResponse.redirect(deniedUrl);
          res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          return res;
        }
      } catch (err) {
        console.warn("Middleware permissions check error:", err);
      }
    }
  }

  // 4. If user is at /login but already authenticated and allowed -> send to first allowed route
  if (pathname === "/login" && isAuthenticated && isAllowed) {
    const dest = getStaffFirstAllowedPath();
    const res = NextResponse.redirect(new URL(dest, request.url));
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  }

  // 5. If user is at /login and authenticated but NOT allowed -> send to /onboarding
  if (pathname === "/login" && isAuthenticated && !isAllowed) {
    const res = NextResponse.redirect(new URL("/onboarding", request.url));
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  }

  // 6. If user is at /onboarding and already authenticated and allowed -> send to first allowed route
  if (pathname === "/onboarding" && isAuthenticated && isAllowed) {
    const dest = getStaffFirstAllowedPath();
    const res = NextResponse.redirect(new URL(dest, request.url));
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

