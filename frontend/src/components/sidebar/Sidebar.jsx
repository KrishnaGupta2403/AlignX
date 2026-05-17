"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Target, 
  CheckSquare, 
  FileText,
  LogOut,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Define links based on roles
  const roleLinks = {
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Analytics Dashboard', path: '/admin/analytics', icon: BarChart3 },
      { name: 'System Reports', path: '/admin/reports', icon: FileText },
      { name: 'Manage Users', path: '/admin/users', icon: Users },
      { name: 'Audit Trail', path: '/admin/audit', icon: ShieldCheck },
      { name: 'Escalations', path: '/admin/escalations', icon: AlertTriangle },
      { name: 'Cycle Management', path: '/admin/cycles', icon: RefreshCw },
    ],
    manager: [
      { name: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
      { name: 'My Team\'s Goals', path: '/manager/approvals', icon: Target },
      { name: 'Team Check-Ins', path: '/manager/checkins', icon: CheckSquare },
      { name: 'Reports & Analytics', path: '/manager/reports', icon: FileText },
    ],
    employee: [
      { name: 'My Goals', path: '/employee/dashboard', icon: Target },
      { name: 'Quarterly Check-In', path: '/employee/checkin', icon: CheckSquare },
      { name: 'Reports', path: '/employee/reports', icon: FileText },
    ],
  };

  const links = roleLinks[role] || roleLinks.employee;

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <aside className="w-64 h-screen bg-[#0A0510]/80 backdrop-blur-xl border-r border-white/10 flex flex-col fixed left-0 top-0 pt-16">
      
      {/* User Info Profile Area */}
      <div className="p-6 border-b border-white/5">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#B497CF] flex items-center justify-center text-white font-bold text-xl mb-3 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          {user?.user_metadata?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <h3 className="text-white font-medium truncate">
          {user?.user_metadata?.name || 'User'}
        </h3>
        <p className="text-[#A855F7] text-xs uppercase tracking-wider font-semibold mt-1">
          {role}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
          return (
            <Link 
              key={link.path} 
              href={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-white/10 text-white shadow-[inset_2px_0_0_#A855F7]' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-[#A855F7]' : ''} />
              <span className="font-medium text-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Area */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
