import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 1 Day (24 Hours)
const ABSOLUTE_SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("auth-token")?.value;
  const sessionCreated = Number(request.cookies.get("session-created")?.value || 0);
  const lastActive = Number(request.cookies.get("last-active")?.value || 0);
  const now = Date.now();

  const isAuthPage = path.startsWith("/login");
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/images") ||
    path.startsWith("/onspot_admin_html") ||
    path.startsWith("/html-reference") ||
    path.startsWith("/old-frontend") ||
    path.includes(".");

  if (isPublicAsset) {
    return NextResponse.next();
  }

  // Handle explicit logout on /login page
  if (isAuthPage && (request.nextUrl.searchParams.get("logout") === "true" || request.nextUrl.searchParams.has("force"))) {
    const response = NextResponse.next();
    const cookieNames = ["auth-token", "session-created", "last-active", "token", "authToken", "refreshToken", "session"];
    cookieNames.forEach((name) => {
      response.cookies.delete(name);
      response.cookies.set(name, "", { path: "/", maxAge: 0, expires: new Date(0) });
    });
    return response;
  }

  // Check expiration if session cookies are present
  const isSessionExpired =
    (sessionCreated > 0 && now - sessionCreated > ABSOLUTE_SESSION_MAX_MS) ||
    (lastActive > 0 && now - lastActive > INACTIVITY_TIMEOUT_MS);

  // If token exists but has NO session timestamps, it is a foreign cookie from another project or invalid session
  const isForeignOrUntracked = Boolean(token && sessionCreated === 0 && lastActive === 0);

  // If session is expired or foreign cookie detected
  if (token && (isSessionExpired || isForeignOrUntracked)) {
    const response = isAuthPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login?logout=true", request.url));
    const cookieNames = ["auth-token", "session-created", "last-active", "token", "authToken", "refreshToken", "session"];
    cookieNames.forEach((name) => {
      response.cookies.delete(name);
      response.cookies.set(name, "", { path: "/", maxAge: 0, expires: new Date(0) });
    });
    return response;
  }

  const isAuthenticated = Boolean(token && !isSessionExpired && !isForeignOrUntracked);

  // Root path handling
  if (path === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in trying to visit login
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Not logged in trying to visit protected pages
  if (!isAuthPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/.*).*)"],
};

