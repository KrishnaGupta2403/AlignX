"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DotField from '@/components/backgrounds/DotField';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BorderGlow from '@/components/backgrounds/BorderGlow';

import { hyperspeedPresets } from '@/components/backgrounds/Hyperspeed';
import Hyperspeed from '@/components/backgrounds/Hyperspeed';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('expired') === 'true') {
        setError('Your session has expired. Please sign in again.');
      }
    }
  }, []);

  const handleLogin = async (customEmail?: string, customPassword?: string) => {
    const emailToUse = typeof customEmail === 'string' ? customEmail : email;
    const passwordToUse = typeof customPassword === 'string' ? customPassword : password;

    if (!emailToUse || !passwordToUse) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: authError } = await (supabase.auth as any).signInWithPassword({
      email: emailToUse,
      password: passwordToUse
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data?.user) {
      setError('Login failed. Please try again.');
      setLoading(false);
      return;
    }

    // --- Determine the user's role ---
    let userRole = null;

    // 1. Check user_metadata first (instant, no DB call)
    userRole = data.user.user_metadata?.role || null;
    console.log('[Login] user_metadata role:', userRole);

    // 2. If not in metadata, query the profiles table
    if (!userRole) {
      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (!pError && pData?.role) {
        userRole = pData.role;
        console.log('[Login] profiles table role:', userRole);
      } else {
        console.warn('[Login] profiles query error or no role:', pError?.message);
      }
    }

    // 3. Final fallback
    if (!userRole) {
      userRole = 'employee';
      console.warn('[Login] No role found anywhere. Defaulting to employee.');
    }

    console.log('[Login] Final role for redirect:', userRole);

    // --- Redirect based on role ---
    if (userRole === 'admin') {
      router.push('/admin/dashboard');
    } else if (userRole === 'manager') {
      router.push('/manager/dashboard');
    } else {
      router.push('/employee/dashboard');
    }
    // Note: don't call setLoading(false) here since we're navigating away
  };

  const handleQuickLogin = async (role: 'admin' | 'manager' | 'employee') => {
    let targetEmail = '';
    let targetPassword = '';
    if (role === 'admin') {
      targetEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
      targetPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
    } else if (role === 'manager') {
      targetEmail = process.env.NEXT_PUBLIC_MANAGER_EMAIL || '';
      targetPassword = process.env.NEXT_PUBLIC_MANAGER_PASSWORD || '';
    } else if (role === 'employee') {
      targetEmail = process.env.NEXT_PUBLIC_EMPLOYEE_EMAIL || '';
      targetPassword = process.env.NEXT_PUBLIC_EMPLOYEE_PASSWORD || '';
    }
    setEmail(targetEmail);
    setPassword(targetPassword);
    await handleLogin(targetEmail, targetPassword);
  };

  return (
    <main className="min-h-screen w-full flex bg-[#0A0510] text-white font-sans relative overflow-hidden">

      {/* Full-page Hyperspeed background — shifted left so road centers on left panel */}
      <div className="absolute inset-0 z-0" style={{ transform: 'translateX(-25%)', width: '150%' }}>
        <Hyperspeed effectOptions={hyperspeedPresets.one} />
      </div>

      {/* Left half: transparent spacer so hyperspeed shows through */}
      <div className="hidden lg:block" style={{flex: 1}} />

      {/* Right side: Login Container */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="relative w-full max-w-[380px] mx-4">
        <BorderGlow
          edgeSensitivity={30}
          glowColor="280 80 80"
          backgroundColor="rgba(10, 5, 16, 0.7)"
          borderRadius={20}
          glowRadius={60}
          glowIntensity={1.9}
          coneSpread={5}
          animated={true}
          colors={['#c084fc', '#f472b6', '#38bdf8']}
          fillOpacity={0.15}
        >
          <div className="p-7 backdrop-blur-xl">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#A855F7] to-[#B497CF] mb-2 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-white/70 text-lg font-medium">Enter your credentials to access your dashboard</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-base">
                {error}
              </div>
            )}

            <div className="space-y-4.5 flex flex-col">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-[#A855F7] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-lg placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all"
                  placeholder="Email Address"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-[#A855F7] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-lg placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all"
                  placeholder="Password"
                />
              </div>

              <div className="flex justify-end">
                <a href="#" className="text-base text-[#B497CF] hover:text-[#A855F7] transition-colors font-medium">
                  Forgot password?
                </a>
              </div>

              <button
                onClick={() => handleLogin()}
                disabled={loading}
                className="relative overflow-hidden group w-full bg-gradient-to-r from-[#A855F7] to-[#8a3fd6] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#A855F7]/25 hover:shadow-[#A855F7]/40 transition-all flex items-center justify-center gap-2 mt-3 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <span className="relative z-10">{loading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Testing Roles Section */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-center text-xs font-semibold text-white/40 tracking-wider uppercase mb-2.5">
                  testing roles
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin')}
                    disabled={loading}
                    className="py-2 px-1 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-[#A855F7]/20 hover:border-[#A855F7]/40 transition-all text-center disabled:opacity-50"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('manager')}
                    disabled={loading}
                    className="py-2 px-1 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-[#A855F7]/20 hover:border-[#A855F7]/40 transition-all text-center disabled:opacity-50"
                  >
                    Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('employee')}
                    disabled={loading}
                    className="py-2 px-1 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-[#A855F7]/20 hover:border-[#A855F7]/40 transition-all text-center disabled:opacity-50"
                  >
                    Employee
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-7 text-center text-lg text-white/70">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-[#A855F7] font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </BorderGlow>
      </div>
      </div>
    </main>
  );
}
