"use client";

import { useState } from "react";
import { List, Map as MapIcon } from "lucide-react";
import { RiskBadge } from "@/components/ui/primitives";
import { RegionalRiskMap } from "@/components/map/RegionalRiskMap";
import { DEMO_FARMS, Farm } from "@/lib/demo-data/farms";

export default function FarmMapPage() {
  const [view, setView] = useState<"map" | "list">("map");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selected, setSelected] = useState<Farm | null>(null);

  const filtered = DEMO_FARMS.filter((f) => riskFilter === "all" || f.riskLevel === riskFilter);

  return (
    <div className="flex h-[calc(100vh-56px-48px)] flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Farm map</h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            {filtered.length} farms visible
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)]"
          >
            <option value="all">All risk levels</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
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

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_300px]">
        <div className="min-h-[320px] overflow-hidden rounded-[8px] border border-[var(--color-border)]">
          {view === "map" ? (
            <RegionalRiskMap farms={filtered} />
          ) : (
            <div className="scrollbar-thin h-full overflow-y-auto bg-[var(--color-surface)]">
              {filtered.map((farm) => (
                <button
                  key={farm.id}
                  onClick={() => setSelected(farm)}
                  className="flex w-full items-center justify-between border-b border-[var(--color-border)] px-4 py-3 text-left hover:bg-[var(--color-surface-raised)]"
                >
                  <div>
                    <p className="text-[12.5px] text-[var(--color-text)]">
                      {farm.id} · {farm.name}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-dim)]">{farm.location}</p>
                  </div>
                  <RiskBadge level={farm.riskLevel} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {selected ? (
            <div className="flex flex-col gap-3 px-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13.5px] font-medium text-[var(--color-text)]">{selected.id}</h3>
                <RiskBadge level={selected.riskLevel} />
              </div>
              <dl className="flex flex-col gap-2 text-[12px]">
                {[
                  ["Farmer", selected.farmer],
                  ["Crop", selected.crop],
                  ["Area", `${selected.areaAcres} acres`],
                  ["Risk score", selected.riskScore.toFixed(2)],
                  ["Premium", `₹${selected.recommendedPremium.toLocaleString("en-IN")}`],
                  ["Last assessment", selected.lastAssessment],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-[var(--color-text-dim)]">{k}</dt>
                    <dd className="tnum text-[var(--color-text)]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-4 py-8 text-center">
              <p className="text-[12px] text-[var(--color-text-dim)]">
                Select a farm marker or list item to view details here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
