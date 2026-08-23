"use client";

import { useEffect, useState } from "react";
import { List, Map as MapIcon, MapPin, RefreshCw } from "lucide-react";
import { RiskBadge } from "@/components/ui/primitives";
import { RegionalRiskMap } from "@/components/map/RegionalRiskMap";
import type { MapFarm } from "@/lib/policy/policyDataAdapter";

// ─── Risk badge normalisation ─────────────────────────────────────────────────
type RiskLevel = "low" | "moderate" | "high";

function toRiskLevel(level: string): RiskLevel {
  if (level === "high") return "high";
  if (level === "moderate") return "moderate";
  return "low";
}

// ─── Skeleton list item ───────────────────────────────────────────────────────
function ListSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-40 animate-pulse rounded bg-[var(--color-surface-raised)]" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-[var(--color-surface-raised)]" />
          </div>
          <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--color-surface-raised)]" />
        </div>
      ))}
    </>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-surface-raised)]">
        <MapPin size={20} className="text-[var(--color-text-dim)]" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[var(--color-text)]">No farm locations yet</p>
        <p className="mt-1.5 text-[11.5px] text-[var(--color-text-muted)] leading-relaxed max-w-[220px]">
          Complete a risk assessment and submit for underwriting to visualise farms on the map.
        </p>
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ farm }: { farm: MapFarm }) {
  const pairs: [string, string][] = [
    ["Farm code",   farm.farmCode],
    ["Farmer",      farm.farmerName],
    ["Crop",        farm.cropVariety ? `${farm.crop} — ${farm.cropVariety}` : farm.crop],
    ...(farm.village ? [["Village", farm.village] as [string, string]] : []),
    ["District",    farm.district],
    ["Area",        `${farm.areaAcres.toFixed(1)} acres`],
    ["Risk score",  `${(farm.riskScore * 100).toFixed(1)}%`],
    ...(farm.recommendedPremium > 0
      ? [["Premium", `₹${farm.recommendedPremium.toLocaleString("en-IN")}`] as [string, string]]
      : []),
    ["Status",      farm.status.replace(/_/g, " ")],
    ["Submitted",   new Date(farm.submittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
  ];

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[13.5px] font-semibold text-[var(--color-text)]">{farm.farmName}</h3>
          <p className="text-[11px] text-[var(--color-text-dim)]">{farm.id}</p>
        </div>
        <RiskBadge level={toRiskLevel(farm.riskLevel)} />
      </div>

      <dl className="flex flex-col gap-2 text-[12px]">
        {pairs.map(([k, v]) => (
          <div key={k} className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-[var(--color-text-dim)]">{k}</dt>
            <dd className="tnum text-right text-[var(--color-text)] break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FarmMapPage() {
  const [farms,      setFarms]      = useState<MapFarm[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState<"map" | "list">("map");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selected,   setSelected]   = useState<MapFarm | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/analytics?type=map")
      .then((r) => r.json())
      .then((d) => {
        setFarms(d.mapFarms || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = farms.filter(
    (f) => riskFilter === "all" || f.riskLevel === riskFilter
  );

  return (
    <div className="flex h-[calc(100vh-56px-48px)] flex-col gap-3">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Farm map</h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            {loading ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw size={11} className="animate-spin" /> Loading…
              </span>
            ) : (
              `${filtered.length} farm${filtered.length === 1 ? "" : "s"} visible`
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setSelected(null); }}
            className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)]"
          >
            <option value="all">All risk levels</option>
            <option value="low">Low risk</option>
            <option value="moderate">Moderate risk</option>
            <option value="high">High risk</option>
          </select>

          <div className="flex rounded-[6px] border border-[var(--color-border)] p-0.5">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-[12px] ${
                view === "map" ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]" : "text-[var(--color-text-dim)]"
              }`}
            >
              <MapIcon size={13} /> Map
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-[12px] ${
                view === "list" ? "bg-[var(--color-surface-raised)] text-[var(--color-text)]" : "text-[var(--color-text-dim)]"
              }`}
            >
              <List size={13} /> List
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_300px]">
        {/* Map / List panel */}
        <div className="min-h-[320px] overflow-hidden rounded-[8px] border border-[var(--color-border)]">
          {view === "map" ? (
            loading ? (
              <div className="flex h-full items-center justify-center bg-[var(--color-surface)]">
                <div className="flex items-center gap-2 text-[12.5px] text-[var(--color-text-dim)]">
                  <RefreshCw size={15} className="animate-spin text-[var(--color-emerald)]" />
                  Loading map data…
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-full items-center justify-center bg-[var(--color-surface)]">
                <EmptyState />
              </div>
            ) : (
              <RegionalRiskMap farms={filtered} />
            )
          ) : (
            <div className="scrollbar-thin h-full overflow-y-auto bg-[var(--color-surface)]">
              {loading ? (
                <ListSkeleton />
              ) : filtered.length === 0 ? (
                <EmptyState />
              ) : (
                filtered.map((farm) => (
                  <button
                    key={farm.id}
                    onClick={() => setSelected(farm)}
                    className={`flex w-full items-center justify-between border-b border-[var(--color-border)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-raised)] ${
                      selected?.id === farm.id ? "bg-[var(--color-surface-raised)]" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] text-[var(--color-text)]">
                        {farm.farmCode} · {farm.farmName}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-dim)]">
                        {farm.crop}{farm.district ? ` · ${farm.district}` : ""}
                      </p>
                    </div>
                    <RiskBadge level={toRiskLevel(farm.riskLevel)} />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Detail sidebar */}
        <div className="overflow-hidden overflow-y-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {selected ? (
            <DetailPanel farm={selected} />
          ) : (
            <div className="flex h-full items-center justify-center px-4 py-8 text-center">
              <p className="text-[12px] text-[var(--color-text-dim)]">
                {farms.length > 0
                  ? "Click a map marker or list item to view farm details."
                  : "No farm data available yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
