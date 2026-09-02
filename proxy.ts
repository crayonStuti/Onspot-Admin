import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("auth-token")?.value;

  const isAuthPage = path.startsWith("/login");
  const isPublicAsset =
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/images") ||
    path.startsWith("/html-reference") ||
    path.startsWith("/old-frontend") ||
    path.includes(".");

  if (isPublicAsset) {
    return NextResponse.next();
  }

  // Root path handling
  if (path === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/users", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in trying to visit login
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/users", request.url));
  }

  // Not logged in trying to visit protected pages
  if (!isAuthPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/.*).*)"],
};
