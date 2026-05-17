"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApprovals } from '@/hooks/useApprovals';
import ApprovalDashboard from '@/modules/approvals/ApprovalDashboard';
import GoalReviewPanel from '@/modules/approvals/GoalReviewPanel';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Loader2, LayoutDashboard, Clock, CheckCircle2, XCircle, Users, CheckSquare, Target } from 'lucide-react';
import { ACTIVE_QUARTER } from '@/utils/constants';
import { getAchievements } from '@/services/achievementService';
import ManagerLayout from '@/layouts/ManagerLayout';
import { supabase } from '@/lib/supabase';
import BorderGlow from '@/components/backgrounds/BorderGlow';

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const {
    teamSheets,
    selectedSheetGoals,
    loading,
    error,
    stats,
    fetchTeamSheets,
    fetchSheetGoals,
    approveSheet,
    rejectSheet,
    updateGoal
  } = useApprovals() as any;

  const [selectedSheet, setSelectedSheet] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<any>(null); // { type: 'Approve' | 'Reject', sheetId, comments }
  const [successMessage, setSuccessMessage] = useState('');
  const [checkinStats, setCheckinStats] = useState({ submitted: 0, pending: 0, avgProgress: 0 });
  const [loadingCheckins, setLoadingCheckins] = useState(false);
  const [teamSize, setTeamSize] = useState(0);

  // Initial Data Fetch
  useEffect(() => {
    if (user?.id) {
      fetchTeamSheets(user.id);
      
      // Fetch exact team size from profiles
      const fetchTeamSize = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('manager_id', user.id)
          .eq('role', 'employee');
        if (!error && data) {
          setTeamSize(data.length);
        }
      };
      fetchTeamSize();
    }
  }, [user?.id, fetchTeamSheets]);

  // Load team check-in submission and progress stats dynamically
  useEffect(() => {
    const fetchCheckinStats = async () => {
      const approvedSheets = teamSheets.filter((s: any) => s.status === 'Approved');
      if (approvedSheets.length === 0) {
        setCheckinStats({ submitted: 0, pending: 0, avgProgress: 0 });
        return;
      }

      setLoadingCheckins(true);
      try {
        let submittedCount = 0;
        let totalProgressSum = 0;
        let totalAchievementsCount = 0;

        await Promise.all(
          approvedSheets.map(async (sheet: any) => {
            const achievements = await getAchievements(sheet.id, ACTIVE_QUARTER);
            const hasSubmissions = achievements.length > 0;
            if (hasSubmissions) {
               submittedCount++;
               const sheetProgressSum = achievements.reduce((acc: number, a: any) => acc + (a.progress_percentage || 0), 0);
               totalProgressSum += sheetProgressSum;
               totalAchievementsCount += achievements.length;
            }
          })
        );

        const pendingCount = approvedSheets.length - submittedCount;
        const avgProgress = totalAchievementsCount > 0 
          ? Math.round(totalProgressSum / totalAchievementsCount)
          : 0;

        setCheckinStats({
          submitted: submittedCount,
          pending: pendingCount,
          avgProgress
        });
      } catch (err) {
        console.error("Failed to load team checkin stats:", err);
      } finally {
        setLoadingCheckins(false);
      }
    };

    if (teamSheets.length > 0) {
      fetchCheckinStats();
    }
  }, [teamSheets]);

  // Handle click inline on dashboard! No more routing to empty approvals pages!
  const handleReviewClick = async (sheet: any) => {
    setSelectedSheet(sheet);
    await fetchSheetGoals(sheet.id);
  };

  const handleClosePanel = () => {
    setSelectedSheet(null);
  };

  const initiateApprove = (sheetId: any, comments: any) => {
    setConfirmAction({ type: 'Approve', sheetId, comments });
  };

  const initiateReject = (sheetId: any, comments: any) => {
    if (!comments || comments.trim() === '') {
      alert("Please provide comments before rejecting a goal sheet.");
      return;
    }
    setConfirmAction({ type: 'Reject', sheetId, comments });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    
    try {
      if (confirmAction.type === 'Approve') {
        await approveSheet(confirmAction.sheetId, user.id, confirmAction.comments);
        setSuccessMessage('Goal sheet approved successfully!');
      } else if (confirmAction.type === 'Reject') {
        await rejectSheet(confirmAction.sheetId, user.id, confirmAction.comments);
        setSuccessMessage('Goal sheet rejected and returned to employee.');
      }
      
      // Cleanup UI
      setConfirmAction(null);
      setSelectedSheet(null);
      
      // Auto-refresh team stats and sheets
      if (user?.id) {
        await fetchTeamSheets(user.id);
      }
      
      // Auto-hide success message after 3s
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ManagerLayout>
      <div className="space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#A855F7]/20 rounded-xl">
            <LayoutDashboard size={28} className="text-[#A855F7]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Manager Dashboard</h1>
            <p className="text-white/50 mt-1">
              Overview of your team's goal management pipeline.
            </p>
          </div>
        </div>

        {/* Global Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl shadow-lg">
            {error}
          </div>
        )}

        {/* Success Toast */}
        {successMessage && (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 size={20} />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Summary Stat Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Team Size */}
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
                <div className="text-white/50 text-sm font-semibold tracking-wider uppercase mb-2">Team Size</div>
                <div className="text-4xl font-bold text-white">{teamSize} {teamSize === 1 ? 'Employee' : 'Employees'}</div>
              </div>
            </BorderGlow>

            {/* Pending Approvals */}
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
                <div className="text-amber-400/80 text-sm font-semibold tracking-wider uppercase mb-2">Pending Approvals</div>
                <div className="text-4xl font-bold text-amber-400">{stats?.pending || 0} Sheets</div>
              </div>
            </BorderGlow>

            {/* Average Team Progress */}
            <BorderGlow
              edgeSensitivity={20}
              glowColor="280 80 70"
              backgroundColor="rgba(10, 5, 16, 0.6)"
              borderRadius={16}
              glowRadius={40}
              glowIntensity={1.0}
              colors={['#a855f7', '#c084fc', '#8b5cf6']}
              fillOpacity={0.1}
            >
              <div className="p-6 h-full relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-[#A855F7]">
                  <Target size={120} />
                </div>
                <div className="text-[#A855F7] text-sm font-semibold tracking-wider uppercase mb-2">Average Team Progress</div>
                <div className="text-4xl font-bold text-white font-mono flex items-baseline gap-1">
                  {loadingCheckins ? <Loader2 className="animate-spin text-white text-xs" size={24} /> : `${checkinStats.avgProgress}%`}
                </div>
              </div>
            </BorderGlow>
          </div>
        )}

        {/* Team Quarterly Check-ins Section Title */}
        {!loading && (
          <div className="pt-4 border-t border-white/5 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckSquare size={20} className="text-[#A855F7]" />
              Quarterly Check-In Pipeline ({ACTIVE_QUARTER})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Submitted Card */}
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
                    <CheckCircle2 size={120} />
                  </div>
                  <div className="text-emerald-400/80 text-sm font-semibold tracking-wider uppercase mb-2">Check-ins Submitted</div>
                  <div className="text-4xl font-bold text-white font-mono">
                    {loadingCheckins ? <Loader2 className="animate-spin text-white" size={24} /> : checkinStats.submitted}
                  </div>
                  <p className="text-[20px] text-white/40 mt-2">Active check-ins logged for approved goal sheets</p>
                </div>
              </BorderGlow>

              {/* Pending Card */}
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
                  <div className="text-amber-400/80 text-sm font-semibold tracking-wider uppercase mb-2">Pending Check-in</div>
                  <div className="text-4xl font-bold text-white font-mono">
                    {loadingCheckins ? <Loader2 className="animate-spin text-white" size={24} /> : checkinStats.pending}
                  </div>
                  <p className="text-[20px] text-white/40 mt-2">Approved goal sheets waiting for check-in submission</p>
                </div>
              </BorderGlow>

              {/* Average Progress Card */}
              <BorderGlow
                edgeSensitivity={20}
                glowColor="280 80 70"
                backgroundColor="rgba(10, 5, 16, 0.6)"
                borderRadius={16}
                glowRadius={40}
                glowIntensity={1.0}
                colors={['#a855f7', '#c084fc', '#8b5cf6']}
                fillOpacity={0.1}
              >
                <div className="p-6 h-full relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-[#A855F7]">
                    <Target size={120} />
                  </div>
                  <div className="text-[#A855F7] text-sm font-semibold tracking-wider uppercase mb-2">Team Average Progress</div>
                  <div className="text-4xl font-bold text-white font-mono flex items-baseline gap-1">
                    {loadingCheckins ? <Loader2 className="animate-spin text-white text-xs" size={24} /> : `${checkinStats.avgProgress}%`}
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          checkinStats.avgProgress >= 71 
                            ? 'bg-emerald-400' 
                            : checkinStats.avgProgress >= 41 
                            ? 'bg-amber-400' 
                            : 'bg-rose-400'
                        }`} 
                        style={{ width: `${checkinStats.avgProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </BorderGlow>
            </div>
          </div>
        )}

        {/* Dashboard Table */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Full Team List</h2>
          {loading && !selectedSheet ? (
            <div className="flex flex-col items-center justify-center p-20">
              <Loader2 className="w-10 h-10 text-[#A855F7] animate-spin mb-4" />
              <p className="text-white/50 font-medium">Fetching team submissions...</p>
            </div>
          ) : (
            <ApprovalDashboard 
              sheets={teamSheets} 
              onReview={handleReviewClick} 
            />
          )}
        </div>

      </div>

      {/* Review Modal Panel inline on Dashboard */}
      {selectedSheet && (
        <GoalReviewPanel
          sheet={selectedSheet}
          goals={selectedSheetGoals}
          onClose={handleClosePanel}
          onApprove={initiateApprove}
          onReject={initiateReject}
          onUpdateGoal={updateGoal}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={!!confirmAction}
          title={confirmAction.type === 'Approve' ? 'Approve Goal Sheet' : 'Reject Goal Sheet'}
          message={`Are you sure you want to ${confirmAction.type.toLowerCase()} this goal sheet? This action will be logged and the employee will be notified.`}
          confirmText={`Yes, ${confirmAction.type}`}
          cancelText="Cancel"
          onConfirm={executeAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </ManagerLayout>
  );
}
