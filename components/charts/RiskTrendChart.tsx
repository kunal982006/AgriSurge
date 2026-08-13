"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export function RiskTrendChart({ data }: { data: { month: string; avgRisk: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "var(--color-text-dim)", fontSize: 11 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 1]}
          tick={{ fill: "var(--color-text-dim)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: 6,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--color-text-muted)" }}
          formatter={(value) => [Number(value).toFixed(2), "Avg. risk"]}
        />
        <Line
          type="monotone"
          dataKey="avgRisk"
          stroke="var(--color-emerald)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-emerald)", strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
