"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Loader2, 
  Eye, 
  X, 
  Calendar,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  Unlock
} from 'lucide-react';
import { getAdminSystemReportsData } from '@/services/analyticsService';
import { generateCSV, generateExcel, logReport } from '@/services/reportService';
import { useAuth } from '@/hooks/useAuth';
import { unlockGoalSheet } from '@/services/approvalService';

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [sheets, setSheets] = useState<any[]>([]);
  const [filteredSheets, setFilteredSheets] = useState<any[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination State (20 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Detail Modal State
  const [selectedSheet, setSelectedSheet] = useState<any | null>(null);

  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const handleUnlock = async (sheetId: string) => {
    if (!user?.id) return;
    if (!confirm("Are you sure you want to unlock this goal sheet? This will reset its status to Draft and allow the employee to edit it.")) return;
    try {
      setUnlockingId(sheetId);
      await unlockGoalSheet(sheetId, user.id);
      
      // Update local state immediately
      setSheets(prev => prev.map(s => {
        if (s.id === sheetId) {
          return { ...s, isLocked: false, is_locked: false, status: 'Draft' };
        }
        return s;
      }));
      
      alert("Goal sheet successfully unlocked and reset to Draft status!");
    } catch (err) {
      console.error("Failed to unlock goal sheet:", err);
      alert("Failed to unlock goal sheet. Please check permissions and database connectivity.");
    } finally {
      setUnlockingId(null);
    }
  };

  // Fetch all sheets
  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminSystemReportsData();
        setSheets(data);
        setFilteredSheets(data);
      } catch (err: any) {
        console.error("Failed to load admin system reports:", err);
        setError("Error loading system sheets. Make sure the goal_sheets table is configured properly.");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = sheets;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.employeeName.toLowerCase().includes(q) || 
        s.employeeEmail.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(s => s.status === statusFilter);
    }

    setFilteredSheets(result);
    setCurrentPage(1); // Reset to page 1 when filter parameters are modified
  }, [searchQuery, statusFilter, sheets]);

  // Export handlers
  const handleExportCSV = async () => {
    if (filteredSheets.length === 0) return;
    try {
      // Map data for export (flattening out deep goals objects for cleaner flat row mappings)
      const exportData = filteredSheets.map(s => ({
        employee_name: s.employeeName,
        employee_email: s.employeeEmail,
        goal_sheet_status: s.status,
        date_created: s.createdAt,
        goals_registered_count: s.goalsCount
      }));

      generateCSV(exportData, `system_reports_${new Date().toISOString().split('T')[0]}`);
      
      // Log report audit trail
      if (user?.id) {
        await logReport('Admin CSV System Export', user.id, { statusFilter, searchQueryCount: filteredSheets.length });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = async () => {
    if (filteredSheets.length === 0) return;
    try {
      const exportData = filteredSheets.map(s => ({
        employee_name: s.employeeName,
        employee_email: s.employeeEmail,
        goal_sheet_status: s.status,
        date_created: s.createdAt,
        goals_registered_count: s.goalsCount
      }));

      generateExcel(exportData, `system_reports_${new Date().toISOString().split('T')[0]}`);
      
      if (user?.id) {
        await logReport('Admin Excel System Export', user.id, { statusFilter, searchQueryCount: filteredSheets.length });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get status badge styles
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Submitted':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-white/5 text-white/50 border border-white/10';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-[#A855F7] animate-spin mb-4" />
          <p className="text-white/60 font-medium">Assembling system reports records...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl">
          <h2 className="text-xl font-bold mb-2">Reports Loading Failed</h2>
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#A855F7]/20 rounded-xl">
              <FileText size={28} className="text-[#A855F7]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">System Compliance Reports</h1>
              <p className="text-white/50 mt-1 text-sm">
                Search, filter, inspect active employee sheets, and compile reports.
              </p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={filteredSheets.length === 0}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={handleExportExcel}
              disabled={filteredSheets.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-[#A855F7] to-[#8a3fd6] hover:shadow-lg hover:shadow-[#A855F7]/20 text-white font-medium px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 text-sm"
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 py-2.5 pl-11 pr-4 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#A855F7]/30 transition-all"
              placeholder="Search by employee name or email..."
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter size={16} className="text-[#A855F7]" />
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-white/10 text-white text-sm py-2 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A855F7]/30 transition-all outline-none"
            >
              <option value="All" className="bg-[#0A0510] text-white">All Goal Sheets</option>
              <option value="Approved" className="bg-[#0A0510] text-emerald-400">Approved</option>
              <option value="Submitted" className="bg-[#0A0510] text-amber-400">Submitted</option>
              <option value="Rejected" className="bg-[#0A0510] text-rose-400">Rejected</option>
              <option value="Draft" className="bg-[#0A0510] text-white/60">Draft</option>
            </select>
          </div>
        </div>

        {/* System Reports Table */}
        <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/50 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Created Date</th>
                  <th className="py-3 px-4 font-semibold">Registered Goals</th>
                  <th className="py-3 px-4 font-semibold">Goal Sheet Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalPages = Math.ceil(filteredSheets.length / itemsPerPage) || 1;
                  const paginatedSheets = filteredSheets.slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  );

                  if (filteredSheets.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-white/30 text-sm">
                          No goal sheets match your search criteria.
                        </td>
                      </tr>
                    );
                  }

                  return paginatedSheets.map((sheet, index) => (
                    <tr key={sheet.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-medium text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#A855F7]/10 flex items-center justify-center font-bold text-xs text-[#A855F7]">
                          {sheet.employeeName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="block font-semibold">{sheet.employeeName}</span>
                          <span className="block text-[11px] text-white/40">{sheet.employeeEmail}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white/70 font-mono text-sm">{sheet.createdAt}</td>
                      <td className="py-4 px-4 text-white font-mono text-sm">{sheet.goalsCount} Goals</td>
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${getBadgeStyle(sheet.status)}`}>
                          {sheet.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                        {(sheet.is_locked || sheet.isLocked) && (
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
                          title="View detailed objectives"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {(() => {
            const totalPages = Math.ceil(filteredSheets.length / itemsPerPage) || 1;
            if (totalPages <= 1) return null;
            return (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-white/5 gap-4">
                <p className="text-xs text-white/50">
                  Showing <span className="text-white font-semibold font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="text-white font-semibold font-mono">{Math.min(currentPage * itemsPerPage, filteredSheets.length)}</span> of{' '}
                  <span className="text-white font-semibold font-mono">{filteredSheets.length}</span> goal sheets
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-white/60 font-semibold px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

      </div>

      {/* Sleek Goal List Modal Panel */}
      {selectedSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0A0510] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-[#A855F7]" />
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedSheet.employeeName}'s Performance Objectives</h3>
                  <p className="text-[11px] text-white/50">{selectedSheet.employeeEmail} • Created: {selectedSheet.createdAt}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSheet(null)}
                className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {selectedSheet.goals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 rounded-2xl border border-white/5">
                  <AlertCircle className="text-[#A855F7] mb-2" size={32} />
                  <p className="text-white/60 font-semibold">No objectives registered</p>
                  <p className="text-[11px] text-white/40 mt-1">This employee has not added any goals to their sheet yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSheet.goals.map((goal: any, idx: number) => (
                    <div key={goal.id || idx} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[#A855F7] text-xs font-bold font-mono bg-[#A855F7]/10 px-2 py-0.5 rounded">
                            Goal #{idx + 1}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getBadgeStyle(goal.status)}`}>
                            {goal.status || 'Draft'}
                          </span>
                        </div>
                        <h4 className="text-white font-bold leading-snug">{goal.title}</h4>
                      </div>

                      <div className="grid grid-cols-3 gap-6 md:text-right flex-shrink-0 md:min-w-[280px]">
                        <div>
                          <span className="block text-[10px] text-white/40 font-semibold uppercase tracking-wider">Weightage</span>
                          <span className="block font-bold text-white font-mono text-sm">{goal.weightage}%</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-white/40 font-semibold uppercase tracking-wider">Target</span>
                          <span className="block font-bold text-white font-mono text-sm">{goal.target}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-white/40 font-semibold uppercase tracking-wider">UOM Type</span>
                          <span className="block font-bold text-[#A855F7] text-xs uppercase mt-0.5">{goal.uom_type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedSheet(null)}
                className="bg-white/5 hover:bg-white/10 text-white font-medium px-5 py-2.5 rounded-xl transition-all text-sm"
              >
                Close Objectives
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
