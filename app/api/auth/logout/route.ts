import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // CSRF Origin / Referer validation
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: "Invalid origin (CSRF detected)" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Malformed origin" }, { status: 403 });
    }
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  const cookieNames = [
    "auth-token",
    "session-created",
    "last-active",
    "token",
    "authToken",
    "refreshToken",
    "session",
  ];

  const cookieOpts = {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  // Clear defined cookies
  for (const name of cookieNames) {
    response.cookies.delete(name);
    response.cookies.set(name, "", cookieOpts);
  }

  // Clear any existing cookies found in the incoming request
  request.cookies.getAll().forEach((cookie) => {
    response.cookies.delete(cookie.name);
    response.cookies.set(cookie.name, "", cookieOpts);
  });

  // Request browser to clear cookies for this origin
  response.headers.set("Clear-Site-Data", '"cookies", "storage"');

  return response;
}

export async function GET(request: NextRequest) {
  // Reject unauthenticated GET logout to prevent CSRF image/link attacks
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login?logout=true", request.url));
  }
  // For actual logout from browser UI, POST is required
  return NextResponse.json(
    { error: "Method Not Allowed. Use POST to log out." },
    { status: 405, headers: { Allow: "POST" } }
  );
}
