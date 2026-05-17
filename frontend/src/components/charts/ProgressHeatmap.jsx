"use client";

import React from "react";

export default function ProgressHeatmap({ achievementData = [] }) {
  // Group achievements by employee name
  const grouped = {};
  achievementData.forEach((row) => {
    if (!grouped[row.employeeName]) {
      grouped[row.employeeName] = [];
    }
    grouped[row.employeeName].push(row);
  });

  const employees = Object.keys(grouped);
  const maxGoals = Math.max(...Object.values(grouped).map((arr) => arr.length), 0);

  const getCellBg = (score) => {
    if (score === undefined || score === null) return "bg-white/5 text-white/20 border-white/5";
    if (score >= 100) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30";
    if (score >= 75) return "bg-teal-500/20 text-teal-400 border-teal-500/30 hover:bg-teal-500/30";
    if (score >= 45) return "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30";
    if (score > 0) return "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30";
    return "bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30";
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-white font-bold text-sm uppercase tracking-wider text-white/60">
            Goal Progress Heatmap Grid
          </h3>
          <p className="text-xs text-white/40 mt-1">
            Visual alignment showing current performance score matrix across all team goals.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-white/50">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/30" />
            <span>Outstanding (≥100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-teal-500/20 border border-teal-500/30" />
            <span>High (75-99%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/30" />
            <span>Meets (45-74%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-500/20 border border-rose-500/30" />
            <span>Needs Action (0%)</span>
          </div>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="w-full py-12 flex items-center justify-center text-white/40 text-sm italic">
          No goal achievement data available to display heatmap
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider font-bold">
                <th className="py-4 px-6 text-left w-56">Employee Name</th>
                {Array.from({ length: maxGoals }).map((_, i) => (
                  <th key={i} className="py-4 px-4 text-center">
                    Goal {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {employees.map((name) => {
                const goals = grouped[name] || [];
                return (
                  <tr key={name} className="hover:bg-white/5 transition-colors">
                    <td className="py-5 px-6 font-semibold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#B497CF] flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate max-w-[160px]" title={name}>
                        {name}
                      </div>
                    </td>

                    {Array.from({ length: maxGoals }).map((_, i) => {
                      const goal = goals[i];
                      const score = goal ? Math.round(goal.progressScore) : undefined;

                      return (
                        <td key={i} className="py-4 px-4 text-center relative group">
                          {goal ? (
                            <>
                              <div
                                className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center font-bold font-mono text-xs shadow-md border transition-all duration-200 hover:scale-110 hover:shadow-lg ${getCellBg(
                                  score
                                )} cursor-default`}
                              >
                                {score}%
                              </div>

                              {/* CSS Hover Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-50 w-64 bg-[#18181B]/95 border border-white/15 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-left transition-all">
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#18181B] border-r border-b border-white/15 rotate-45" />
                                <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">
                                  Goal Details
                                </p>
                                <p className="text-white font-bold text-xs line-clamp-2 mb-3 leading-snug">
                                  {goal.goalTitle}
                                </p>
                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-semibold text-white/70">
                                  <div>
                                    Target: <span className="text-white font-mono">{goal.target}</span>
                                  </div>
                                  <div>
                                    Planned: <span className="text-white font-mono">{goal.planned}</span>
                                  </div>
                                  <div>
                                    Actual: <span className="text-white font-mono">{goal.actual}</span>
                                  </div>
                                  <div>
                                    Score:{" "}
                                    <span
                                      className={`font-mono ${
                                        score >= 100
                                          ? "text-emerald-400"
                                          : score >= 45
                                          ? "text-amber-400"
                                          : "text-rose-400"
                                      }`}
                                    >
                                      {score}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center font-semibold text-white/10 border border-white/5 bg-white/2 cursor-default">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
