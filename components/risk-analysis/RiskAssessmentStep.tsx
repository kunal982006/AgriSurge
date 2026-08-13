"use client";

import { RiskPredictionResult } from "@/lib/ml/types";

function factorBar(contribution: number) {
  return Math.min(100, Math.round(contribution * 100));
}

export function RiskAssessmentStep({
  loading,
  result,
  error,
}: {
  loading: boolean;
  result: RiskPredictionResult | null;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-emerald)]" />
        <p className="animate-pulse-soft text-[12.5px] text-[var(--color-text-muted)]">
          Analyzing environmental conditions…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[6px] border border-[var(--color-red)]/40 bg-[var(--color-red-dim)] px-4 py-4">
        <p className="text-[12.5px] text-[var(--color-red)]">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-[6px] border border-dashed border-[var(--color-border-strong)] px-4 py-8 text-center">
        <p className="text-[12.5px] text-[var(--color-text-muted)]">
          Run the assessment to generate a risk score for this parcel.
        </p>
      </div>
    );
  }

  const pct = Math.round(result.riskScore * 100);
  const levelColor =
    result.riskLevel === "high"
      ? "text-[var(--color-red)]"
      : result.riskLevel === "moderate"
      ? "text-[var(--color-amber)]"
      : "text-[var(--color-emerald)]";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-8">
        <span className={`tnum text-[44px] font-semibold leading-none ${levelColor}`}>{pct}%</span>
        <span className={`text-[13px] font-medium uppercase tracking-wide ${levelColor}`}>
          {result.riskLevel} risk
        </span>
        {result.isMock && (
          <span className="mt-2 rounded-[4px] border border-[var(--color-border-strong)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-dim)]">
            Development mock predictor — not a trained model
          </span>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11.5px] font-medium uppercase tracking-wide text-[var(--color-text-dim)]">
          Risk factors
        </p>
        <div className="flex flex-col gap-2.5">
          {result.factors.map((f) => (
            <div key={f.name}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="text-[var(--color-text-muted)]">{f.name}</span>
                <span className="tnum text-[var(--color-text-dim)]">{factorBar(f.contribution)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
                <div
                  className="h-full rounded-full bg-[var(--color-red)]"
                  style={{ width: `${factorBar(f.contribution)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4 text-[12px]">
        <div>
          <p className="text-[var(--color-text-dim)]">Model</p>
          <p className="mt-0.5 text-[var(--color-text)]">{result.modelName}</p>
        </div>
        <div>
          <p className="text-[var(--color-text-dim)]">Version</p>
          <p className="tnum mt-0.5 text-[var(--color-text)]">{result.modelVersion}</p>
        </div>
        <div>
          <p className="text-[var(--color-text-dim)]">Generated</p>
          <p className="tnum mt-0.5 text-[var(--color-text)]">
            {new Date(result.generatedAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
