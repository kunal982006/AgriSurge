"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, BarChart3, TrendingUp, AlertTriangle, Leaf } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/primitives";
import { RiskTrendChart } from "@/components/charts/RiskTrendChart";
import { PremiumTrendChart } from "@/components/charts/PremiumTrendChart";
import { RiskBarChart } from "@/components/charts/RiskBarChart";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import type {
  TrendPoint,
  PremiumPoint,
  RegionalRiskPoint,
  CropRiskPoint,
  RiskDistributionPoint,
} from "@/lib/policy/policyDataAdapter";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalyticsData {
  riskTrend: TrendPoint[];
  premiumTrend: PremiumPoint[];
  regionalRisk: RegionalRiskPoint[];
  cropRisk: CropRiskPoint[];
  riskDistribution: RiskDistributionPoint[];
  totalPolicies: number;
  highRiskCount: number;
  avgRiskScore: number;
  totalPremium: number;
  availableRegions: string[];
  availableCrops: string[];
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="h-[220px] px-4 py-4 flex items-end gap-2 animate-pulse">
      {[65, 45, 80, 55, 70, 40, 90, 60].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-[3px] bg-[var(--color-surface-raised)]"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[var(--color-border-strong)] py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-raised)]">
        <BarChart3 size={22} className="text-[var(--color-text-dim)]" />
      </div>
      <h3 className="text-[14px] font-semibold text-[var(--color-text)]">No policy data available yet</h3>
      <p className="mt-2 max-w-xs text-[12px] text-[var(--color-text-muted)] leading-relaxed">
        Complete a risk assessment and submit for underwriting to generate portfolio analytics.
      </p>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] text-[var(--color-text-muted)]">{label}</span>
        <Icon size={14} className={accent || "text-[var(--color-text-dim)]"} />
      </div>
      <p className={`tnum text-[22px] font-bold ${accent || "text-[var(--color-text)]"}`}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--color-text-dim)]">{sub}</p>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Filters
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [cropFilter,   setCropFilter]   = useState("ALL");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (regionFilter !== "ALL") params.set("region", regionFilter);
      if (cropFilter   !== "ALL") params.set("crop",   cropFilter);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [regionFilter, cropFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Export CSV of aggregated data
  const handleExportCsv = () => {
    if (!data) return;
    const rows: string[][] = [
      ["Metric", "Period / Category", "Value"],
      ...data.riskTrend.map((r) => ["Risk Trend", r.month, r.avgRisk.toFixed(4)]),
      ...data.premiumTrend.map((r) => ["Premium Trend", r.month, r.premium.toFixed(0)]),
      ...data.regionalRisk.map((r) => ["Regional Risk", r.region, r.avgRisk.toFixed(4)]),
      ...data.cropRisk.map((r) => ["Crop Risk", r.crop, r.avgRisk.toFixed(4)]),
      ...data.riskDistribution.map((r) => ["Risk Distribution", r.level, String(r.count)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `agrisurge-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasData = data && data.totalPolicies > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Reports & Analytics</h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            {hasData
              ? `Portfolio insights across ${data.totalPolicies} policy ${data.totalPolicies === 1 ? "record" : "records"}`
              : "Portfolio-level risk and premium analytics"}
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={!hasData}
          className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] px-3 py-2 text-[12px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] disabled:opacity-40"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)]"
        >
          <option value="ALL">All regions</option>
          {(data?.availableRegions || []).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          value={cropFilter}
          onChange={(e) => setCropFilter(e.target.value)}
          className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)]"
        >
          <option value="ALL">All crops</option>
          {(data?.availableCrops || []).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {(regionFilter !== "ALL" || cropFilter !== "ALL") && (
          <button
            onClick={() => { setRegionFilter("ALL"); setCropFilter("ALL"); }}
            className="rounded-[6px] border border-[var(--color-border)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-dim)] hover:border-[var(--color-border-strong)]"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Error ─────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 rounded-[7px] border border-[var(--color-red)]/20 bg-[var(--color-red)]/5 px-3 py-2.5 text-[12.5px] text-[var(--color-red)]">
          <AlertTriangle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {!loading && !error && !hasData && <EmptyState />}

      {/* ── Summary stat cards ────────────────────────────────────── */}
      {(loading || hasData) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[90px] animate-pulse rounded-[8px] bg-[var(--color-surface-raised)]" />
            ))
          ) : (
            <>
              <StatCard
                label="Total Policies"
                value={String(data!.totalPolicies)}
                icon={BarChart3}
              />
              <StatCard
                label="High Risk Policies"
                value={String(data!.highRiskCount)}
                sub={`${data!.totalPolicies > 0 ? Math.round((data!.highRiskCount / data!.totalPolicies) * 100) : 0}% of portfolio`}
                icon={AlertTriangle}
                accent="text-[var(--color-red)]"
              />
              <StatCard
                label="Avg. Risk Score"
                value={`${(data!.avgRiskScore * 100).toFixed(1)}%`}
                icon={TrendingUp}
                accent={
                  data!.avgRiskScore >= 0.7
                    ? "text-[var(--color-red)]"
                    : data!.avgRiskScore >= 0.4
                    ? "text-[var(--color-amber)]"
                    : "text-[var(--color-emerald)]"
                }
              />
              <StatCard
                label="Total Premium"
                value={`₹${data!.totalPremium.toLocaleString("en-IN")}`}
                icon={Leaf}
                accent="text-[var(--color-emerald)]"
              />
            </>
          )}
        </div>
      )}

      {/* ── Charts grid ───────────────────────────────────────────── */}
      {(loading || hasData) && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Risk Trend */}
          <Card>
            <CardHeader
              title="Risk trend over time"
              subtitle="Average portfolio risk score by submission month"
            />
            {loading ? (
              <ChartSkeleton />
            ) : data!.riskTrend.length > 0 ? (
              <div className="h-[220px] px-4 py-4">
                <RiskTrendChart data={data!.riskTrend} />
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-[12px] text-[var(--color-text-dim)]">
                Not enough data points yet
              </div>
            )}
          </Card>

          {/* Premium Trend */}
          <Card>
            <CardHeader
              title="Premium trend"
              subtitle="Total recommended premium by submission month"
            />
            {loading ? (
              <ChartSkeleton />
            ) : data!.premiumTrend.length > 0 ? (
              <div className="h-[220px] px-4 py-4">
                <PremiumTrendChart data={data!.premiumTrend} />
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-[12px] text-[var(--color-text-dim)]">
                No premium data available
              </div>
            )}
          </Card>

          {/* Regional Risk */}
          <Card>
            <CardHeader
              title="Regional risk comparison"
              subtitle="Average risk score by district"
            />
            {loading ? (
              <ChartSkeleton />
            ) : data!.regionalRisk.length > 0 ? (
              <div className="h-[220px] px-4 py-4">
                <RiskBarChart
                  data={data!.regionalRisk}
                  categoryKey="region"
                  valueKey="avgRisk"
                  horizontal
                />
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-[12px] text-[var(--color-text-dim)]">
                No regional data available
              </div>
            )}
          </Card>

          {/* Crop Risk */}
          <Card>
            <CardHeader
              title="Crop-wise risk"
              subtitle="Average risk score by crop type"
            />
            {loading ? (
              <ChartSkeleton />
            ) : data!.cropRisk.length > 0 ? (
              <div className="h-[220px] px-4 py-4">
                <RiskBarChart
                  data={data!.cropRisk}
                  categoryKey="crop"
                  valueKey="avgRisk"
                  horizontal
                />
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-[12px] text-[var(--color-text-dim)]">
                No crop data available
              </div>
            )}
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader title="Risk distribution" subtitle="Policies by risk level" />
            {loading ? (
              <div className="h-[200px] animate-pulse rounded-[6px] bg-[var(--color-surface-raised)] mx-4 mb-4" />
            ) : (
              <div className="px-4 pb-4">
                <RiskDistributionChart data={data!.riskDistribution} />
                {/* Legend */}
                <div className="mt-3 flex items-center justify-center gap-5">
                  {data!.riskDistribution.map((d) => (
                    <div key={d.level} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: d.fill }}
                      />
                      {d.level}
                      <span className="tnum text-[var(--color-text-dim)]">({d.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* High-Risk Regions */}
          <Card>
            <CardHeader
              title="High-risk regions"
              subtitle="Districts with average risk score ≥ 0.55"
            />
            {loading ? (
              <div className="divide-y divide-[var(--color-border)]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="h-3 w-28 animate-pulse rounded bg-[var(--color-surface-raised)]" />
                    <div className="h-3 w-10 animate-pulse rounded bg-[var(--color-surface-raised)]" />
                  </div>
                ))}
              </div>
            ) : (() => {
              const highRisk = data!.regionalRisk.filter((r) => r.avgRisk >= 0.55);
              return highRisk.length > 0 ? (
                <ul className="divide-y divide-[var(--color-border)]">
                  {highRisk.map((r) => (
                    <li
                      key={r.region}
                      className="flex items-center justify-between px-4 py-3 text-[12.5px]"
                    >
                      <span className="text-[var(--color-text-muted)]">{r.region}</span>
                      <span className="tnum text-[var(--color-red)]">
                        {(r.avgRisk * 100).toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center px-4 py-6 text-[12px] text-[var(--color-text-dim)]">
                  No high-risk regions in current dataset
                </div>
              );
            })()}
          </Card>
        </div>
      )}
    </div>
  );
}
