'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '../lib/zustandStore';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, onboarded, library, loadPreferences, loadLibrary, token } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (token) {
      loadPreferences();
      loadLibrary();
    }
  }, [token, loadPreferences, loadLibrary]);

  useEffect(() => {
    const checkRedirect = async () => {
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
      const isPublic = publicPaths.includes(pathname);

      if (isPublic) {
        setChecking(false);
        return;
      }

      if (!token) {
        setChecking(false);
        return;
      }

      // Wait until user details are loaded if token is present
      if (token && !user) {
        return;
      }

      if (user) {
        const hasLibraryItems = library && library.length > 0;
        const isUserOnboarded = onboarded || user.onboarded;

        if (!isUserOnboarded && !hasLibraryItems && pathname !== '/onboarding') {
          router.replace('/onboarding');
        } else if (isUserOnboarded && pathname === '/onboarding') {
          router.replace('/');
        } else {
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    };

    checkRedirect();
  }, [user, onboarded, library, pathname, router, token]);

  const isPublic = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(pathname);

  if (checking && token && !onboarded && !isPublic && pathname !== '/onboarding') {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0b0f19 0%, #111827 100%)',
        color: 'white',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999
      }}>
        <div style={{
          width: 48, height: 48, 
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
