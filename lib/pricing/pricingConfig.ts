/**
 * Centralized AgriSurge Risk-Based Insurance Pricing Configuration (v2.0).
 * 
 * Rules:
 *   1. Farm area conversion: 1 acre = 0.40468564224 hectares.
 *   2. Base exposure = area_hectares * crop_base_rate_per_ha.
 *   3. Risk adjustment = base_exposure * risk_multiplier (Step 4 score).
 *   4. Environmental/Underwriting adjustment = transparent irrigation & soil factors.
 *   5. Recommended Premium = clamp(round_to_10(risk_adjusted * underwriting_adj), min_premium, max_premium).
 * 
 * NO hard-coded ₹10,000 or ₹15,000 placeholders.
 * NO random multipliers.
 */

export const PRICING_MODEL_VERSION = "v2.0";
export const ACRES_TO_HECTARES_FACTOR = 0.40468564224;

// Base Premium Rates per Hectare (₹ / ha)
export const CROP_BASE_RATES: Record<string, { ratePerHa: number; category: string }> = {
  RICE: { ratePerHa: 3500, category: "Cereals / Grains" },
  WHEAT: { ratePerHa: 3200, category: "Cereals / Grains" },
  COTTON: { ratePerHa: 4500, category: "Commercial / Fiber" },
  SUGARCANE: { ratePerHa: 6000, category: "Commercial / Cash Crop" },
  MAIZE: { ratePerHa: 2800, category: "Cereals / Grains" },
  SOYABEAN: { ratePerHa: 3000, category: "Oilseeds" },
  GROUNDNUT: { ratePerHa: 3200, category: "Oilseeds" },
  CHICKPEA: { ratePerHa: 2600, category: "Pulses" },
  PIGEONPEA: { ratePerHa: 2800, category: "Pulses" },
  "KHARIF SORGHUM": { ratePerHa: 2400, category: "Cereals / Grains" },
  "RABI SORGHUM": { ratePerHa: 2400, category: "Cereals / Grains" },
  "PEARL MILLET": { ratePerHa: 2200, category: "Cereals / Grains" },
};

export const DEFAULT_CROP_BASE_RATE = 3000; // Fallback rate per ha

// Risk Multipliers based on Step 4 Risk Score / Tier
export const RISK_TIER_MULTIPLIERS = {
  LOW: { multiplier: 0.90, label: "LOW RISK (-10%)", tier: "low" },
  MODERATE: { multiplier: 1.15, label: "MODERATE RISK (+15%)", tier: "moderate" },
  HIGH: { multiplier: 1.40, label: "HIGH RISK (+40%)", tier: "high" },
} as const;

// Underwriting Adjustments (Optional & Transparent)
export const IRRIGATION_ADJUSTMENTS: Record<string, { factor: number; label: string }> = {
  Rainfed: { factor: 1.05, label: "+5% (Rainfed risk exposure)" },
  Drip: { factor: 0.95, label: "-5% (Drip water efficiency)" },
  Sprinkler: { factor: 0.97, label: "-3% (Sprinkler efficiency)" },
  Canal: { factor: 1.00, label: "0% (Standard canal supply)" },
  Borewell: { factor: 1.00, label: "0% (Standard groundwater)" },
  Other: { factor: 1.00, label: "0% (Standard)" },
};

export const SOIL_ADJUSTMENTS: Record<string, { factor: number; label: string }> = {
  "Black Soil": { factor: 0.98, label: "-2% (High water retention)" },
  "Sandy Soil": { factor: 1.04, label: "+4% (Fast drainage risk)" },
  "Alluvial Soil": { factor: 1.00, label: "0% (Balanced fertility)" },
  "Loamy Soil": { factor: 0.99, label: "-1% (Good retention)" },
  "Red Soil": { factor: 1.02, label: "+2% (Moderate drainage)" },
};

// Premium Boundaries & Guardrails
export const PRICING_GUARDRAILS = {
  MINIMUM_PREMIUM: 1500,   // ₹1,500 min policy premium
  MAXIMUM_PREMIUM: 250000, // ₹2,50,000 max policy cap
  ROUNDING_STEP: 10,       // Round to nearest ₹10
};

