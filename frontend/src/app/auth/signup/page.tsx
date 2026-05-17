"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import DotField from '@/components/backgrounds/DotField';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BorderGlow from '@/components/backgrounds/BorderGlow';

import { hyperspeedPresets } from '@/components/backgrounds/Hyperspeed';
import Hyperspeed from '@/components/backgrounds/Hyperspeed';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setError('');
    setSuccessMsg('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { data, error } = await (supabase.auth as any).signUp({
      email,
      password,
      options: {
        data: { 
          name: name,
          email: email
        },
      },
    });

    if (!error && data?.user) {
      try {
        // Direct upsert to ensure the email is recorded in the profiles table if RLS/policies allow it
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: name,
            email: email,
            role: 'employee'
          });
        if (profileError) {
          console.warn('[Signup] Profile upsert warning (may be handled by DB trigger or restricted by RLS):', profileError.message);
        }
      } catch (upsertErr) {
        console.error('[Signup] Direct profile upsert error:', upsertErr);
      }
    }

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccessMsg('Account created! Check your email to confirm your account, then sign in.');
    }
  };

  return (
    <main className="min-h-screen w-full flex bg-[#0A0510] text-white font-sans relative overflow-hidden">

      {/* Full-page Hyperspeed background — shifted left so road centers on left panel */}
      <div className="absolute inset-0 z-0" style={{ transform: 'translateX(-25%)', width: '150%' }}>
        <Hyperspeed effectOptions={hyperspeedPresets.one} />
      </div>

      {/* Left half: transparent spacer so hyperspeed shows through */}
      <div className="hidden lg:block" style={{flex: 1}} />

      {/* Right side: Signup Container */}
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
                Create Account
              </h1>
              <p className="text-white/70 text-lg font-medium">Join us today to unlock all features</p>
            </div>

            {error && (
              <div className="mb-5 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-base">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-5 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-base">
                {successMsg}
              </div>
            )}

            <div className="space-y-4.5 flex flex-col">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-[#A855F7] transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-lg placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all"
                  placeholder="Full Name"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-[#A855F7] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-lg placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all"
                  placeholder="Password"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-[#A855F7] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-lg placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-transparent transition-all"
                  placeholder="Confirm Password"
                />
              </div>

              <button
                onClick={handleSignup}
                disabled={loading}
                className="relative overflow-hidden group w-full bg-gradient-to-r from-[#A855F7] to-[#8a3fd6] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#A855F7]/25 hover:shadow-[#A855F7]/40 transition-all flex items-center justify-center gap-2 mt-3 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <span className="relative z-10">{loading ? 'Creating account...' : 'Sign Up'}</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <p className="mt-7 text-center text-lg text-white/70">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#A855F7] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </BorderGlow>
      </div>
      </div>
    </main>
  );
}
