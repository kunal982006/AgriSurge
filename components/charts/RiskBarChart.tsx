"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function colorForRisk(value: number) {
  if (value >= 0.7) return "var(--color-red)";
  if (value >= 0.4) return "var(--color-amber)";
  return "var(--color-emerald)";
}

export function RiskBarChart({
  data,
  categoryKey,
  valueKey,
  horizontal = false,
}: {
  data: Record<string, string | number>[];
  categoryKey: string;
  valueKey: string;
  horizontal?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 12, bottom: 0, left: horizontal ? 8 : -20 }}
      >
        <CartesianGrid stroke="var(--color-border)" vertical={horizontal} horizontal={!horizontal} strokeDasharray="0" />
        {horizontal ? (
          <>
            <XAxis type="number" domain={[0, 1]} tick={{ fill: "var(--color-text-dim)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey={categoryKey}
              tick={{ fill: "var(--color-text-muted)", fontSize: 11.5 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={categoryKey} tick={{ fill: "var(--color-text-dim)", fontSize: 11 }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
            <YAxis domain={[0, 1]} tick={{ fill: "var(--color-text-dim)", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
          </>
        )}
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: 6,
            fontSize: 12,
          }}
          cursor={{ fill: "var(--color-surface-raised)" }}
          formatter={(value) => [Number(value).toFixed(2), "Avg. risk"]}
        />
        <Bar dataKey={valueKey} radius={horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]} maxBarSize={horizontal ? 14 : 32}>
          {data.map((entry, i) => (
            <Cell key={i} fill={colorForRisk(Number(entry[valueKey]))} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
