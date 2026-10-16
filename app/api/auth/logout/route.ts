import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
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

  // Clear defined cookies
  for (const name of cookieNames) {
    response.cookies.delete(name);
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  // Clear any existing cookies found in the incoming request
  request.cookies.getAll().forEach((cookie) => {
    response.cookies.delete(cookie.name);
    response.cookies.set(cookie.name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  });

  // Request browser to clear cookies for this origin
  response.headers.set("Clear-Site-Data", '"cookies", "storage"');

  return response;
}

export async function GET(request: NextRequest) {
  return POST(request);
}
