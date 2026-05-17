"use client";

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Calendar, 
  User, 
  Shield, 
  Search, 
  X, 
  FileCode,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';

export default function AuditLogTable({ logs = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  
  // Pagination State (20 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset to first page when any filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, actionFilter, userFilter, fromDate, toDate, tableFilter]);
  
  // Modal State for Expandable JSON viewer
  const [modalData, setModalData] = useState(null); // { title: string, data: any }

  // Resets all filters back to default
  const handleClearFilters = () => {
    setSearchTerm('');
    setActionFilter('');
    setUserFilter('');
    setFromDate('');
    setToDate('');
    setTableFilter('');
  };

  // Get color badges for Roles
  const getRoleBadge = (role) => {
    const r = role?.toLowerCase();
    if (r === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          <Shield size={10} />
          Admin
        </span>
      );
    }
    if (r === 'manager') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          <Shield size={10} />
          Manager
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
        <Shield size={10} />
        Employee
      </span>
    );
  };

  // Color code the action column precisely as requested
  const getActionBadge = (action) => {
    const act = action?.toUpperCase();
    if (act === 'GOAL_CREATED' || act === 'GOAL_APPROVED') {
      return (
        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg font-mono">
          {action}
        </span>
      );
    }
    if (act === 'GOAL_UPDATED' || act === 'ACHIEVEMENT_UPDATED') {
      return (
        <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg font-mono">
          {action}
        </span>
      );
    }
    if (act === 'GOAL_DELETED' || act === 'GOAL_REJECTED') {
      return (
        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg font-mono">
          {action}
        </span>
      );
    }
    if (act === 'SHEET_SUBMITTED' || act === 'CHECKIN_SUBMITTED') {
      return (
        <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg font-mono">
          {action}
        </span>
      );
    }
    return (
      <span className="bg-white/5 border border-white/10 text-white/70 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg font-mono">
        {action || 'UNKNOWN'}
      </span>
    );
  };

  // Format JSON beautifully inside expandable views
  const renderJSON = (val) => {
    if (!val) return <div className="text-white/30 italic text-xs py-4 text-center">No record state recorded.</div>;
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return (
        <pre className="text-[11px] text-[#C084FC] font-mono overflow-x-auto max-w-full p-4 bg-black/40 border border-white/5 rounded-xl whitespace-pre-wrap break-all leading-relaxed scrollbar-thin scrollbar-thumb-white/10 select-all">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return (
        <pre className="text-[11px] text-white/60 font-mono overflow-x-auto max-w-full p-4 bg-black/40 border border-white/5 rounded-xl whitespace-pre-wrap break-all leading-relaxed select-all">
          {String(val)}
        </pre>
      );
    }
  };

  // Get distinct list of users present in logs for User Dropdown filter
  const uniqueUsers = Array.from(
    new Map(
      logs
        .filter(l => l.user)
        .map(l => [l.user_id || l.user.email, l.user])
    ).values()
  ).sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''));

  // Get unique actions & tables for Dropdowns
  const uniqueActions = [...new Set(logs.map(l => l.action).filter(Boolean))].sort();
  const uniqueTables = [...new Set(logs.map(l => l.table_name).filter(Boolean))].sort();

  // Dynamically filter logs by Search, Dropdowns, and Date boundary ranges
  const filteredLogs = logs.filter(log => {
    const searchString = `${log.user?.name || ''} ${log.user?.email || ''} ${log.description || ''} ${log.table_name || ''} ${log.action || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesUser = !userFilter || log.user_id === userFilter;
    const matchesTable = !tableFilter || log.table_name === tableFilter;
    
    let matchesDate = true;
    if (fromDate) {
      matchesDate = matchesDate && new Date(log.created_at) >= new Date(fromDate + 'T00:00:00');
    }
    if (toDate) {
      matchesDate = matchesDate && new Date(log.created_at) <= new Date(toDate + 'T23:59:59');
    }

    return matchesSearch && matchesAction && matchesUser && matchesTable && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Search & Advanced Filters Header Grid */}
      <div className="bg-[#0A0510]/80 border border-white/10 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Filter size={16} className="text-[#A855F7]" />
          <span>Filter Audit Trails</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search keyword..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#A855F7]/50 transition-all h-9"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Action filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#A855F7]/50 cursor-pointer h-9"
            >
              <option value="" className="bg-[#0A0510] text-white/50">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action} className="bg-[#0A0510] text-white">{action}</option>
              ))}
            </select>
          </div>

          {/* User filter */}
          <div>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#A855F7]/50 cursor-pointer h-9"
            >
              <option value="" className="bg-[#0A0510] text-white/50">All Users</option>
              {uniqueUsers.map(user => (
                <option key={user.id} value={user.id} className="bg-[#0A0510] text-white">
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Table filter */}
          <div>
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#A855F7]/50 cursor-pointer h-9"
            >
              <option value="" className="bg-[#0A0510] text-white/50">All Tables</option>
              {uniqueTables.map(table => (
                <option key={table} value={table} className="bg-[#0A0510] text-white">{table}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs rounded-xl h-9 transition-all cursor-pointer"
            >
              <RefreshCw size={12} />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Date Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2 border-t border-white/5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A855F7]/50 h-9 cursor-pointer text-left"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-white/40 uppercase tracking-wider font-bold">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A855F7]/50 h-9 cursor-pointer text-left"
            />
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0A0510]/60 backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-white/70 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold w-[180px]">Timestamp</th>
                <th className="p-4 font-semibold w-[220px]">Actor</th>
                <th className="p-4 font-semibold w-[110px]">User Role</th>
                <th className="p-4 font-semibold w-[180px]">Action Type</th>
                <th className="p-4 font-semibold w-[140px]">Table Affected</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold text-center w-[110px]">Old Snapshot</th>
                <th className="p-4 font-semibold text-center w-[110px]">New Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {(() => {
                const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
                const paginatedLogs = filteredLogs.slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                );

                if (filteredLogs.length === 0) {
                  return (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-white/40 italic">
                        No matching audit logs found. Try adjusting your filters.
                      </td>
                    </tr>
                  );
                }

                return paginatedLogs.map((log) => {
                  const timestampStr = log.created_at
                    ? new Date(log.created_at).toLocaleString()
                    : '-';

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors align-middle">
                      {/* Timestamp */}
                      <td className="p-4 text-white/80 font-mono text-xs">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-white/40" />
                          {timestampStr}
                        </span>
                      </td>

                      {/* Actor profile */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7] font-semibold text-xs shrink-0">
                            {log.user?.name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div className="truncate">
                            <p className="text-white font-semibold truncate leading-tight">
                              {log.user?.name || 'System / Auto'}
                            </p>
                            <p className="text-white/40 text-[10px] truncate">
                              {log.user?.email || 'system_event@alignx.internal'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-4">{getRoleBadge(log.user_role)}</td>

                      {/* Action */}
                      <td className="p-4">{getActionBadge(log.action)}</td>

                      {/* Table affected */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 text-white/70 font-mono text-[11px] px-2 py-0.5 rounded uppercase">
                          <Database size={10} className="text-[#A855F7]" />
                          {log.table_name || 'N/A'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="p-4 text-white/70 max-w-[280px] truncate" title={log.description}>
                        {log.description}
                      </td>

                      {/* Old Value Expand Button */}
                      <td className="p-4 text-center">
                        {log.old_value ? (
                          <button
                            onClick={() => setModalData({ title: 'Old Value Snapshot (Pre-Action State)', data: log.old_value })}
                            className="inline-flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-500/5 h-7"
                          >
                            <Eye size={12} />
                            View
                          </button>
                        ) : (
                          <span className="text-white/20 text-xs font-mono">-</span>
                        )}
                      </td>

                      {/* New Value Expand Button */}
                      <td className="p-4 text-center">
                        {log.new_value ? (
                          <button
                            onClick={() => setModalData({ title: 'New Value Snapshot (Post-Action State)', data: log.new_value })}
                            className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-500/5 h-7"
                          >
                            <Eye size={12} />
                            View
                          </button>
                        ) : (
                          <span className="text-white/20 text-xs font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {(() => {
        const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
        if (totalPages <= 1) return null;
        return (
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-[#0A0510]/80 border border-white/10 rounded-2xl gap-4 shadow-xl">
            <p className="text-xs text-white/50">
              Showing <span className="text-white font-semibold font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="text-white font-semibold font-mono">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> of{' '}
              <span className="text-white font-semibold font-mono">{filteredLogs.length}</span> audit logs
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
              >
                Previous
              </button>
              <span className="text-xs text-white/60 font-semibold px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
              >
                Next
              </button>
            </div>
          </div>
        );
      })()}

      {/* Expandable JSON Viewer Modal Popup overlay */}
      {modalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setModalData(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#0C0712] border border-white/15 rounded-2xl shadow-2xl p-6 overflow-hidden transform scale-100 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="text-[#A855F7]" size={16} />
                {modalData.title}
              </h3>
              <button 
                onClick={() => setModalData(null)}
                className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            
            {/* Scrollable code block */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {renderJSON(modalData.data)}
            </div>
            
            {/* Modal footer action */}
            <div className="pt-4 border-t border-white/10 mt-4 flex justify-end shrink-0">
              <button 
                onClick={() => setModalData(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
