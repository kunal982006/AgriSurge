"use client";

import { PremiumBreakdown } from "@/lib/pricing/types";

export type SubmissionResult = {
  assessmentId: string;
  status: string;
  recommendedPremium: number;
  riskLevel: string;
};

export function PremiumRecommendationStep({
  breakdown,
  onSubmit,
  isSubmitting,
  error,
  successData,
}: {
  breakdown: PremiumBreakdown | null;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
  successData: SubmissionResult | null;
}) {
  if (!breakdown) {
    return (
      <div className="rounded-[6px] border border-dashed border-[var(--color-border-strong)] px-4 py-8 text-center">
        <p className="text-[12.5px] text-[var(--color-text-muted)]">
          Complete the risk assessment to generate a premium recommendation.
        </p>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-[6px] border border-[var(--color-emerald)]/30 bg-[var(--color-emerald-dim)]/20 px-5 py-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-emerald-dim)] text-[var(--color-emerald)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3 className="text-[15px] font-medium text-[var(--color-text)]">UNDERWRITING SUBMITTED</h3>
          
          <dl className="mt-6 flex flex-col gap-3 text-[13px]">
            <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
              <dt className="text-[var(--color-text-dim)]">Assessment ID:</dt>
              <dd className="font-medium text-[var(--color-text)]">{successData.assessmentId}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
              <dt className="text-[var(--color-text-dim)]">Status:</dt>
              <dd className="font-medium text-[var(--color-amber)]">Under Review</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
              <dt className="text-[var(--color-text-dim)]">Submitted:</dt>
              <dd className="text-[var(--color-text)]">Just now</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
              <dt className="text-[var(--color-text-dim)]">Recommended Premium:</dt>
              <dd className="text-[var(--color-text)]">₹{successData.recommendedPremium.toLocaleString("en-IN")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-dim)]">Risk Level:</dt>
              <dd className="uppercase text-[var(--color-text)]">{successData.riskLevel}</dd>
            </div>
          </dl>
        </div>
        <div className="flex justify-end mt-2">
          <button className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-[12.5px] font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]">
            View Submission
          </button>
        </div>
      </div>
    );
  }

  const tierColor =
    breakdown.riskTier === "high"
      ? "text-[var(--color-red)]"
      : breakdown.riskTier === "moderate"
      ? "text-[var(--color-amber)]"
      : "text-[var(--color-emerald)]";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-5">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <span className="text-[12px] text-[var(--color-text-muted)]">Base premium</span>
          <span className="tnum text-[14px] text-[var(--color-text)]">
            ₹{breakdown.basePremium.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
          <span className="text-[12px] text-[var(--color-text-muted)]">Risk score</span>
          <span className="tnum text-[14px] text-[var(--color-text)]">
            {(breakdown.riskScore * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
          <span className="text-[12px] text-[var(--color-text-muted)]">Risk tier</span>
          <span className={`text-[13px] font-medium uppercase ${tierColor}`}>{breakdown.riskTier}</span>
        </div>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
          <span className="text-[12px] text-[var(--color-text-muted)]">Risk adjustment</span>
          <span className="tnum text-[14px] text-[var(--color-text)]">{breakdown.multiplier.toFixed(1)}×</span>
        </div>
        <div className="flex items-center justify-between pt-3">
          <span className="text-[13px] font-medium text-[var(--color-text)]">Recommended premium</span>
          <span className="tnum text-[22px] font-semibold text-[var(--color-emerald)]">
            ₹{breakdown.recommendedPremium.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <div className="rounded-[6px] border border-[var(--color-amber)]/30 bg-[var(--color-amber-dim)]/40 px-4 py-3">
        <p className="text-[12px] leading-relaxed text-[var(--color-amber)]">
          Premium recommendation is generated from the configured risk-pricing rules and should be
          reviewed by an authorized underwriting team before a policy is issued.
        </p>
      </div>

      {error && (
        <div className="rounded-[6px] border border-[var(--color-red)]/30 bg-[var(--color-red-dim)]/40 px-4 py-3">
          <p className="text-[12px] text-[var(--color-red)]">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button 
          disabled={isSubmitting}
          className="rounded-[6px] border border-[var(--color-border)] px-3.5 py-2 text-[12.5px] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] disabled:opacity-50"
        >
          Save as draft
        </button>
        <button 
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-[6px] bg-[var(--color-emerald)] px-3.5 py-2 text-[12.5px] font-medium text-[#0c1210] hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? "Submitting..." : "Submit for Underwriting"}
        </button>
      </div>
    </div>
  );
}
