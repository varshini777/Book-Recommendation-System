import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy — server-side route protection.
 *
 * Protected routes: /admin/*, /analytics/*, /demo/*
 *
 * Strategy:
 * - Reads the `litrealm_role` cookie which is set by zustandStore on login.
 * - If the cookie is missing or not "admin", redirect to /access-denied.
 *
 * Note: The `litrealm_role` cookie is written client-side on login and cleared
 * on logout. This gives us server-side enforcement without requiring SSR token
 * verification. The backend itself also enforces 403 for all admin API endpoints.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/demo');

  if (isAdminRoute) {
    const role = request.cookies.get('litrealm_role')?.value;

    if (role !== 'admin') {
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
