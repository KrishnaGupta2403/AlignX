"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import Link from 'next/link';
import BorderGlow from '@/components/backgrounds/BorderGlow';
import { 
  Users, 
  Target, 
  Clock, 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  Settings, 
  ArrowRight,
  ShieldCheck,
  Loader2,
  Search,
  Unlock,
  Eye,
  X
} from 'lucide-react';
import { getAdminOverviewStats, getAdminSystemReportsData } from '@/services/analyticsService';
import { unlockGoalSheet } from '@/services/approvalService';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active sheets auditing states
  const [sheets, setSheets] = useState<any[]>([]);
  const [filteredSheets, setFilteredSheets] = useState<any[]>([]);
  const [sheetsLoading, setSheetsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheet, setSelectedSheet] = useState<any | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const loadStats = async () => {
  try {
    if (!stats) setLoading(true); // ← only show loading if no data yet
    const data = await getAdminOverviewStats();
    setStats(data);
  } catch (err) {
    console.error("Failed to load admin stats:", err);
  } finally {
    setLoading(false);
  }
};

 const loadGoalSheets = async () => {
  try {
    if (!sheets.length) setSheetsLoading(true); // ← only show loading if no data yet
    const data = await getAdminSystemReportsData();
      console.log('Sheets:', data.map((s: any) => ({ 
        name: s.employeeName, 
        is_locked: s.is_locked,
        status: s.status 
      })));
      setSheets(data);
      setFilteredSheets(data);
    } catch (err) {
      console.error("Failed to load goal sheets on admin dashboard:", err);
    } finally {
      setSheetsLoading(false);
    }
  };

 useEffect(() => {
  loadStats();
  loadGoalSheets();

  // Prevent refetch on tab switch
  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && stats && sheets.length) return;
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);

  // Filter sheets by query search
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredSheets(sheets);
    } else {
      setFilteredSheets(
        sheets.filter((s: any) => 
          s.employeeName.toLowerCase().includes(q) || 
          s.employeeEmail.toLowerCase().includes(q) ||
          s.status.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, sheets]);

  const handleUnlock = async (sheetId: string) => {
    if (!user?.id) return;
    if (!confirm("Are you sure you want to unlock this goal sheet? This will reset its status to Draft and allow the employee to edit it.")) return;
    try {
      setUnlockingId(sheetId);
      await unlockGoalSheet(sheetId, user.id);
      
      // Update state locally
      setSheets(prev => prev.map((s: any) => {
        if (s.id === sheetId) {
          return { ...s, isLocked: false, is_locked: false, status: 'Draft' };
        }
        return s;
      }));

      // Reload global overview stats
      const freshStats = await getAdminOverviewStats();
      setStats(freshStats);
      
      alert("Goal sheet successfully unlocked and reset to Draft status!");
    } catch (err) {
      console.error("Failed to unlock goal sheet:", err);
      alert("Failed to unlock goal sheet. Please check database permissions.");
    } finally {
      setUnlockingId(null);
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Submitted':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-white/5 text-white/50 border border-white/10';
    }
  };

  const navCards = [
    {
      title: "Analytics Hub",
      description: "Analyze system performance, track QoQ progress metrics, and compare managers.",
      path: "/admin/analytics",
      icon: BarChart3,
      badge: "Charts & Visuals",
      color: "from-purple-500/20 to-pink-500/20 text-[#A855F7] border-purple-500/30"
    },
    {
      title: "System Reports",
      description: "Search, filter, audit employee sheets, and compile instant CSV or Excel spreadsheets.",
      path: "/admin/reports",
      icon: FileText,
      badge: "Compliance & Data",
      color: "from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30"
    },
    {
      title: "User Management",
      description: "Review active profiles, assign reporting structure, and configure platform access levels.",
      path: "/admin/users",
      icon: Users,
      badge: "Directory Controls",
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30"
    },
    {
      title: "Audit Trail",
      description: "View system audit logs, configure environment properties, and optimize backend processes.",
      path: "/admin/audit",
      icon: Settings,
      badge: "Governance",
      color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30"
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 relative z-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-[#A855F7]/20 rounded-2xl">
              <ShieldCheck size={32} className="text-[#A855F7]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Admin Control Center</h1>
              <p className="text-white/50 mt-1 text-sm">
                System-wide dashboard governance and evaluation compliance mapping.
              </p>
            </div>
          </div>
          <div className="bg-[#0A0510] border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/60 font-mono text-xs tracking-wider uppercase">System Operational</span>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Users */}
          <BorderGlow
            edgeSensitivity={20}
            glowColor="200 80 70"
            backgroundColor="rgba(10, 5, 16, 0.6)"
            borderRadius={16}
            glowRadius={40}
            glowIntensity={1.0}
            colors={['#38bdf8', '#0ea5e9', '#0284c7']}
            fillOpacity={0.1}
          >
            <div className="p-6 h-full relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users size={120} />
              </div>
              <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-2">Total Users</div>
              <div className="text-4xl font-extrabold text-white font-mono">
                {loading ? <Loader2 size={24} className="animate-spin text-white/40" /> : stats?.totalUsers || 0}
              </div>
              <p className="text-[11px] text-white/40 mt-4">Total registered employee and manager accounts</p>
            </div>
          </BorderGlow>

          {/* Card 2: System Completion */}
          <BorderGlow
            edgeSensitivity={20}
            glowColor="140 80 70"
            backgroundColor="rgba(10, 5, 16, 0.6)"
            borderRadius={16}
            glowRadius={40}
            glowIntensity={1.0}
            colors={['#10b981', '#34d399', '#059669']}
            fillOpacity={0.1}
          >
            <div className="p-6 h-full relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
                <Target size={120} />
              </div>
              <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-2">System-wide Completion Rate</div>
              <div className="text-4xl font-extrabold text-emerald-400 font-mono">
                {loading ? <Loader2 size={24} className="animate-spin text-white/40" /> : `${stats?.completionRate || 0}%`}
              </div>
              <div className="mt-3">
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                    style={{ width: `${stats?.completionRate || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </BorderGlow>

          {/* Card 3: Pending Approvals */}
          <BorderGlow
            edgeSensitivity={20}
            glowColor="40 80 70"
            backgroundColor="rgba(10, 5, 16, 0.6)"
            borderRadius={16}
            glowRadius={40}
            glowIntensity={1.0}
            colors={['#f59e0b', '#fbbf24', '#d97706']}
            fillOpacity={0.1}
          >
            <div className="p-6 h-full relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-amber-500">
                <Clock size={120} />
              </div>
              <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-2">Pending Approvals</div>
              <div className="text-4xl font-extrabold text-amber-400 font-mono">
                {loading ? <Loader2 size={24} className="animate-spin text-white/40" /> : stats?.totalPending || 0}
              </div>
              <p className="text-[11px] text-white/40 mt-4">Goal sheets awaiting active manager verification</p>
            </div>
          </BorderGlow>
        </div>

        {/* Dynamic Goal Sheet Lock/Unlock Actions Panel */}
        <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings size={20} className="text-[#A855F7]" />
                Goal Sheets Auditing & Actions Center
              </h2>
              <p className="text-xs text-white/40 mt-0.5">
                Audit system objectives sheets, check locking status, and lock/unlock sheets to allow re-edits.
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Find employee or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#A855F7]/50 transition-colors"
              />
            </div>
          </div>

          {sheetsLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={36} className="animate-spin text-[#A855F7] mb-3" />
              <p className="text-white/40 text-sm">Querying active goal sheets ledger...</p>
            </div>
          ) : filteredSheets.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <ShieldCheck className="mx-auto w-12 h-12 text-white/20 mb-3" />
              <h3 className="text-white font-semibold">No Goal Sheets Found</h3>
              <p className="text-white/40 text-xs mt-1">Try refining your search keyword or check server seed data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 font-semibold text-xs tracking-wider uppercase bg-white/5">
                    <th className="py-3.5 px-4 rounded-tl-xl">Employee Details</th>
                    <th className="py-3.5 px-4">Evaluation Path</th>
                    <th className="py-3.5 px-4">Objectives Count</th>
                    <th className="py-3.5 px-4">Locking Status</th>
                    <th className="py-3.5 px-4 text-right rounded-tr-xl">Auditing Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSheets.map((sheet) => (
                    <tr key={sheet.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#A855F7]/10 flex items-center justify-center font-black text-xs text-[#A855F7]">
                          {sheet.employeeName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-semibold text-white text-sm">{sheet.employeeName}</span>
                          <span className="block text-[11px] text-white/40">{sheet.employeeEmail}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white/70 text-xs font-mono">{sheet.createdAt}</td>
                      <td className="py-4 px-4 text-white text-xs font-mono">{sheet.goalsCount} Goals</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${getBadgeStyle(sheet.status)}`}>
                          {sheet.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                        {sheet.status === 'Approved' && (
                          <button
                            onClick={() => handleUnlock(sheet.id)}
                            disabled={unlockingId === sheet.id}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-white rounded-lg transition-all disabled:opacity-40"
                            title="Unlock Goal Sheet"
                          >
                            {unlockingId === sheet.id ? (
                              <span className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin block mx-auto" />
                            ) : (
                              <Unlock size={16} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedSheet(sheet)}
                          className="p-2 bg-[#A855F7]/10 hover:bg-[#A855F7]/25 text-[#A855F7] hover:text-white rounded-lg transition-all"
                          title="View Objectives"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Portal Shortcuts Grid */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-[#A855F7]" />
            Administrative Shortcuts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {navCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div key={idx} className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all shadow-xl hover:shadow-2xl flex flex-col justify-between group relative overflow-hidden">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl bg-gradient-to-tr border ${card.color}`}>
                        <Icon size={24} />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 bg-white/5 px-2.5 py-1 rounded-md">
                        {card.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-6">{card.description}</p>
                  </div>
                  <Link 
                    href={card.path} 
                    className="flex items-center justify-between text-sm text-white/80 hover:text-white bg-white/5 hover:bg-[#A855F7] px-4 py-3 rounded-xl font-medium transition-all group-hover:translate-y-0 translate-y-0"
                  >
                    <span>Open Module Dashboard</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Sleek Goal List Modal Panel */}
      {selectedSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0A0510] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-lg font-bold text-white">Goals: {selectedSheet.employeeName}</h3>
                <p className="text-xs text-white/40 mt-0.5">{selectedSheet.employeeEmail}</p>
              </div>
              <button 
                onClick={() => setSelectedSheet(null)}
                className="p-2 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {selectedSheet.goals.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheck className="mx-auto w-12 h-12 text-white/20 mb-3" />
                  <p className="text-white/50 text-sm">No goals have been created under this sheet yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSheet.goals.map((goal: any, index: number) => (
                    <div 
                      key={goal.id || index}
                      className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="space-y-2 max-w-[70%]">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-[#A855F7]/10 flex items-center justify-center font-bold text-[#A855F7] text-xs font-mono">
                            {index + 1}
                          </span>
                          <h4 className="font-bold text-white text-sm">{goal.title}</h4>
                        </div>
                        <p className="text-xs text-white/40 pl-9 font-mono">Status: {goal.status || 'Draft'}</p>
                      </div>
                      
                      <div className="flex gap-6 sm:text-right pl-9 sm:pl-0">
                        <div>
                          <span className="block text-[10px] text-white/40 font-bold uppercase tracking-wider">Weightage</span>
                          <span className="text-sm font-extrabold text-[#A855F7] font-mono">{goal.weightage}%</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-white/40 font-bold uppercase tracking-wider">Target</span>
                          <span className="text-sm font-extrabold text-white font-mono">{goal.target} <span className="text-xs text-white/40 font-medium font-sans">{goal.uom_type}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
              <button
                onClick={() => setSelectedSheet(null)}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all"
              >
                Close Modal
              </button>
            </div>

          </div>
        </div>
      )}
    </AdminLayout>
  );
}
