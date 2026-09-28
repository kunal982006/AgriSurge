"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileSearch,
  FileText,
  Filter,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { UNDERWRITING_STATUS_CONFIG } from "@/lib/underwriting/status";

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

  // Filter States
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

  // Debounced Search Trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPolicies();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="flex flex-col gap-6 text-[var(--color-text)]">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[var(--color-text)]">
            Policies & Underwriting Workspace
          </h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            Review submitted risk assessments, evaluate pricing, and make underwriting decisions.
          </p>
        </div>

        <button
          onClick={fetchPolicies}
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh Queue
        </button>
      </div>

      {/* METRIC SUMMARY CARDS (Actual Database Counts) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div
          onClick={() => setStatusFilter("UNDER_REVIEW")}
          className={`cursor-pointer rounded-[6px] border p-3.5 transition-all ${
            statusFilter === "UNDER_REVIEW"
              ? "border-amber-500 bg-amber-500/10"
              : "border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between text-[11.5px] text-[var(--color-text-dim)]">
            <span>UNDER REVIEW</span>
            <Clock size={15} className="text-amber-400" />
          </div>
          <p className="tnum mt-2 text-[24px] font-bold text-amber-400">{counts.underReview || 0}</p>
          <span className="text-[10.5px] text-[var(--color-text-dim)]">Awaiting Decision</span>
        </div>

        <div
          onClick={() => setStatusFilter("NEEDS_INFORMATION")}
          className={`cursor-pointer rounded-[6px] border p-3.5 transition-all ${
            statusFilter === "NEEDS_INFORMATION"
              ? "border-blue-500 bg-blue-500/10"
              : "border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-blue-500/50"
          }`}
        >
          <div className="flex items-center justify-between text-[11.5px] text-[var(--color-text-dim)]">
            <span>PENDING INFO</span>
            <FileSearch size={15} className="text-blue-400" />
          </div>
          <p className="tnum mt-2 text-[24px] font-bold text-blue-400">{counts.needsInformation || 0}</p>
          <span className="text-[10.5px] text-[var(--color-text-dim)]">Info Requested</span>
        </div>

        <div
          onClick={() => setStatusFilter("APPROVED")}
          className={`cursor-pointer rounded-[6px] border p-3.5 transition-all ${
            statusFilter === "APPROVED"
              ? "border-[var(--color-emerald)] bg-[var(--color-emerald-dim)]/20"
              : "border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-emerald)]/50"
          }`}
        >
          <div className="flex items-center justify-between text-[11.5px] text-[var(--color-text-dim)]">
            <span>APPROVED</span>
            <CheckCircle2 size={15} className="text-[var(--color-emerald)]" />
          </div>
          <p className="tnum mt-2 text-[24px] font-bold text-[var(--color-emerald)]">{counts.approved || 0}</p>
          <span className="text-[10.5px] text-[var(--color-text-dim)]">Bound Policies</span>
        </div>

        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`cursor-pointer rounded-[6px] border p-3.5 transition-all ${
            statusFilter === "REJECTED"
              ? "border-[var(--color-red)] bg-[var(--color-red-dim)]/20"
              : "border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-red)]/50"
          }`}
        >
          <div className="flex items-center justify-between text-[11.5px] text-[var(--color-text-dim)]">
            <span>REJECTED</span>
            <XCircle size={15} className="text-[var(--color-red)]" />
          </div>
          <p className="tnum mt-2 text-[24px] font-bold text-[var(--color-red)]">{counts.rejected || 0}</p>
          <span className="text-[10.5px] text-[var(--color-text-dim)]">Declined Risk</span>
        </div>

        <div
          onClick={() => setRiskFilter("HIGH")}
          className={`cursor-pointer rounded-[6px] border p-3.5 transition-all col-span-2 sm:col-span-1 ${
            riskFilter === "HIGH"
              ? "border-[var(--color-red)] bg-[var(--color-red-dim)]/20"
              : "border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-red)]/40"
          }`}
        >
          <div className="flex items-center justify-between text-[11.5px] text-[var(--color-text-dim)]">
            <span>HIGH RISK</span>
            <AlertTriangle size={15} className="text-[var(--color-red)]" />
          </div>
          <p className="tnum mt-2 text-[24px] font-bold text-[var(--color-red)]">{counts.highRisk || 0}</p>
          <span className="text-[10.5px] text-[var(--color-text-dim)]">High Risk Flagged</span>
        </div>
      </div>

      {/* FILTERS & SEARCH TOOLBAR */}
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative min-w-[260px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
            <input
              type="text"
              placeholder="Search Policy ID, Farmer, Farm, Village, District, Crop…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-8 pr-3 text-[12px] text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="NEEDS_INFORMATION">Needs Information</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MODERATE">Moderate Risk</option>
              <option value="HIGH">High Risk</option>
            </select>

            {/* Crop Filter */}
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none"
            >
              <option value="ALL">All Crops</option>
              {availableCrops.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Region Filter */}
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none"
            >
              <option value="ALL">All Regions</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[var(--color-text)] focus:border-[var(--color-emerald)] focus:outline-none"
            >
              <option value="default">Default Sort (Priority)</option>
              <option value="date">Newest Date</option>
              <option value="risk">Highest Risk Score</option>
              <option value="premium">Highest Recommended Premium</option>
              <option value="area">Largest Farm Area</option>
            </select>
          </div>
        </div>
      </Card>

      {/* UNDERWRITING QUEUE TABLE */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw size={24} className="animate-spin text-[var(--color-emerald)]" />
            <p className="mt-2 text-[12.5px] text-[var(--color-text-dim)]">Loading underwriting applications…</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-[12.5px] text-[var(--color-red)]">{error}</div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-[12.5px] text-[var(--color-text-muted)]">
            No underwriting applications found matching selected filters.
          </div>
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[11px] uppercase tracking-wide text-[var(--color-text-dim)]">
                  <th className="px-4 py-3 font-medium">Application ID</th>
                  <th className="px-4 py-3 font-medium">Farm ID</th>
                  <th className="px-4 py-3 font-medium">Farmer</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Crop</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Risk Score</th>
                  <th className="px-4 py-3 font-medium">Rec. Premium</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const normLevel = String(r.riskLevel).toUpperCase();
                  const isHigh = normLevel === "HIGH";
                  const isLow = normLevel === "LOW";
                  const statusInfo = UNDERWRITING_STATUS_CONFIG[r.status as keyof typeof UNDERWRITING_STATUS_CONFIG] || {
                    label: r.status,
                    badgeClass: "bg-gray-500/10 text-gray-400 border-gray-500/30",
                  };

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]/60"
                    >
                      <td className="tnum px-4 py-3 font-semibold text-[var(--color-emerald)]">{r.id}</td>
                      <td className="tnum px-4 py-3 text-[var(--color-text-muted)]">{r.farmCode}</td>
                      <td className="px-4 py-3 font-medium text-[var(--color-text)]">{r.farmerName}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">
                        {r.district || r.region}, MH
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text)] font-medium">
                        {r.crop} <span className="text-[11px] font-normal text-[var(--color-text-dim)]">({r.cropVariety || "Variety"})</span>
                      </td>
                      <td className="tnum px-4 py-3 text-[var(--color-text-muted)]">
                        {r.areaAcres} ac <span className="text-[10.5px] text-[var(--color-text-dim)]">({r.areaHectares} ha)</span>
                      </td>
                      <td className="tnum px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-[4px] px-1.5 py-0.5 text-[11px] font-bold ${
                              isHigh
                                ? "bg-[var(--color-red-dim)] text-[var(--color-red)]"
                                : isLow
                                ? "bg-[var(--color-emerald-dim)] text-[var(--color-emerald)]"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {r.riskScore}% {normLevel}
                          </span>
                        </div>
                      </td>
                      <td className="tnum px-4 py-3 font-bold text-[var(--color-text)]">
                        ₹{Number(r.recommendedPremium).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="tnum px-4 py-3 text-[11.5px] text-[var(--color-text-dim)]">
                        {new Date(r.submittedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/policies/${r.id}`}
                          className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--color-emerald)] px-3 py-1 text-[11.5px] font-semibold text-white hover:opacity-90"
                        >
                          Review <ExternalLink size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
