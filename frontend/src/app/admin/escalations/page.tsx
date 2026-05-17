"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
// @ts-ignore
import { getAllEscalations, resolveEscalation } from '@/services/escalationService';
// @ts-ignore
import { sendNotification } from '@/services/notificationService';
// @ts-ignore
import { logAudit } from '@/services/auditService';
import { useAuth } from '@/hooks/useAuth';
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Users,
  ArrowUpCircle,
  Check
} from 'lucide-react';

export default function AdminEscalationsPage() {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllEscalations();
      setEscalations(data);
    } catch (err: any) {
      console.error("Failed to load escalations:", err);
      setError("Failed to retrieve escalation records from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  // --- Summary Calculations ---
  const totalCount = escalations.length;
  const resolvedCount = escalations.filter((e: any) => e.resolved).length;
  const pendingCount = totalCount - resolvedCount;

  // --- Resolve Handler ---
  const handleResolve = async (escalation: any) => {
    if (resolvingId) return;
    setResolvingId(escalation.id);
    try {
      await resolveEscalation(escalation.id);

      // Notify the employee
      await sendNotification({
        userId: escalation.employee_id,
        title: 'Escalation Resolved',
        message: 'Your pending escalation has been reviewed and resolved by admin.',
        type: 'success'
      });

      // Log the audit trail
      await logAudit({
        userId: user?.id,
        userRole: 'admin',
        action: 'ESCALATION_RESOLVED',
        tableName: 'escalations',
        recordId: escalation.id,
        description: `Admin resolved escalation for employee`
      });

      // Update local state immediately
      setEscalations((prev: any[]) =>
        prev.map((e: any) => e.id === escalation.id ? { ...e, resolved: true } : e)
      );
    } catch (err: any) {
      console.error("Failed to resolve escalation:", err);
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return { label: 'Manager', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 2: return { label: 'HR', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      default: return { label: `Level ${level}`, color: 'text-white/60 bg-white/5 border-white/10' };
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-[#A855F7] animate-spin mb-4" />
          <p className="text-white/60 font-medium">Loading escalation records...</p>
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
            <h2 className="text-xl font-bold text-white">Escalation Pipeline Error</h2>
          </div>
          <p className="text-sm text-white/70 mb-4">{error}</p>
          <button
            onClick={fetchEscalations}
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
            <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30 shadow-lg shadow-rose-500/5">
              <ShieldAlert size={28} className="text-rose-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Escalation Management</h1>
              <p className="text-white/50 mt-1 text-sm">
                Track, review, and resolve employee escalations across the organization.
              </p>
            </div>
          </div>

          <button
            onClick={fetchEscalations}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <RefreshCcw size={12} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Total Escalations */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Total Escalations</span>
              <p className="text-3xl font-black text-white font-mono">{totalCount}</p>
              <p className="text-[10px] text-white/30 font-semibold leading-none">All time records</p>
            </div>
            <div className="p-3 bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-xl text-[#A855F7]">
              <ArrowUpCircle size={20} />
            </div>
          </div>

          {/* Resolved */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Resolved</span>
              <p className="text-3xl font-black text-emerald-400 font-mono">{resolvedCount}</p>
              <p className="text-[10px] text-emerald-400/60 font-semibold leading-none">Successfully addressed</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
          </div>

          {/* Pending */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Pending</span>
              <p className="text-3xl font-black text-amber-400 font-mono">{pendingCount}</p>
              <p className="text-[10px] text-amber-400/60 font-semibold leading-none">Awaiting resolution</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Clock size={20} />
            </div>
          </div>
        </div>

        {/* Escalation Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-400" />
              Escalation Records
            </h2>
            <span className="text-xs text-white/40 font-semibold font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded">
              Total: {totalCount}
            </span>
          </div>

          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            {escalations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-white/20">
                  <CheckCircle2 size={28} />
                </div>
                <h4 className="text-white font-semibold text-sm">No Escalations Found</h4>
                <p className="text-white/40 text-xs mt-1">There are no escalation records in the system.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-5 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider">Employee</th>
                      <th className="px-5 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider">Manager</th>
                      <th className="px-5 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider max-w-[250px]">Issue</th>
                      <th className="px-5 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider text-center">Level</th>
                      <th className="px-5 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider text-center">Status</th>
                      <th className="px-5 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider">Created</th>
                      <th className="px-5 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {escalations.map((esc: any) => {
                      const level = getLevelLabel(esc.escalation_level);
                      const isResolving = resolvingId === esc.id;

                      return (
                        <tr key={esc.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Employee Name */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#B497CF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {esc.employee?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-white font-semibold text-xs">{esc.employee?.name || 'Unknown'}</p>
                                <p className="text-white/30 text-[10px]">{esc.employee?.email || ''}</p>
                              </div>
                            </div>
                          </td>

                          {/* Manager Name */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {esc.manager?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-white font-semibold text-xs">{esc.manager?.name || 'Unknown'}</p>
                                <p className="text-white/30 text-[10px]">{esc.manager?.email || ''}</p>
                              </div>
                            </div>
                          </td>

                          {/* Issue */}
                          <td className="px-5 py-4 max-w-[250px]">
                            <p className="text-white/70 text-xs leading-relaxed truncate" title={esc.issue}>
                              {esc.issue}
                            </p>
                          </td>

                          {/* Level */}
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${level.color}`}>
                              <ArrowUpCircle size={10} />
                              {level.label}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4 text-center">
                            {esc.resolved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                <CheckCircle2 size={10} />
                                Resolved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border bg-amber-500/10 text-amber-400 border-amber-500/20">
                                <Clock size={10} />
                                Pending
                              </span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-5 py-4">
                            <p className="text-white/50 text-xs font-mono">{formatDate(esc.created_at)}</p>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-center">
                            {esc.resolved ? (
                              <span className="text-white/20 text-[10px] font-semibold italic">Closed</span>
                            ) : (
                              <button
                                onClick={() => handleResolve(esc)}
                                disabled={isResolving}
                                className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isResolving ? (
                                  <>
                                    <Loader2 size={11} className="animate-spin" />
                                    Resolving...
                                  </>
                                ) : (
                                  <>
                                    <Check size={11} />
                                    Resolve
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
