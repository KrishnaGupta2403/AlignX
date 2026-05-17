"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
// @ts-ignore
import { getAllCycles, activateCycle, getActiveCycle, getAllEmployees, createCycle } from '@/services/cycleService';
// @ts-ignore
import { logAudit } from '@/services/auditService';
// @ts-ignore
import { sendNotification } from '@/services/notificationService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  PlusCircle,
  Activity,
  Clock,
  FileText,
  Percent
} from 'lucide-react';

export default function AdminCycleManagementPage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [cycleToActivate, setCycleToActivate] = useState<any>(null);

  // Cycle Summary Statistics State
  const [activeCycleStats, setActiveCycleStats] = useState({
    daysRemaining: 0,
    totalSheets: 0,
    completionRate: 0
  });

  // Create Cycle Form State
  const [formName, setFormName] = useState('');
  const [formPhase, setFormPhase] = useState('Goal');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchCyclesAndActive = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allCycles, currentActive] = await Promise.all([
        getAllCycles(),
        getActiveCycle().catch(() => null) // Allow error if no active cycle is set yet
      ]);
      
      setCycles(allCycles);
      setActiveCycle(currentActive);

      if (currentActive) {
        // Calculate days remaining
        const endDateStr = currentActive.end_date;
        let daysRem = 0;
        if (endDateStr) {
          const endDate = new Date(endDateStr);
          const today = new Date();
          endDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          const diffTime = endDate.getTime() - today.getTime();
          daysRem = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          daysRem = daysRem > 0 ? daysRem : 0;
        }

        // Fetch goal sheets associated with this cycle to compute total counts & completion rate
        const { data: sheetsData, error: sheetsError } = await supabase
          .from('goal_sheets')
          .select('id, status')
          .eq('cycle_id', currentActive.id);

        if (!sheetsError && sheetsData) {
          const approved = sheetsData.filter((s: any) => s.status === 'Approved').length;
          const rate = sheetsData.length > 0 ? Math.round((approved / sheetsData.length) * 100) : 0;
          setActiveCycleStats({
            daysRemaining: daysRem,
            totalSheets: sheetsData.length,
            completionRate: rate
          });
        } else {
          setActiveCycleStats({
            daysRemaining: daysRem,
            totalSheets: 0,
            completionRate: 0
          });
        }
      } else {
        setActiveCycleStats({
          daysRemaining: 0,
          totalSheets: 0,
          completionRate: 0
        });
      }
    } catch (err: any) {
      console.error("Failed to load cycles:", err);
      setError("Failed to retrieve performance cycles from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCyclesAndActive();
  }, []);

  const handleCreateCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formName.trim()) {
      setFormError("Cycle name is required.");
      return;
    }

    if (new Date(formStartDate) >= new Date(formEndDate)) {
      setFormError("Start Date must be strictly before End Date.");
      return;
    }

    setCreating(true);
    try {
      const newCycle = await createCycle({
        name: formName.trim(),
        phase: formPhase,
        start_date: formStartDate,
        end_date: formEndDate,
        active: false // Created as inactive by default
      });

      // Log the audit trail
      await logAudit({
        userId: user?.id,
        userRole: 'admin',
        action: 'CYCLE_CREATED',
        tableName: 'cycles',
        recordId: newCycle.id,
        description: `Admin registered new performance cycle: ${newCycle.name} (${newCycle.phase})`
      });

      setFormSuccess("Cycle registered successfully!");
      setFormName('');
      setFormPhase('Goal');
      setFormStartDate('');
      setFormEndDate('');

      // Refresh cycles list
      const allCycles = await getAllCycles();
      setCycles(allCycles);
    } catch (err: any) {
      console.error("Failed to create cycle:", err);
      setFormError("Failed to register cycle. Check input parameters.");
    } finally {
      setCreating(false);
    }
  };

  const handleActivateClick = (cycle: any) => {
    setCycleToActivate(cycle);
  };

  const confirmActivate = async () => {
    if (!cycleToActivate || activatingId) return;
    const targetCycle = cycleToActivate;
    setCycleToActivate(null);
    setActivatingId(targetCycle.id);
    try {
      // Call service to deactivate others and activate this one
      await activateCycle(targetCycle.id);

      // Log the audit trail
      await logAudit({
        userId: user?.id,
        userRole: 'admin',
        action: 'CYCLE_ACTIVATED',
        tableName: 'cycles',
        recordId: targetCycle.id,
        description: `Admin transitioned active performance cycle to phase: ${targetCycle.phase}`
      });

      // Get all employees and notify them
      try {
        const employees = await getAllEmployees();
        await Promise.all(
          employees.map((employee: any) =>
            sendNotification({
              userId: employee.id,
              title: 'New Quarter Started',
              message: `${targetCycle.phase} has now started. Please update your achievements.`,
              type: 'info',
              link: '/employee/checkin' as any
            }).catch((err: any) => console.error("Failed to notify user:", employee.id, err))
          )
        );
      } catch (notifyErr) {
        console.error("Failed to send employee notifications:", notifyErr);
      }

      // Refetch clean state
      const [allCycles, currentActive] = await Promise.all([
        getAllCycles(),
        getActiveCycle()
      ]);
      
      setCycles(allCycles);
      setActiveCycle(currentActive);
    } catch (err: any) {
      console.error("Failed to activate cycle:", err);
    } finally {
      setActivatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-[#A855F7] animate-spin mb-4" />
          <p className="text-white/60 font-medium">Assembling cycle timelines...</p>
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
            <h2 className="text-xl font-bold text-white">Timeline Pipeline Error</h2>
          </div>
          <p className="text-sm text-white/70 mb-4">{error}</p>
          <button
            onClick={fetchCyclesAndActive}
            className="flex items-center gap-2 bg-[#A855F7] hover:bg-[#8a3fd6] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw size={12} />
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
              <RefreshCw size={28} className="text-[#A855F7] animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Cycle Phase Management</h1>
              <p className="text-white/50 mt-1 text-sm">
                Control the active phase of the evaluation cycle across the organization.
              </p>
            </div>
          </div>

          <button
            onClick={fetchCyclesAndActive}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <RefreshCw size={12} />
            Sync Timeline
          </button>
        </div>

        {/* Current Active Cycle Callout Panel */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#170E28] to-[#0A0510] border border-white/15 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#A855F7]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-3 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              <Zap size={10} className="fill-emerald-400" />
              Live & Active Period
            </span>
            {activeCycle ? (
              <>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {activeCycle.name}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                  <span className="font-semibold text-white/80">Phase:</span>
                  <span className="bg-[#A855F7]/20 border border-[#A855F7]/30 text-white font-bold text-xs px-3 py-1 rounded-lg">
                    {activeCycle.phase}
                  </span>
                  <span className="h-4 w-px bg-white/10 hidden sm:block" />
                  <span className="flex items-center gap-1.5 font-mono text-xs">
                    <Calendar size={14} className="text-white/40" />
                    {formatDate(activeCycle.start_date)}
                  </span>
                  <ArrowRight size={14} className="text-white/30" />
                  <span className="flex items-center gap-1.5 font-mono text-xs">
                    <Calendar size={14} className="text-white/40" />
                    {formatDate(activeCycle.end_date)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <AlertCircle size={18} />
                No active performance review cycle currently configured.
              </div>
            )}
          </div>

          {activeCycle && (
            <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-white font-bold text-xs uppercase tracking-wider">Active System Constraints</p>
                <p className="text-white/40 text-[11px] mt-0.5">
                  {activeCycle.phase === 'Goal' 
                    ? 'Goal setting enabled; quarterly check-ins read-only.'
                    : `Goal setting locked; ${activeCycle.phase} check-ins enabled.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Phase Timeline Visual */}
        <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Evaluation Phase Timeline</h3>
              <p className="text-[10px] text-white/40 mt-0.5">Track the progression of the active cycle evaluation lifecycle.</p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider font-mono">
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                ✅ Done
              </span>
              <span className="flex items-center gap-1 text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">
                🟢 Active
              </span>
              <span className="flex items-center gap-1 text-white/30 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                ⬜ Upcoming
              </span>
            </div>
          </div>

          <div className="relative pt-4 pb-2 px-4 sm:px-12">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/10 -translate-y-[10px] rounded-full" />

            <div className="relative flex justify-between items-center z-10">
              {['Goal', 'Q1', 'Q2', 'Q3', 'Q4'].map((phaseCode, idx) => {
                const phaseLabels: any = {
                  'Goal': 'Goal Setting',
                  'Q1': 'Q1 Check-in',
                  'Q2': 'Q2 Check-in',
                  'Q3': 'Q3 Check-in',
                  'Q4': 'Q4 Check-in'
                };
                const order = ['Goal', 'Q1', 'Q2', 'Q3', 'Q4'];
                const activeIndex = activeCycle ? order.indexOf(activeCycle.phase) : -1;
                
                let state = 'upcoming'; // done, active, upcoming
                if (activeCycle) {
                  if (idx < activeIndex) state = 'done';
                  else if (idx === activeIndex) state = 'active';
                }

                return (
                  <div key={phaseCode} className="flex flex-col items-center space-y-2 relative">
                    {/* Circle Node */}
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      state === 'done'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10'
                        : state === 'active'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/25 scale-110'
                        : 'bg-[#0A0510] border-white/20 text-white/30'
                    }`}>
                      {state === 'done' ? (
                        <span className="text-[10px] font-bold">✓</span>
                      ) : state === 'active' ? (
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      ) : (
                        <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                      )}
                    </div>

                    {/* Labels */}
                    <div className="text-center">
                      <p className={`text-[10px] font-bold tracking-wider ${
                        state === 'done' ? 'text-emerald-400' : state === 'active' ? 'text-purple-400' : 'text-white/30'
                      }`}>
                        {phaseCode}
                      </p>
                      <p className={`text-[9px] hidden sm:block mt-0.5 ${
                        state === 'done' ? 'text-white/60 font-semibold' : state === 'active' ? 'text-white font-bold' : 'text-white/20'
                      }`}>
                        {phaseLabels[phaseCode]}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cycle Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Active Phase */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Active Phase</p>
                <h3 className="text-2xl font-black text-white mt-3 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  {activeCycle ? activeCycle.phase : 'None'}
                </h3>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/25 text-purple-400 p-2.5 rounded-xl">
                <Activity size={20} className="animate-pulse" />
              </div>
            </div>
            <p className="text-[11px] text-white/40 mt-4">Current stage of system evaluations</p>
          </div>

          {/* Card 2: Days Remaining */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Days Remaining</p>
                <h3 className="text-4xl font-extrabold text-white mt-2 font-mono">
                  {activeCycleStats.daysRemaining}
                </h3>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/25 text-amber-400 p-2.5 rounded-xl">
                <Clock size={20} />
              </div>
            </div>
            <p className="text-[11px] text-white/40 mt-4">Time left in the active phase</p>
          </div>

          {/* Card 3: Total Goal Sheets */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Total Goal Sheets</p>
                <h3 className="text-4xl font-extrabold text-white mt-2 font-mono">
                  {activeCycleStats.totalSheets}
                </h3>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 p-2.5 rounded-xl">
                <FileText size={20} />
              </div>
            </div>
            <p className="text-[11px] text-white/40 mt-4">Created sheets linked to this cycle</p>
          </div>

          {/* Card 4: Completion Rate */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Completion Rate</p>
                <h3 className="text-4xl font-extrabold text-emerald-400 mt-2 font-mono">
                  {activeCycleStats.completionRate}%
                </h3>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-2.5 rounded-xl">
                <Percent size={20} />
              </div>
            </div>
            <p className="text-[11px] text-white/40 mt-4">Percentage of sheets fully approved</p>
          </div>
        </div>

        {/* Cycles Grid: Form on the Left (1/3), Table on the Right (2/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Create New Cycle Form Panel */}
          <div className="lg:col-span-1 bg-[#0A0510]/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A855F7] to-[#8B5CF6]" />
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle size={18} className="text-[#A855F7]" />
                Register New Cycle
              </h3>
              <p className="text-white/40 text-[11px] mt-1">Configure a new performance milestone period.</p>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateCycleSubmit} className="space-y-4">
              {/* Cycle Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Cycle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FY 2026-27"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#0A0510] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 focus:border-[#A855F7] focus:outline-none transition-all"
                />
              </div>

              {/* Phase */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Evaluation Phase</label>
                <select
                  value={formPhase}
                  onChange={(e) => setFormPhase(e.target.value)}
                  className="w-full bg-[#0A0510] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#A855F7] focus:outline-none transition-all"
                >
                  <option value="Goal">Goal Setting</option>
                  <option value="Q1">Q1 Check-in</option>
                  <option value="Q2">Q2 Check-in</option>
                  <option value="Q3">Q3 Check-in</option>
                  <option value="Q4">Q4 Check-in</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  required
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full bg-[#0A0510] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#A855F7] focus:outline-none transition-all font-mono"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  required
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full bg-[#0A0510] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#A855F7] focus:outline-none transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] hover:from-[#9333EA] hover:to-[#7C3AED] text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-[#A855F7]/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <PlusCircle size={14} />
                    Create Cycle
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Cycles Table Panel */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar size={18} className="text-[#A855F7]" />
                Cycle Records & Phase Transitions
              </h2>
              <span className="text-xs text-white/40 font-semibold font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded">
                Total Cycles: {cycles.length}
              </span>
            </div>

            <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              {cycles.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-white/20">
                    <Calendar size={28} />
                  </div>
                  <h4 className="text-white font-semibold text-sm">No Cycle Timelines Found</h4>
                  <p className="text-white/40 text-xs mt-1">Setup initial system cycles in your database seeds.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="px-6 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider">Cycle Name</th>
                        <th className="px-6 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider text-center">Phase</th>
                        <th className="px-6 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] text-white/40 font-bold uppercase tracking-wider text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {cycles.map((cycle: any) => {
                        const isActive = cycle.active;
                        const isActivating = activatingId === cycle.id;

                        return (
                          <tr key={cycle.id} className={`hover:bg-white/[0.02] transition-colors ${isActive ? 'bg-white/[0.01]' : ''}`}>
                            {/* Cycle Name */}
                            <td className="px-6 py-4">
                              <span className="text-white font-bold text-xs">{cycle.name}</span>
                            </td>

                            {/* Phase */}
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-1 bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] rounded-lg text-[10px] font-bold uppercase">
                                {cycle.phase}
                              </span>
                            </td>

                            {/* Start Date */}
                            <td className="px-6 py-4">
                              <span className="text-white/60 text-xs font-mono">{formatDate(cycle.start_date)}</span>
                            </td>

                            {/* End Date */}
                            <td className="px-6 py-4">
                              <span className="text-white/60 text-xs font-mono">{formatDate(cycle.end_date)}</span>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 text-center">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/40 font-bold uppercase tracking-wider">
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-center">
                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                                  <ShieldCheck size={14} />
                                  Active Phase
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleActivateClick(cycle)}
                                  disabled={isActivating}
                                  className="inline-flex items-center gap-1.5 bg-[#A855F7]/10 hover:bg-[#A855F7]/20 border border-[#A855F7]/20 text-[#A855F7] hover:text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isActivating ? (
                                    <>
                                      <Loader2 size={11} className="animate-spin" />
                                      Activating...
                                    </>
                                  ) : (
                                    <>
                                      <Play size={11} className="fill-current" />
                                      Activate Phase
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

      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!cycleToActivate}
        title="Activate Phase"
        message="Are you sure? This will deactivate the current phase."
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmActivate}
        onCancel={() => setCycleToActivate(null)}
      />
    </AdminLayout>
  );
}
