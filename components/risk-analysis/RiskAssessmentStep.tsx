"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { RiskPredictionResult } from "@/lib/ml/types";
import { getRiskBadgeStyles } from "@/lib/risk/thresholds";

function AnimatedCountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(value);
    if (start === end) {
      setDisplay(end);
      return;
    }

    const duration = 1200; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad formula
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      const currentVal = Math.round(start + (end - start) * easedProgress);

      setDisplay(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value]);

  return <span>{display}</span>;
}

function ArcRiskGauge({ score, riskLevel }: { score: number; riskLevel: string }) {
  const styles = getRiskBadgeStyles(riskLevel);
  const radius = 68;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // Semi-circle
  const progress = Math.min(100, Math.max(0, score)) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex flex-col items-center justify-center pt-2">
      <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
        {/* Background Track */}
        <path
          d="M 12 80 A 68 68 0 0 1 148 80"
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active Progress Arc */}
        <path
          d="M 12 80 A 68 68 0 0 1 148 80"
          fill="none"
          stroke={styles.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute top-[38px] flex flex-col items-center justify-center text-center">
        <span className="tnum text-[38px] font-bold leading-none tracking-tight text-[var(--color-text)]">
          <AnimatedCountUp value={score} />%
        </span>
        <span className={`mt-1.5 rounded-[4px] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${styles.bg}`}>
          {styles.label}
        </span>
      </div>
    </div>
  );
}

