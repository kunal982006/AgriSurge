/**
 * Centralized AgriSurge Risk Thresholds & Classification Configuration.
 * 
 * Thresholds:
 *   0 - 39  : LOW
 *   40 - 69 : MODERATE
 *   70 - 100: HIGH
 */

export type RiskLevelCategory = "LOW" | "MODERATE" | "HIGH";

export const RISK_THRESHOLDS = {
  LOW_MAX: 39,
  MODERATE_MAX: 69,
  HIGH_MAX: 100,
} as const;

export function getRiskLevel(score: number): RiskLevelCategory {
  if (score <= RISK_THRESHOLDS.LOW_MAX) {
    return "LOW";
  }
  if (score <= RISK_THRESHOLDS.MODERATE_MAX) {
    return "MODERATE";
  }
  return "HIGH";
}

export function getRiskBadgeStyles(level: RiskLevelCategory | string) {
  const norm = String(level).toUpperCase();
  if (norm === "LOW") {
    return {
      bg: "bg-[var(--color-emerald-dim)] text-[var(--color-emerald)] border border-[var(--color-emerald)]/30",
      text: "text-[var(--color-emerald)]",
      stroke: "var(--color-emerald)",
      label: "LOW RISK",
    };
  }
  if (norm === "HIGH") {
    return {
      bg: "bg-[var(--color-red-dim)] text-[var(--color-red)] border border-[var(--color-red)]/30",
      text: "text-[var(--color-red)]",
      stroke: "var(--color-red)",
      label: "HIGH RISK",
    };
  }
  // Default MODERATE
  return {
    bg: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    text: "text-amber-400",
    stroke: "#f59e0b",
    label: "MODERATE RISK",
  };
}

/**
 * Calculates deterministic AgriSurge yield-deviation risk score (0 to 100).
 * 
 * Formula:
 *   yield_deviation = (predicted_yield - expected_yield) / expected_yield
 * 
 *   - Above +15% yield -> Risk Score = 10 (Low risk)
 *   - 0% to +15% yield -> Risk Score = 35 to 10
 *   - 0% to -20% yield -> Risk Score = 35 to 65
 *   - Below -20% yield -> Risk Score = 65 to 95 (High risk)
 */
export function calculateYieldDeviationRisk(predictedYield: number, expectedYield: number): {
  yieldDeviationPct: number;
  riskScore: number;
  riskLevel: RiskLevelCategory;
} {
  if (expectedYield <= 0) {
    return { yieldDeviationPct: 0, riskScore: 50, riskLevel: "MODERATE" };
  }

  const deviationRatio = (predictedYield - expectedYield) / expectedYield;
  const yieldDeviationPct = Number((deviationRatio * 100).toFixed(1));

  let scoreVal: number;
  if (deviationRatio >= 0.15) {
    scoreVal = 10;
  } else if (deviationRatio >= 0) {
    scoreVal = 35 - (deviationRatio / 0.15) * 25;
  } else if (deviationRatio >= -0.20) {
    scoreVal = 35 + (Math.abs(deviationRatio) / 0.20) * 30;
  } else {
    const extra = Math.abs(deviationRatio) - 0.20;
    scoreVal = Math.min(95, 65 + (extra / 0.30) * 30);
  }

  const riskScore = Math.round(scoreVal);
  const riskLevel = getRiskLevel(riskScore);

  return { yieldDeviationPct, riskScore, riskLevel };
}
