"use client";

import React from 'react';
import { Edit2, Trash2, AlertCircle } from 'lucide-react';

export const getStatusBadgeStyle = (status) => {
  switch (status) {
    case 'Draft': return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    case 'Submitted': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'Approved': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'Rejected': return 'bg-red-500/10 text-red-400 border border-red-500/20';
    default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  }
};

export default function GoalTable({ 
  goals = [], 
  goalSheetStatus = 'Draft', // Determines if goals can be edited/deleted
  isEditable = false,
  onEdit, 
  onDelete 
}) {

  if (!goals || goals.length === 0) {
    return (
      <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl p-10 shadow-xl w-full text-center flex flex-col items-center justify-center">
        <div className="bg-white/5 p-4 rounded-full mb-4">
          <AlertCircle size={32} className="text-[#A855F7]/50" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Goals Found</h3>
        <p className="text-white/50 max-w-sm">
          You haven't added any goals to this sheet yet. Start by creating your first goal above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-white/70 text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Description</th>
              <th className="p-4 font-semibold whitespace-nowrap">Target</th>
              <th className="p-4 font-semibold whitespace-nowrap">UoM</th>
              <th className="p-4 font-semibold whitespace-nowrap">Weightage</th>
              <th className="p-4 font-semibold whitespace-nowrap">Status</th>
              {isEditable && (
                <th className="p-4 font-semibold text-right whitespace-nowrap">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {goals.map((goal) => (
              <tr 
                key={goal.id} 
                className="hover:bg-white/[0.02] transition-colors group"
              >
                <td className="p-4 text-white font-medium max-w-[200px] truncate" title={goal.title}>
                  {goal.title}
                </td>
                <td className="p-4 text-white/60 text-sm max-w-[300px] truncate" title={goal.description}>
                  {goal.description}
                </td>
                <td className="p-4 text-white font-mono text-sm">
                  {goal.target}
                </td>
                <td className="p-4 text-white/80 text-sm">
                  <span className="bg-[#A855F7]/10 text-[#A855F7] px-2 py-1 rounded-md text-xs font-bold tracking-wider">
                    {goal.uom_type}
                  </span>
                </td>
                <td className="p-4 text-white font-mono text-sm">
                  {goal.weightage}%
                </td>
                <td className="p-4 text-white/80 text-sm">
                  {/* Using goalSheetStatus here as goals often share the sheet's status, or fallback to goal.status */}
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold tracking-wider ${
                    getStatusBadgeStyle(goal.status || goalSheetStatus)
                  }`}>
                    {goal.status || goalSheetStatus}
                  </span>
                </td>
                
                {isEditable && (
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit && onEdit(goal)}
                        className="p-2 bg-white/5 hover:bg-[#A855F7]/20 text-white/60 hover:text-[#A855F7] rounded-lg transition-colors"
                        title="Edit Goal"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(goal.id)}
                        className="p-2 bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
