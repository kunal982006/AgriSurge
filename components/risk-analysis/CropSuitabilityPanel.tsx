"use client";

import { useEffect, useState } from "react";
import { CropSuitabilityResult, analyseCropSuitability } from "@/lib/crop/cropSuitabilityAnalysis";
import { SensorData } from "./SensorSoilDataStep";
import { FarmDetails } from "./FarmDetailsStep";

// ─── Main Panel ───────────────────────────────────────────────────────
export function CropSuitabilityPanel({
  sensorData,
  selectedCrop,
  farmDetails,
}: {
  sensorData: SensorData;
  selectedCrop: string;
  farmDetails?: FarmDetails;
}) {
  const [result, setResult] = useState<CropSuitabilityResult | null>(null);

  useEffect(() => {
    if (!selectedCrop) {
      setResult(null);
      return;
    }
    const r = analyseCropSuitability(sensorData, selectedCrop, farmDetails);
    setResult(r);
  }, [sensorData, selectedCrop, farmDetails]);

  if (!result) return null;

  // Map tier to a clean professional styling
  const isHighRisk = result.tier === "High Risk";
  const isCaution = result.tier === "Moderate";
  const statusColor = isHighRisk ? "bg-red-600" : isCaution ? "bg-amber-500" : "bg-emerald-600";
  const statusTextColor = isHighRisk ? "text-red-700 dark:text-red-400" : isCaution ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400";
  const statusBg = isHighRisk ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50" : isCaution ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50" : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50";

  return (
    <div
      className="flex flex-col rounded-[6px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
      style={{
        animation: "fadeSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        
        {/* Left Side: Crop Identity and Summary */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100 leading-none">
              {result.cropName}
            </h3>
            <span className={`inline-flex items-center rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusBg} ${statusTextColor}`}>
              {result.tier}
            </span>
          </div>
          
          <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            {result.summary}
          </p>

          <div className="flex items-center gap-3 pt-2">
            {farmDetails?.soilType && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="font-medium text-slate-700 dark:text-slate-300">Soil:</span> {result.soilCompatibility}
              </div>
            )}
            {farmDetails?.irrigationType && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 border-l border-slate-200 dark:border-slate-800 pl-3">
                <span className="font-medium text-slate-700 dark:text-slate-300">Irrigation:</span> {result.irrigationCompatibility}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Suitability Score */}
        <div className="flex flex-col items-end shrink-0 min-w-[140px] pt-1 md:pt-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1">
            Suitability Score
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-bold tabular-nums text-slate-900 dark:text-slate-100 leading-none">
              {result.overallScore}
            </span>
            <span className="text-[14px] text-slate-400 font-medium">/ 100</span>
          </div>
          
          <div className="mt-3 w-full h-1.5 overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-sm transition-all duration-1000 ease-out ${statusColor}`}
              style={{ width: `${result.overallScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
