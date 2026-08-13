"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Card, RiskBadge, StatusBadge } from "@/components/ui/primitives";
import { DEMO_FARMS } from "@/lib/demo-data/farms";

export default function FarmsPage() {
  const [query, setQuery] = useState("");
  const [cropFilter, setCropFilter] = useState("all");

  const crops = Array.from(new Set(DEMO_FARMS.map((f) => f.crop)));

  const filtered = DEMO_FARMS.filter((f) => {
    const matchesQuery =
      !query ||
      f.id.toLowerCase().includes(query.toLowerCase()) ||
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.farmer.toLowerCase().includes(query.toLowerCase());
    const matchesCrop = cropFilter === "all" || f.crop === cropFilter;
    return matchesQuery && matchesCrop;
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Farms</h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
            {DEMO_FARMS.length} insured parcels across 5 regions
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-[6px] bg-[var(--color-emerald)] px-3 py-2 text-[12.5px] font-medium text-[#0c1210] hover:opacity-90">
          <Plus size={14} />
          Add farm
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5">
          <Search size={13} className="text-[var(--color-text-dim)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search farm ID, name, or farmer"
            className="w-64 bg-transparent text-[12px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none"
          />
        </div>
        <select
          value={cropFilter}
          onChange={(e) => setCropFilter(e.target.value)}
          className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)]"
        >
          <option value="all">All crops</option>
          {crops.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)]">No farms match your filters.</p>
            <p className="mt-1 text-[11.5px] text-[var(--color-text-dim)]">
              Try a different search term or clear the crop filter.
            </p>
          </div>
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[11px] uppercase tracking-wide text-[var(--color-text-dim)]">
                  <th className="px-4 py-2.5 font-medium">Farm ID</th>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 font-medium">Crop</th>
                  <th className="px-4 py-2.5 font-medium">Area</th>
                  <th className="px-4 py-2.5 font-medium">Risk score</th>
                  <th className="px-4 py-2.5 font-medium">Risk level</th>
                  <th className="px-4 py-2.5 font-medium">Policy status</th>
                  <th className="px-4 py-2.5 font-medium">Last assessment</th>
                  <th className="px-4 py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((farm) => (
                  <tr
                    key={farm.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)]"
                  >
                    <td className="tnum px-4 py-2.5 text-[var(--color-text)]">{farm.id}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text)]">{farm.name}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{farm.location}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{farm.crop}</td>
                    <td className="tnum px-4 py-2.5 text-[var(--color-text-muted)]">{farm.areaAcres} ac</td>
                    <td className="tnum px-4 py-2.5 text-[var(--color-text)]">{farm.riskScore.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <RiskBadge level={farm.riskLevel} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={farm.policyStatus} />
                    </td>
                    <td className="tnum px-4 py-2.5 text-[var(--color-text-dim)]">{farm.lastAssessment}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button className="text-[11.5px] text-[var(--color-emerald)] hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
