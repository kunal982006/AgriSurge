/**
 * AgriSurge Crop Suitability Analysis Engine
 *
 * Pure analysis utility — takes sensor data + selected crop profile and
 * produces deterministic, explainable suitability output.
 *
 * No random values. All calculations are deterministic comparisons against
 * crop profile ranges from cropProfiles.ts.
 */

import { CropProfile, RangeSpec, SuitabilityLevel, SuitabilityTier, getCropProfile } from "./cropProfiles";
import { SensorData } from "@/components/risk-analysis/SensorSoilDataStep";
import { FarmDetails } from "@/components/risk-analysis/FarmDetailsStep";

export interface ParameterAnalysis {
  parameter: string;
  label: string;
  actualValue: number;
  unit: string;
  status: SuitabilityLevel;
  statusLabel: string;
  /** 0–100 normalized position within the full range */
  normalizedPosition: number;
  /** 0–100 position of optLow in the full range */
  optLowPct: number;
  /** 0–100 position of optHigh in the full range */
  optHighPct: number;
  preferredRange: string;
  observation: string;
}

export interface CropSuitabilityResult {
  cropName: string;
  cropEmoji: string;
  /** 0–100 overall score */
  overallScore: number;
  tier: SuitabilityTier;
  tierColor: "emerald" | "green" | "amber" | "red";
  /** Plain-language summary */
  summary: string;
  parameters: ParameterAnalysis[];
  positiveConditions: string[];
  riskFactors: string[];
  soilCompatibility: "Compatible" | "Moderate" | "Less Suitable";
  irrigationCompatibility: "Compatible" | "Acceptable" | "Suboptimal";
}

/** Score an individual value against a range spec.
 *  Returns 0–100 suitability score for that parameter. */
function scoreParameter(value: number, range: RangeSpec): { score: number; status: SuitabilityLevel } {
  if (value >= range.optLow && value <= range.optHigh) {
    return { score: 100, status: "optimal" };
  }
  if (value < range.min || value > range.max) {
    return { score: 0, status: "risk" };
  }

  if (value < range.optLow) {
    const ratio = (value - range.min) / (range.optLow - range.min);
    if (ratio >= 0.6) return { score: Math.round(55 + ratio * 40), status: "moderate" };
    return { score: Math.round(ratio * 55), status: "caution" };
  } else {
    // value > optHigh
    const ratio = (range.max - value) / (range.max - range.optHigh);
    if (ratio >= 0.6) return { score: Math.round(55 + ratio * 40), status: "moderate" };
    return { score: Math.round(ratio * 55), status: "caution" };
  }
}

function statusLabel(status: SuitabilityLevel): string {
  switch (status) {
    case "optimal":  return "Optimal";
    case "moderate": return "Moderate";
    case "caution":  return "Caution";
    case "risk":     return "Risk";
  }
}

function observation(param: string, value: number, range: RangeSpec, status: SuitabilityLevel, unit: string): string {
  const formatted = param === "ph" ? value.toFixed(1) : value.toFixed(param === "rainfall" ? 0 : 1);
  switch (status) {
    case "optimal":
      return `${formatted}${unit} — within the preferred range for this crop.`;
    case "moderate":
      if (value < range.optLow) return `${formatted}${unit} — slightly below the preferred range; consider monitoring.`;
      return `${formatted}${unit} — slightly above the preferred range; manageable.`;
    case "caution":
      if (value < range.optLow) return `${formatted}${unit} — below the optimal range; may affect yield.`;
      return `${formatted}${unit} — above the optimal range; monitor closely.`;
    case "risk":
      if (value < range.min) return `${formatted}${unit} — significantly low for this crop's requirements.`;
      return `${formatted}${unit} — significantly high; poses a risk to this crop.`;
  }
}

function normalizePosition(value: number, range: RangeSpec): number {
  const span = range.max - range.min;
  if (span === 0) return 50;
  return Math.max(0, Math.min(100, ((value - range.min) / span) * 100));
}

function formatRange(range: RangeSpec): string {
  const optLowStr = range.unit ? `${range.optLow}${range.unit}` : `${range.optLow}`;
  const optHighStr = range.unit ? `${range.optHigh}${range.unit}` : `${range.optHigh}`;
  return `${optLowStr} – ${optHighStr}`;
}

function tierFromScore(score: number): { tier: SuitabilityTier; color: "emerald" | "green" | "amber" | "red" } {
  if (score >= 80) return { tier: "Excellent", color: "emerald" };
  if (score >= 65) return { tier: "Good", color: "green" };
  if (score >= 45) return { tier: "Moderate", color: "amber" };
  return { tier: "High Risk", color: "red" };
}

function summaryText(tier: SuitabilityTier, cropName: string): string {
  switch (tier) {
    case "Excellent":
      return `Your current conditions are well-suited for ${cropName}. Most parameters fall within the preferred range.`;
    case "Good":
      return `Conditions are generally favourable for ${cropName}. Minor adjustments may further improve suitability.`;
    case "Moderate":
      return `Some conditions are outside the preferred range for ${cropName}. Review the factors below before proceeding.`;
    case "High Risk":
      return `Current conditions present notable challenges for ${cropName}. Consider addressing the identified risk factors.`;
  }
}

