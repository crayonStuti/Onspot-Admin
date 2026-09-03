import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('auth-token')?.value;

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/auth/register', '/'];
  const isPublicPath = publicPaths.includes(path);

  // If user is at a public path and has a token, redirect to dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/crm/dashboard', request.url));
  }

  // If user is at a protected path and has NO token, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Configure which paths this middleware runs on
export const config = {
  matcher: [

    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
