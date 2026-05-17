"use client";

import React, { useState, useEffect, useCallback } from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useAuth } from '@/hooks/useAuth';
import { useGoals } from '@/hooks/useGoals';
import { supabase } from '@/lib/supabase';
import BorderGlow from '@/components/backgrounds/BorderGlow';
import { calculateProgress } from '@/services/progressService';
import { generateCSV, generateExcel, logReport } from '@/services/reportService';
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  FileText, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  XCircle, 
  AlertCircle, 
  Target, 
  Star,
  MessageSquare,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function EmployeeReportsPage() {
  const { user } = useAuth();
  const { goalSheet, goals, loading: goalsLoading, error: goalsError } = useGoals(user?.id);

  // States
  const [selectedQuarter, setSelectedQuarter] = useState('Q1');
  const [activeTab, setActiveTab] = useState('achievements');
  const [achievements, setAchievements] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Fetch achievements & checkins when goalSheet changes
  useEffect(() => {
    if (!goalSheet?.id) return;

    let isMounted = true;
    const fetchExtraData = async () => {
      setLoadingExtra(true);
      try {
        // Fetch achievements for all quarters to populate trend charts
        const { data: achData, error: achError } = await supabase
          .from('achievements')
          .select('id, goal_id, quarter, actual, planned, employee_comments')
          .eq('goal_sheet_id', goalSheet.id);

        if (achError) throw achError;

        // Fetch all checkins/reviews for ratings and feedback log
        const { data: chkData, error: chkError } = await supabase
          .from('checkins')
          .select('id, quarter, rating, comments, status, created_at')
          .eq('goal_sheet_id', goalSheet.id)
          .order('created_at', { ascending: false });

        if (chkError) throw chkError;

        if (isMounted) {
          setAchievements(achData || []);
          setCheckins(chkData || []);
        }
      } catch (err) {
        console.error('Error fetching employee report data:', err);
      } finally {
        if (isMounted) setLoadingExtra(false);
      }
    };

    fetchExtraData();
    return () => {
      isMounted = false;
    };
  }, [goalSheet]);

  // Compute stats based on goals & achievements of selected quarter
  const activeQuarterAchievements = achievements.filter((a: any) => a.quarter === selectedQuarter);
  
  // Create rich mapped goals list for the selected quarter
  const mappedGoals = goals.map((goal: any) => {
    const ach = activeQuarterAchievements.find((a: any) => a.goal_id === goal.id);
    const actual = ach ? ach.actual : 0;
    const planned = ach ? ach.planned : 0;
    const progress = Math.min(Math.round(calculateProgress(goal.uom_type, goal.target, actual)) || 0, 100);

    return {
      ...goal,
      actual,
      planned,
      progress
    };
  });

  // Calculate weighted average progress
  let totalWeightedScore = 0;
  let totalWeightage = 0;
  let completedCount = 0;

  mappedGoals.forEach((g: any) => {
    const weight = Number(g.weightage) || 0;
    totalWeightedScore += (g.progress * weight) / 100;
    totalWeightage += weight;
    if (g.progress >= 100) {
      completedCount++;
    }
  });

  const averageProgress = totalWeightage > 0 ? Math.round((totalWeightedScore / totalWeightage) * 100) : 0;

  // Compile QoQ trend data for line charts
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const trendData = quarters.map((q: string) => {
    const qAchs = achievements.filter((a: any) => a.quarter === q);
    let qWeightedSum = 0;
    let qWeightSum = 0;

    goals.forEach((goal: any) => {
      const ach = qAchs.find((a: any) => a.goal_id === goal.id);
      const actual = ach ? ach.actual : 0;
      const progress = Math.min(Math.round(calculateProgress(goal.uom_type, goal.target, actual)) || 0, 100);
      const weight = Number(goal.weightage) || 0;

      qWeightedSum += (progress * weight) / 100;
      qWeightSum += weight;
    });

    return {
      quarter: q,
      "My Progress": qWeightSum > 0 ? Math.round((qWeightedSum / qWeightSum) * 100) : 0
    };
  });

  // Get status style helper
  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'Submitted': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'Draft': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'Rejected': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      default: return 'bg-white/5 border-white/10 text-white/60';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'Submitted': return <Clock size={16} className="text-amber-400" />;
      case 'Draft': return <Edit3 size={16} className="text-blue-400" />;
      case 'Rejected': return <XCircle size={16} className="text-rose-400" />;
      default: return <AlertCircle size={16} className="text-white/40" />;
    }
  };

  // Export functions
  const handleExport = async (format: string) => {
    if (!goals.length) return;

    const exportData = mappedGoals.map((g: any) => ({
      "Goal Title": g.title,
      "Description": g.description,
      "UOM Type": g.uom_type,
      "Quarter": selectedQuarter,
      "Goal Weightage": `${g.weightage}%`,
      "Target Value": g.target,
      "Planned Achievement": g.planned,
      "Actual Achievement": g.actual,
      "Progress Rate": `${g.progress}%`,
      "Status": g.status
    }));

    const filename = `my_performance_report_${selectedQuarter}_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      generateCSV(exportData, filename);
    } else {
      generateExcel(exportData, filename);
    }

    if (user?.id) {
      try {
        await logReport('employee_achievement', user.id, { quarter: selectedQuarter, format });
      } catch (err) {
        console.error('Failed to log employee report export audit:', err);
      }
    }
  };

  const currentCheckin = checkins.find((c: any) => c.quarter === selectedQuarter);

  // Custom tool tip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#18181B]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
            {label}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2 font-medium text-white/80">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: entry.color || entry.stroke }} />
                  {entry.name}
                </span>
                <span className="font-bold font-mono text-white">
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const isLoading = goalsLoading || loadingExtra;

  return (
    <div className="space-y-8 relative z-10">
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="text-[#A855F7]" size={36} />
            My Performance Reports
          </h1>
          <p className="text-white/50 text-[15px] mt-1">
            Personalized real-time analytics, quarter-over-quarter progress, and cycle compliance metrics.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quarter Dropdown Filter */}
          <div className="flex items-center gap-2 bg-[#0A0510]/60 border border-white/10 rounded-xl px-3 py-2">
            <Calendar size={16} className="text-white/40" />
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="bg-transparent text-white border-none outline-none text-sm font-medium cursor-pointer"
            >
              <option value="Q1" className="bg-[#0A0510] text-white">Quarter 1 (Q1)</option>
              <option value="Q2" className="bg-[#0A0510] text-white">Quarter 2 (Q2)</option>
              <option value="Q3" className="bg-[#0A0510] text-white">Quarter 3 (Q3)</option>
              <option value="Q4" className="bg-[#0A0510] text-white">Quarter 4 (Q4)</option>
            </select>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={isLoading || !goals.length}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={16} className="text-white/60" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={isLoading || !goals.length}
              className="flex items-center gap-2 bg-gradient-to-r from-[#A855F7] to-[#B497CF] hover:from-[#b56ef8] hover:to-[#c3abd8] text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#0A0510]/40 backdrop-blur-md border border-white/5 rounded-2xl">
          <Loader2 className="w-12 h-12 text-[#A855F7] animate-spin mb-4" />
          <p className="text-white/50 text-[18px] font-medium">Assembling your personal compliance portfolio...</p>
        </div>
      ) : goalsError ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{goalsError}</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0A0510]/40 backdrop-blur-md border border-white/5 rounded-2xl text-center px-4">
          <Target size={48} className="text-white/20 mb-4 animate-pulse" />
          <h3 className="text-white font-semibold text-[20px]">No goals defined yet</h3>
          <p className="text-white/40 mt-1 max-w-sm text-[15px]">
            Please draft and submit your goals in the 'My Goals' section first to initiate active reporting.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tab 1: Achievements & Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Weighted Average Progress */}
            <BorderGlow glowIntensity={1.8} coneSpread={4} borderRadius={16}>
              <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute right-4 bottom-4 opacity-5 text-[#A855F7]">
                  <Activity size={80} />
                </div>
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Weighted Progress ({selectedQuarter})</div>
                <div className="text-4xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1">
                  <span className={averageProgress >= 80 ? 'text-emerald-400' : averageProgress >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                    {averageProgress}%
                  </span>
                </div>
                <p className="text-[12px] text-white/40 mt-2">Overall achievement performance rating</p>
              </div>
            </BorderGlow>

            {/* Goals Completed */}
            <BorderGlow glowIntensity={1.8} coneSpread={4} borderRadius={16}>
              <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute right-4 bottom-4 opacity-5 text-emerald-400">
                  <CheckCircle2 size={80} />
                </div>
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Target Achievements</div>
                <div className="text-4xl font-bold text-white font-mono">{completedCount} <span className="text-[18px] text-white/40">/ {goals.length} Goals</span></div>
                <p className="text-[12px] text-white/40 mt-2">Goals completed (at 100%+ progress)</p>
              </div>
            </BorderGlow>

            {/* Target Weightage Assigned */}
            <BorderGlow glowIntensity={1.8} coneSpread={4} borderRadius={16}>
              <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute right-4 bottom-4 opacity-5 text-blue-400">
                  <Target size={80} />
                </div>
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Weightage Allocation</div>
                <div className="text-4xl font-bold text-blue-400 font-mono">{totalWeightage}%</div>
                <p className="text-[12px] text-white/40 mt-2">Total score weightage points assigned</p>
              </div>
            </BorderGlow>

            {/* Goal Sheet Status */}
            <BorderGlow glowIntensity={1.8} coneSpread={4} borderRadius={16}>
              <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute right-4 bottom-4 opacity-5 text-[#B497CF]">
                  <FileText size={80} />
                </div>
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Sheet Compliance</div>
                <div className="text-4xl font-bold font-mono flex items-center gap-2">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[15px] font-bold border ${getStatusBg(goalSheet?.status)}`}>
                    {getStatusIcon(goalSheet?.status)}
                    {goalSheet?.status || 'Draft'}
                  </span>
                </div>
                <p className="text-[12px] text-white/40 mt-2">Current authorization cycle state</p>
              </div>
            </BorderGlow>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-white/10">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { id: 'achievements', name: 'Achievements & Metrics' },
                { id: 'trends', name: 'QoQ Growth Trends' },
                { id: 'reviews', name: 'Manager Check-Ins & Ratings' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-[16px] transition-all duration-200 relative ${
                      isActive
                        ? 'border-[#A855F7] text-white font-semibold'
                        : 'border-transparent text-white/50 hover:text-white/80'
                    }`}
                  >
                    {tab.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#A855F7] shadow-[0_0_10px_#A855F7]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content Window */}
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl transition-all duration-300">
            
            {/* TAB 1: ACHIEVEMENTS & METRICS */}
            {activeTab === 'achievements' && (
              <div className="space-y-8">
                {/* Visual Target vs Logged Bar Chart */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-white font-bold text-[15px] uppercase tracking-wider text-white/60 mb-6 flex items-center gap-2">
                    <Award size={18} className="text-[#A855F7]" />
                    Goal Completion Comparison (Target vs Logged)
                  </h3>
                  <div className="w-full h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mappedGoals}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="title"
                          stroke="rgba(255,255,255,0.4)"
                          tickFormatter={(t) => t.length > 20 ? `${t.substring(0, 18)}...` : t}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="rgba(255,255,255,0.4)"
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 12, fontFamily: "monospace" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          content={() => (
                            <div className="flex justify-center gap-6 text-[12px] font-semibold text-white/60 pt-4">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-white/10 rounded-sm inline-block" />
                                Goal Metric Value
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-gradient-to-r from-[#A855F7] to-[#B497CF] rounded-sm inline-block" />
                                Current Progress Rate
                              </div>
                            </div>
                          )}
                        />
                        <Bar dataKey="target" name="Target Value" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="progress" name="Progress Rate" fill="url(#purpleGrad)" radius={[4, 4, 0, 0]}>
                          <defs>
                            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#B497CF" stopOpacity={0.2}/>
                            </linearGradient>
                          </defs>
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Achievement Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <FileText className="text-[#A855F7]" size={20} />
                      Quarterly Achievements Ledger ({selectedQuarter})
                    </h2>
                    <span className="text-[13px] font-semibold text-white/40 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                      {goals.length} target records
                    </span>
                  </div>

                  <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-white/40 text-[13px] uppercase tracking-wider font-semibold">
                          <th className="py-4 px-6">Goal Detail</th>
                          <th className="py-4 px-4 text-center">UOM Type</th>
                          <th className="py-4 px-4 text-center">Weightage</th>
                          <th className="py-4 px-4 text-center">Target Metric</th>
                          <th className="py-4 px-4 text-center">Planned Log</th>
                          <th className="py-4 px-4 text-center">Actual Log</th>
                          <th className="py-4 px-4 text-center">Progress %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-[15px] text-white/80 font-medium">
                        {mappedGoals.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            {/* Title & description */}
                            <td className="py-4 px-6 max-w-sm">
                              <div className="font-bold text-white leading-snug">{row.title}</div>
                              <div className="text-white/40 text-[12px] font-normal line-clamp-1 mt-1">{row.description}</div>
                            </td>

                            {/* UOM Type */}
                            <td className="py-4 px-4 text-center">
                              <span className="inline-block text-[11px] uppercase font-bold tracking-widest text-[#A855F7] bg-[#A855F7]/10 px-2 py-0.5 rounded border border-[#A855F7]/20">
                                {row.uom_type}
                              </span>
                            </td>

                            {/* Weightage */}
                            <td className="py-4 px-4 text-center font-semibold font-mono text-white/60">
                              {row.weightage}%
                            </td>

                            {/* Target */}
                            <td className="py-4 px-4 text-center font-mono font-semibold text-white">
                              {row.target}
                            </td>

                            {/* Planned */}
                            <td className="py-4 px-4 text-center font-mono font-semibold text-white/40">
                              {row.planned}
                            </td>

                            {/* Actual */}
                            <td className="py-4 px-4 text-center font-mono font-bold text-[#A855F7]">
                              {row.actual}
                            </td>

                            {/* Progress percentage */}
                            <td className="py-4 px-4 text-center">
                              <span className={`font-bold font-mono text-[16px] ${
                                row.progress >= 80 ? 'text-emerald-400' : row.progress >= 50 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {row.progress}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: QOQ GROWTH TRENDS */}
            {activeTab === 'trends' && (
              <div className="space-y-8">
                {/* QoQ Line chart */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-white font-bold text-[15px] uppercase tracking-wider text-white/60 mb-6 flex items-center gap-2">
                    <Activity size={18} className="text-[#A855F7]" />
                    Quarter-over-Quarter Performance Trajectory
                  </h3>
                  <div className="w-full h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData}
                        margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="quarter"
                          stroke="rgba(255,255,255,0.4)"
                          tick={{ fontSize: 12, fontFamily: "monospace" }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="rgba(255,255,255,0.4)"
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 12, fontFamily: "monospace" }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="My Progress"
                          stroke="#A855F7"
                          strokeWidth={3}
                          dot={{ r: 5, strokeWidth: 1, fill: "#0A0510" }}
                          activeDot={{ r: 8, strokeWidth: 0 }}
                          animationDuration={500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Feedback Growth Analysis card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-white font-semibold text-[17px] flex items-center gap-2">
                      <TrendingUp size={16} className="text-[#A855F7]" />
                      Self-Performance Development Profile
                    </h3>
                    <p className="text-[13px] text-white/50 max-w-xl font-normal">
                      The growth trajectory evaluates average achievements percentages mapped out dynamically across your target segments. Continue updates to construct a complete, high-fidelity annual career portfolio.
                    </p>
                  </div>
                  <div className="text-right">
                    {(() => {
                      const q1 = trendData[0]?.["My Progress"] || 0;
                      const q4 = trendData[3]?.["My Progress"] || trendData[2]?.["My Progress"] || trendData[1]?.["My Progress"] || q1;
                      const shift = q4 - q1;

                      if (shift > 0) {
                        return (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-semibold">
                            +{shift}% Score Growth since Q1
                          </div>
                        );
                      } else if (shift < 0) {
                        return (
                          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-sm font-semibold">
                            {shift}% Shift since Q1
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-xl text-sm font-semibold">
                            Stable Output Rate
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: REVIEWS & FEEDBACKS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Active check-in overview rating banner */}
                <div className="bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(168,85,247,0.15)] relative overflow-hidden group">
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-white font-bold text-[18px] flex items-center gap-2">
                      <Star className="text-amber-400 fill-amber-400" size={20} />
                      Quarter Audit Assessment Score ({selectedQuarter})
                    </h3>
                    <p className="text-[13px] text-white/50 max-w-xl font-normal">
                      Star rating and review logs provided directly by your manager during the check-in and goal sheets assessment cycle.
                    </p>
                  </div>
                  <div className="text-left sm:text-right relative z-10">
                    {currentCheckin?.rating ? (
                      <span className="text-4xl font-extrabold font-mono tracking-tight text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                        ★ {currentCheckin.rating} <span className="text-sm font-normal text-white/40">/ 5 Rating</span>
                      </span>
                    ) : (
                      <span className="text-white/30 text-[14px] font-semibold tracking-wider italic bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        Awaiting Manager Assessment
                      </span>
                    )}
                  </div>
                </div>

                {/* Manager Comments Section */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center gap-2 text-white font-semibold text-[16px] border-b border-white/5 pb-3">
                    <MessageSquare size={18} className="text-[#A855F7]" />
                    Manager Feedback Comments log
                  </div>
                  
                  {currentCheckin?.comments ? (
                    <div className="p-4 bg-[#0A0510]/50 border border-white/5 rounded-xl">
                      <p className="text-white/80 leading-relaxed text-[15px] font-medium whitespace-pre-wrap">
                        "{currentCheckin.comments}"
                      </p>
                      <div className="flex items-center gap-2 mt-4 text-[11px] text-white/40 font-mono">
                        <span>Submitted on:</span>
                        <span>{new Date(currentCheckin.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-white/40 italic text-[15px]">
                      No written feedback comments registered by your manager for {selectedQuarter} check-in sheet yet.
                    </div>
                  )}
                </div>

                {/* General Assessment Logs History */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 shadow-lg">
                  <div className="text-white font-semibold text-[16px] border-b border-white/5 pb-3 uppercase tracking-wider text-white/60">
                    All Check-Ins Log History
                  </div>

                  {checkins.length === 0 ? (
                    <div className="text-center text-white/30 py-4 italic text-[14px]">
                      No check-in history records registered for this goal sheet.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {checkins.map((chk, i) => (
                        <div key={i} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2 text-[15px]">
                              Quarter Audit Log: <span className="text-[#A855F7] font-mono font-extrabold">{chk.quarter}</span>
                            </div>
                            <div className="text-[12px] text-white/40 mt-1 truncate max-w-sm sm:max-w-md">
                              {chk.comments || 'No comments registered.'}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {chk.rating !== null && (
                              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded text-[12px] font-mono">
                                ★ {chk.rating}
                              </div>
                            )}
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBg(chk.status)}`}>
                              {chk.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
