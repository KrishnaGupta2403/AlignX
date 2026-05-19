"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import BorderGlow from '@/components/backgrounds/BorderGlow';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Search, 
  UserCheck, 
  ShieldCheck, 
  Loader2, 
  Check, 
  RefreshCw,
  SlidersHorizontal,
  UserCheck2,
  Mail,
  ChevronsUpDown
} from 'lucide-react';

// Retry helper — silently retries failed requests up to maxRetries times.
// Works with the AbortController fetch in supabase.js: the first frozen
// request is aborted (kills the dead socket), then the retry gets a fresh connection.
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 800): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt) throw err;
      console.log(`[Admin Users] Request attempt ${attempt} failed, retrying in ${delayMs}ms...`, err?.message);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('All retries exhausted');
}

interface Profile {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  manager_id: string | null;
  created_at?: string;
}

export default function ManageUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{ [key: string]: 'success' | 'error' | null }>({});
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  
  // Cache of available managers for selection
  const [managers, setManagers] = useState<Profile[]>([]);

  // Fetch all profiles and identify managers
  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        setProfiles(data);
        // Managers are users whose role is "manager"
        const mgrs = data.filter((p: Profile) => p.role?.toLowerCase() === 'manager');
        setManagers(mgrs);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);



  // Update a user's role
  const handleRoleChange = async (profileId: string, newRole: string) => {
    console.log(`[Admin Users] Changing role for user ${profileId} to ${newRole}`);
    try {
      setUpdatingUserId(profileId);
      
      // If changing from manager/employee, we might want to reset their manager_id if they had one
      const updates: any = { role: newRole };
      if (newRole !== 'employee') {
        updates.manager_id = null;
      }

      const { error } = await retryWithBackoff(() =>
        supabase
          .from('profiles')
          .update(updates)
          .eq('id', profileId)
          .then((res: any) => { if (res.error) throw res.error; return res; })
      ) as any;

      if (error) {
        console.error('[Admin Users] Database error updating role:', error);
        throw error;
      }
      console.log('[Admin Users] Profiles table updated role successfully');

      // Update locally
      setProfiles(prev => prev.map(p => 
        p.id === profileId 
          ? { ...p, role: newRole, manager_id: newRole !== 'employee' ? null : p.manager_id } 
          : p
      ));

      // If we made someone a manager, update the managers cache list
      const updatedProfile = profiles.find(p => p.id === profileId);
      if (updatedProfile) {
        const withNewRole = { ...updatedProfile, role: newRole };
        if (newRole === 'manager') {
          setManagers(prev => [...prev.filter(m => m.id !== profileId), withNewRole].sort((a,b) => (a.name || '').localeCompare(b.name || '')));
        } else {
          setManagers(prev => prev.filter(m => m.id !== profileId));
        }
      }

      // Show temporary success feedback
      setUpdateStatus(prev => ({ ...prev, [profileId]: 'success' }));
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, [profileId]: null }));
      }, 2000);

    } catch (err: any) {
      console.error('[Admin Users] Exception caught updating role:', err);
      alert(`Failed to update role: ${err.message || err}`);
      setUpdateStatus(prev => ({ ...prev, [profileId]: 'error' }));
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, [profileId]: null }));
      }, 2000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Assign a manager to an employee
  const handleManagerChange = async (profileId: string, managerId: string) => {
    console.log(`[Admin Users] Changing manager for user ${profileId} to ${managerId}`);
    try {
      setUpdatingUserId(profileId);
      const dbValue = managerId === 'none' ? null : managerId;

      // 1. Update the profiles table
      await retryWithBackoff(() =>
        supabase
          .from('profiles')
          .update({ manager_id: dbValue })
          .eq('id', profileId)
          .then((res: any) => { if (res.error) throw res.error; return res; })
      );
      console.log('[Admin Users] Profiles table updated successfully');

      // 2. Also update any active/submitted/approved goal sheets for this employee
      await retryWithBackoff(() =>
        supabase
          .from('goal_sheets')
          .update({ manager_id: dbValue })
          .eq('employee_id', profileId)
          .then((res: any) => {
            if (res.error) console.warn('[Admin Users] goal_sheets update warning:', res.error);
            return res;
          })
      ).catch(err => console.warn('[Admin Users] goal_sheets update non-blocking error:', err));
      console.log('[Admin Users] Goal sheets table updated successfully');

      // Update locally
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, manager_id: dbValue } : p));

      // Show success feedback
      setUpdateStatus(prev => ({ ...prev, [profileId]: 'success' }));
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, [profileId]: null }));
      }, 2000);

    } catch (err: any) {
      console.error('[Admin Users] Exception caught updating manager:', err);
      alert(`Failed to assign manager: ${err?.message || err}`);
      setUpdateStatus(prev => ({ ...prev, [profileId]: 'error' }));
      setTimeout(() => {
        setUpdateStatus(prev => ({ ...prev, [profileId]: null }));
      }, 2000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Filter profiles
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      (profile.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (profile.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = 
      selectedRoleFilter === 'all' || 
      (profile.role || '').toLowerCase() === selectedRoleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  return (
    <AdminLayout>
      <div className="space-y-8 relative z-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-[#A855F7]/20 rounded-2xl">
              <Users size={32} className="text-[#A855F7]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight font-sans">Manage Users Directory</h1>
              <p className="text-white/50 mt-1 text-sm">
                Control system access privileges, assign administrative roles, and map reporting hierarchies.
              </p>
            </div>
          </div>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Sync Ledger
          </button>
        </div>

        {/* Global Directory Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#0A0510]/60 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-2">Total Users</div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {loading ? '...' : profiles.length}
            </div>
            <p className="text-[11px] text-white/40 mt-3">Registered system profiles</p>
          </div>

          <div className="bg-[#0A0510]/60 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-2">Employees</div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              {loading ? '...' : profiles.filter(p => p.role === 'employee').length}
            </div>
            <p className="text-[11px] text-white/40 mt-3">Direct evaluation targets</p>
          </div>

          <div className="bg-[#0A0510]/60 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-2">Managers</div>
            <div className="text-3xl font-extrabold text-indigo-400 font-mono">
              {loading ? '...' : profiles.filter(p => p.role === 'manager').length}
            </div>
            <p className="text-[11px] text-white/40 mt-3">Active evaluators & team leaders</p>
          </div>

          <div className="bg-[#0A0510]/60 border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className="text-white/50 text-xs font-semibold tracking-wider uppercase mb-2">Administrators</div>
            <div className="text-3xl font-extrabold text-purple-400 font-mono">
              {loading ? '...' : profiles.filter(p => p.role === 'admin').length}
            </div>
            <p className="text-[11px] text-white/40 mt-3">Full platform security access</p>
          </div>
        </div>

        {/* Directory Filters & Table Container */}
        <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-[#A855F7]" />
                User Profiles Directory
              </h2>
              <p className="text-xs text-white/40 mt-0.5">
                Search profiles, elevate roles, and configure direct manager chains with instant live saving.
              </p>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Find user name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#A855F7]/50 transition-colors"
                />
              </div>

              {/* Role Filters */}
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#A855F7]/50 transition-colors outline-none cursor-pointer"
              >
                <option className="bg-[#0A0510]" value="all">All Roles</option>
                <option className="bg-[#0A0510]" value="admin">Admin</option>
                <option className="bg-[#0A0510]" value="manager">Manager</option>
                <option className="bg-[#0A0510]" value="employee">Employee</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={40} className="animate-spin text-[#A855F7] mb-3" />
              <p className="text-white/40 text-sm">Retrieving system ledger indexes...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
              <ShieldCheck className="mx-auto w-12 h-12 text-white/20 mb-3" />
              <h3 className="text-white font-semibold">No Profiles Discovered</h3>
              <p className="text-white/40 text-xs mt-1">Try resetting your search query or role dropdown filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 font-semibold text-xs tracking-wider uppercase bg-white/5">
                    <th className="py-3.5 px-4 rounded-tl-xl">User details</th>
                    <th className="py-3.5 px-4">System Email</th>
                    <th className="py-3.5 px-4">Platform Role</th>
                    <th className="py-3.5 px-4">Reporting Manager</th>
                    <th className="py-3.5 px-4 text-center rounded-tr-xl w-32">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      {/* Avatar Details */}
                      <td className="py-4 px-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#A855F7]/10 to-[#B497CF]/10 border border-[#A855F7]/20 flex items-center justify-center font-black text-sm text-[#A855F7] shadow-sm">
                          {profile.name?.substring(0, 2).toUpperCase() || profile.email?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <span className="block font-semibold text-white text-sm">
                            {profile.name || 'Anonymous User'}
                          </span>
                          <span className="block text-[10px] text-white/30 font-mono">
                            UID: {profile.id.substring(0, 8)}...
                          </span>
                        </div>
                      </td>

                      {/* Email Address */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                          <Mail size={14} className="text-white/30" />
                          <span>{profile.email}</span>
                        </div>
                      </td>

                      {/* Platform Role Selector */}
                      <td className="py-4 px-4">
                        <div className="relative inline-block w-40">
                          <select
                            value={profile.role || 'employee'}
                            disabled={updatingUserId === profile.id}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:ring-1 focus:ring-[#A855F7]/40 outline-none cursor-pointer disabled:opacity-50 transition-all font-semibold"
                          >
                            <option className="bg-[#0A0510]" value="admin">🛡️ Admin</option>
                            <option className="bg-[#0A0510]" value="manager">💼 Manager</option>
                            <option className="bg-[#0A0510]" value="employee">👥 Employee</option>
                          </select>
                        </div>
                      </td>

                      {/* Reporting Manager Assignment */}
                      <td className="py-4 px-4">
                        {profile.role === 'employee' ? (
                          <div className="relative inline-block w-52">
                            <select
                              value={profile.manager_id || 'none'}
                              disabled={updatingUserId === profile.id}
                              onChange={(e) => handleManagerChange(profile.id, e.target.value)}
                              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/90 focus:outline-none focus:ring-1 focus:ring-[#A855F7]/40 outline-none cursor-pointer disabled:opacity-50 transition-all font-medium"
                            >
                              <option className="bg-[#0A0510]" value="none">❌ Unassigned</option>
                              {managers
                                .filter(m => m.id !== profile.id) // Cannot report to self
                                .map(m => (
                                  <option className="bg-[#0A0510]" key={m.id} value={m.id}>
                                    👤 {m.name || m.email}
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs font-mono italic pl-2">
                            Not Applicable
                          </span>
                        )}
                      </td>

                      {/* Status indicator */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center h-8">
                          {updatingUserId === profile.id ? (
                            <Loader2 size={16} className="animate-spin text-[#A855F7]" />
                          ) : updateStatus[profile.id] === 'success' ? (
                            <div className="bg-emerald-500/20 text-emerald-400 p-1 rounded-full animate-in zoom-in-50 duration-200">
                              <Check size={12} className="stroke-[3px]" />
                            </div>
                          ) : updateStatus[profile.id] === 'error' ? (
                            <span className="text-rose-400 text-xs font-semibold">Failed</span>
                          ) : (
                            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
