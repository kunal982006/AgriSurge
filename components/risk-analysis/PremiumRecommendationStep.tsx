"use client";

import { useEffect, useState } from "react";
import { PRICING_MODEL_VERSION } from "@/lib/pricing/pricingConfig";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Coins,
  FileCheck,
  FileText,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { PremiumBreakdown } from "@/lib/pricing/types";

export type SubmissionResult = {
  assessmentId: string;
  status: string;
  recommendedPremium: number;
  riskLevel: string;
};

function AnimatedPriceCountUp({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(target);
    if (start === end) {
      setDisplay(end);
      return;
    }

    const duration = 1400; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      const currentVal = Math.round(start + (end - start) * easedProgress);

      setDisplay(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [target]);

  return <span>₹{display.toLocaleString("en-IN")}</span>;
}

export function PremiumRecommendationStep({
  breakdown,
  onSubmit,
  isSubmitting,
  error,
  successData,
  farmDetails,
  farmLocation,
}: {
  breakdown: PremiumBreakdown | null;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
  successData: SubmissionResult | null;
  farmDetails?: any;
  farmLocation?: any;
}) {
  const [draftSaved, setDraftSaved] = useState(false);

  const handleSaveDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 4000);
  };

  if (!breakdown) {
    return (
      <div className="rounded-[6px] border border-dashed border-[var(--color-border-strong)] px-4 py-8 text-center">
        <p className="text-[12.5px] text-[var(--color-text-muted)]">
          Complete the risk assessment in Step 4 to generate a premium recommendation.
        </p>
      </div>
    );
  }

  // Submission Receipt (After Submit for Underwriting)
  if (successData) {
    return (
      <div className="flex flex-col gap-5 text-[var(--color-text)]">
        <div className="rounded-[6px] border border-[var(--color-emerald)]/40 bg-[var(--color-surface-raised)] p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-emerald-dim)] text-[var(--color-emerald)]">
            <FileCheck size={24} />
          </div>

          <h3 className="text-[16px] font-bold uppercase tracking-wider text-[var(--color-text)]">
            Underwriting Policy Submitted
          </h3>
          <p className="mt-1 text-[12px] text-[var(--color-text-dim)]">
            Application logged for underwriter review. Draft status initialized to UNDER_REVIEW.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[12.5px]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <span className="text-[var(--color-text-dim)]">Assessment Policy Code:</span>
              <span className="tnum font-semibold text-[var(--color-emerald)]">{successData.assessmentId}</span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <span className="text-[var(--color-text-dim)]">Underwriting Status:</span>
              <span className="rounded-[4px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-400 uppercase">
                {successData.status.replace("_", " ")}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <span className="text-[var(--color-text-dim)]">Submitted Timestamp:</span>
              <span className="tnum text-[var(--color-text-muted)]">
                {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
              <span className="text-[var(--color-text-dim)]">Recommended Premium:</span>
              <span className="tnum text-[15px] font-bold text-[var(--color-emerald)]">
                ₹{successData.recommendedPremium.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-dim)]">Assessed Risk Tier:</span>
              <span className="font-semibold uppercase text-[var(--color-text)]">{successData.riskLevel}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[var(--color-text-dim)]">
            <Info size={13} className="text-[var(--color-emerald)] shrink-0" />
            <span>Policy record stored in database with immutable pricing model version v2.0.</span>
          </div>
        </div>
      </div>
    );
  }

  const details = breakdown.details;
  const areaAcres = details?.areaAcres ?? 5.0;
  const areaHectares = details?.areaHectares ?? (areaAcres * 0.404686);
  const cropCategory = details?.cropCategory ?? "Agricultural Crop";
  const cropName = details?.crop ?? "RICE";
  const cropVariety = farmDetails?.cropVariety === "Other" ? farmDetails?.customCropVariety : farmDetails?.cropVariety || "Standard";
  const baseRatePerHa = details?.baseRatePerHa ?? 3500;
  const baseExposure = details?.baseExposure ?? (baseRatePerHa * areaHectares);
  const riskMultiplier = details?.riskMultiplier ?? breakdown.multiplier;
  const riskAdjustedAmount = details?.riskAdjustedAmount ?? (baseExposure * riskMultiplier);
  const underwritingAdjAmount = details?.underwritingAdjAmount ?? 0;
  const recommendedPremium = breakdown.recommendedPremium;

  const riskLevelStr = String(details?.riskLevel || breakdown.riskTier).toUpperCase();
  const isHighRisk = riskLevelStr === "HIGH";
  const isLowRisk = riskLevelStr === "LOW";

  return (
    <div className="flex flex-col gap-5 text-[var(--color-text)]">
      {/* MAIN RECOMMENDED PREMIUM HERO CARD */}
      <div className="flex flex-col items-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <Coins size={18} className="text-[var(--color-emerald)]" />
          <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Risk-Based Premium Recommendation
          </h3>
        </div>

        {/* Animated Premium Header */}
        <div className="mt-3 text-center">
          <p className="tnum text-[42px] font-extrabold tracking-tight text-[var(--color-emerald)]">
            <AnimatedPriceCountUp target={recommendedPremium} />
          </p>
          <span className="text-[11.5px] font-medium text-[var(--color-text-dim)]">
            Calculated Recommended Policy Premium
          </span>
        </div>

        {/* RISK -> PRICE VISUALIZATION FLOW */}
        <div className="mt-6 flex w-full flex-wrap items-center justify-between gap-2 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[11.5px]">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <span className="text-[var(--color-text-dim)]">Step 4 Risk Score</span>
            <span className="tnum font-bold text-[var(--color-text)]">{breakdown.riskScore}%</span>
          </div>

          <ChevronRight size={14} className="hidden text-[var(--color-text-dim)] sm:block" />

          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <span className="text-[var(--color-text-dim)]">Risk Level</span>
            <span className={`font-bold ${isHighRisk ? "text-[var(--color-red)]" : isLowRisk ? "text-[var(--color-emerald)]" : "text-amber-400"}`}>
              {riskLevelStr}
            </span>
          </div>

          <ChevronRight size={14} className="hidden text-[var(--color-text-dim)] sm:block" />

          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <span className="text-[var(--color-text-dim)]">Risk Multiplier</span>
            <span className="tnum font-bold text-[var(--color-text)]">{riskMultiplier.toFixed(2)}×</span>
          </div>

          <ChevronRight size={14} className="hidden text-[var(--color-text-dim)] sm:block" />

          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <span className="text-[var(--color-text-dim)]">Recommended Premium</span>
            <span className="tnum font-bold text-[var(--color-emerald)]">₹{recommendedPremium.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* UNDERWRITING CONTEXT SUMMARY (Steps 1 & 2 Inputs) */}
      <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <div className="mb-2.5 flex items-center justify-between border-b border-[var(--color-border)] pb-2">
          <div className="flex items-center gap-2">
            <Sprout size={15} className="text-[var(--color-emerald)]" />
            <h4 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
              Underwriting Exposure Context
            </h4>
          </div>
          <span className="text-[10.5px] text-[var(--color-text-dim)]">Steps 1–3 Inputs</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11.5px] sm:grid-cols-4">
          <div>
            <span className="text-[var(--color-text-dim)]">Farm Area:</span>
            <p className="font-semibold text-[var(--color-text)] tnum">
              {areaAcres.toFixed(1)} acres <span className="font-normal text-[var(--color-text-dim)]">({areaHectares.toFixed(2)} ha)</span>
            </p>
          </div>
          <div>
            <span className="text-[var(--color-text-dim)]">Crop & Category:</span>
            <p className="font-semibold text-[var(--color-text)] truncate">{cropName} ({cropCategory})</p>
          </div>
          <div>
            <span className="text-[var(--color-text-dim)]">Crop Variety:</span>
            <p className="font-semibold text-[var(--color-text)] truncate">{cropVariety}</p>
          </div>
          <div>
            <span className="text-[var(--color-text-dim)]">Irrigation & Soil:</span>
            <p className="font-semibold text-[var(--color-text)] truncate">
              {details?.irrigationType || "Rainfed"} | {details?.soilType || "Soil"}
            </p>
          </div>
        </div>

        <p className="mt-2 text-[10.5px] text-[var(--color-text-dim)]">
          * Note: Crop variety is displayed for underwriting context. AgriSurge V2 yield model operates at crop level.
        </p>
      </div>

      {/* FULL PRICING BREAKDOWN TABLE */}
      <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <Scale size={15} className="text-[var(--color-emerald)]" />
          <h4 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
            Transparent Pricing Calculation Breakdown
          </h4>
        </div>

        <div className="flex flex-col gap-2.5 text-[12.5px]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <div>
              <span className="font-medium text-[var(--color-text)]">Crop Base Rate</span>
              <p className="text-[10.5px] text-[var(--color-text-dim)]">Standard per-hectare rate for {cropName}</p>
            </div>
            <span className="tnum font-semibold text-[var(--color-text)]">₹{baseRatePerHa.toLocaleString("en-IN")} / ha</span>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <div>
              <span className="font-medium text-[var(--color-text)]">Base Exposure</span>
              <p className="text-[10.5px] text-[var(--color-text-dim)]">{areaHectares.toFixed(2)} ha × ₹{baseRatePerHa.toLocaleString("en-IN")}/ha</p>
            </div>
            <span className="tnum font-semibold text-[var(--color-text)]">₹{Math.round(baseExposure).toLocaleString("en-IN")}</span>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <div>
              <span className="font-medium text-[var(--color-text)]">Risk Multiplier ({riskLevelStr})</span>
              <p className="text-[10.5px] text-[var(--color-text-dim)]">Step 4 V2 Risk Score {breakdown.riskScore}% multiplier ({riskMultiplier.toFixed(2)}×)</p>
            </div>
            <span className="tnum font-semibold text-[var(--color-text)]">
              {riskMultiplier < 1.0 ? "-" : "+"}₹{Math.abs(Math.round(riskAdjustedAmount - baseExposure)).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
            <div>
              <span className="font-medium text-[var(--color-text)]">Underwriting Adjustments</span>
              <p className="text-[10.5px] text-[var(--color-text-dim)]">
                Irrigation ({details?.irrigationType || "Rainfed"} {details?.irrigationFactor ? `${((details.irrigationFactor - 1)*100).toFixed(0)}%` : ""}) + Soil ({details?.soilType || "Soil"})
              </p>
            </div>
            <span className="tnum font-semibold text-[var(--color-text)]">
              {underwritingAdjAmount >= 0 ? `+₹${Math.round(underwritingAdjAmount).toLocaleString("en-IN")}` : `-₹${Math.abs(Math.round(underwritingAdjAmount)).toLocaleString("en-IN")}`}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 font-semibold text-[14px]">
            <span className="text-[var(--color-text)]">Recommended Policy Premium</span>
            <span className="tnum text-[18px] font-bold text-[var(--color-emerald)]">
              ₹{recommendedPremium.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* DRAFT SAVED NOTIFICATION */}
      {draftSaved && (
        <div className="flex items-center gap-2 rounded-[6px] border border-[var(--color-emerald)]/40 bg-[var(--color-emerald-dim)]/20 px-4 py-2.5 text-[12px] text-[var(--color-emerald)]">
          <CheckCircle2 size={15} />
          <span>Workflow draft saved locally. Status remains un-submitted.</span>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex items-center gap-2 rounded-[6px] border border-[var(--color-red)]/40 bg-[var(--color-red-dim)]/30 px-4 py-3 text-[12px] text-[var(--color-red)]">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* ACTIONS FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-[11px] text-[var(--color-text-dim)]">
          Pricing Model Version: <strong className="text-[var(--color-text-muted)]">{PRICING_MODEL_VERSION}</strong>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2 text-[12.5px] font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] disabled:opacity-50"
          >
            <Bookmark size={14} /> Save as Draft
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--color-emerald)] px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <FileText size={14} /> Submit for Underwriting
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
