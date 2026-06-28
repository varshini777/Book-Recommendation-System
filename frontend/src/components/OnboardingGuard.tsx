'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '../lib/zustandStore';

const PROTECTED_PATHS = ['/', '/catalog', '/library', '/profile', '/settings', '/onboarding', '/admin'];
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/demo', '/access-denied'];

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, onboarded, token, authLoading } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    const isPublic = PUBLIC_PATHS.includes(pathname);
    const isProtected = PROTECTED_PATHS.includes(pathname) || pathname.startsWith('/catalog/') || pathname.startsWith('/admin/');

    if (isPublic) {
      if (token && (pathname === '/login' || pathname === '/register')) {
        router.replace('/');
      }
      return;
    }

    if (!token) {
      if (isProtected) {
        const loginUrl = new URL('/login', window.location.origin);
        loginUrl.searchParams.set('redirect', pathname);
        router.replace(loginUrl.toString());
      }
      return;
    }

    if (!user) return;

    const isUserOnboarded = onboarded || user.onboarded;

    if (!isUserOnboarded && pathname !== '/onboarding') {
      router.replace('/onboarding');
    } else if (isUserOnboarded && pathname === '/onboarding') {
      router.replace('/');
    }
  }, [authLoading, user, onboarded, pathname, router, token]);

  if (authLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0b0f19 0%, #111827 100%)',
        color: 'white',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid rgba(255,255,255,0.1)',
          borderTopColor: '#6A1B29',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: 16, color: '#9CA3AF', fontSize: '0.9rem', fontWeight: 500 }}>
          Calibrating your LitRealm experience...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}