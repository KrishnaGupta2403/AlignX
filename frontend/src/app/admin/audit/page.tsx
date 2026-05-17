"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
// @ts-ignore
import AuditLogTable from '@/components/tables/AuditLogTable';
import { getAuditLogs } from '@/services/auditService';
import { 
  ShieldCheck, 
  Activity, 
  Calendar, 
  UserCheck, 
  Terminal, 
  Loader2, 
  AlertCircle,
  RefreshCcw
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err: any) {
      console.error("Failed to load audit logs:", err);
      setError("Failed to retrieve audit trails from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // --- Statistics Calculations ---
  
  // 1. Total actions logged today
  const getTodayCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return logs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= today;
    }).length;
  };

  // 2. Total actions this week (last 7 days)
  const getWeekCount = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return logs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= oneWeekAgo;
    }).length;
  };

  // 3. Most Active User
  const getMostActiveUser = () => {
    const userCounts: { [key: string]: number } = {};
    logs.forEach(log => {
      if (log.user) {
        const name = log.user.name || log.user.email || 'System';
        userCounts[name] = (userCounts[name] || 0) + 1;
      }
    });

    let mostActive = 'N/A';
    let max = 0;
    Object.keys(userCounts).forEach(user => {
      if (userCounts[user] > max) {
        max = userCounts[user];
        mostActive = user;
      }
    });
    return max > 0 ? { name: mostActive, count: max } : null;
  };

  // 4. Most Common Action
  const getMostCommonAction = () => {
    const actionCounts: { [key: string]: number } = {};
    logs.forEach(log => {
      if (log.action) {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      }
    });

    let mostCommon = 'N/A';
    let max = 0;
    Object.keys(actionCounts).forEach(act => {
      if (actionCounts[act] > max) {
        max = actionCounts[act];
        mostCommon = act;
      }
    });
    return max > 0 ? { action: mostCommon, count: max } : null;
  };

  const todayCount = getTodayCount();
  const weekCount = getWeekCount();
  const activeUser = getMostActiveUser();
  const commonAction = getMostCommonAction();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-[#A855F7] animate-spin mb-4" />
          <p className="text-white/60 font-medium">Assembling system audit trails...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl max-w-xl mx-auto mt-10">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle size={24} className="text-red-500" />
            <h2 className="text-xl font-bold text-white">Auditing Pipeline Broken</h2>
          </div>
          <p className="text-sm text-white/70 mb-4">{error}</p>
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2 bg-[#A855F7] hover:bg-[#8a3fd6] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCcw size={12} />
            Try Reconnecting
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 relative z-10">
        {/* Header Panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#A855F7]/20 rounded-xl border border-[#A855F7]/30 shadow-lg shadow-[#A855F7]/5">
              <ShieldCheck size={28} className="text-[#A855F7]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Audit Trail & Governance</h1>
              <p className="text-white/50 mt-1 text-sm">
                System-wide security logs, transaction logs, and administrative modifications tracking.
              </p>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <RefreshCcw size={12} />
            Refresh Logs
          </button>
        </div>

        {/* Governance Metrics Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Logged Today */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Actions Today</span>
              <p className="text-3xl font-black text-white font-mono">{todayCount}</p>
              <p className="text-[10px] text-emerald-400 font-semibold leading-none">Live tracking active</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Activity size={20} />
            </div>
          </div>

          {/* Card 2: Logged This Week */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Logged This Week</span>
              <p className="text-3xl font-black text-white font-mono">{weekCount}</p>
              <p className="text-[10px] text-white/30 font-semibold leading-none">Rolling 7-day total</p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Calendar size={20} />
            </div>
          </div>

          {/* Card 3: Most Active User */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="space-y-1 truncate max-w-[70%]">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Most Active User</span>
              <p className="text-lg font-black text-white truncate font-sans">
                {activeUser ? activeUser.name : 'N/A'}
              </p>
              <p className="text-[10px] text-purple-400 font-bold font-mono">
                {activeUser ? `${activeUser.count} logged actions` : 'No logs recorded'}
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <UserCheck size={20} />
            </div>
          </div>

          {/* Card 4: Most Common Action */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="space-y-1 truncate max-w-[70%]">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Top Action Type</span>
              <p className="text-sm font-black text-white truncate font-mono uppercase tracking-tight">
                {commonAction ? commonAction.action : 'N/A'}
              </p>
              <p className="text-[10px] text-amber-400 font-bold font-mono">
                {commonAction ? `${commonAction.count} executions` : 'No operations'}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Terminal size={20} />
            </div>
          </div>
        </div>

        {/* Audit Log Table Component */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal size={18} className="text-[#A855F7]" />
              Historical Transaction Ledger
            </h2>
            <span className="text-xs text-white/40 font-semibold font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded">
              Total Logged: {logs.length}
            </span>
          </div>
          {/* @ts-ignore */}
          <AuditLogTable logs={logs} />
        </div>
      </div>
    </AdminLayout>
  );
}
