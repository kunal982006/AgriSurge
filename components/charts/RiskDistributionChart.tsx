"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function RiskDistributionChart({
  data,
}: {
  data: { level: string; count: number; fill: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="relative h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="level"
            innerRadius={52}
            outerRadius={72}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.level} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-[20px] font-semibold text-[var(--color-text)]">{total}</span>
        <span className="text-[10.5px] text-[var(--color-text-dim)]">farms</span>
      </div>
    </div>
  );
}
