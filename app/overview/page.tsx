"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FileText,
  RefreshCw,
  ChevronRight,
  Activity,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  BarChart2,
  Layers,
  DollarSign,
} from "lucide-react";
import { RiskDistributionChart } from "@/components/charts/RiskDistributionChart";
import { RegionalRiskMap } from "@/components/map/RegionalRiskMap";
import type { OverviewDashboardPayload } from "@/lib/analytics/overviewAnalytics";

// ─── Inline Risk Badge (no emojis, professional dot indicator) ─────────
function RiskPill({ level }: { level: "low" | "moderate" | "high" }) {
  if (level === "high")
    return (
      <span className="inline-flex items-center gap-1 rounded-[3px] bg-red-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
        High
      </span>
    );
  if (level === "moderate")
    return (
      <span className="inline-flex items-center gap-1 rounded-[3px] bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
        Moderate
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-[3px] bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
      Low
    </span>
  );
}

// ─── Inline Status Badge ───────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const norm = (status || "").toLowerCase().replace(/\s+/g, "_");
  if (norm === "approved")
    return (
      <span className="inline-flex items-center gap-1 rounded-[3px] bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
        Approved
      </span>
    );
  if (norm === "under_review")
    return (
      <span className="inline-flex items-center gap-1 rounded-[3px] bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
        Under Review
      </span>
    );
  if (norm === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-[3px] bg-red-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
        Rejected
      </span>
    );
  if (norm === "needs_information")
    return (
      <span className="inline-flex items-center gap-1 rounded-[3px] bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
        Needs Info
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-[3px] border border-slate-200 px-1.5 py-0.5 text-[10.5px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent = "text-slate-400",
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
    <div className="flex flex-col justify-between rounded-[6px] border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10.5px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
          <Icon size={13} className={accent} />
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="tabular-nums text-[24px] font-bold leading-none tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </span>
          {badge}
        </div>
        <p className="mt-1.5 text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug">
          {subtext}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────
function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-5 w-44 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-64 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-7 w-32 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-[6px] bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="h-[380px] rounded-[6px] bg-slate-100 dark:bg-slate-800 lg:col-span-8" />
        <div className="h-[380px] rounded-[6px] bg-slate-100 dark:bg-slate-800 lg:col-span-4" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-52 rounded-[6px] bg-slate-100 dark:bg-slate-800" />
        <div className="h-52 rounded-[6px] bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [data, setData] = useState<OverviewDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (loading && !data) return <OverviewSkeleton />;

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[6px] border border-red-200 bg-red-50 py-14 text-center dark:border-red-800/40 dark:bg-red-950/20">
        <AlertTriangle size={22} className="text-red-500 mb-2" />
        <h3 className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">Failed to load overview</h3>
        <p className="mt-1 text-[12px] text-slate-500 max-w-sm">{error}</p>
        <button
          onClick={() => fetchOverviewData(true)}
          className="mt-4 rounded-[5px] border border-red-200 bg-white px-3.5 py-1.5 text-[12px] font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:text-red-400"
        >
          Retry
        </button>
      </div>
    );
  }

  const total = data?.summary.totalPolicies || 0;
  const hasPolicies = total > 0;
  const isFiltered = regionFilter !== "ALL" || statusFilter !== "ALL";

  const avgScore = data?.summary.averageRiskScore || 0;
  const avgRiskLevel: "low" | "moderate" | "high" =
    avgScore >= 70 ? "high" : avgScore >= 40 ? "moderate" : "low";

  const highRiskCount = data?.summary.highRiskCount || 0;
  const highRiskPct = total > 0 ? Math.round((highRiskCount / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 text-slate-900 dark:text-slate-100">

      {/* ── 1. Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-white">
            Portfolio Overview
          </h1>
          <p className="mt-0.5 text-[12.5px] text-slate-500 dark:text-slate-400">
            {hasPolicies
              ? `Real-time view of ${total} underwriting ${total === 1 ? "policy" : "policies"}`
              : "No underwriting policies registered yet"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-[5px] border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="ALL">All Regions</option>
            {(data?.availableRegions || []).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[5px] border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="NEEDS_INFORMATION">Needs Info</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {isFiltered && (
            <button
              onClick={() => { setRegionFilter("ALL"); setStatusFilter("ALL"); }}
              className="rounded-[5px] border border-slate-200 px-2.5 py-1.5 text-[12px] text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          )}

          <button
            onClick={() => fetchOverviewData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-[5px] border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw size={11} className={refreshing ? "animate-spin text-emerald-500" : ""} />
            {refreshing ? "Updating…" : "Refresh"}
          </button>

          <Link
            href="/risk-analysis"
            className="inline-flex items-center gap-1.5 rounded-[5px] bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            New Application
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ── Empty State ────────────────────────────────────────────────── */}
      {!hasPolicies && (
        <div className="flex flex-col items-center justify-center rounded-[6px] border border-dashed border-slate-200 bg-slate-50 py-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 mb-3">
            <FileText size={18} className="text-slate-400" />
          </div>
          <h2 className="text-[14px] font-semibold text-slate-700 dark:text-slate-300">No Policies Yet</h2>
          <p className="mt-1 text-[12px] text-slate-400 max-w-sm leading-relaxed">
            Complete a risk assessment and submit for underwriting to populate portfolio metrics.
          </p>
          <Link
            href="/risk-analysis"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[5px] bg-emerald-600 px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Start Risk Assessment
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {hasPolicies && (
        <>
          {/* ── 2. KPI Cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Total Policies"
              value={total}
              subtext="Across active underwriting records"
              icon={FileText}
              accent="text-slate-500"
            />
            <KpiCard
              label="Portfolio Risk"
              value={`${avgScore}%`}
              subtext="Average risk across portfolio"
              icon={Activity}
              accent={avgRiskLevel === "high" ? "text-red-500" : avgRiskLevel === "moderate" ? "text-amber-500" : "text-emerald-500"}
              badge={<RiskPill level={avgRiskLevel} />}
            />
            <KpiCard
              label="High Risk Policies"
              value={highRiskCount}
              subtext={`${highRiskPct}% of total portfolio`}
              icon={AlertTriangle}
              accent={highRiskCount > 0 ? "text-red-500" : "text-slate-400"}
            />
            <KpiCard
              label="Total Premium"
              value={`₹${(data?.summary.totalPremium || 0).toLocaleString("en-IN")}`}
              subtext="Aggregated recommended premium"
              icon={DollarSign}
              accent="text-emerald-500"
            />
          </div>

          {/* ── 3. Map + Risk Distribution ────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Geographic Map */}
            <div className="flex flex-col overflow-hidden rounded-[6px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                <div>
                  <h2 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                    Geographic Risk Exposure
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Live distribution of insured farm locations across Maharashtra
                  </p>
                </div>
                <Link
                  href="/farm-map"
                  className="inline-flex items-center gap-1 text-[11.5px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  Full Map <ChevronRight size={12} />
                </Link>
              </div>

              <div className="h-[340px] w-full overflow-hidden">
                {data && data.mapFarms.length > 0 ? (
                  <RegionalRiskMap farms={data.mapFarms} />
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MapPin size={16} className="text-slate-300 dark:text-slate-600" />
                      <span className="text-[12px] text-slate-400">No coordinate data available for current selection.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Map Legend */}
              <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-800 px-4 py-2.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-widest text-slate-400">Legend</span>
                {[
                  { label: "Low Risk", color: "bg-emerald-500" },
                  { label: "Moderate Risk", color: "bg-amber-400" },
                  { label: "High Risk", color: "bg-red-500" },
                ].map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className={`h-2 w-2 rounded-full ${item.color} shrink-0`} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="flex flex-col rounded-[6px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-4 lg:col-span-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                <div>
                  <h2 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                    Risk Distribution
                  </h2>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Portfolio breakdown by risk tier</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                  {total} Total
                </span>
              </div>

              <div className="flex-1 py-1">
                <RiskDistributionChart data={data?.riskDistribution || []} />
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                {(data?.riskDistribution || []).map((item) => {
                  const count = item.count || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={item.level} className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.fill }} />
                        <span className="text-slate-600 dark:text-slate-400">{item.level} Risk</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] text-slate-400 tabular-nums">{pct}%</span>
                        <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200 min-w-[16px] text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 4. Crop Exposure + Policy Status ─────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Crop Exposure */}
            <div className="rounded-[6px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Crop Exposure</h3>
                  <p className="text-[11px] text-slate-400">Portfolio distribution by insured crop</p>
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-slate-100 dark:border-slate-800">
                  <BarChart2 size={12} className="text-slate-400" />
                </div>
              </div>

              {data && data.topCrops.length > 0 ? (
                <div className="space-y-4">
                  {/* Table header */}
                  <div className="grid grid-cols-12 text-[10px] font-semibold uppercase tracking-widest text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="col-span-4">Crop</span>
                    <span className="col-span-3 text-right">Policies</span>
                    <span className="col-span-2 text-right">Share</span>
                    <span className="col-span-3 text-right">Avg Risk</span>
                  </div>
                  {data.topCrops.map((c) => {
                    const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
                    const riskColor = c.avgRisk >= 70 ? "text-red-600 dark:text-red-400" : c.avgRisk >= 40 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
                    const barColor = c.avgRisk >= 70 ? "bg-red-500" : c.avgRisk >= 40 ? "bg-amber-400" : "bg-emerald-500";
                    return (
                      <div key={c.crop} className="space-y-1.5">
                        <div className="grid grid-cols-12 items-center text-[12px]">
                          <span className="col-span-4 font-medium text-slate-800 dark:text-slate-200 truncate pr-2">{c.crop}</span>
                          <span className="col-span-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{c.count}</span>
                          <span className="col-span-2 text-right tabular-nums text-slate-400">{pct}%</span>
                          <span className={`col-span-3 text-right tabular-nums font-semibold ${riskColor}`}>{c.avgRisk}%</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-6 text-center text-[12px] text-slate-400">No crop data available.</p>
              )}
            </div>

            {/* Policy Status */}
            <div className="rounded-[6px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Policy Status</h3>
                  <p className="text-[11px] text-slate-400">Distribution by underwriting decision</p>
                </div>
                <span className="text-[11.5px] font-semibold tabular-nums text-slate-500">{total} Total</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  {
                    label: "Approved",
                    count: data?.summary.approvedPolicies || 0,
                    icon: CheckCircle2,
                    color: "text-emerald-600 dark:text-emerald-400",
                    bg: "bg-emerald-50 dark:bg-emerald-950/20",
                    border: "border-emerald-100 dark:border-emerald-900/40",
                    dot: "bg-emerald-500",
                  },
                  {
                    label: "Under Review",
                    count: data?.summary.underReviewPolicies || 0,
                    icon: Clock,
                    color: "text-amber-600 dark:text-amber-400",
                    bg: "bg-amber-50 dark:bg-amber-950/20",
                    border: "border-amber-100 dark:border-amber-900/40",
                    dot: "bg-amber-400",
                  },
                  {
                    label: "Rejected",
                    count: data?.summary.rejectedPolicies || 0,
                    icon: XCircle,
                    color: "text-red-600 dark:text-red-400",
                    bg: "bg-red-50 dark:bg-red-950/20",
                    border: "border-red-100 dark:border-red-900/40",
                    dot: "bg-red-500",
                  },
                ].map((row) => {
                  const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
                  return (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between rounded-[5px] border ${row.border} ${row.bg} px-3.5 py-3`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${row.dot}`} />
                        <span className={`text-[12.5px] font-medium ${row.color}`}>{row.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1 overflow-hidden rounded-full bg-white/60 dark:bg-black/20">
                          <div
                            className={`h-full rounded-full ${row.dot} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11.5px] text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
                        <span className={`text-[15px] font-bold tabular-nums w-6 text-right ${row.color}`}>
                          {row.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 5. Recent Applications Table ─────────────────────────── */}
          <div className="overflow-hidden rounded-[6px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
              <div>
                <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">Recent Applications</h3>
                <p className="text-[11px] text-slate-400">Latest policy assessments and underwriting decisions</p>
              </div>
              <Link
                href="/policies"
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                All Policies <ChevronRight size={12} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {data && data.recentAssessments.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      {["Policy ID", "Applicant", "Crop", "Location", "Risk", "Status", "Premium", "Date"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {data.recentAssessments.map((a) => (
                      <tr key={a.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link
                            href={`/policies/${a.id}`}
                            className="font-mono text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                          >
                            {a.id}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">{a.farmerName}</p>
                          <p className="text-[10.5px] text-slate-400">{a.farmName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[12.5px] text-slate-700 dark:text-slate-300">{a.crop}</p>
                          {a.cropVariety && <p className="text-[10.5px] text-slate-400">{a.cropVariety}</p>}
                        </td>
                        <td className="px-4 py-3 max-w-[130px] truncate">
                          <span className="text-[12px] text-slate-500 dark:text-slate-400" title={a.location}>
                            {a.location}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="tabular-nums text-[12.5px] font-semibold text-slate-800 dark:text-slate-200">
                              {a.riskScore}%
                            </span>
                            <RiskPill level={a.riskLevel as "low" | "moderate" | "high"} />
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusPill status={a.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="tabular-nums text-[12.5px] font-semibold text-slate-800 dark:text-slate-200">
                            ₹{a.recommendedPremium.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="tabular-nums text-[11.5px] text-slate-400">{a.dateFormatted}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-[12px] text-slate-400">No assessments match the current filters.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
