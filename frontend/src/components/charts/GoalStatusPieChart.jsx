"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

export default function GoalStatusPieChart({ achievementData = [] }) {
  // Aggregate status distribution dynamically
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let missed = 0;

  achievementData.forEach((row) => {
    const score = row.progressScore || 0;
    const isCompleted = score >= 100;
    const isInProgress = score > 0 && score < 100;
    
    if (isCompleted) {
      completed++;
    } else if (isInProgress) {
      inProgress++;
    } else {
      // If score is 0: Check sheet/goal status to decide if Missed or Not Started
      const isApprovedOrRejected = row.sheetStatus === "Approved" || row.sheetStatus === "Rejected";
      if (isApprovedOrRejected) {
        missed++;
      } else {
        notStarted++;
      }
    }
  });

  const data = [
    { name: "Completed", value: completed, color: "#10B981" },
    { name: "In Progress", value: inProgress, color: "#3B82F6" },
    { name: "Not Started", value: notStarted, color: "#6B7280" },
    { name: "Missed", value: missed, color: "#EF4444" }
  ].filter((item) => item.value > 0);

  const totalGoals = completed + inProgress + notStarted + missed;

  // Custom tool tip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const percent = totalGoals > 0 ? Math.round((entry.value / totalGoals) * 100) : 0;
      return (
        <div className="bg-[#18181B]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block animate-pulse"
              style={{ backgroundColor: entry.payload.color }}
            />
            <span className="text-white font-bold text-sm">{entry.name}</span>
          </div>
          <p className="text-white/60 text-xs font-semibold">
            Count: <strong className="text-white font-mono">{entry.value} goals</strong> ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl w-full h-[360px] flex flex-col justify-between">
      <div>
        <h3 className="text-white font-bold text-sm uppercase tracking-wider text-white/60">
          Goal Status Distribution
        </h3>
        <p className="text-xs text-white/40 mt-1">
          Visual breakdown of operational goal statuses.
        </p>
      </div>

      {totalGoals === 0 ? (
        <div className="h-48 flex items-center justify-center text-white/30 text-xs italic">
          No goal status metrics available
        </div>
      ) : (
        <div className="flex-1 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                content={({ payload }) => (
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-white/60">
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: entry.payload.color }}
                        />
                        {entry.value} ({entry.payload.value})
                      </div>
                    ))}
                  </div>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Central Summary Count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-9">
            <span className="text-white font-extrabold text-2xl font-mono leading-none">
              {totalGoals}
            </span>
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-1">
              Total Goals
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
