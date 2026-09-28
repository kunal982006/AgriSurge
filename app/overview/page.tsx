"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FileText,
  RefreshCw,
  Coins,
  ChevronRight,
  Activity,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { RiskBadge, StatusBadge } from "@/components/ui/primitives";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import { RegionalRiskMap } from "@/components/map/RegionalRiskMap";
import type { OverviewDashboardPayload } from "@/lib/analytics/overviewAnalytics";

// ─── Compact KPI Card ────────────────────────────────────────────────────────
function KpiMetric({
  label,
  value,
  subtext,
  icon: Icon,
  accent = "text-[var(--color-emerald)]",
  badge,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 transition-colors hover:border-[var(--color-border-strong)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">{label}</span>
        <Icon size={14} className={accent} />
      </div>

      <div className="mt-2.5">
        <div className="flex items-baseline gap-2">
          <span className="tnum text-[22px] font-bold tracking-tight text-[var(--color-text)]">{value}</span>
          {badge}
        </div>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-dim)] truncate">{subtext}</p>
      </div>
    </div>
  );
}

// ─── Compact Loading Skeleton ────────────────────────────────────────────────
function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-5 w-44 rounded bg-[var(--color-surface-raised)]" />
          <div className="h-3 w-64 rounded bg-[var(--color-surface-raised)]" />
        </div>
        <div className="h-7 w-48 rounded bg-[var(--color-surface-raised)]" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[8px] bg-[var(--color-surface-raised)]" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="h-[380px] rounded-[8px] bg-[var(--color-surface-raised)] lg:col-span-8" />
        <div className="h-[380px] rounded-[8px] bg-[var(--color-surface-raised)] lg:col-span-4" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-44 rounded-[8px] bg-[var(--color-surface-raised)]" />
        <div className="h-44 rounded-[8px] bg-[var(--color-surface-raised)]" />
      </div>
    </div>
  );
}

