"use client";

// import FloatingLines from '@/components/backgrounds/FloatingLines';
import dynamic from 'next/dynamic';
const FloatingLines = dynamic(
  () => import('@/components/backgrounds/FloatingLines'),
  { ssr: false, loading: () => <div /> }
);
import { ArrowRight, Target, Activity, CheckSquare, ShieldCheck, Zap, Layers, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function RootPage() {
  return (
    <main className="relative min-h-screen w-full bg-[#07020d] text-white font-sans overflow-x-hidden flex flex-col justify-between">
      {/* Absolute Premium WebGL Background */}
      <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
        {/* @ts-ignore */}
        <FloatingLines 
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={[8, 8, 8]}
          lineDistance={[8, 8, 8]}
          bendRadius={8}
          bendStrength={-2}
          interactive
          parallax={true}
          animationSpeed={0.8}
          gradientStart="#e945f5"
          gradientMid="#6f6f6f"
          gradientEnd="#6a6a6a"
        />
      </div>

      {/* Radiant Glowing Background Effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-pink-500/10 blur-[120px] pointer-events-none z-0" />

      {/* Header / Navbar */}
      <header className="relative z-10 w-full px-6 py-6 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#e945f5] to-[#A855F7] flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Target className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="text-3xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-[#B497CF] to-[#e945f5]">
            ALIGNX
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/auth/login" 
            className="px-5 py-2.5 rounded-xl text-white/80 hover:text-white font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/signup" 
            className="relative group overflow-hidden px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all font-semibold shadow-md flex items-center gap-1.5"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#e945f5] to-[#A855F7] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Hero & Content Layout */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-grow">
        <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#e945f5]" />
            <span className="text-xs font-semibold tracking-wide uppercase text-purple-300">
              Next-Gen Performance Architecture
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
            ALIGN INDIVIDUAL GOALS.<br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#e945f5] via-[#B497CF] to-white">
              UNLEASH VELOCITY.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl font-light leading-relaxed">
            AlignX unites employee aspirations, real-time metrics, automated performance reviews, and check-in timelines into a high-performance workspace engineered for high-growth enterprises.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
            <Link 
              href="/auth/signup" 
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#e945f5] to-[#A855F7] text-white font-bold tracking-wide hover:shadow-[0_0_30px_rgba(233,69,245,0.4)] transition-all flex items-center justify-center gap-2 text-center group"
            >
              <span>Get Started Instantly</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href="/auth/login" 
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-bold tracking-wide backdrop-blur-md text-center"
            >
              Enter Dashboard
            </Link>
          </div>

          {/* Quick Metrics Footer */}
          <div className="pt-8 grid grid-cols-3 gap-6 md:gap-12 border-t border-white/5 w-full">
            <div>
              <div className="text-3xl font-black text-[#e945f5]">100%</div>
              <div className="text-xs text-white/50 uppercase tracking-widest mt-1">Goal Alignment</div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-300">4.8x</div>
              <div className="text-xs text-white/50 uppercase tracking-widest mt-1">Cycle Velocity</div>
            </div>
            <div>
              <div className="text-3xl font-black text-white">0</div>
              <div className="text-xs text-white/50 uppercase tracking-widest mt-1">Friction Overheads</div>
            </div>
          </div>
        </div>

        {/* Interactive Futuristic Card Stack */}
        <div className="lg:col-span-5 relative w-full flex justify-center">
          <div className="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-tr from-white/5 to-white/0 border border-white/10 p-8 flex flex-col justify-between backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group">
            {/* Glossy inner shimmer */}
            <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 translate-x-[-50%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#e945f5]" />
              </div>
              <div className="px-3 py-1 rounded-full bg-[#e945f5]/10 border border-[#e945f5]/20 text-[#e945f5] text-xs font-bold tracking-wider uppercase">
                Active Cycle
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold tracking-tight">Performance Pipeline</h3>
              <p className="text-sm text-white/60 font-light">
                Monitor cycles, execute quarterly feedback loops, lock goal sheets, and complete audit-compliant reviews with absolute speed.
              </p>
              
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>Objective Key Results</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Integrated Cycle Audits</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <ShieldCheck className="w-4 h-4 text-[#e945f5]" />
                  <span>Robust RLS Security Guard</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
              <span>AlignX Engine v2.0</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400">System Online</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer copyright */}
      <footer className="relative z-10 w-full px-6 py-8 max-w-7xl mx-auto border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
        <div>
          &copy; {new Date().getFullYear()} AlignX Performance Inc. All rights reserved.
        </div>
        <div className="flex gap-6">
          <Link href="/auth/login" className="hover:text-white transition-colors">Workspace Login</Link>
          <Link href="/auth/signup" className="hover:text-white transition-colors">Request Account</Link>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </footer>
    </main>
  );
}
