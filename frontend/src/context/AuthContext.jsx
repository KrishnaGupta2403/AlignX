"use client";

import { createContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  // Two separate loading flags:
  // - sessionLoading: waiting to know IF a session exists
  // - roleLoading: waiting to know WHAT the role is (only relevant if session exists)
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  const router = useRouter();
  const intentionalLogout = useRef(false);

  const resolvedUserId = useRef(null);

  // Fetch role STRICTLY from Supabase — no defaults, no fallbacks
  const fetchProfileRole = async (userObj) => {
    if (!userObj?.id) return null;
    
    const isSilentlyRefreshing = resolvedUserId.current === userObj.id;
    
    // Only show loading screen if this is a fresh login/initial load
    if (!isSilentlyRefreshing) {
      setRoleLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userObj.id)
        .single();

      if (error) {
        console.warn('[AuthContext] profiles query failed:', error.message, '| Code:', error.code);
        return null;
      }

      console.log('[AuthContext] Role from Supabase:', data?.role);
      resolvedUserId.current = userObj.id;
      return data?.role ?? null;
    } catch (err) {
      console.error('[AuthContext] Unexpected error fetching role:', err);
      return null;
    } finally {
      if (!isSilentlyRefreshing) {
        setRoleLoading(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth event:', event);

        if (!mounted) return;

        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
          setUser(null);
          setRole(null);
          setSessionLoading(false);
          setRoleLoading(false);

          if (!intentionalLogout.current) {
            router.push('/auth/login?expired=true');
          }
          intentionalLogout.current = false;

        } else if (session?.user) {
          setUser(session.user);
          setSessionLoading(false); // Session is confirmed — unlock that gate

          // Now fetch the real role from the DB (roleLoading stays true during this)
          const resolvedRole = await fetchProfileRole(session.user);
          if (mounted) setRole(resolvedRole);

        } else {
          // No session at all
          setUser(null);
          setRole(null);
          setSessionLoading(false);
          setRoleLoading(false);
        }
      }
    );

    // Safety net: if onAuthStateChange never fires, unblock after 5s
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        setSessionLoading(false);
        setRoleLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const logout = () => {
    intentionalLogout.current = true;
    
    // 1. Forcefully clear any Supabase session tokens from local storage instantly
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }

    // 2. Fire-and-forget the Supabase signout (do not await, to avoid getting stuck in network queues)
    supabase.auth.signOut({ scope: 'local' }).catch(err => console.error('Logout error:', err));

    // 3. Immediately bounce the user back to the login screen
    window.location.href = '/auth/login';
  };

  // Combined loading = we're still figuring out session OR role
  const loading = sessionLoading || roleLoading;

  const value = { user, role, loading, sessionLoading, roleLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