// ─── Main Overview Page ──────────────────────────────────────────────────────
export default function OverviewPage() {
  const [data, setData] = useState<OverviewDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchOverviewData = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (regionFilter !== "ALL") params.set("region", regionFilter);
        if (statusFilter !== "ALL") params.set("status", statusFilter);

        const res = await fetch(`/api/overview?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch overview analytics.");

        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          throw new Error(json.error || "Failed to load dashboard data.");
        }
      } catch (err: any) {
        setError(err.message || "Unable to load dashboard intelligence.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [regionFilter, statusFilter]
  );

  useEffect(() => {
    fetchOverviewData(false);
  }, [fetchOverviewData]);

  if (loading && !data) {
    return <OverviewSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[8px] border border-red-500/20 bg-red-500/5 py-14 text-center">
        <AlertTriangle size={28} className="text-red-400 mb-2" />
        <h3 className="text-[14px] font-semibold text-[var(--color-text)]">Failed to load overview data</h3>
        <p className="mt-1 text-[11.5px] text-[var(--color-text-dim)] max-w-sm">{error}</p>
        <button
          onClick={() => fetchOverviewData(true)}
          className="mt-3.5 rounded-[5px] bg-red-500/20 px-3 py-1.5 text-[11.5px] font-medium text-red-200 hover:bg-red-500/30"
        >
          Retry
        </button>
      </div>
    );
  }

  const total = data?.summary.totalPolicies || 0;
  const hasPolicies = total > 0;
  const isFiltered = regionFilter !== "ALL" || statusFilter !== "ALL";

  // Derived metrics
  const avgScore = data?.summary.averageRiskScore || 0;
  const avgRiskLevel: "low" | "moderate" | "high" =
    avgScore >= 70 ? "high" : avgScore >= 40 ? "moderate" : "low";

  const highRiskCount = data?.summary.highRiskCount || 0;
  const highRiskPct = total > 0 ? Math.round((highRiskCount / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 text-[var(--color-text)]">
      {/* ── 1. Compact Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight text-[var(--color-text)]">Portfolio Overview</h1>
          <p className="mt-0.5 text-[12px] text-[var(--color-text-dim)]">
            {hasPolicies
              ? `Real-time view of ${total} underwriting ${total === 1 ? "policy" : "policies"}`
              : "No underwriting policies registered yet"}
          </p>
        </div>

        {/* Filters & Refresh */}
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11.5px] text-[var(--color-text)] focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="ALL">All Regions</option>
            {(data?.availableRegions || []).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11.5px] text-[var(--color-text)] focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="NEEDS_INFORMATION">Needs Info</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {isFiltered && (
            <button
              onClick={() => {
                setRegionFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="rounded-[5px] border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-text-dim)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)] cursor-pointer"
            >
              Clear
            </button>
          )}

          <button
            onClick={() => fetchOverviewData(true)}
            disabled={refreshing}
            className="flex items-center gap-1 rounded-[5px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)] disabled:opacity-50 cursor-pointer"
            title="Refresh portfolio data"
          >
            <RefreshCw size={11} className={`shrink-0 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
            <span>{refreshing ? "Updating…" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ── Empty State if Zero Policies ────────────────────────────── */}
      {!hasPolicies && (
        <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-14 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-3">
            <FileText size={20} />
          </div>
          <h2 className="text-[14.5px] font-bold text-[var(--color-text)]">No Underwriting Policies Available</h2>
          <p className="mt-1 text-[12px] text-[var(--color-text-dim)] max-w-sm leading-relaxed">
            Complete a risk assessment and submit for underwriting to populate live portfolio metrics and geographic exposure.
          </p>
          <Link
            href="/risk-analysis"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[5px] bg-[var(--color-emerald)] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <span>Start Risk Assessment</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {hasPolicies && (
        <>
          {/* ── 2. Primary Metrics Row (4 Compact Cards) ──────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Total Policies */}
            <KpiMetric
              label="TOTAL POLICIES"
              value={total}
              subtext="Across active underwriting records"
              icon={FileText}
              accent="text-sky-500"
            />

            {/* Card 2: Portfolio Risk */}
            <KpiMetric
              label="PORTFOLIO RISK"
              value={`${avgScore}%`}
              subtext="Average risk across portfolio"
              icon={Activity}
              accent="text-emerald-500"
              badge={<RiskBadge level={avgRiskLevel} />}
            />

            {/* Card 3: High Risk */}
            <KpiMetric
              label="HIGH RISK"
              value={`${highRiskCount} ${highRiskCount === 1 ? "Policy" : "Policies"}`}
              subtext={`${highRiskPct}% of total portfolio`}
              icon={AlertTriangle}
              accent={highRiskCount > 0 ? "text-red-500" : "text-emerald-500"}
            />

            {/* Card 4: Total Premium */}
            <KpiMetric
              label="TOTAL PREMIUM"
              value={`₹${(data?.summary.totalPremium || 0).toLocaleString("en-IN")}`}
              subtext="Aggregated recommended premium"
              icon={Coins}
              accent="text-emerald-500"
            />
          </div>

          {/* ── 3. Main Content Grid (Left 65%, Right 35%) ─────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left 65%: Geographic Risk Map */}
            <div className="flex flex-col rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] lg:col-span-8">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
                <div>
                  <h2 className="text-[13px] font-semibold text-[var(--color-text)]">Geographic Risk Exposure</h2>
                  <p className="text-[11px] text-[var(--color-text-dim)]">Live distribution of insured locations</p>
                </div>
                <Link
                  href="/farm-map"
                  className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--color-emerald)] hover:underline"
                >
                  <span>Full Map</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

              <div className="h-[340px] w-full overflow-hidden">
                {data && data.mapFarms.length > 0 ? (
                  <RegionalRiskMap farms={data.mapFarms} />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-[var(--color-text-dim)] text-[12px]">
                    <div className="flex flex-col items-center gap-1.5">
                      <MapPin size={18} className="text-[var(--color-text-dim)] opacity-40" />
                      <span>No coordinate data available for current selection.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 35%: Risk Distribution */}
            <div className="flex flex-col justify-between rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:col-span-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
                <div>
                  <h2 className="text-[13px] font-semibold text-[var(--color-text)]">Risk Distribution</h2>
                  <p className="text-[11px] text-[var(--color-text-dim)]">Categorical portfolio breakdown</p>
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">{total} Policies</span>
              </div>

              <div className="py-2">
                <RiskDistributionChart data={data?.riskDistribution || []} />
              </div>

              {/* Exact Count List */}
              <div className="space-y-2 border-t border-[var(--color-border)] pt-3 text-[12px]">
                {(data?.riskDistribution || []).map((item) => {
                  const count = item.count || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={item.level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.fill }} />
                        <span>{item.level} Risk</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-[var(--color-text-dim)] text-[11px]">{pct}%</span>
                        <span className="tnum font-bold text-[var(--color-text)]">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 4. Secondary Analytics Row (Crop Exposure & Policy Status) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Left: Crop Exposure */}
            <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5 mb-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-[var(--color-text)]">Crop Exposure</h3>
                  <p className="text-[11px] text-[var(--color-text-dim)]">Portfolio distribution by crop type</p>
                </div>
                <span className="text-[11px] text-[var(--color-text-dim)]">{data?.topCrops.length || 0} Crops</span>
              </div>

              {data && data.topCrops.length > 0 ? (
                <div className="space-y-3">
                  {data.topCrops.map((c) => {
                    const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
                    return (
                      <div key={c.crop} className="space-y-1">
                        <div className="flex items-center justify-between text-[11.5px]">
                          <span className="font-medium text-[var(--color-text)]">{c.crop}</span>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[var(--color-text-dim)]">{c.count} {c.count === 1 ? "policy" : "policies"} ({pct}%)</span>
                            <span
                              className={`tnum font-semibold text-[11px] ${
                                c.avgRisk >= 70
                                  ? "text-red-500"
                                  : c.avgRisk >= 40
                                  ? "text-amber-500"
                                  : "text-emerald-500"
                              }`}
                            >
                              {c.avgRisk}% avg risk
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              c.avgRisk >= 70
                                ? "bg-red-500"
                                : c.avgRisk >= 40
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--color-text-dim)] py-4 text-center">No crop data available</p>
              )}
            </div>

            {/* Right: Policy Status Breakdown */}
            <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5 mb-3">
                <div>
                  <h3 className="text-[13px] font-semibold text-[var(--color-text)]">Policy Status Breakdown</h3>
                  <p className="text-[11px] text-[var(--color-text-dim)]">Distribution by underwriting decision</p>
                </div>
                <span className="text-[11px] text-[var(--color-text-dim)]">{total} Total</span>
              </div>

              <div className="space-y-2.5 text-[12px]">
                {/* Approved */}
                <div className="flex items-center justify-between rounded-[5px] bg-[var(--color-surface-raised)] px-3 py-2 border border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-[var(--color-text)] font-medium">Approved / Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-text-dim)]">
                      {total > 0 ? Math.round(((data?.summary.approvedPolicies || 0) / total) * 100) : 0}%
                    </span>
                    <span className="tnum font-bold text-[var(--color-text)]">{data?.summary.approvedPolicies || 0}</span>
                  </div>
                </div>

                {/* Under Review */}
                <div className="flex items-center justify-between rounded-[5px] bg-[var(--color-surface-raised)] px-3 py-2 border border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-amber-500 shrink-0" />
                    <span className="text-[var(--color-text)] font-medium">Under Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-text-dim)]">
                      {total > 0 ? Math.round(((data?.summary.underReviewPolicies || 0) / total) * 100) : 0}%
                    </span>
                    <span className="tnum font-bold text-[var(--color-text)]">{data?.summary.underReviewPolicies || 0}</span>
                  </div>
                </div>

                {/* Rejected */}
                <div className="flex items-center justify-between rounded-[5px] bg-[var(--color-surface-raised)] px-3 py-2 border border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <XCircle size={14} className="text-red-500 shrink-0" />
                    <span className="text-[var(--color-text)] font-medium">Rejected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-text-dim)]">
                      {total > 0 ? Math.round(((data?.summary.rejectedPolicies || 0) / total) * 100) : 0}%
                    </span>
                    <span className="tnum font-bold text-[var(--color-text)]">{data?.summary.rejectedPolicies || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. Recent Underwriting Activity Table ─────────────────── */}
          <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--color-text)]">Recent Underwriting Activity</h3>
                <p className="text-[11px] text-[var(--color-text-dim)]">Latest policy assessments and decision status</p>
              </div>
              <Link
                href="/policies"
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--color-emerald)] hover:underline"
              >
                <span>All Policies</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            <div className="scrollbar-thin overflow-x-auto">
              {data && data.recentAssessments.length > 0 ? (
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[10.5px] uppercase tracking-wider text-[var(--color-text-dim)]">
                      <th className="px-4 py-2 font-medium">Policy ID</th>
                      <th className="px-4 py-2 font-medium">Farm & Farmer</th>
                      <th className="px-4 py-2 font-medium">Location</th>
                      <th className="px-4 py-2 font-medium">Crop</th>
                      <th className="px-4 py-2 font-medium">Risk Score</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Premium</th>
                      <th className="px-4 py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {data.recentAssessments.map((a) => (
                      <tr key={a.id} className="hover:bg-[var(--color-surface-raised)] transition-colors">
                        <td className="tnum px-4 py-2.5 font-semibold text-[var(--color-emerald)]">
                          <Link href="/policies" className="hover:underline">
                            {a.id}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-[var(--color-text)]">{a.farmName}</span>
                          <span className="block text-[10.5px] text-[var(--color-text-dim)]">{a.farmerName}</span>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-text-muted)] max-w-[130px] truncate" title={a.location}>
                          {a.location}
                        </td>
                        <td className="px-4 py-2.5 text-[var(--color-text)]">
                          <span>{a.crop}</span>
                          {a.cropVariety && <span className="block text-[10px] text-[var(--color-text-dim)]">{a.cropVariety}</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="tnum font-bold text-[var(--color-text)]">{a.riskScore}%</span>
                            <RiskBadge level={a.riskLevel} />
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="tnum px-4 py-2.5 font-medium text-[var(--color-text)]">
                          ₹{a.recommendedPremium.toLocaleString("en-IN")}
                        </td>
                        <td className="tnum px-4 py-2.5 text-[10.5px] text-[var(--color-text-dim)] whitespace-nowrap">
                          {a.dateFormatted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-[var(--color-text-dim)] text-[11.5px]">
                  No assessments match current filters.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
