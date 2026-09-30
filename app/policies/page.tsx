"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSearch,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { UNDERWRITING_STATUS_CONFIG } from "@/lib/underwriting/status";

// ─── Metric stat card ─────────────────────────────────────────────────
function StatCard({
  label,
  count,
  sub,
  accent,
  active,
  onClick,
}: {
  label: string;
  count: number;
  sub: string;
  accent: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-start rounded-[6px] border p-4 text-left transition-all cursor-pointer ${
        active
          ? `${accent} shadow-sm`
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      }`}
    >
      <span className="text-[10.5px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="mt-2 text-[28px] font-bold tabular-nums leading-none text-slate-900 dark:text-slate-100">
        {count}
      </span>
      <span className="mt-1 text-[11.5px] text-slate-400 dark:text-slate-500">{sub}</span>
    </button>
  );
}

// ─── Risk badge ───────────────────────────────────────────────────────
function RiskBadge({ level, score }: { level: string; score: number }) {
  const norm = level.toUpperCase();
  if (norm === "HIGH")
    return (
      <span className="inline-flex items-center gap-1 rounded-[3px] bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
        {score}% High
      </span>
    );
  if (norm === "MODERATE")
    return (
      <span className="inline-flex items-center gap-1 rounded-[3px] bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
        {score}% Moderate
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-[3px] bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
      {score}% Low
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────
function StatusBadge({ statusInfo }: { statusInfo: { label: string; badgeClass: string } }) {
  return (
    <span
      className={`inline-flex items-center rounded-[3px] border px-2 py-0.5 text-[11px] font-semibold ${statusInfo.badgeClass}`}
    >
      {statusInfo.label}
    </span>
  );
}

// ─── Filter select ────────────────────────────────────────────────────
function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-[5px] border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    >
      {children}
    </select>
  );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function PoliciesUnderwritingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    underReview: 0,
    needsInformation: 0,
    approved: 0,
    rejected: 0,
    highRisk: 0,
  });
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [cropFilter, setCropFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("default");

  const fetchPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (riskFilter !== "ALL") params.set("risk", riskFilter);
      if (cropFilter !== "ALL") params.set("crop", cropFilter);
      if (regionFilter !== "ALL") params.set("region", regionFilter);
      if (searchQuery) params.set("q", searchQuery);
      if (sortBy !== "default") params.set("sortBy", sortBy);

      const res = await fetch(`/api/policies?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load underwriting policies.");
      const data = await res.json();

      setRecords(data.records || []);
      setCounts(data.counts || {});
      setAvailableCrops(data.availableCrops || []);
      setAvailableRegions(data.availableRegions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [statusFilter, riskFilter, cropFilter, regionFilter, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => fetchPolicies(), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-6 text-slate-900 dark:text-slate-100">

      {/* ── PAGE HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">
            Underwriting Queue
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
            Review submitted applications, evaluate risk and make binding decisions.
          </p>
        </div>
        <button
          onClick={fetchPolicies}
          className="inline-flex items-center gap-1.5 rounded-[5px] border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── STAT CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Under Review"
          count={counts.underReview || 0}
          sub="Awaiting decision"
          accent="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
          active={statusFilter === "UNDER_REVIEW"}
          onClick={() => setStatusFilter(statusFilter === "UNDER_REVIEW" ? "ALL" : "UNDER_REVIEW")}
        />
        <StatCard
          label="Needs Information"
          count={counts.needsInformation || 0}
          sub="Info requested"
          accent="border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30"
          active={statusFilter === "NEEDS_INFORMATION"}
          onClick={() => setStatusFilter(statusFilter === "NEEDS_INFORMATION" ? "ALL" : "NEEDS_INFORMATION")}
        />
        <StatCard
          label="Approved"
          count={counts.approved || 0}
          sub="Bound policies"
          accent="border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
          active={statusFilter === "APPROVED"}
          onClick={() => setStatusFilter(statusFilter === "APPROVED" ? "ALL" : "APPROVED")}
        />
        <StatCard
          label="Rejected"
          count={counts.rejected || 0}
          sub="Declined risk"
          accent="border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30"
          active={statusFilter === "REJECTED"}
          onClick={() => setStatusFilter(statusFilter === "REJECTED" ? "ALL" : "REJECTED")}
        />
        <StatCard
          label="High Risk"
          count={counts.highRisk || 0}
          sub="Flagged for review"
          accent="border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/30"
          active={riskFilter === "HIGH"}
          onClick={() => setRiskFilter(riskFilter === "HIGH" ? "ALL" : "HIGH")}
        />
      </div>

      {/* ── SEARCH + FILTERS ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-[6px] border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search policy ID, farmer, crop, district…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[5px] border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect value={statusFilter} onChange={setStatusFilter}>
            <option value="ALL">All Statuses</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="NEEDS_INFORMATION">Needs Information</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </FilterSelect>

          <FilterSelect value={riskFilter} onChange={setRiskFilter}>
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="HIGH">High Risk</option>
          </FilterSelect>

          <FilterSelect value={cropFilter} onChange={setCropFilter}>
            <option value="ALL">All Crops</option>
            {availableCrops.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={regionFilter} onChange={setRegionFilter}>
            <option value="ALL">All Regions</option>
            {availableRegions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={sortBy} onChange={setSortBy}>
            <option value="default">Sort: Priority</option>
            <option value="date">Newest First</option>
            <option value="risk">Highest Risk</option>
            <option value="premium">Highest Premium</option>
            <option value="area">Largest Area</option>
          </FilterSelect>
        </div>
      </div>

      {/* ── QUEUE TABLE ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[6px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <RefreshCw size={22} className="animate-spin text-emerald-500" />
            <p className="text-[12.5px] text-slate-500">Loading applications…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            <p className="text-[12.5px] text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <FileSearch size={24} className="text-slate-300 dark:text-slate-600" />
            <p className="text-[13px] font-medium text-slate-500">No applications found</p>
            <p className="text-[12px] text-slate-400">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  {[
                    "Policy ID",
                    "Application Ref",
                    "Applicant",
                    "Location",
                    "Crop",
                    "Area",
                    "Risk",
                    "Premium",
                    "Status",
                    "Submitted",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => {
                  const normLevel = String(r.riskLevel).toUpperCase();
                  const statusInfo =
                    UNDERWRITING_STATUS_CONFIG[r.status as keyof typeof UNDERWRITING_STATUS_CONFIG] || {
                      label: r.status,
                      badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
                    };

                  return (
                    <tr
                      key={r.id}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Policy ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-[12px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {r.id}
                        </span>
                      </td>

                      {/* Application Ref */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-[11.5px] text-slate-400 dark:text-slate-500">
                          {r.farmCode}
                        </span>
                      </td>

                      {/* Applicant */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[13px] font-medium text-slate-800 dark:text-slate-200">
                          {r.farmerName}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[12.5px] text-slate-500 dark:text-slate-400">
                          {r.district || r.region}, MH
                        </span>
                      </td>

                      {/* Crop */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div>
                          <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">
                            {r.crop}
                          </p>
                          {r.cropVariety && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              {r.cropVariety}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Area */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-[12.5px] tabular-nums text-slate-700 dark:text-slate-300">
                          {r.areaAcres} ac
                        </p>
                        <p className="text-[11px] tabular-nums text-slate-400">
                          {r.areaHectares} ha
                        </p>
                      </td>

                      {/* Risk */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <RiskBadge level={normLevel} score={r.riskScore} />
                      </td>

                      {/* Premium */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[13px] font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          ₹{Number(r.recommendedPremium).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <StatusBadge statusInfo={statusInfo} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-[12px] tabular-nums text-slate-400 dark:text-slate-500">
                          {new Date(r.submittedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right flex justify-end gap-2">
                        {r.status === "APPROVED" && r.certificatePdf && (
                          <a
                            href={r.certificatePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-emerald-700 shadow-sm hover:border-emerald-400 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:border-emerald-500 transition-colors"
                          >
                            Certificate <ExternalLink size={11} />
                          </a>
                        )}
                        <Link
                          href={`/policies/${r.id}`}
                          className="inline-flex items-center gap-1.5 rounded-[4px] border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 shadow-sm hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors"
                        >
                          Review <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-[11.5px] text-slate-400 dark:text-slate-500">
                Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{records.length}</span> application{records.length !== 1 ? "s" : ""}
                {counts.total > records.length ? (
                  <> of <span className="font-semibold text-slate-600 dark:text-slate-300">{counts.total}</span> total</>
                ) : null}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
