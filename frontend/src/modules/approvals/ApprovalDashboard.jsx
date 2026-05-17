"use client";

import React from 'react';
import { getStatusBadgeStyle } from '@/modules/goal-management/GoalTable';
import { Eye, Clock, CheckCircle } from 'lucide-react';

export default function ApprovalDashboard({ sheets = [], onReview }) {
  if (!sheets || sheets.length === 0) {
    return (
      <div className="bg-[#0A0510]/60 backdrop-blur-md border border-white/10 rounded-2xl p-10 shadow-xl w-full text-center flex flex-col items-center justify-center">
        <div className="bg-emerald-500/10 p-4 rounded-full mb-4">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
        <p className="text-white/50 max-w-sm">
          There are currently no pending goal sheets requiring your approval. Your team is either still drafting or you've cleared your queue.
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
              <th className="p-4 font-semibold">Employee</th>
              <th className="p-4 font-semibold">Submitted On</th>
              <th className="p-4 font-semibold text-center">Goals</th>
              <th className="p-4 font-semibold text-center">Weightage</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sheets.map((sheet) => {
              // Calculate totals dynamically using the joined goals array
              const goalsCount = sheet.goals ? sheet.goals.length : 0;
              const totalWeightage = sheet.goals 
                ? sheet.goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0)
                : 0;

              // Format date
              const submittedDate = sheet.updated_at 
                ? new Date(sheet.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                : 'Unknown';

              const employeeName = sheet.employee?.name || 'Unknown Employee';
              const employeeEmail = sheet.employee?.email || 'No email provided';

              return (
                <tr 
                  key={sheet.id} 
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#A855F7]/80 to-[#B497CF]/80 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{employeeName}</div>
                        <div className="text-white/40 text-xs">{employeeEmail}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4 text-white/70 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-white/40" />
                      {submittedDate}
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white font-mono text-sm">
                      {goalsCount}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center justify-center rounded-lg px-3 py-1 font-mono text-sm border ${
                      totalWeightage === 100 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {totalWeightage}%
                    </span>
                  </td>

                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold tracking-wider ${
                      getStatusBadgeStyle(sheet.status)
                    }`}>
                      {sheet.status}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => onReview && onReview(sheet)}
                      className="inline-flex items-center gap-2 bg-[#A855F7]/10 hover:bg-[#A855F7]/20 border border-[#A855F7]/30 text-[#A855F7] px-4 py-2 rounded-xl transition-colors text-sm font-semibold shadow-lg shadow-[#A855F7]/5"
                    >
                      <Eye size={16} />
                      Review
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
