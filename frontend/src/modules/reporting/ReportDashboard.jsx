"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { calculateProgress } from '@/services/progressService';
import QoQTrendsChart from '@/components/charts/QoQTrendsChart';
import ProgressHeatmap from '@/components/charts/ProgressHeatmap';
import GoalStatusPieChart from '@/components/charts/GoalStatusPieChart';
import TeamCompletionBarChart from '@/components/charts/TeamCompletionBarChart';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Loader2, 
  AlertCircle,
  Calendar,
  CheckCircle2, 
  Clock, 
  Edit3, 
  XCircle,
  Award,
  Target,
  TrendingUp,
  User
} from 'lucide-react';

export default function ReportDashboard() {
  const { user } = useAuth();
  const {
    reportData,
    activeReport,
    setActiveReport,
    loading,
    error,
    quarter,
    setQuarter,
    fetchAchievementReport,
    fetchCompletionReport,
    fetchTeamProgress,
    fetchQoQReport,
    exportCSV,
    exportExcel
  } = useReports('Q1');

  // Trigger fetch when user, activeReport, or quarter changes
  useEffect(() => {
    if (!user?.id) return;

    if (!activeReport) {
      setActiveReport('achievement');
      return;
    }

    switch (activeReport) {
      case 'achievement':
        fetchAchievementReport(user.id, quarter);
        break;
      case 'completion':
        fetchCompletionReport(user.id);
        break;
      case 'teamProgress':
        fetchTeamProgress(user.id, quarter);
        break;
      case 'qoq':
        fetchQoQReport(user.id);
        break;
      default:
        break;
    }
  }, [user, activeReport, quarter, setActiveReport, fetchAchievementReport, fetchCompletionReport, fetchTeamProgress, fetchQoQReport]);

  const handleExport = (format) => {
    if (!user?.id) return;
    const filename = `${activeReport}_report_${quarter}_${new Date().toISOString().split('T')[0]}`;
    if (format === 'csv') {
      exportCSV(user.id, filename);
    } else {
      exportExcel(user.id, filename);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 className="text-emerald-400" size={18} />;
      case 'Submitted':
        return <Clock className="text-amber-400" size={18} />;
      case 'Draft':
        return <Edit3 className="text-blue-400" size={18} />;
      case 'Rejected':
        return <XCircle className="text-rose-400" size={18} />;
      default:
        return <AlertCircle className="text-white/40" size={18} />;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'Submitted': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'Draft': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'Rejected': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      default: return 'bg-white/5 border-white/10 text-white/60';
    }
  };

  return (
    <div className="space-y-8 relative z-10">
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="text-[#A855F7]" size={32} />
            Analytics & Reports
          </h1>
          <p className="text-white/50 mt-1">
            Real-time visual summaries, completion metrics, and exportable team audit trails.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quarter Dropdown Filter (Visible for Achievement and Manager reports) */}
          {(activeReport === 'achievement' || activeReport === 'teamProgress') && (
            <div className="flex items-center gap-2 bg-[#0A0510]/60 border border-white/10 rounded-xl px-3 py-2">
              <Calendar size={16} className="text-white/40" />
              <select
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                className="bg-transparent text-white border-none outline-none text-sm font-medium cursor-pointer"
              >
                <option value="Q1" className="bg-[#0A0510] text-white">Quarter 1 (Q1)</option>
                <option value="Q2" className="bg-[#0A0510] text-white">Quarter 2 (Q2)</option>
                <option value="Q3" className="bg-[#0A0510] text-white">Quarter 3 (Q3)</option>
                <option value="Q4" className="bg-[#0A0510] text-white">Quarter 4 (Q4)</option>
              </select>
            </div>
          )}

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              disabled={loading || !reportData.length}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={16} className="text-white/60" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={loading || !reportData.length}
              className="flex items-center gap-2 bg-gradient-to-r from-[#A855F7] to-[#B497CF] hover:from-[#b56ef8] hover:to-[#c3abd8] text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Tabs Section */}
      <div className="border-b border-white/10">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'achievement', name: 'Achievement Report' },
            { id: 'completion', name: 'Completion Report' },
            { id: 'teamProgress', name: 'Manager Report' },
            { id: 'qoq', name: 'QoQ Trends' },
          ].map((tab) => {
            const isActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 relative ${
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

      {/* Report Content Loading Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#0A0510]/40 backdrop-blur-md border border-white/5 rounded-2xl">
          <Loader2 className="w-10 h-10 text-[#A855F7] animate-spin mb-4" />
          <p className="text-white/50 font-medium">Analyzing database and drafting reports...</p>
        </div>
      ) : reportData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0A0510]/40 backdrop-blur-md border border-white/5 rounded-2xl text-center px-4">
          <Target size={48} className="text-white/20 mb-4 animate-pulse" />
          <h3 className="text-white font-semibold text-lg">No report data matches current filters</h3>
          <p className="text-white/40 mt-1 max-w-sm text-sm">
            Ensure your team members have active goal sheets assigned or quarter data registered in the system.
          </p>
        </div>
      ) : (
        <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl transition-all duration-300">
          
          {/* TAB 1: ACHIEVEMENT REPORT CONTENT */}
          {activeReport === 'achievement' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Award className="text-[#A855F7]" size={20} />
                  Planned vs Actual Achievements Table ({quarter})
                </h2>
                <span className="text-xs font-semibold text-white/40 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  {reportData.reduce((acc, curr) => acc + (curr.goals?.length || 0), 0)} goal records
                </span>
              </div>

              <div className="overflow-x-auto bg-white/5 border border-white/10 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider font-semibold">
                      <th className="py-4 px-6">Employee Name</th>
                      <th className="py-4 px-4">Goal Title</th>
                      <th className="py-4 px-4 text-center">Quarter</th>
                      <th className="py-4 px-4 text-center">Target</th>
                      <th className="py-4 px-4 text-center">Planned</th>
                      <th className="py-4 px-4 text-center">Actual</th>
                      <th className="py-4 px-4 text-center">Progress Score</th>
                      <th className="py-4 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-white/80">
                    {(() => {
                      const flatGoals = reportData.flatMap(emp => 
                        (emp.goals || []).map(goal => ({
                          employeeName: emp.employeeName,
                          employeeEmail: emp.employeeEmail,
                          sheetStatus: emp.sheetStatus,
                          ...goal
                        }))
                      );

                      if (flatGoals.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-12 text-center text-white/40">
                              No achievement goals registered or matches filters for {quarter}.
                            </td>
                          </tr>
                        );
                      }

                      return flatGoals.map((row, idx) => {
                        const progress = Math.round(calculateProgress(row.uom_type, row.target, row.actual)) || 0;
                        
                        return (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            {/* Employee name column */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#B497CF] flex items-center justify-center text-white font-bold text-xs shadow-md">
                                  {row.employeeName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-white">{row.employeeName}</div>
                                  <div className="text-[11px] text-white/40">{row.employeeEmail}</div>
                                </div>
                              </div>
                            </td>

                            {/* Goal Title */}
                            <td className="py-4 px-4 max-w-xs">
                              <div className="font-medium text-white line-clamp-2" title={row.title}>
                                {row.title}
                              </div>
                              <span className="inline-block mt-1 text-[9px] uppercase font-bold tracking-widest text-[#A855F7] bg-[#A855F7]/10 px-1.5 py-0.5 rounded border border-[#A855F7]/20">
                                {row.uom_type}
                              </span>
                            </td>

                            {/* Quarter */}
                            <td className="py-4 px-4 text-center font-semibold font-mono text-white/60">
                              {quarter}
                            </td>

                            {/* Target */}
                            <td className="py-4 px-4 text-center font-mono font-semibold text-white">
                              {row.target}
                            </td>

                            {/* Planned */}
                            <td className="py-4 px-4 text-center font-mono font-semibold text-white/60">
                              {row.planned}
                            </td>

                            {/* Actual */}
                            <td className="py-4 px-4 text-center font-mono font-bold text-[#A855F7]">
                              {row.actual}
                            </td>

                            {/* Progress Score (color coded) */}
                            <td className="py-4 px-4 text-center">
                              <span className={`font-bold font-mono text-base ${
                                progress >= 70 ? 'text-emerald-400' : progress >= 40 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {progress}%
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBg(row.status)}`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Progress & Operational Status Summary */}
              {(() => {
                const flatGoals = reportData.flatMap(emp => 
                  (emp.goals || []).map(goal => ({
                    employeeName: emp.employeeName,
                    employeeEmail: emp.employeeEmail,
                    sheetStatus: emp.sheetStatus,
                    goalTitle: goal.title,
                    target: goal.target,
                    planned: goal.planned,
                    actual: goal.actual,
                    progressScore: calculateProgress(goal.uom_type, goal.target, goal.actual),
                    status: goal.status
                  }))
                );
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      <GoalStatusPieChart achievementData={flatGoals} />
                    </div>
                    <div className="lg:col-span-2">
                      <ProgressHeatmap achievementData={flatGoals} />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: COMPLETION REPORT CONTENT */}
          {activeReport === 'completion' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="text-[#A855F7]" size={20} />
                  Goal Sheet Submission & Approval Pipeline
                </h2>
              </div>

              {(() => {
                const total = reportData.length;
                const counts = { Draft: 0, Submitted: 0, Approved: 0, Rejected: 0 };
                reportData.forEach(row => {
                  if (counts[row.status] !== undefined) {
                    counts[row.status]++;
                  }
                });

                const approved = counts.Approved;
                const submitted = counts.Submitted;
                const draft = counts.Draft;
                const rejected = counts.Rejected;
                const completed = approved + submitted;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const approvedPct = total > 0 ? Math.round((approved / total) * 100) : 0;
                const submittedPct = total > 0 ? Math.round((submitted / total) * 100) : 0;

                return (
                  <>
                    {/* Aggregation Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                      {/* Total Card */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-200 hover:translate-y-[-2px]">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <User className="text-white" size={80} />
                        </div>
                        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Total Employees</div>
                        <div className="text-4xl font-bold text-white font-mono">{total}</div>
                        <p className="text-[11px] text-white/40 mt-2">Active members in team</p>
                      </div>

                      {/* Draft Card */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-200 hover:translate-y-[-2px]">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Edit3 className="text-blue-400" size={80} />
                        </div>
                        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Draft</div>
                        <div className="text-4xl font-bold text-blue-400 font-mono">{draft}</div>
                        <p className="text-[11px] text-white/40 mt-2">Worksheets in preparation</p>
                      </div>

                      {/* Submitted Card */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-200 hover:translate-y-[-2px]">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Clock className="text-amber-400" size={80} />
                        </div>
                        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Submitted</div>
                        <div className="text-4xl font-bold text-amber-400 font-mono">{submitted}</div>
                        <p className="text-[11px] text-white/40 mt-2">Awaiting manager sign-off</p>
                      </div>

                      {/* Approved Card */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-200 hover:translate-y-[-2px]">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <CheckCircle2 className="text-emerald-400" size={80} />
                        </div>
                        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Approved</div>
                        <div className="text-4xl font-bold text-emerald-400 font-mono">{approved}</div>
                        <p className="text-[11px] text-white/40 mt-2">Finalized & locked sheets</p>
                      </div>

                      {/* Rejected Card */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group transition-all duration-200 hover:translate-y-[-2px]">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <XCircle className="text-rose-400" size={80} />
                        </div>
                        <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Rejected</div>
                        <div className="text-4xl font-bold text-rose-400 font-mono">{rejected}</div>
                        <p className="text-[11px] text-white/40 mt-2">Returned for revisions</p>
                      </div>
                    </div>

                    {/* Progress Summary Graph */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                      <h3 className="text-white font-semibold text-sm uppercase tracking-wider text-white/60">
                        Submission Progress Ratio
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">
                            Approved or Submitted: <strong className="text-white">{completed}</strong> / {total} sheets
                          </span>
                          <span className="text-[#A855F7] font-bold font-mono">{pct}% Complete</span>
                        </div>
                        
                        {/* Segmented Progress Bar */}
                        <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden border border-white/5 flex">
                          <div 
                            className="bg-emerald-400 h-full rounded-l-full transition-all duration-500" 
                            style={{ width: `${approvedPct}%` }}
                            title={`Approved: ${approvedPct}%`}
                          />
                          <div 
                            className="bg-amber-400 h-full transition-all duration-500" 
                            style={{ width: `${submittedPct}%` }}
                            title={`Submitted: ${submittedPct}%`}
                          />
                        </div>
                        
                        <div className="flex items-center gap-6 text-xs text-white/50 pt-2 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-emerald-400 rounded-full" />
                            Approved ({approved})
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-amber-400 rounded-full" />
                            Submitted ({submitted})
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-white/20 rounded-full" />
                            Pending Drafts/Rejections ({total - completed})
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Employee Status Table */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                      <div className="bg-white/5 px-6 py-4 border-b border-white/5">
                        <h3 className="text-white font-semibold text-sm uppercase tracking-wider text-white/60">Employee Goal Sheet Statuses</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider font-semibold">
                              <th className="py-4 px-6">Employee Name</th>
                              <th className="py-4 px-4">Email</th>
                              <th className="py-4 px-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm text-white/80">
                            {reportData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6 font-semibold text-white flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#B497CF] flex items-center justify-center text-white font-bold text-xs">
                                    {row.employeeName.charAt(0).toUpperCase()}
                                  </div>
                                  {row.employeeName}
                                </td>
                                <td className="py-4 px-4 font-mono text-white/60 text-xs">{row.employeeEmail}</td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBg(row.status)}`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 3: MANAGER REPORT CONTENT (Team Progress) */}
          {activeReport === 'teamProgress' && (
            <div className="space-y-6">
              {(() => {
                const teamAverage = reportData.length > 0
                  ? Math.round(reportData.reduce((acc, curr) => acc + (curr.score || 0), 0) / reportData.length)
                  : 0;

                return (
                  <>
                    {/* Overall team average progress score banner */}
                    <div className="bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(168,85,247,0.15)] relative overflow-hidden group">
                      {/* Interactive background shine */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                      
                      <div className="space-y-1 relative z-10">
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                          <TrendingUp className="text-[#A855F7]" size={20} />
                          Overall Team Average Progress Score
                        </h3>
                        <p className="text-xs text-white/50 max-w-xl">
                          Calculated as the weighted average score across all active goals for your team members during {quarter}.
                        </p>
                      </div>
                      <div className="text-left sm:text-right relative z-10">
                        <span className={`text-4xl font-extrabold font-mono tracking-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.2)] ${
                          teamAverage >= 75 ? 'text-emerald-400' : teamAverage >= 45 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {teamAverage}%
                        </span>
                      </div>
                    </div>

                    {/* Team Leaderboard Bar Chart */}
                    <TeamCompletionBarChart reportData={reportData} />

                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                      <div className="bg-white/5 px-6 py-4 border-b border-white/5">
                        <h3 className="text-white font-semibold text-sm uppercase tracking-wider text-white/60">Employee Progress Summary Table</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider font-semibold">
                              <th className="py-4 px-6">Employee Name</th>
                              <th className="py-4 px-4 text-center">Average Progress Score</th>
                              <th className="py-4 px-4 text-center">Goals Breakdown</th>
                              <th className="py-4 px-6 text-center">Manager Rating</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm text-white/80">
                            {reportData.map((emp, idx) => {
                              const score = Math.round(emp.score) || 0;
                              return (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                  {/* Employee profile card */}
                                  <td className="py-4 px-6 font-semibold text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#B497CF] flex items-center justify-center text-white font-bold text-xs">
                                      {emp.employeeName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-white">{emp.employeeName}</div>
                                      <div className="text-[11px] text-white/40">{emp.employeeEmail}</div>
                                    </div>
                                  </td>

                                  {/* Average progress score */}
                                  <td className="py-4 px-4">
                                    <div className="flex flex-col items-center gap-1.5 justify-center max-w-[160px] mx-auto">
                                      <span className={`font-bold font-mono text-base ${
                                        score >= 75 ? 'text-emerald-400' : score >= 45 ? 'text-amber-400' : 'text-rose-400'
                                      }`}>
                                        {score}%
                                      </span>
                                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/5">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-500 ${
                                            score >= 75 
                                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                                              : score >= 45 
                                              ? 'bg-gradient-to-r from-amber-500 to-orange-400' 
                                              : 'bg-gradient-to-r from-rose-500 to-pink-400'
                                          }`} 
                                          style={{ width: `${score}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Goals breakdown (completed vs in progress vs missed) */}
                                  <td className="py-4 px-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {/* Completed */}
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Goals completed (score 100%)">
                                        {emp.completedGoals} C
                                      </span>
                                      {/* In Progress */}
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Goals in progress">
                                        {emp.inProgressGoals} IP
                                      </span>
                                      {/* Missed */}
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20" title="Goals missed/unstarted">
                                        {emp.missedGoals} M
                                      </span>
                                    </div>
                                  </td>

                                  {/* Manager check-in rating */}
                                  <td className="py-4 px-6 text-center">
                                    {emp.rating !== null && emp.rating !== undefined ? (
                                      <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold font-mono shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                        ★ {emp.rating} / 5
                                      </div>
                                    ) : (
                                      <span className="text-white/30 text-xs font-semibold tracking-wider italic bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                        N/A
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB 4: QOQ TRENDS CONTENT */}
          {activeReport === 'qoq' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="text-[#A855F7]" size={20} />
                  Quarter-over-Quarter Team Progress Trends
                </h2>
              </div>

              {/* Recharts Line Chart */}
              <QoQTrendsChart reportData={reportData} />

              {/* Trend summary card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 justify-between items-center max-w-4xl mx-auto">
                <div className="space-y-1">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#A855F7]" />
                    Team Performance Trend Evaluation
                  </h3>
                  <p className="text-xs text-white/50 max-w-xl">
                    Trend charts evaluate average team progress percentages mapped out dynamically across current fiscal segments. Monitor increases or drops to optimize operational workloads.
                  </p>
                </div>
                <div className="text-right">
                  {(() => {
                    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
                    const teamAverages = {};
                    quarters.forEach(q => {
                      const scores = reportData.map(emp => emp[q] || 0);
                      teamAverages[q] = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
                    });

                    const q1Val = teamAverages.Q1 || 0;
                    const lastVal = teamAverages.Q4 || teamAverages.Q3 || teamAverages.Q2 || q1Val;
                    const diff = Math.round(lastVal - q1Val);

                    if (diff > 0) {
                      return (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm font-semibold">
                          +{diff}% Growth since Q1
                        </div>
                      );
                    } else if (diff < 0) {
                      return (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-sm font-semibold">
                          {diff}% Shift since Q1
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-xl text-sm font-semibold">
                          Stable Performance
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
