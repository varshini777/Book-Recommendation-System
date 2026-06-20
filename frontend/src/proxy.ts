import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy — server-side route protection.
 *
 * Protected routes: /admin/*, /analytics/*, /demo/*
 *
 * Strategy:
 * - Reads the `litrealm_auth` cookie which is set by zustandStore on login.
 * - If the cookie is missing, redirect to /access-denied.
 *
 * Note: The `litrealm_auth` cookie only indicates authentication state.
 * The actual role validation is securely handled by `AdminGuard` on the client
 * and enforced strictly by the backend API 403s.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/demo');

  if (isAdminRoute) {
    const isAuth = request.cookies.get('litrealm_auth')?.value;

    if (!isAuth) {
      const url = request.nextUrl.clone();
      url.pathname = '/access-denied';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/analytics/:path*', '/demo/:path*'],
};