export type PricingCalculationDetails = {
  areaAcres: number;
  areaHectares: number;
  crop: string;
  cropCategory: string;
  baseRatePerHa: number;
  baseExposure: number;
  riskScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH";
  riskMultiplier: number;
  riskAdjustedAmount: number;
  irrigationType?: string;
  irrigationFactor: number;
  soilType?: string;
  soilFactor: number;
  underwritingAdjFactor: number;
  underwritingAdjAmount: number;
  rawRecommendedPremium: number;
  recommendedPremium: number;
  pricingModelVersion: string;
  calculatedAt: string;
};

/**
 * Calculates deterministic AgriSurge premium recommendation from Steps 1–4 inputs.
 */
export function calculateAgriSurgePremium(params: {
  areaAcres: number;
  crop: string;
  riskScore: number;
  riskLevel?: string;
  irrigationType?: string;
  soilType?: string;
}): PricingCalculationDetails {
  // Validate inputs
  const areaAcres = Math.max(0.1, Number(params.areaAcres) || 1.0);
  const areaHectares = Number((areaAcres * ACRES_TO_HECTARES_FACTOR).toFixed(4));

  const normCrop = String(params.crop || "RICE").toUpperCase();
  const cropConfig = CROP_BASE_RATES[normCrop] || {
    ratePerHa: DEFAULT_CROP_BASE_RATE,
    category: "Default Agricultural Crop",
  };

  const baseRatePerHa = cropConfig.ratePerHa;
  const baseExposure = Number((areaHectares * baseRatePerHa).toFixed(2));

  // Determine Risk Tier & Multiplier from Step 4 Risk Score
  const score = Math.min(100, Math.max(0, Math.round(params.riskScore)));
  let riskLevel: "LOW" | "MODERATE" | "HIGH";
  if (score <= 39) {
    riskLevel = "LOW";
  } else if (score <= 69) {
    riskLevel = "MODERATE";
  } else {
    riskLevel = "HIGH";
  }

  const riskMultiplier = RISK_TIER_MULTIPLIERS[riskLevel].multiplier;
  const riskAdjustedAmount = Number((baseExposure * riskMultiplier).toFixed(2));

  // Underwriting Adjustments (Irrigation & Soil)
  const irriInfo = IRRIGATION_ADJUSTMENTS[params.irrigationType || "Rainfed"] || { factor: 1.0, label: "0%" };
  const soilInfo = SOIL_ADJUSTMENTS[params.soilType || "Alluvial Soil"] || { factor: 1.0, label: "0%" };

  const underwritingAdjFactor = Number((irriInfo.factor * soilInfo.factor).toFixed(4));
  const underwritingAdjAmount = Number((riskAdjustedAmount * (underwritingAdjFactor - 1.0)).toFixed(2));

  const rawRecommended = riskAdjustedAmount + underwritingAdjAmount;

  // Rounding & Guardrail Clamping
  let finalPremium = Math.round(rawRecommended / PRICING_GUARDRAILS.ROUNDING_STEP) * PRICING_GUARDRAILS.ROUNDING_STEP;
  finalPremium = Math.min(PRICING_GUARDRAILS.MAXIMUM_PREMIUM, Math.max(PRICING_GUARDRAILS.MINIMUM_PREMIUM, finalPremium));

  return {
    areaAcres,
    areaHectares,
    crop: normCrop,
    cropCategory: cropConfig.category,
    baseRatePerHa,
    baseExposure,
    riskScore: score,
    riskLevel,
    riskMultiplier,
    riskAdjustedAmount,
    irrigationType: params.irrigationType,
    irrigationFactor: irriInfo.factor,
    soilType: params.soilType,
    soilFactor: soilInfo.factor,
    underwritingAdjFactor,
    underwritingAdjAmount,
    rawRecommendedPremium: rawRecommended,
    recommendedPremium: finalPremium,
    pricingModelVersion: PRICING_MODEL_VERSION,
    calculatedAt: new Date().toISOString(),
  };
}