export function RiskAssessmentStep({
  loading,
  result,
  error,
  onRetry,
}: {
  loading: boolean;
  result: RiskPredictionResult | null;
  error: string | null;
  onRetry?: () => void;
}) {
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);

  // Analysis sequence stage simulation when loading
  useEffect(() => {
    if (!loading) {
      setAnalysisStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setAnalysisStepIndex((prev) => (prev < 4 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    const sequence = [
      "Verifying farm location & coordinates…",
      "Loading crop profile & farm details…",
      "Analyzing server-side IMD historical weather…",
      "Running AgriSurge V2 ML Model (agrisurge_v2_model.joblib)…",
      "Calculating yield deviation & risk score…",
    ];

    return (
      <div className="flex flex-col items-center justify-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-12 px-6 shadow-sm">
        <div className="mb-4 relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-2 border-[var(--color-emerald)]/20 border-t-[var(--color-emerald)] animate-spin" />
          <Cpu size={20} className="absolute text-[var(--color-emerald)]" />
        </div>

        <h3 className="text-[14px] font-semibold uppercase tracking-wider text-[var(--color-text)] mb-3">
          Running AgriSurge Risk Assessment
        </h3>

        <div className="w-full max-w-sm flex flex-col gap-2 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[11.5px]">
          {sequence.map((stepText, idx) => {
            const isDone = idx < analysisStepIndex;
            const isCurrent = idx === analysisStepIndex;
            return (
              <div key={stepText} className="flex items-center gap-2">
                {isDone ? (
                  <CheckCircle2 size={13} className="text-[var(--color-emerald)] shrink-0" />
                ) : isCurrent ? (
                  <RefreshCw size={13} className="animate-spin text-amber-400 shrink-0" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-[var(--color-border-strong)] shrink-0" />
                )}
                <span
                  className={
                    isDone
                      ? "text-[var(--color-text-muted)] line-through opacity-80"
                      : isCurrent
                      ? "font-medium text-[var(--color-text)]"
                      : "text-[var(--color-text-dim)]"
                  }
                >
                  {stepText}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[6px] border border-[var(--color-red)]/40 bg-[var(--color-red-dim)] px-6 py-8 text-center">
        <AlertTriangle size={24} className="text-[var(--color-red)]" />
        <div>
          <h3 className="text-[14px] font-semibold text-[var(--color-red)]">Risk Assessment Unavailable</h3>
          <p className="mt-1 text-[12px] text-[var(--color-red)]/90">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--color-red)]/50 bg-[var(--color-red)]/20 px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-red)] hover:bg-[var(--color-red)]/30"
          >
            <RefreshCw size={12} /> Retry Risk Assessment
          </button>
        )}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-[6px] border border-dashed border-[var(--color-border-strong)] px-4 py-8 text-center">
        <p className="text-[12.5px] text-[var(--color-text-muted)]">
          Click &quot;Run risk assessment&quot; below to generate a real V2 model yield-deviation risk score.
        </p>
      </div>
    );
  }

  const isPositiveDev = result.yieldDeviationPct >= 0;

  return (
    <div className="flex flex-col gap-5 text-[var(--color-text)]">
      {/* FARM CONTEXT VS MODEL BASIS NOTICE */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)]/60 px-3 py-2 text-[11px] text-[var(--color-text-muted)]">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} className="text-[var(--color-emerald)] shrink-0" />
          <span>
            Selected Location: <strong>{result.district ? `${result.district.toUpperCase()}, Maharashtra` : "Maharashtra"}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1 text-[var(--color-text-dim)]">
          <Layers size={12} />
          <span>Basis: District-level historical agricultural/weather dataset</span>
        </div>
      </div>

      {/* MAIN RISK RESULT CARD */}
      <div className="flex flex-col items-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <ShieldCheck size={16} className="text-[var(--color-emerald)]" />
          <h3 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            AI Risk Assessment Result
          </h3>
        </div>

        {/* Circular Gauge */}
        <ArcRiskGauge score={result.riskScore} riskLevel={result.riskLevel} />

        <p className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          {result.riskBasis}
        </p>

        {/* YIELD METRICS GRID */}
        <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center">
            <span className="text-[11px] text-[var(--color-text-dim)]">V2 Predicted Yield</span>
            <p className="tnum mt-1 text-[18px] font-bold text-[var(--color-text)]">
              {result.predictedYieldKgHa.toLocaleString("en-IN")} <span className="text-[12px] font-normal text-[var(--color-text-dim)]">kg/ha</span>
            </p>
          </div>

          <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center">
            <span className="text-[11px] text-[var(--color-text-dim)]">Expected Baseline Yield</span>
            <p className="tnum mt-1 text-[18px] font-bold text-[var(--color-text)]">
              {result.expectedYieldKgHa.toLocaleString("en-IN")} <span className="text-[12px] font-normal text-[var(--color-text-dim)]">kg/ha</span>
            </p>
          </div>

          <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center">
            <span className="text-[11px] text-[var(--color-text-dim)]">Yield Deviation</span>
            <div className="mt-1 flex items-center justify-center gap-1">
              {isPositiveDev ? (
                <TrendingUp size={16} className="text-[var(--color-emerald)]" />
              ) : (
                <TrendingDown size={16} className="text-[var(--color-red)]" />
              )}
              <p className={`tnum text-[18px] font-bold ${isPositiveDev ? "text-[var(--color-emerald)]" : "text-[var(--color-red)]"}`}>
                {isPositiveDev ? `+${result.yieldDeviationPct}%` : `${result.yieldDeviationPct}%`}
              </p>
            </div>
          </div>
        </div>

        {/* DYNAMIC RISK SUMMARY */}
        <div className="mt-4 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-3 text-[11.5px] leading-relaxed text-[var(--color-text-muted)] text-left w-full">
          <p>
            Based on the selected crop ({result.crop || "Crop"}), historical district yield behavior ({result.expectedYieldKgHa} kg/ha baseline), and IMD environmental features, the V2 ML model estimates a predicted yield of <strong>{result.predictedYieldKgHa} kg/ha</strong> ({isPositiveDev ? `+${result.yieldDeviationPct}% above` : `${result.yieldDeviationPct}% below`} historical expected yield). This yields a <strong>{result.riskLevel.toUpperCase()}</strong> agricultural risk profile ({result.riskScore}% score).
          </p>
        </div>
      </div>

      {/* CONTRIBUTING FACTORS / MODEL EXPLAINABILITY */}
      <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-[var(--color-emerald)]" />
            <h4 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
              Model Feature Importance (V2 Permutation Weight)
            </h4>
          </div>
          <span className="text-[10.5px] text-[var(--color-text-dim)]">Test Set Permutation ΔR²</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {result.factors && result.factors.length > 0 ? (
            result.factors.map((factor) => {
              const pctWeight = Math.min(100, Math.round((factor.contribution || 0) * 100));
              return (
                <div key={factor.name} className="flex flex-col gap-1 text-[11.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--color-text-muted)]">{factor.name}</span>
                    <span className="tnum font-semibold text-[var(--color-text-dim)]">{pctWeight}% weight</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-emerald)] transition-all duration-700"
                      style={{ width: `${Math.max(5, pctWeight)}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-[11.5px] text-[var(--color-text-dim)]">Feature importance metrics currently unavailable.</p>
          )}
        </div>
      </div>

      {/* MODEL INFORMATION METADATA */}
      <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
        <div className="mb-3 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <Cpu size={15} className="text-amber-400" />
          <h4 className="text-[12.5px] font-semibold uppercase tracking-wider text-[var(--color-text)]">
            Trained Model Metadata
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11.5px] sm:grid-cols-3">
          <div>
            <span className="text-[var(--color-text-dim)]">Model Name:</span>
            <p className="font-medium text-[var(--color-text)]">{result.modelMetadata?.modelName || "AgriSurge V2 Model"}</p>
          </div>
          <div>
            <span className="text-[var(--color-text-dim)]">Algorithm:</span>
            <p className="font-medium text-[var(--color-text)]">{result.modelMetadata?.modelType || "RidgeRegression"}</p>
          </div>
          <div>
            <span className="text-[var(--color-text-dim)]">Version:</span>
            <p className="tnum font-medium text-[var(--color-text)]">{result.modelMetadata?.modelVersion || "2.0.0"}</p>
          </div>
          <div>
            <span className="text-[var(--color-text-dim)]">Prediction Target:</span>
            <p className="font-medium text-[var(--color-text)]">{result.modelMetadata?.target || "yield_kg_ha"}</p>
          </div>
          <div>
            <span className="text-[var(--color-text-dim)]">Geographic Level:</span>
            <p className="font-medium text-[var(--color-text)]">District-level historical data</p>
          </div>
          <div>
            <span className="text-[var(--color-text-dim)]">Training Baseline:</span>
            <p className="tnum font-medium text-[var(--color-text)]">
              {result.modelMetadata?.trainRows ? `${result.modelMetadata.trainRows.toLocaleString()} rows` : "12,358 rows"}
            </p>
          </div>
        </div>
      </div>

      {/* DATA TRANSPARENCY NOTICE */}
      <div className="flex items-center gap-2 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-raised)]/40 p-3 text-[11px] text-[var(--color-text-dim)]">
        <Info size={14} className="shrink-0 text-[var(--color-emerald)]" />
        <span>
          Risk score is calculated deterministically from V2 model yield deviation relative to historical expected yield. No mock predictors or random numbers were used.
        </span>
      </div>
    </div>
  );
}
