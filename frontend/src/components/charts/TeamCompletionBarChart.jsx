"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

export default function TeamCompletionBarChart({ reportData = [] }) {
  const getBarColor = (score) => {
    if (score >= 75) return "#10B981"; // Emerald / Green
    if (score >= 45) return "#F59E0B"; // Amber / Yellow
    return "#EF4444"; // Rose / Red
  };

  const chartData = reportData.map((emp) => ({
    name: emp.employeeName,
    score: Math.round(emp.score || 0),
    email: emp.employeeEmail
  }));

  // Custom tool tip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="bg-[#18181B]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
          <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1">
            Performance Index
          </p>
          <p className="text-white font-bold text-sm mb-1">{entry.payload.name}</p>
          <p className="text-white/40 text-[10px] font-mono mb-2">{entry.payload.email}</p>
          <div className="flex items-center justify-between gap-6 text-sm font-semibold pt-1 border-t border-white/5">
            <span className="text-white/70">Average Progress:</span>
            <span
              className="font-mono text-base font-bold"
              style={{ color: getBarColor(entry.value) }}
            >
              {entry.value}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl w-full h-[360px] flex flex-col justify-between">
      <div>
        <h3 className="text-white font-bold text-sm uppercase tracking-wider text-white/60">
          Team Progress Leaderboard
        </h3>
        <p className="text-xs text-white/40 mt-1">
          Leaderboard mapping average achievement levels per employee.
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-white/30 text-xs italic">
          No team average statistics available
        </div>
      ) : (
        <div className="flex-1 relative mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10, fontWeight: 500 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10, fontWeight: 500 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
              <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={45}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.score)}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
