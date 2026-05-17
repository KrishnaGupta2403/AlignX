"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGoals } from '@/hooks/useGoals';
import { useCheckins } from '@/hooks/useCheckins';
import { calculateProgress } from '@/services/progressService';
import { logAudit } from '@/services/auditService';
import { useCycle } from '@/hooks/useCycle';
import { 
  Calendar, 
  Target, 
  CheckCircle2, 
  Lock, 
  Loader2, 
  Save,
  HelpCircle
} from 'lucide-react';

export default function CheckinPage() {
  const { user } = useAuth();
  const { goalSheet, goals, loading: goalsLoading, error: goalsError } = useGoals(user?.id);

  // Dynamically determine current active calendar quarter
  const getCurrentQuarter = () => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 0 && month <= 2) return 'Q1';
    if (month >= 3 && month <= 5) return 'Q2';
    if (month >= 6 && month <= 8) return 'Q3';
    return 'Q4';
  };

  const { 
    activeQuarter: currentActiveQuarter, 
    isCheckinPhase, 
    activePhase, 
    loading: cycleLoading 
  } = useCycle();

  const {
    achievements,
    activeQuarter,
    setActiveQuarter,
    loading: achievementsLoading,
    error: achievementsError,
    fetchAchievements,
    saveAchievement
  } = useCheckins(currentActiveQuarter);

  const [rowInputs, setRowInputs] = useState({});
  const [savingGoalId, setSavingGoalId] = useState(null);
  const [savedGoalId, setSavedGoalId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Fetch achievements when the goal sheet is available and active quarter changes
  useEffect(() => {
    if (goalSheet?.id) {
      fetchAchievements(goalSheet.id, activeQuarter);
    }
  }, [goalSheet?.id, activeQuarter, fetchAchievements]);

  // Initialize row inputs from localStorage or database achievements
  useEffect(() => {
    if (goals.length > 0) {
      // 1. Get database values
      const dbInputs = {};
      goals.forEach((goal) => {
        const achievement = achievements.find((a) => a.goal_id === goal.id);
        dbInputs[goal.id] = {
          planned: achievement?.planned !== undefined && achievement?.planned !== null ? achievement.planned.toString() : '',
          actual: achievement?.actual !== undefined && achievement?.actual !== null ? achievement.actual.toString() : '',
          status: achievement?.status || 'Not Started',
          employee_comments: achievement?.employee_comments || ''
        };
      });

      // 2. Look for any unsaved local draft for this user & quarter
      let mergedInputs = { ...dbInputs };
      try {
        const draftKey = `alignx_checkin_drafts_${user?.id}_${activeQuarter}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const draftInputs = JSON.parse(savedDraft);
          Object.keys(draftInputs).forEach((goalId) => {
            if (dbInputs[goalId]) {
              mergedInputs[goalId] = {
                ...dbInputs[goalId],
                ...draftInputs[goalId]
              };
            }
          });
        }
      } catch (err) {
        console.error("Failed to load local checkin draft:", err);
      }

      setRowInputs(mergedInputs);
    }
  }, [goals, achievements, user?.id, activeQuarter]);

  // Handle single input field updates per row & auto-persist to localStorage
  const handleInputChange = (goalId, field, value) => {
    setRowInputs((prev) => {
      const updated = {
        ...prev,
        [goalId]: {
          ...prev[goalId],
          [field]: value
        }
      };
      
      try {
        const draftKey = `alignx_checkin_drafts_${user?.id}_${activeQuarter}`;
        localStorage.setItem(draftKey, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save checkin draft to localStorage:", err);
      }

      return updated;
    });
  };

  // Save achievement row directly in database
  const handleSaveRow = async (goal) => {
    if (!goalSheet) return;
    const inputs = rowInputs[goal.id];
    if (!inputs) return;

    setSavingGoalId(goal.id);
    setSuccessMsg(null);
    try {
      // Auto-calculate progress score
      const progressPercent = calculateProgress(goal.uom_type, goal.target, inputs.actual);

      const achievementData = {
        goal_id: goal.id,
        goal_sheet_id: goalSheet.id,
        employee_id: user.id,        // ← add this
        quarter: activeQuarter,
        planned: inputs.planned !== '' ? Number(inputs.planned) : null,
        actual: inputs.actual !== '' ? Number(inputs.actual) : null,
        status: inputs.status,
        employee_comments: inputs.employee_comments,
        progress_score: progressPercent
};

      await saveAchievement(achievementData);

await logAudit({
  userId: user.id,
  userRole: 'employee',
  action: 'ACHIEVEMENT_UPDATED',
  tableName: 'achievements',
  recordId: goal.id,
  newValue: achievementData,
  description: `Employee updated achievement for goal: "${goal.title}" in ${activeQuarter}`
});

setSavedGoalId(goal.id);
      setTimeout(() => setSavedGoalId(null), 3000);

      setSuccessMsg(`Achievement saved for goal: "${goal.title}"`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGoalId(null);
    }
  };

  // Only display checkins if sheet is Approved
  const isSheetApproved = goalSheet?.status === 'Approved';
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const statusOptions = ['Not Started', 'In Progress', 'Completed', 'Missed'];

  const hasLoadedData = goals.length > 0 && Object.keys(rowInputs).length > 0;

  if (cycleLoading || ((goalsLoading || achievementsLoading) && !hasLoadedData)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#A855F7] animate-spin mb-4" />
        <p className="text-white/60 font-medium">Loading quarterly objectives & achievements...</p>
      </div>
    );
  }

  if (!isCheckinPhase) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-[#0A0510]/40 border border-white/10 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-2xl space-y-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A855F7] to-indigo-500" />
        <div className="w-16 h-16 bg-[#A855F7]/10 border border-[#A855F7]/20 text-[#A855F7] rounded-full flex items-center justify-center shadow-lg shadow-[#A855F7]/5 animate-pulse">
          <Lock size={28} />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-bold text-white tracking-tight">Check-Ins Locked</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Quarterly check-ins are only available during Q1-Q4 phases.
          </p>
        </div>
        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-white/45 uppercase tracking-wider font-mono">
          Current Phase: <span className="text-[#A855F7] font-bold">{activePhase || 'None'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Quarterly Check-ins</h1>
          <p className="text-white/60">Log achievements and update actuals against approved goals.</p>
        </div>

        <div className="bg-[#0A0510] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
          <Calendar size={18} className="text-[#A855F7]" />
          <span className="text-white/50 text-sm">Active Quarter:</span>
          <span className="text-white font-bold bg-[#A855F7]/20 border border-[#A855F7]/30 px-2 py-0.5 rounded text-sm uppercase">
            {currentActiveQuarter}
          </span>
        </div>
      </div>

      {/* Quarter Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {quarters.map((q) => {
          const qIndex = quarters.indexOf(q);
          const activeIdx = quarters.indexOf(currentActiveQuarter);
          const isFuture = qIndex > activeIdx;
          const isSelected = q === activeQuarter;
          const isCurrentActive = q === currentActiveQuarter;

          return (
            <button
              key={q}
              disabled={isFuture}
              onClick={() => setActiveQuarter(q)}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isSelected
                  ? 'bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] text-white shadow-lg shadow-[#A855F7]/20 scale-105 border border-white/10 cursor-pointer'
                  : !isFuture
                  ? 'bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white cursor-pointer'
                  : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed opacity-40'
              }`}
            >
              {q} Evaluation
              {isCurrentActive && (
                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Global Message Banners */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-xl shadow-lg font-medium">
          {successMsg}
        </div>
      )}

      {(goalsError || achievementsError) && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl">
          {goalsError || achievementsError}
        </div>
      )}

      {/* Non-Approved Goal Sheet Guard */}
      {!isSheetApproved ? (
        <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-xl">
          <div className="bg-amber-500/10 p-4 rounded-full mb-4 border border-amber-500/20 text-amber-400">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Check-in Unavailable</h3>
          <p className="text-white/60 mb-4">
            Your goal sheet is currently in <span className="text-[#A855F7] font-semibold uppercase">{goalSheet?.status || 'Draft'}</span> status.
          </p>
          <p className="text-white/40 text-sm max-w-md">
            Quarterly achievements can only be logged for Approved goal sheets. Once your manager approves your sheet, this tab will unlock.
          </p>
        </div>
      ) : (
        /* Goals Achievement Update Table */
        <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-white/70 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold w-1/4">Goal Objective & Metrics</th>
                  <th className="p-4 font-semibold text-center w-[120px]">Planned Input</th>
                  <th className="p-4 font-semibold text-center w-[180px]">Actual Input</th>
                  <th className="p-4 font-semibold text-center w-[150px]">Status</th>
                  <th className="p-4 font-semibold w-[250px]">Employee Comments</th>
                  <th className="p-4 font-semibold text-right w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {goals.map((goal) => {
                  const inputs = rowInputs[goal.id] || {
                    planned: '',
                    actual: '',
                    status: 'Not Started',
                    employee_comments: ''
                  };

                  // Auto-calculate dynamic progress score (read-only)
                  const progressPct = calculateProgress(goal.uom_type, goal.target, inputs.actual);
                  const isSaving = savingGoalId === goal.id;

                  return (
                    <tr key={goal.id} className="hover:bg-white/[0.01] transition-colors group align-middle">
                      {/* Title & Static metrics */}
                      <td className="p-4">
                        <div className="font-semibold text-white group-hover:text-[#A855F7] transition-colors text-sm">
                          {goal.title}
                        </div>
                        <div className="flex gap-2 items-center mt-2">
                          <span className="bg-white/5 border border-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase">
                            {goal.uom_type}
                          </span>
                          <span className="text-white/40 text-[11px] font-mono">
                            Target: <strong className="text-white/80 font-bold">{goal.target}</strong>
                          </span>
                          
                          {/* Helper Mini-Tooltip */}
                          <div className="group/tip relative cursor-help">
                            <HelpCircle size={12} className="text-white/30 hover:text-[#A855F7] transition-colors" />
                            <span className="absolute left-0 bottom-full mb-1 w-64 bg-[#0A0510] border border-white/10 text-white/70 text-[10px] p-2 rounded shadow-2xl hidden group-hover/tip:block z-50 pointer-events-none leading-relaxed">
                              {goal.uom_type === 'MIN' && "MIN: Lower performs better. 0 actual yields 100% progress."}
                              {goal.uom_type === 'MAX' && "MAX: Higher performs better. Formula: (Actual / Target) * 100."}
                              {goal.uom_type === 'ZERO' && "ZERO: Reaching exactly 0 yields 100%. Anything else is 0%."}
                              {goal.uom_type === 'TIMELINE' && "TIMELINE: Enter percentage of timeline complete (0-100)."}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Planned Value Input */}
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          value={inputs.planned}
                          disabled={activeQuarter !== currentActiveQuarter}
                          onChange={(e) => handleInputChange(goal.id, 'planned', e.target.value)}
                          placeholder="Expected"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center text-white placeholder-white/20 focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/30 transition-all font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Actual Value Input & Instantly Displayed Color Coded Progress */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={inputs.actual}
                            disabled={activeQuarter !== currentActiveQuarter}
                            onChange={(e) => handleInputChange(goal.id, 'actual', e.target.value)}
                            placeholder="Reached"
                            className="w-[90px] bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center text-white placeholder-white/20 focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/30 transition-all font-mono text-sm font-semibold text-[#A855F7] disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          
                          {inputs.actual !== '' && (
                            <div className="flex flex-col items-start gap-1">
                              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 transition-colors ${
                                progressPct >= 71 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                  : progressPct >= 41 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              }`}>
                                {progressPct}%
                              </span>
                              <div className="w-12 bg-white/10 rounded-full h-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    progressPct >= 71 
                                      ? 'bg-emerald-400' 
                                      : progressPct >= 41 
                                      ? 'bg-amber-400' 
                                      : 'bg-rose-400'
                                  }`} 
                                  style={{ width: `${Math.min(100, progressPct)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-4 text-center">
                        <select
                          value={inputs.status}
                          disabled={activeQuarter !== currentActiveQuarter}
                          onChange={(e) => handleInputChange(goal.id, 'status', e.target.value)}
                          className="w-full bg-[#0F0A18] border border-white/10 rounded-xl px-3 py-1.5 text-white/80 text-xs font-semibold focus:outline-none focus:border-[#A855F7]/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-[#0A0510] text-white">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Employee Comments */}
                      <td className="p-4">
                        <input
                          type="text"
                          value={inputs.employee_comments}
                          disabled={activeQuarter !== currentActiveQuarter}
                          onChange={(e) => handleInputChange(goal.id, 'employee_comments', e.target.value)}
                          placeholder="Log progress comments..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white placeholder-white/20 focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/30 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>

                      {/* Save Action */}
                      <td className="p-4 text-right">
                        {activeQuarter !== currentActiveQuarter ? (
                          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/40 px-3 py-1.5 rounded-xl text-xs font-semibold">
                            <Lock size={12} className="shrink-0" />
                            Locked (Read-Only)
                          </span>
                        ) : savedGoalId === goal.id ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/5 animate-bounce">
                            <CheckCircle2 size={13} className="shrink-0" />
                            Saved
                          </span>
                        ) : (
                          <button
                            disabled={isSaving}
                            onClick={() => handleSaveRow(goal)}
                            className="inline-flex items-center gap-1.5 bg-[#A855F7]/10 hover:bg-[#A855F7]/20 border border-[#A855F7]/30 hover:border-[#A855F7]/50 text-[#A855F7] px-3.5 py-2 rounded-xl transition-all text-xs font-bold shadow-lg shadow-[#A855F7]/5 disabled:opacity-50"
                          >
                            {isSaving ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Save size={13} />
                            )}
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
