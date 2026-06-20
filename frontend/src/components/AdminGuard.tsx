'use client';
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../lib/zustandStore';

interface AdminGuardProps {
  children: ReactNode;
}

/**
 * Client-side route guard for admin-only pages.
 * Redirects non-admin users to /access-denied.
 * This runs client-side after hydration (works regardless of token storage).
 */
export default function AdminGuard({ children }: AdminGuardProps) {
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    // Wait briefly for Zustand to hydrate from localStorage
    const timer = setTimeout(() => {
      if (!user || user.role !== 'admin') {
        router.replace('/access-denied');
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [user, router]);

  // While checking, render nothing (or a minimal loading state)
  if (!user || user.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
