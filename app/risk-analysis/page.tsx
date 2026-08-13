import { RiskAnalysisWorkflow } from "@/components/risk-analysis/RiskAnalysisWorkflow";

export default function RiskAnalysisPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[19px] font-semibold text-[var(--color-text)]">Risk analysis</h1>
        <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)]">
          Underwriting workflow — locate the parcel, capture farm details, review environmental
          exposure, run the risk model, and generate a premium recommendation.
        </p>
      </div>
      <RiskAnalysisWorkflow />
    </div>
  );
}
