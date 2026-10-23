import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 1 Day (24 Hours)
const ABSOLUTE_SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

function isValidJwtStructure(token?: string): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.trim().split(".");
  if (parts.length !== 3) return false;
  return parts.every((p) => p.length > 0 && /^[A-Za-z0-9_-]+$/.test(p));
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("auth-token")?.value;
  const sessionCreated = Number(request.cookies.get("session-created")?.value || 0);
  const lastActive = Number(request.cookies.get("last-active")?.value || 0);
  const now = Date.now();

  const isAuthPage = path.startsWith("/login");
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/images") ||
    path.startsWith("/onspot_admin_html") ||
    path.startsWith("/html-reference") ||
    path.startsWith("/old-frontend") ||
    /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff|woff2|ttf|eot|map|txt)$/i.test(path);

  if (isPublicAsset) {
    return NextResponse.next();
  }

  const cookieNames = [
    "auth-token",
    "session-created",
    "last-active",
    "token",
    "authToken",
    "refreshToken",
    "session",
  ];
  const secureCookieOpts = {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  // Handle explicit logout on /login page
  if (isAuthPage && (request.nextUrl.searchParams.get("logout") === "true" || request.nextUrl.searchParams.has("force"))) {
    const response = NextResponse.next();
    cookieNames.forEach((name) => {
      response.cookies.delete(name);
      response.cookies.set(name, "", secureCookieOpts);
    });
    return response;
  }

  // Check expiration if session cookies are present
  const isSessionExpired =
    (sessionCreated > 0 && now - sessionCreated > ABSOLUTE_SESSION_MAX_MS) ||
    (lastActive > 0 && now - lastActive > INACTIVITY_TIMEOUT_MS);

  // If token exists but has NO session timestamps, it is a foreign cookie from another project or invalid session
  const isForeignOrUntracked = Boolean(token && sessionCreated === 0 && lastActive === 0);
  const isTokenMalformed = Boolean(token && !isValidJwtStructure(token));

  // If session is expired, malformed, or foreign cookie detected
  if (token && (isSessionExpired || isForeignOrUntracked || isTokenMalformed)) {
    const response = isAuthPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login?logout=true", request.url));
    cookieNames.forEach((name) => {
      response.cookies.delete(name);
      response.cookies.set(name, "", secureCookieOpts);
    });
    return response;
  }

  const isAuthenticated = Boolean(token && isValidJwtStructure(token) && !isSessionExpired && !isForeignOrUntracked);

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