export function analyseCropSuitability(
  sensorData: SensorData,
  selectedCrop: string,
  farmDetails?: FarmDetails
): CropSuitabilityResult | null {
  if (!selectedCrop) return null;

  const profile = getCropProfile(selectedCrop);
  if (!profile) {
    // Return a neutral result for unknown crops
    return null;
  }

  const N   = Number(sensorData.nitrogen)    || 0;
  const P   = Number(sensorData.phosphorus)  || 0;
  const K   = Number(sensorData.potassium)   || 0;
  const T   = Number(sensorData.temperature) || 0;
  const H   = Number(sensorData.humidity)    || 0;
  const pH  = Number(sensorData.soilPH)      || 0;
  const R   = Number(sensorData.rainfall)    || 0;

  const { ranges } = profile;

  // Score each parameter
  const parameterInputs: Array<{
    key: string;
    label: string;
    value: number;
    range: RangeSpec;
    paramKey: string;
  }> = [
    { key: "temperature", label: "Temperature",    value: T,  range: ranges.temperature, paramKey: "temperature" },
    { key: "humidity",    label: "Humidity",        value: H,  range: ranges.humidity,    paramKey: "humidity"    },
    { key: "rainfall",    label: "Rainfall",        value: R,  range: ranges.rainfall,    paramKey: "rainfall"    },
    { key: "ph",          label: "Soil pH",          value: pH, range: ranges.ph,          paramKey: "ph"          },
    { key: "nitrogen",    label: "Nitrogen (N)",     value: N,  range: ranges.nitrogen,    paramKey: "nitrogen"    },
    { key: "phosphorus",  label: "Phosphorus (P)",   value: P,  range: ranges.phosphorus,  paramKey: "phosphorus"  },
    { key: "potassium",   label: "Potassium (K)",    value: K,  range: ranges.potassium,   paramKey: "potassium"   },
  ];

  const parameterResults: ParameterAnalysis[] = parameterInputs.map(({ key, label, value, range, paramKey }) => {
    const { score, status } = scoreParameter(value, range);
    return {
      parameter: key,
      label,
      actualValue: value,
      unit: range.unit,
      status,
      statusLabel: statusLabel(status),
      normalizedPosition: normalizePosition(value, range),
      optLowPct: normalizePosition(range.optLow, range),
      optHighPct: normalizePosition(range.optHigh, range),
      preferredRange: formatRange(range),
      observation: observation(paramKey, value, range, status, range.unit),
    };
  });

  // Weighted score (temperature and rainfall carry slightly more weight)
  const weights = [1.3, 1.0, 1.3, 1.1, 0.9, 0.9, 0.8]; // T, H, R, pH, N, P, K
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let weightedSum = 0;
  parameterResults.forEach((p, i) => {
    const { score } = scoreParameter(parameterInputs[i].value, parameterInputs[i].range);
    weightedSum += score * weights[i];
  });
  const overallScore = Math.round(weightedSum / totalWeight);

  // Soil compatibility
  let soilCompatibility: CropSuitabilityResult["soilCompatibility"] = "Less Suitable";
  if (farmDetails?.soilType) {
    if (profile.suitableSoils.includes(farmDetails.soilType)) {
      soilCompatibility = "Compatible";
    } else if (profile.suitableSoils.some((s) => farmDetails.soilType.includes(s.split(" ")[0]))) {
      soilCompatibility = "Moderate";
    }
  } else {
    soilCompatibility = "Moderate"; // unknown = neutral
  }

  // Irrigation compatibility
  let irrigationCompatibility: CropSuitabilityResult["irrigationCompatibility"] = "Suboptimal";
  if (farmDetails?.irrigationType) {
    if (profile.suitableIrrigation.includes(farmDetails.irrigationType)) {
      irrigationCompatibility = "Compatible";
    } else {
      irrigationCompatibility = "Acceptable";
    }
  } else {
    irrigationCompatibility = "Acceptable";
  }

  // Build natural-language observations
  const positiveConditions: string[] = [];
  const riskFactors: string[] = [];

  for (const p of parameterResults) {
    if (p.status === "optimal") {
      positiveConditions.push(`${p.label} is within the preferred range for ${profile.name}.`);
    } else if (p.status === "caution" || p.status === "risk") {
      const value = p.parameter === "ph"
        ? `${p.actualValue.toFixed(1)}`
        : `${p.actualValue.toFixed(p.parameter === "rainfall" ? 0 : 1)}${p.unit}`;

      if (p.actualValue < parameterInputs.find((pi) => pi.key === p.parameter)!.range.optLow) {
        riskFactors.push(`${p.label} (${value}) is below the preferred range for ${profile.name}.`);
      } else {
        riskFactors.push(`${p.label} (${value}) is above the preferred range for ${profile.name}.`);
      }
    }
  }

  if (soilCompatibility === "Less Suitable" && farmDetails?.soilType) {
    riskFactors.push(`${farmDetails.soilType} soil may not be ideal for ${profile.name}.`);
  } else if (soilCompatibility === "Compatible" && farmDetails?.soilType) {
    positiveConditions.push(`${farmDetails.soilType} soil is well-suited for this crop.`);
  }

  const { tier, color } = tierFromScore(overallScore);

  return {
    cropName: profile.name,
    cropEmoji: profile.emoji,
    overallScore,
    tier,
    tierColor: color,
    summary: summaryText(tier, profile.name),
    parameters: parameterResults,
    positiveConditions,
    riskFactors,
    soilCompatibility,
    irrigationCompatibility,
  };
}
