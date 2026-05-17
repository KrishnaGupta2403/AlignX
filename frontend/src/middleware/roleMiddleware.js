"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function RoleGuard({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only act once BOTH session AND role have been resolved (loading = false)
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (role === null) {
        // Role fetched but returned null — user has no role assigned in Supabase
        console.error('[RoleGuard] User has no role in the profiles table. Redirecting to login.');
        router.push('/auth/login?error=no_role');
      } else if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // Logged in but wrong role
        router.push('/unauthorized');
      }
    }
  }, [user, role, loading, router, allowedRoles]);

  // Show spinner while loading session OR role
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0510]">
        <div className="w-10 h-10 border-4 border-[#A855F7] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white/40 text-sm animate-pulse">Verifying access...</p>
      </div>
    );
  }

  // Block render if not authorized (redirect is already happening via useEffect)
  if (!user || role === null || (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role))) {
    return null;
  }

  return children;
}
