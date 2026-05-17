"use client";

import { useState, useEffect } from 'react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import { useAuth } from '@/hooks/useAuth';
import { useGoals } from '@/hooks/useGoals';
import GoalForm from '@/modules/goal-management/GoalForm';
import GoalTable, { getStatusBadgeStyle } from '@/modules/goal-management/GoalTable';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Loader2, Send, AlertCircle, Lock, Calendar, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAchievements } from '@/services/achievementService';
import { ACTIVE_QUARTER } from '@/utils/constants';
import { useCycle } from '@/hooks/useCycle';
import BorderGlow from '@/components/backgrounds/BorderGlow';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { isGoalPhase, activePhase, loading: cycleLoading } = useCycle();
  const { 
    goalSheet, 
    goals, 
    loading: goalsLoading, 
    error, 
    addGoal, 
    editGoal, 
    removeGoal, 
    submitGoals 
  } = useGoals(user?.id);
  
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<any[]>([]);

  const sheetStatus = goalSheet?.status || 'Draft';
  const isDraft = sheetStatus === 'Draft';
  const isRejected = sheetStatus === 'Rejected';
  const isLocked = goalSheet?.is_locked === true;
  const isEditable = (isDraft || isRejected) && !isLocked && isGoalPhase;
  const loading = goalsLoading || cycleLoading;

  // Load achievement records for the active evaluation quarter
  useEffect(() => {
    if (goalSheet?.id) {
      getAchievements(goalSheet.id, ACTIVE_QUARTER)
        .then(setAchievements)
        .catch(console.error);
    }
  }, [goalSheet?.id]);

  useEffect(() => {
    if (isRejected && goalSheet?.id) {
      const fetchReason = async () => {
        const { data } = await supabase
          .from('approval_records')
          .select('comments')
          .eq('goal_sheet_id', goalSheet.id)
          .eq('action', 'Rejected')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data?.comments) {
          setRejectionReason(data.comments);
        }
      };
      fetchReason();
    }
  }, [isRejected, goalSheet?.id]);
  
  const totalWeightage = goals.reduce((acc: number, goal: any) => acc + (Number(goal.weightage) || 0), 0);

  const handleFormSubmit = async (goalData: any) => {
    try {
      if (editingGoal) {
        await editGoal(editingGoal.id, goalData);
        setEditingGoal(null); // Clear edit state after successful update
      } else {
        await addGoal(goalData);
      }
    } catch (err) {
      // The error is automatically caught and stored in the useGoals hook
      console.error(err);
    }
  };

  const handleEditClick = (goal: any) => {
    setEditingGoal(goal);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top where the form is
  };

  const handleDeleteClick = async (goalId: any) => {
    setGoalToDelete(goalId);
  };

  const confirmDelete = async () => {
    if (goalToDelete) {
      await removeGoal(goalToDelete);
      setGoalToDelete(null);
    }
  };

  const cancelDelete = () => {
    setGoalToDelete(null);
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
  };

  const handleSubmitSheet = async () => {
    setValidationError(null);
    setSuccessMsg(null);

    if (totalWeightage !== 100) {
      setValidationError(`Total weightage must equal exactly 100% before submitting. You currently have ${totalWeightage}%.`);
      return;
    }

    if (window.confirm('Are you sure you want to submit your goal sheet for approval? You will no longer be able to edit these goals.')) {
      setIsSubmitting(true);
      try {
        await submitGoals();
        setSuccessMsg("Goals submitted successfully!");
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Calculate quarterly summary statistics
  const averageProgress = goals.length > 0
    ? Math.round(
        goals.reduce((acc: number, goal: any) => {
          const ach = achievements.find(a => a.goal_id === goal.id);
          return acc + (ach ? ach.progress_percentage : 0);
        }, 0) / goals.length
      )
    : 0;

  const counts: any = { Completed: 0, 'In Progress': 0, 'Not Started': 0, Missed: 0 };
  goals.forEach((goal: any) => {
    const ach = achievements.find(a => a.goal_id === goal.id);
    const status = ach?.status || 'Not Started';
    if (counts[status] !== undefined) {
      counts[status]++;
    } else {
      counts['Not Started']++;
    }
  });

  // If not goal phase, show locked message
  if (!isGoalPhase && !cycleLoading) {
    return (
      <EmployeeLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-[#0A0510]/40 border border-white/10 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-2xl space-y-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div className="w-16 h-16 bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] rounded-full flex items-center justify-center shadow-lg shadow-[#A855F7]/5 animate-pulse">
            <Lock size={28} />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold text-white tracking-tight">Goal Sheet Locked</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Goal submission is only available during the Goal Setting phase.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-white/45 uppercase tracking-wider font-mono">
            Current Phase: <span className="text-[#A855F7] font-bold">{activePhase || 'None'}</span>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-8">
        
        {/* Header & Status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">My Goal Sheet</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/60 text-sm">
              <span>Manage and track your performance objectives.</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/20" />
              <span className="inline-flex items-center gap-1 text-[#A855F7] font-semibold bg-[#A855F7]/10 border border-[#A855F7]/20 px-2.5 py-0.5 rounded-full text-xs font-mono">
                Cycle: {goalSheet?.cycle?.name || 'FY 2025-26'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-[#0A0510] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="text-white/50 text-sm">Status:</span>
              <span className={`text-sm font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                getStatusBadgeStyle(sheetStatus)
              }`}>
                {sheetStatus}
              </span>
            </div>
            
            {/* Submit Button (Only available if draft/rejected and there are goals) */}
            {isEditable && goals.length > 0 && (
              <button 
                onClick={handleSubmitSheet}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-[#A855F7] hover:bg-[#8a3fd6] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-[#A855F7]/25 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Submit for Approval
              </button>
            )}
          </div>
        </div>

        {/* Global Error Display */}
        {(error || validationError) && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl">
            {error || validationError}
          </div>
        )}

        {/* Global Success Display */}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-xl">
            {successMsg}
          </div>
        )}

        {/* Locked Banner */}
        {isLocked && (
          <div className="bg-[#0A0510]/60 backdrop-blur-md border border-[#A855F7]/30 text-[#A855F7] px-6 py-5 rounded-2xl flex items-center gap-3 shadow-lg shadow-[#A855F7]/10">
            <Lock size={20} className="text-[#A855F7]" />
            <span className="font-medium text-white/90">Your goals are locked after approval. No further edits can be made.</span>
          </div>
        )}

        {/* Rejection Reason Display */}
        {isRejected && rejectionReason && (
          <div className="bg-red-500/10 border border-red-500/30 px-6 py-5 rounded-2xl flex flex-col gap-2 shadow-lg shadow-red-500/5">
            <h3 className="text-red-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <AlertCircle size={18} /> Manager Feedback
            </h3>
            <p className="text-white/80 font-medium">{rejectionReason}</p>
          </div>
        )}

        {/* Overall Progress Summary Cards */}
        {goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Goals Card */}
            <BorderGlow
              edgeSensitivity={20}
              glowColor="270 80 70"
              backgroundColor="rgba(10, 5, 16, 0.6)"
              borderRadius={16}
              glowRadius={40}
              glowIntensity={1.0}
              colors={['#A855F7', '#c084fc', '#8b5cf6']}
              fillOpacity={0.1}
            >
              <div className="p-6 flex flex-col justify-between h-full relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Total Goals</p>
                    <h3 className="text-4xl font-extrabold text-white mt-2 font-mono">{goals.length}</h3>
                  </div>
                  <div className="bg-[#A855F7]/10 border border-[#A855F7]/25 text-[#A855F7] p-2.5 rounded-xl">
                    <Calendar size={20} />
                  </div>
                </div>
                <p className="text-[11px] text-white/40 mt-4">Goals registered for the current performance period</p>
              </div>
            </BorderGlow>

            {/* Average Progress Score Card */}
            <BorderGlow
              edgeSensitivity={20}
              glowColor={averageProgress >= 71 ? "140 80 70" : averageProgress >= 41 ? "40 80 70" : "0 80 70"}
              backgroundColor="rgba(10, 5, 16, 0.6)"
              borderRadius={16}
              glowRadius={40}
              glowIntensity={1.0}
              colors={
                averageProgress >= 71 
                  ? ['#10B981', '#34D399', '#059669'] 
                  : averageProgress >= 41 
                  ? ['#F59E0B', '#FBBF24', '#D97706'] 
                  : ['#EF4444', '#F87171', '#DC2626']
              }
              fillOpacity={0.1}
            >
              <div className="p-6 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Average Progress Score</p>
                    <h3 className="text-4xl font-bold text-white mt-1 font-mono tracking-tight flex items-baseline gap-1">
                      {averageProgress}%
                    </h3>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${
                    averageProgress >= 71 
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                      : averageProgress >= 41 
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' 
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                  }`}>
                    <Target size={20} />
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        averageProgress >= 71 
                          ? 'bg-emerald-400' 
                          : averageProgress >= 41 
                          ? 'bg-amber-400' 
                          : 'bg-rose-400'
                      }`} 
                      style={{ width: `${averageProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </BorderGlow>

            {/* Goals Completed Card */}
            <BorderGlow
              edgeSensitivity={20}
              glowColor="140 80 70"
              backgroundColor="rgba(10, 5, 16, 0.6)"
              borderRadius={16}
              glowRadius={40}
              glowIntensity={1.0}
              colors={['#10B981', '#34D399', '#059669']}
              fillOpacity={0.1}
            >
              <div className="p-6 flex flex-col justify-between h-full relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">Goals Completed</p>
                    <h3 className="text-4xl font-extrabold text-emerald-400 mt-2 font-mono">{counts.Completed}</h3>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-2.5 rounded-xl">
                    <span className="text-sm font-bold">100%</span>
                  </div>
                </div>
                <p className="text-[11px] text-white/40 mt-4">Goals that have hit 100% or greater progress levels</p>
              </div>
            </BorderGlow>
          </div>
        )}

        {/* Main Content Area */}
        {goalsLoading && !goals.length ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 size={32} className="text-[#A855F7] animate-spin" />
            </div>
          ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
            
            {/* Form Section (Left column, takes 1/3 space on large screens, hides if submitted/approved) */}
            {isEditable && (
              <div className="xl:col-span-1 sticky top-24">
                <GoalForm 
                  onSubmit={handleFormSubmit}
                  existingGoals={goals}
                  currentEditingGoal={editingGoal}
                  onCancel={editingGoal ? handleCancelEdit : null}
                />
              </div>
            )}

            {/* Table Section (Right column, expands if form is hidden) */}
            <div className={isEditable ? "xl:col-span-2" : "xl:col-span-3"}>
              <div className="flex justify-between items-end mb-4 px-2">
                <h2 className="text-xl font-bold text-white">Your Goals ({goals.length})</h2>
              </div>
              <GoalTable 
                goals={goals}
                goalSheetStatus={sheetStatus}
                isEditable={isEditable}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            </div>

          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal 
        isOpen={!!goalToDelete}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action cannot be undone and its weightage will be returned to your available pool."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </EmployeeLayout>
  );
}
