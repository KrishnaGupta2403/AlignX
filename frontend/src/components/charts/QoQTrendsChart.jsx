"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const COLORS = [
  "#A855F7", // Purple
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#14B8A6"  // Teal
];

export default function QoQTrendsChart({ reportData = [] }) {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  // Map data to Recharts format: [{ quarter: 'Q1', 'Alice': 80, 'Bob': 60 }, ...]
  const chartData = quarters.map((q) => {
    const point = { quarter: q };
    reportData.forEach((emp) => {
      point[emp.employeeName] = emp[q] !== undefined ? emp[q] : 0;
    });
    return point;
  });

  const employeeNames = reportData.map((emp) => emp.employeeName);

  // Custom tool tip component for modern aesthetics
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#18181B]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">
            Quarter Performance ({label})
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-6 text-sm">
                <span className="flex items-center gap-2 font-medium text-white/80">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: entry.stroke }}
                  />
                  {entry.name}
                </span>
                <span className="font-bold font-mono text-white">
                  {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
      <h3 className="text-white font-bold text-sm uppercase tracking-wider text-white/60 mb-6">
        Quarterly Progress Trends By Employee
      </h3>
      {reportData.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
          No quarterly trend data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="88%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="quarter"
              stroke="rgba(255,255,255,0.4)"
              tick={{ fontSize: 11, fontFamily: "monospace" }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.4)"
              tick={{ fontSize: 11, fontFamily: "monospace" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              content={({ payload }) => (
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-white/60 pt-4">
                  {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.value}
                    </div>
                  ))}
                </div>
              )}
            />
            {employeeNames.map((name, idx) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                animationDuration={500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
