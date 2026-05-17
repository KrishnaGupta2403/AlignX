"use client";

import React, { useState } from 'react';
import { X, Edit2, Check, XCircle, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';

export default function GoalReviewPanel({ 
  sheet, 
  goals = [], 
  onApprove, 
  onReject, 
  onUpdateGoal, 
  onClose 
}) {
  const [comments, setComments] = useState('');
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [editValues, setEditValues] = useState({ target: '', weightage: '' });

  if (!sheet) return null;

  const employeeName = sheet.employee?.name || 'Unknown Employee';
  const totalWeightage = goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);
  const isReadOnly = sheet.status !== 'Submitted';

  const startEditing = (goal) => {
    if (isReadOnly) return;
    setEditingGoalId(goal.id);
    setEditValues({ target: goal.target, weightage: goal.weightage });
  };

  const cancelEditing = () => {
    setEditingGoalId(null);
    setEditValues({ target: '', weightage: '' });
  };

  const saveEditing = async (goalId) => {
    if (onUpdateGoal) {
      await onUpdateGoal(goalId, {
        target: Number(editValues.target),
        weightage: Number(editValues.weightage)
      });
    }
    setEditingGoalId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0A0510]/80 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-[#120A1A] border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              Reviewing Goals: <span className="text-[#A855F7]">{employeeName}</span>
            </h2>
            <p className="text-white/50 text-sm mt-1">
              Status: <span className="text-white font-medium uppercase tracking-wider text-xs px-2 py-1 rounded bg-white/5 border border-white/10 ml-2">{sheet.status}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Summary Banner */}
          <div className="flex items-center justify-between bg-[#A855F7]/10 border border-[#A855F7]/20 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#A855F7]/20 p-2 rounded-lg text-[#A855F7]">
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="text-white/70 text-sm">Total Goals</div>
                <div className="text-white font-bold text-lg">{goals.length}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${totalWeightage === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                <AlertCircle size={20} className={totalWeightage === 100 ? 'hidden' : 'block'} />
                {totalWeightage === 100 && <CheckCircle size={20} />}
              </div>
              <div className="text-right">
                <div className="text-white/70 text-sm">Total Weightage</div>
                <div className={`font-bold text-lg ${totalWeightage === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {totalWeightage}%
                </div>
              </div>
            </div>
          </div>

          {/* Goals Table */}
          <div className="bg-[#0A0510] border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-white/70 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold w-1/4">Title</th>
                  <th className="p-4 font-semibold w-1/3">Description</th>
                  <th className="p-4 font-semibold text-center">UoM</th>
                  <th className="p-4 font-semibold text-center">Target</th>
                  <th className="p-4 font-semibold text-center">Weight (%)</th>
                  {!isReadOnly && <th className="p-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {goals.map((goal) => {
                  const isEditing = editingGoalId === goal.id;

                  return (
                    <tr key={goal.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="text-white font-medium text-sm">{goal.title}</div>
                      </td>
                      <td className="p-4 text-white/60 text-xs leading-relaxed">
                        {goal.description}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 text-xs">
                          {goal.uom_type}
                        </span>
                      </td>

                      {/* Target Column */}
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.target}
                            onChange={(e) => setEditValues({...editValues, target: e.target.value})}
                            className="w-20 bg-[#1A0F2E] border border-[#A855F7]/50 rounded-md px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-[#A855F7]"
                          />
                        ) : (
                          <div className="text-white font-mono text-sm">{goal.target}</div>
                        )}
                      </td>

                      {/* Weightage Column */}
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.weightage}
                            onChange={(e) => setEditValues({...editValues, weightage: e.target.value})}
                            className="w-16 bg-[#1A0F2E] border border-[#A855F7]/50 rounded-md px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-[#A855F7]"
                          />
                        ) : (
                          <div className="text-white font-mono text-sm">{goal.weightage}%</div>
                        )}
                      </td>

                      {/* Actions Column */}
                      {!isReadOnly && (
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => saveEditing(goal.id)}
                                className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-md transition-colors"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={cancelEditing}
                                className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md transition-colors"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => startEditing(goal)}
                              className="p-1.5 text-white/40 hover:text-[#A855F7] hover:bg-[#A855F7]/10 rounded-md transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Comments Section */}
          {!isReadOnly && (
            <div className="bg-[#0A0510] border border-white/5 rounded-xl p-5">
              <label className="flex items-center gap-2 text-white/70 text-sm font-semibold mb-3 uppercase tracking-wider">
                <MessageSquare size={16} />
                Manager Comments
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Leave feedback or reasons for rejection here..."
                className="w-full bg-[#1A0F2E]/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7] transition-all resize-none h-24"
              />
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-4">
          {isReadOnly ? (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Close Review
            </button>
          ) : (
            <>
              <button
                onClick={() => onReject && onReject(sheet.id, comments)}
                className="px-6 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold hover:bg-red-500/20 transition-colors"
              >
                Reject Sheet
              </button>
              
              <button
                onClick={() => onApprove && onApprove(sheet.id, comments)}
                disabled={totalWeightage !== 100}
                className="px-6 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Approve Sheet
              </button>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
}
