"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getTeamGoalSheets, getGoalsBySheet } from '@/services/approvalService';
import { getAchievements, getCheckins, addManagerCheckin, upsertAchievement } from '@/services/achievementService';
import { useCycle } from '@/hooks/useCycle';
import { logAudit } from '@/services/auditService';
import { calculateProgress } from '@/services/progressService';
import { sendNotification } from '@/services/notificationService';
import { 
  Users, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  Loader2, 
  Target,
  CheckSquare,
  HelpCircle
} from 'lucide-react';

export default function ManagerCheckinView() {
  const { user } = useAuth();
  
  // Dynamically determine current active calendar quarter
  const getCurrentQuarter = () => {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'Q1';
    if (month >= 3 && month <= 5) return 'Q2';
    if (month >= 6 && month <= 8) return 'Q3';
    return 'Q4';
  };

  const { activeQuarter: ACTIVE_QUARTER } = useCycle();
const defaultQuarter = ACTIVE_QUARTER;
  const [activeQuarter, setActiveQuarter] = useState(defaultQuarter);
  const [teamSheets, setTeamSheets] = useState([]);
  const [expandedSheetId, setExpandedSheetId] = useState(null);
  const [expandedData, setExpandedData] = useState({ goals: [], achievements: [], checkins: [] });
  const [loading, setLoading] = useState(true);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // States to hold editable manager comments per goal row
  const [rowComments, setRowComments] = useState({});

  // Manager overall check-in comments form states
  const [feedbackInput, setFeedbackInput] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Load all team members (only Approved goal sheets qualify for checkins)
  const fetchTeam = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const sheets = await getTeamGoalSheets(user.id);
      // Filter out non-approved goal sheets as check-ins are locked for draft/rejected sheets
      const approvedSheets = sheets.filter(s => s.status === 'Approved');
      
      // Pre-fetch achievement status for each sheet
      const sheetsWithSubmissions = await Promise.all(
        approvedSheets.map(async (sheet) => {
          const achievements = await getAchievements(sheet.id, activeQuarter);
          return {
            ...sheet,
            hasSubmissions: achievements.length > 0,
            achievementCount: achievements.length
          };
        })
      );

      setTeamSheets(sheetsWithSubmissions);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to retrieve team check-in data.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeQuarter]);

  // Minor spelling correction on catch finally blocker
  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Load detailed goals, achievements, and checkins when expanding a sheet
  const handleToggleExpand = async (sheetId) => {
    if (expandedSheetId === sheetId) {
      setExpandedSheetId(null);
      setExpandedData({ goals: [], achievements: [], checkins: [] });
      setRowComments({});
      return;
    }

    setExpandedSheetId(sheetId);
    setExpandedLoading(true);
    setFeedbackInput('');
    setSuccessMsg(null);
    try {
      console.log('Fetching with quarter:', activeQuarter);
const [goals, achievements, checkins] = await Promise.all([
  getGoalsBySheet(sheetId),
  getAchievements(sheetId, activeQuarter),
  getCheckins(sheetId, activeQuarter)
]);
console.log('Goals fetched:', goals);
console.log('Achievements fetched:', achievements);

      setExpandedData({ goals, achievements, checkins });

      // Initialize row comments state with already saved manager comments from achievements
      const initialComments = {};
      goals.forEach(goal => {
        const achievement = achievements.find(a => a.goal_id === goal.id);
        initialComments[goal.id] = achievement?.manager_comments || '';
      });

      // Look for any unsaved local draft for this expanded sheet
      let mergedComments = { ...initialComments };
      try {
        const draftKey = `alignx_manager_draft_row_${user?.id}_${activeQuarter}_${sheetId}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const draftComments = JSON.parse(savedDraft);
          Object.keys(draftComments).forEach(goalId => {
            if (initialComments[goalId] !== undefined) {
              mergedComments[goalId] = draftComments[goalId];
            }
          });
        }
      } catch (err) {
        console.error("Failed to load local manager row draft:", err);
      }
      setRowComments(mergedComments);

      // Load overall feedback input and rating drafts
      try {
        const feedbackKey = `alignx_manager_draft_feedback_${user?.id}_${activeQuarter}_${sheetId}`;
        const savedFeedback = localStorage.getItem(feedbackKey);
        setFeedbackInput(savedFeedback !== null ? savedFeedback : '');

        const ratingKey = `alignx_manager_draft_rating_${user?.id}_${activeQuarter}_${sheetId}`;
        const savedRating = localStorage.getItem(ratingKey);
        setFeedbackRating(savedRating !== null ? Number(savedRating) : 4);
      } catch (err) {
        console.error("Failed to load manager feedback draft:", err);
      }

    } catch (err) {
      console.error(err);
      setError('Error loading check-in details.');
    } finally {
      setExpandedLoading(false);
    }
  };

  // Update a single goal row comment in local state
  const handleRowCommentChange = (goalId, value) => {
    setRowComments(prev => {
      const updated = {
        ...prev,
        [goalId]: value
      };
      
      if (expandedSheetId) {
        const draftKey = `alignx_manager_draft_row_${user?.id}_${activeQuarter}_${expandedSheetId}`;
        try {
          localStorage.setItem(draftKey, JSON.stringify(updated));
        } catch (err) {
          console.error(err);
        }
      }
      return updated;
    });
  };

  // Update feedback input draft
  const handleFeedbackInputChange = (value) => {
    setFeedbackInput(value);
    if (expandedSheetId) {
      const draftKey = `alignx_manager_draft_feedback_${user?.id}_${activeQuarter}_${expandedSheetId}`;
      try {
        localStorage.setItem(draftKey, value);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Update rating draft
  const handleFeedbackRatingChange = (value) => {
    setFeedbackRating(value);
    if (expandedSheetId) {
      const draftKey = `alignx_manager_draft_rating_${user?.id}_${activeQuarter}_${expandedSheetId}`;
      try {
        localStorage.setItem(draftKey, value.toString());
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Submit complete check-in: Saves both manager comments per goal row & overall evaluation feedback
  const handleSubmitCheckin = async (e) => {
    e.preventDefault();
    if (!feedbackInput.trim() || !expandedSheetId) return;
     const sheet = teamSheets.find(s => s.id === expandedSheetId);

    setSubmittingFeedback(true);
    setSuccessMsg(null);
    try {
      // 1. Save all manager comments per goal row into Supabase achievements table
      await Promise.all(
        expandedData.goals.map(async (goal) => {
          const achievement = expandedData.achievements.find(a => a.goal_id === goal.id);
          
          // Construct achievement upsert package
          const achievementData = {
            goal_id: goal.id,
            goal_sheet_id: expandedSheetId,
            employee_id: sheet.employee_id,   // ← add this
            quarter: activeQuarter,
            planned: achievement?.planned !== undefined ? achievement.planned : null,
            actual: achievement?.actual !== undefined ? achievement.actual : null,
            status: achievement?.status || 'Not Started',
            employee_comments: achievement?.employee_comments || '',
            progress_score: achievement?.progress_score || 0,
            manager_comments: rowComments[goal.id] || ''
};

          // If the record exists, append the DB primary key so it updates cleanly
          if (achievement?.id) {
            achievementData.id = achievement.id;
          }

          await upsertAchievement(achievementData);
        })
      );

      // 2. Submit the overall check-in report to manager_checkins
      const checkinData = {
        goal_sheet_id: expandedSheetId,
        employee_id: sheet.employee_id,
        quarter: activeQuarter,
        comments: feedbackInput,
        rating: feedbackRating,
        manager_id: user.id
      };

      const newCheckin = await addManagerCheckin(checkinData);

      await logAudit({
        userId: user.id,
        userRole: 'manager',
        action: 'CHECKIN_SUBMITTED',
        tableName: 'checkins',
        recordId: expandedSheetId,
        newValue: { comments: feedbackInput, rating: feedbackRating },
        description: `Manager submitted check-in for ${activeQuarter}`
      });

      // Notify the employee whose sheet was reviewed
      if (sheet?.employee_id) {
        await sendNotification({
          userId: sheet.employee_id,
          title: 'Manager Check-in Submitted',
          message: `Your manager has submitted their ${activeQuarter} check-in review. Check your progress updates.`,
          type: 'info',
          link: '/employee/checkin'
        });
      }

      // 3. Clear drafts from localStorage
      try {
        localStorage.removeItem(`alignx_manager_draft_row_${user?.id}_${activeQuarter}_${expandedSheetId}`);
        localStorage.removeItem(`alignx_manager_draft_feedback_${user?.id}_${activeQuarter}_${expandedSheetId}`);
        localStorage.removeItem(`alignx_manager_draft_rating_${user?.id}_${activeQuarter}_${expandedSheetId}`);
      } catch (err) {
        console.error("Failed to clear manager drafts from localStorage:", err);
      }

      // 4. Update component state cleanly
      setExpandedData(prev => ({
        ...prev,
        checkins: [newCheckin, ...prev.checkins]
      }));

      setSuccessMsg("Check-in submitted successfully");
      setFeedbackInput('');
      
      // Update team summary counts dynamically
      fetchTeam();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      setError("Failed to save check-in comments. Please check connection.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Team Quarterly Check-ins</h1>
          <p className="text-white/60">Review achievements and submit feedback for your team members.</p>
        </div>

        <div className="bg-[#0A0510] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
          <Users size={18} className="text-[#A855F7]" />
          <span className="text-white/50 text-sm">Managed Team:</span>
          <span className="text-white font-bold bg-[#A855F7]/20 border border-[#A855F7]/30 px-2 py-0.5 rounded text-sm font-mono">
            {teamSheets.length} Approved
          </span>
        </div>
      </div>

      {/* Quarter Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {quarters.map((q) => {
          const isActive = q === activeQuarter;
          const isAllowed = q === ACTIVE_QUARTER;
          return (
            <button
              key={q}
              disabled={!isAllowed}
              onClick={() => {
                setActiveQuarter(q);
                setExpandedSheetId(null);
              }}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] text-white shadow-lg shadow-[#A855F7]/20 scale-105 border border-white/10 cursor-pointer'
                  : isAllowed
                  ? 'bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white cursor-pointer'
                  : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed opacity-40'
              }`}
            >
              {q} Evaluation
              {isAllowed && isActive && (
                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-xl">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-xl font-medium">
          {successMsg}
        </div>
      )}

      {/* Employee List Grid */}
      {teamSheets.length === 0 ? (
        <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-xl">
          <div className="bg-[#A855F7]/10 p-4 rounded-full mb-4 text-[#A855F7] border border-[#A855F7]/20">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Active Team Goal Sheets</h3>
          <p className="text-white/40 text-sm max-w-sm">
            Once your team members submit goal sheets and you approve them, they will appear here to start logging quarterly check-ins.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {teamSheets.map((sheet) => {
            const isExpanded = expandedSheetId === sheet.id;
            return (
              <div 
                key={sheet.id}
                className={`bg-[#0A0510]/60 backdrop-blur-md border rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
                  isExpanded ? 'border-[#A855F7]/40 ring-1 ring-[#A855F7]/20' : 'border-white/10'
                }`}
              >
                {/* Employee Summary Row Header Card */}
                <div 
                  onClick={() => handleToggleExpand(sheet.id)}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-sm">
                      {sheet.employee?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base">{sheet.employee?.name}</h4>
                      <p className="text-white/40 text-xs">Goal Sheet ID: #{sheet.id.slice(0,8)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
                    {/* Status Badge */}
                    {sheet.hasSubmissions ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-xl">
                        <CheckCircle size={12} />
                        Logged ({sheet.achievementCount} achievements)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-xl">
                        <AlertCircle size={12} />
                        Pending Log
                      </span>
                    )}

                    {isExpanded ? <ChevronUp className="text-white/60" /> : <ChevronDown className="text-white/60" />}
                  </div>
                </div>

                {/* Expanded Achievements Table & Manager Feedback Area */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-[#08030C]/40 p-5 space-y-6">
                    {expandedLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="w-8 h-8 text-[#A855F7] animate-spin mr-2" />
                        <span className="text-white/60 text-sm">Loading check-in data...</span>
                      </div>
                    ) : (
                      <>
                        {/* Achievements Grid Table */}
                        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0A0510]/80">
                          <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                              <tr className="bg-white/5 border-b border-white/10 text-white/70 text-xs uppercase tracking-wider">
                                <th className="p-3 font-semibold w-1/4">Objective</th>
                                <th className="p-3 font-semibold text-center w-[80px]">UoM</th>
                                <th className="p-3 font-semibold text-center w-[80px]">Target</th>
                                <th className="p-3 font-semibold text-center w-[90px]">Planned</th>
                                <th className="p-3 font-semibold text-center w-[150px]">Actual & Progress</th>
                                <th className="p-3 font-semibold text-center w-[110px]">Status</th>
                                <th className="p-3 font-semibold w-[200px]">Employee Comments</th>
                                <th className="p-3 font-semibold w-[240px]">Manager Comments</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                              {expandedData.goals.map((goal) => {
                                const achievement = expandedData.achievements.find(a => a.goal_id === goal.id);
                                const progressPct = achievement?.progress_score 
                                  ? Number(achievement.progress_score) 
                                  : achievement 
                                    ? calculateProgress(goal.uom_type, goal.target, achievement.actual)
                                    : 0;
                                console.log('achievement progress_score:', achievement?.progress_score, 'progressPct:', progressPct);

                                return (
                                  <tr key={goal.id} className="hover:bg-white/[0.01] align-middle">
                                    {/* Objective Column */}
                                    <td className="p-3 font-semibold text-white">{goal.title}</td>
                                    
                                    {/* UoM Badge */}
                                    <td className="p-3 text-center">
                                      <span className="bg-white/5 border border-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded font-mono uppercase">
                                        {goal.uom_type}
                                      </span>
                                    </td>
                                    
                                    {/* Target */}
                                    <td className="p-3 text-center font-mono text-white/80">{goal.target}</td>
                                    
                                    {/* Planned */}
                                    <td className="p-3 text-center font-mono text-white/50">
                                      {achievement?.planned !== undefined && achievement?.planned !== null ? achievement.planned : '-'}
                                    </td>
                                    
                                    {/* Actual & Dynamic Progress score nested next to each other */}
                                    <td className="p-3">
                                      <div className="flex items-center gap-2 justify-center">
                                        <span className="font-mono text-[#A855F7] font-bold text-sm">
                                          {achievement?.actual !== undefined && achievement?.actual !== null ? achievement.actual : '-'}
                                        </span>
                                        
                                        {achievement && (
                                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                                            progressPct >= 71 
                                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                              : progressPct >= 41 
                                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                          }`}>
                                            {progressPct}%
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    
                                    {/* Status Badge */}
                                    <td className="p-3 text-center">
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                        achievement?.status === 'Completed' 
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : achievement?.status === 'In Progress' 
                                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                          : achievement?.status === 'Missed'
                                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                          : 'bg-white/5 text-white/40 border border-white/5'
                                      }`}>
                                        {achievement?.status || 'Not Started'}
                                      </span>
                                    </td>

                                    {/* Employee Comments (Read-Only) */}
                                    <td className="p-3 text-white/60 text-xs italic break-words max-w-[200px]">
                                      {achievement?.employee_comments || <span className="text-white/20">No comments logged.</span>}
                                    </td>

                                    {/* Manager Comments (Editable input per goal row) */}
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        value={rowComments[goal.id] || ''}
                                        onChange={(e) => handleRowCommentChange(goal.id, e.target.value)}
                                        placeholder="Add coaching comment..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white placeholder-white/20 focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/30 transition-all text-xs"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Manager Quarter Feedback Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                          
                          {/* Submit Feedback form */}
                          <div className="bg-[#0A0510]/50 border border-white/10 rounded-xl p-5 space-y-4">
                            <h5 className="text-white font-bold text-sm flex items-center gap-2">
                              <MessageSquare size={16} className="text-[#A855F7]" />
                              Add Quarter Check-in Review
                            </h5>

                            <form onSubmit={handleSubmitCheckin} className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">Quarter Evaluation</label>
                                  <span className="text-white font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 inline-block font-mono text-xs">
                                    {activeQuarter} Review
                                  </span>
                                </div>

                                <div>
                                  <label className="text-[10px] text-white/50 uppercase tracking-wider block mb-1">Quarter Rating (1-5)</label>
                                  <select 
                                    value={feedbackRating}
                                    onChange={(e) => handleFeedbackRatingChange(Number(e.target.value))}
                                    className="bg-[#0A0510] border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs font-semibold focus:outline-none focus:border-[#A855F7]/50 cursor-pointer"
                                  >
                                    {[1, 2, 3, 4, 5].map(n => (
                                      <option key={n} value={n} className="bg-[#0A0510] text-white">
                                        {n} - {n === 5 ? 'Exceptional' : n === 4 ? 'Exceeded' : n === 3 ? 'Met' : n === 2 ? 'Needs Improvement' : 'Unsatisfactory'}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] text-white/50 uppercase tracking-wider block">Manager Review Comments</label>
                                <textarea
                                  required
                                  value={feedbackInput}
                                  onChange={(e) => handleFeedbackInputChange(e.target.value)}
                                  placeholder="Provide coaching feedback, note key achievements, or detail next steps..."
                                  rows={3}
                                  className="w-full bg-[#0A0510] border border-white/10 rounded-xl p-3 text-white placeholder-white/20 focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/30 transition-all text-xs"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={submittingFeedback}
                                className="flex items-center justify-center gap-1.5 bg-[#A855F7] hover:bg-[#8a3fd6] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-[#A855F7]/20 disabled:opacity-50 cursor-pointer"
                              >
                                {submittingFeedback ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <CheckSquare size={13} />
                                )}
                                Submit Check-in Feedback
                              </button>
                            </form>
                          </div>

                          {/* Historical Comments / Timeline Feed */}
                          <div className="bg-[#0A0510]/50 border border-white/10 rounded-xl p-5 space-y-4 flex flex-col">
                            <h5 className="text-white font-bold text-sm">
                              Check-in Timeline Reviews ({expandedData.checkins.length})
                            </h5>

                            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                              {expandedData.checkins.length === 0 ? (
                                <div className="text-white/30 text-xs italic py-6 text-center">
                                  No manager reviews logged for Q{activeQuarter.replace('Q', '')} yet.
                                </div>
                              ) : (
                                expandedData.checkins.map((checkin) => (
                                  <div key={checkin.id} className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-1.5">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="text-[#A855F7] font-bold">
                                        Rating: {checkin.rating}/5
                                      </span>
                                      <span className="text-white/40">
                                        {new Date(checkin.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-white/80 text-xs leading-relaxed">{checkin.comments}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
