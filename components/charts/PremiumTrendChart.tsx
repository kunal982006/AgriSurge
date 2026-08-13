"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PremiumTrendChart({ data }: { data: { month: string; premium: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -4 }}>
        <defs>
          <linearGradient id="premiumFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-emerald)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-emerald)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="0" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "var(--color-text-dim)", fontSize: 11 }} axisLine={{ stroke: "var(--color-border)" }} tickLine={false} />
        <YAxis
          tick={{ fill: "var(--color-text-dim)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={54}
          tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: 6,
            fontSize: 12,
          }}
          formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Premium"]}
        />
        <Area type="monotone" dataKey="premium" stroke="var(--color-emerald)" strokeWidth={2} fill="url(#premiumFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
