"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Building2, 
  Loader2, 
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import {
  getAdminOverviewStats,
  getAdminDepartmentCompletion,
  getAdminManagerPerformance,
  getAdminSystemQoQTrends
} from '@/services/analyticsService';

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States
  const [overview, setOverview] = useState<any>(null);
  const [deptRates, setDeptRates] = useState<any[]>([]);
  const [managerPerf, setManagerPerf] = useState<any[]>([]);
  const [qoqTrends, setQoqTrends] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [overviewData, deptData, managerData, qoqData] = await Promise.all([
          getAdminOverviewStats(),
          getAdminDepartmentCompletion(),
          getAdminManagerPerformance(),
          getAdminSystemQoQTrends()
        ]);

        setOverview(overviewData);
        setDeptRates(deptData);
        setManagerPerf(managerData);
        setQoqTrends(qoqData);
      } catch (err: any) {
        console.error("Failed to load admin analytics:", err);
        setError("Error loading system-wide analytics data. Please make sure the database tables are properly seeded.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-[#A855F7] animate-spin mb-4" />
          <p className="text-white/60 font-medium">Assembling system analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-2">Analytics Loading Failed</h2>
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#A855F7]/20 rounded-xl">
            <BarChart3 size={28} className="text-[#A855F7]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-sans">System-Wide Analytics</h1>
            <p className="text-white/50 mt-1 font-sans text-sm">
              Real-time performance metrics and submission compliance across all departments.
            </p>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Users */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users size={120} />
            </div>
            <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-2">Total Users</div>
            <div className="text-4xl font-extrabold text-white font-mono">{overview?.totalUsers || 0}</div>
            <p className="text-[11px] text-white/40 mt-4">Total active accounts registered in the database</p>
          </div>

          {/* Card 2: System-wide Completion Rate */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
              <Target size={120} />
            </div>
            <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-2">System-wide Completion Rate</div>
            <div className="text-4xl font-extrabold text-emerald-400 font-mono">{overview?.completionRate || 0}%</div>
            <div className="mt-3">
              <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                  style={{ width: `${overview?.completionRate || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Pending Approvals */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-amber-500/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-amber-500">
              <Clock size={120} />
            </div>
            <div className="text-amber-400/80 text-xs font-semibold tracking-wider uppercase mb-2">Pending Approvals</div>
            <div className="text-4xl font-extrabold text-amber-400 font-mono">{overview?.totalPending || 0}</div>
            <p className="text-[11px] text-white/40 mt-4">Goal sheets awaiting manager review and sign-off</p>
          </div>
        </div>

        {/* Overall System Stats Banner */}
        <div className="bg-[#0A0510]/40 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-xl">
          <h2 className="text-xs font-bold text-white mb-6 uppercase tracking-wider text-white/50">Goal Sheet Lifecycle Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border-r border-white/5 pr-4">
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Total Employees</span>
              <div className="text-3xl font-extrabold text-white mt-1 font-mono">{overview?.totalEmployees || 0}</div>
            </div>
            <div className="border-r border-white/5 pr-4 pl-0 md:pl-4">
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Submitted Goal Sheets</span>
              <div className="text-3xl font-extrabold text-[#A855F7] mt-1 font-mono">{overview?.totalSubmitted || 0}</div>
            </div>
            <div className="border-r border-white/5 pr-4 pl-0 md:pl-4">
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Approved Goal Sheets</span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">{overview?.totalApproved || 0}</div>
            </div>
            <div className="pl-0 md:pl-4">
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Pending Review</span>
              <div className="text-3xl font-extrabold text-amber-400 mt-1 font-mono">{overview?.totalPending || 0}</div>
            </div>
          </div>
        </div>

        {/* Charts & Leaderboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Department Completion Rates (Vertical Bar Chart) */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Building2 size={20} className="text-[#A855F7]" />
                Department Completion Rates
              </h3>
              <p className="text-white/40 text-xs mb-6">Percentage of employees with approved goal sheets per business unit.</p>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptRates} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="department" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#120F17', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#A855F7' }}
                  />
                  <Bar dataKey="rate" radius={[8, 8, 0, 0]} fill="url(#purplePinkGradient)">
                    <defs>
                      <linearGradient id="purplePinkGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A855F7" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#EC4899" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System-wide QoQ Trend Chart */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#A855F7]" />
                System-Wide QoQ Performance Trend
              </h3>
              <p className="text-white/40 text-xs mb-6">Aggregate evaluation progress average across Q1-Q4 cycles.</p>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qoqTrends} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="quarter" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#120F17', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#3B82F6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averageProgress" 
                    name="Average Progress"
                    stroke="#A855F7" 
                    strokeWidth={3} 
                    dot={{ fill: '#A855F7', r: 5 }} 
                    activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Manager-wise team performance comparison */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl xl:col-span-2">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Award size={20} className="text-[#A855F7]" />
                Manager Leadership Board
              </h3>
              <p className="text-white/40 text-xs mb-6">Compare average goal operational progress and team sizes across organization groups.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-white/50 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Manager</th>
                    <th className="py-3 px-4 font-semibold">Team Size</th>
                    <th className="py-3 px-4 font-semibold">Operational Progress Score</th>
                    <th className="py-3 px-4 font-semibold text-right">Performance Standing</th>
                  </tr>
                </thead>
                <tbody>
                  {managerPerf.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-white/30 text-sm">
                        No team performance records available. Ensure managers have assigned employees.
                      </td>
                    </tr>
                  ) : (
                    managerPerf.map((manager, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#A855F7]/10 flex items-center justify-center font-bold text-xs text-[#A855F7]">
                            {manager.managerName.substring(0, 2).toUpperCase()}
                          </div>
                          {manager.managerName}
                        </td>
                        <td className="py-4 px-4 text-white/80 font-mono text-sm">
                          {manager.teamSize} {manager.teamSize === 1 ? 'Employee' : 'Employees'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold w-10 text-white">{manager.avgProgress}%</span>
                            <div className="w-48 bg-white/10 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  manager.avgProgress >= 71 
                                    ? 'bg-emerald-400' 
                                    : manager.avgProgress >= 41 
                                    ? 'bg-amber-400' 
                                    : 'bg-rose-400'
                                }`} 
                                style={{ width: `${manager.avgProgress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                            manager.avgProgress >= 71 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : manager.avgProgress >= 41 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {manager.avgProgress >= 71 ? 'Exceptional' : manager.avgProgress >= 41 ? 'On Target' : 'Below Target'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
