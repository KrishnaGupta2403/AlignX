"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DotField from '@/components/backgrounds/DotField';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

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

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0A0510] text-white font-sans flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly
          gradientFrom="#A855F7"
          gradientTo="#B497CF"
          glowColor="#120F17"
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#A855F7] to-[#B497CF] mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-white/60 text-sm">Enter your credentials to access your dashboard</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5 flex flex-col">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#A855F7] transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all"
                placeholder="Email Address"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#A855F7] transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all"
                placeholder="Password"
              />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm text-[#B497CF] hover:text-[#A855F7] transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="relative overflow-hidden group w-full bg-gradient-to-r from-[#A855F7] to-[#8a3fd6] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-[#A855F7]/25 hover:shadow-[#A855F7]/40 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative z-10">{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-white/50">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-[#A855F7] font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
