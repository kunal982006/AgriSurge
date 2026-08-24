"use client";

import { MapView } from "./MapView";
import type { MapFarm } from "@/lib/policy/policyDataAdapter";

const RISK_COLOR: Record<string, string> = {
  low:      "#3fa772",
  moderate: "#c9963f",
  high:     "#c15a4a",
};

function formatPremium(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function riskLabel(level: string) {
  if (level === "high") return "High";
  if (level === "moderate") return "Moderate";
  return "Low";
}

export function RegionalRiskMap({ farms }: { farms: MapFarm[] }) {
  const markers = farms.map((farm) => ({
    id: farm.id,
    // react-leaflet uses [lat, lng]
    position: [farm.latitude, farm.longitude] as [number, number],
    riskLevel: farm.riskLevel,
    popupContent: (
      <div className="flex flex-col gap-1.5 font-sans text-[12.5px] text-slate-800 min-w-[170px]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-1.5 mb-0.5">
          <strong className="text-[13px] text-slate-900 leading-tight truncate">{farm.farmName}</strong>
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: RISK_COLOR[farm.riskLevel] }}
          >
            {riskLabel(farm.riskLevel)}
          </span>
        </div>

        {/* Farm details */}
        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11.5px]">
          <span className="text-slate-500">ID</span>
          <span className="font-mono text-slate-700">{farm.id}</span>

          <span className="text-slate-500">Farmer</span>
          <span className="text-slate-700 truncate">{farm.farmerName}</span>

          <span className="text-slate-500">Crop</span>
          <span className="text-slate-700">
            {farm.crop}
            {farm.cropVariety ? ` — ${farm.cropVariety}` : ""}
          </span>

          {farm.village && (
            <>
              <span className="text-slate-500">Village</span>
              <span className="text-slate-700">{farm.village}</span>
            </>
          )}

          <span className="text-slate-500">District</span>
          <span className="text-slate-700">{farm.district}</span>

          <span className="text-slate-500">Area</span>
          <span className="text-slate-700">{farm.areaAcres.toFixed(1)} ac</span>

          <span className="text-slate-500">Risk score</span>
          <span
            className="font-semibold"
            style={{ color: RISK_COLOR[farm.riskLevel] }}
          >
            {(farm.riskScore * 100).toFixed(1)}%
          </span>

          {farm.recommendedPremium > 0 && (
            <>
              <span className="text-slate-500">Premium</span>
              <span className="text-slate-700 font-medium">{formatPremium(farm.recommendedPremium)}</span>
            </>
          )}

          <span className="text-slate-500">Status</span>
          <span className="text-slate-700">{farm.status.replace(/_/g, " ")}</span>
        </div>
      </div>
    ),
  }));

  // Centre map on average of all visible farms; fallback to Maharashtra centre
  let center: [number, number] = [19.5, 76.5];
  if (farms.length > 0) {
    const avgLat = farms.reduce((s, f) => s + f.latitude,  0) / farms.length;
    const avgLng = farms.reduce((s, f) => s + f.longitude, 0) / farms.length;
    center = [avgLat, avgLng];
  }

  return (
    <div className="relative h-full w-full">
      <MapView center={center} zoom={farms.length === 1 ? 10 : 6} markers={markers} />

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-5 left-3 z-[1000] flex items-center gap-3 rounded-[6px] border border-[var(--color-border-strong)] bg-[var(--color-surface)]/90 px-2.5 py-1.5 backdrop-blur-sm">
        {(["low", "moderate", "high"] as const).map((level) => (
          <span key={level} className="flex items-center gap-1 text-[10.5px] text-[var(--color-text-muted)]">
            <span className="h-2 w-2 rounded-full" style={{ background: RISK_COLOR[level] }} />
            {level === "low" ? "Low" : level === "moderate" ? "Moderate" : "High"}
          </span>
        ))}
      </div>
    </div>
  );
}
