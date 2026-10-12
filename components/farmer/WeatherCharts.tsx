"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface MonthlyData {
  month: string;
  rainfallMm: number;
}

interface YoYData {
  year: number;
  rainfallMm: number;
}

interface ForecastData {
  date: string;
  dayLabel: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
}

export function MonthlyRainfallChart({ data }: { data: MonthlyData[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: -16 }}>
          <defs>
            <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--color-text-dim)", fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-text-dim)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit=" mm"
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              fontSize: 12,
            }}
            labelStyle={{ fontWeight: "bold", color: "var(--color-text)" }}
            formatter={(value) => [`${Number(value).toFixed(1)} mm`, "पाऊस / Rainfall"]}
          />
          <Area
            type="monotone"
            dataKey="rainfallMm"
            stroke="#059669"
            strokeWidth={2.5}
            fill="url(#rainGradient)"
            dot={{ r: 3, fill: "#059669", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#10b981" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnnualYoYRainfallChart({ data }: { data: YoYData[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: -16 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fill: "var(--color-text-dim)", fontSize: 11, fontWeight: 600 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-text-dim)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit=" mm"
            width={52}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              fontSize: 12,
            }}
            labelStyle={{ fontWeight: "bold", color: "var(--color-text)" }}
            formatter={(value) => [`${Number(value).toFixed(1)} mm`, "वार्षिक पाऊस / Annual Rainfall"]}
          />
          <Bar
            dataKey="rainfallMm"
            fill="#047857"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ForecastPrecipChart({ data }: { data: ForecastData[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -20 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="dayLabel"
            tick={{ fill: "var(--color-text-dim)", fontSize: 11 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-text-dim)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            unit=" mm"
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-strong)",
              borderRadius: "0.75rem",
              boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              fontSize: 12,
            }}
            labelStyle={{ fontWeight: "bold", color: "var(--color-text)" }}
            formatter={(value, name) => [
              `${Number(value).toFixed(1)} mm`,
              name === "precipitationMm" ? "अंदाजित पाऊस / Forecast Rain" : String(name)
            ]}
          />
          <Bar
            dataKey="precipitationMm"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
