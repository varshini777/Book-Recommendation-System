import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/access-denied',
  '/api',
  '/_next',
  '/favicon.ico',
  '/fonts',
  '/images',
];

const PROTECTED_PATHS = [
  '/',
  '/catalog',
  '/library',
  '/profile',
  '/settings',
  '/onboarding',
  '/admin',
];

const ADMIN_PATHS = [
  '/admin',
  '/analytics',
  '/demo',
];

function pathMatches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(p => pathname === p || pathname.startsWith(p + '/'));
}

function isPublicPath(pathname: string): boolean {
  return pathMatches(pathname, PUBLIC_PATHS);
}

function isProtectedPath(pathname: string): boolean {
  return pathMatches(pathname, PROTECTED_PATHS);
}

function isAdminPath(pathname: string): boolean {
  return pathMatches(pathname, ADMIN_PATHS);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('litrealm_auth');

  // Public paths: always allow, but redirect authenticated users away from /login and /register
  if (isPublicPath(pathname)) {
    if (authCookie?.value === 'true' && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Admin / analytics / demo paths: redirect unauthenticated to /access-denied
  if (isAdminPath(pathname)) {
    if (!authCookie || authCookie.value !== 'true') {
      return NextResponse.redirect(new URL('/access-denied', request.url));
    }
    return NextResponse.next();
  }

  // Protected paths: redirect unauthenticated to /login with redirect param
  if (isProtectedPath(pathname)) {
    if (!authCookie || authCookie.value !== 'true') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|fonts|images).*)',
  ],
};
