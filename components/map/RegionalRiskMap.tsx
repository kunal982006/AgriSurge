"use client";

import { MapView } from "./MapView";
import { Farm } from "@/lib/demo-data/farms";

const RISK_COLOR: Record<Farm["riskLevel"], string> = {
  low: "#3fa772",
  moderate: "#c9963f",
  high: "#c15a4a",
};

export function RegionalRiskMap({ farms }: { farms: Farm[] }) {
  const markers = farms.map((farm) => ({
    id: farm.id,
    // The demo data has [lng, lat], but react-leaflet uses [lat, lng]
    position: [farm.coordinates[1], farm.coordinates[0]] as [number, number],
    riskLevel: farm.riskLevel,
    popupContent: (
      <div className="flex flex-col gap-1 text-[12px] font-sans text-slate-800">
        <strong>{farm.id}</strong>
        <span>{farm.crop}</span>
        <span>{farm.location}</span>
        <span>Risk: {(farm.riskScore * 100).toFixed(0)}%</span>
      </div>
    ),
  }));

  // Find center of all farms if any exist, otherwise default to Nashik area
  let center: [number, number] = [19.9975, 73.7898];
  if (farms.length > 0) {
    const sumLat = farms.reduce((sum, f) => sum + f.coordinates[1], 0);
    const sumLng = farms.reduce((sum, f) => sum + f.coordinates[0], 0);
    center = [sumLat / farms.length, sumLng / farms.length];
  }

  return (
    <div className="relative h-full w-full">
      <MapView center={center} zoom={6} markers={markers} />
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
