"use client";

import { useAuth } from '@/hooks/useAuth';
import { useCycle } from '@/hooks/useCycle';
import { Search } from 'lucide-react';
import NotificationBell from '@/components/navbar/NotificationBell';

export default function Navbar() {
  const { user } = useAuth();
  const { activePhase } = useCycle();

  return (
    <header className="h-16 bg-[#0A0510]/90 backdrop-blur-md border-b border-white/10 fixed top-0 right-0 left-64 z-50 flex items-center justify-between px-8">
      
      {/* Brand / Title Area */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#A855F7] to-[#B497CF] tracking-tight">
          AlignX
        </h2>
        <span className="text-white/50 text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
          Active Phase: <strong className="text-white font-semibold">{activePhase || 'No Active Phase'}</strong>
        </span>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-6">
        
        {/* Search */}
        <div className="relative group hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
            <Search size={16} />
          </div>
          <input
            type="text"
            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#A855F7]/50 w-64 transition-all"
            placeholder="Search anything..."
          />
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* Mini Avatar for top bar */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">{user?.user_metadata?.name?.split(' ')[0] || 'User'}</p>
            <p className="text-xs text-white/50 truncate max-w-[120px]">{user?.email}</p>
          </div>
        </div>

      </div>
    </header>
  );
}
