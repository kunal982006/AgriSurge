import { PremiumBreakdown, RiskTier } from "./types";
import { calculateAgriSurgePremium, PricingCalculationDetails } from "./pricingConfig";

/**
 * AgriSurge Pricing Engine (v2.0).
 * 
 * Orchestrates deterministic risk-based premium recommendations from Steps 1–4 inputs.
 * Separates ML risk assessment from underwriting pricing recommendations.
 */
export function calculatePremium(
  riskScore: number, // 0 - 100 or 0 - 1 ratio
  basePremiumOverride?: number,
  params?: {
    areaAcres?: number;
    crop?: string;
    irrigationType?: string;
    soilType?: string;
  }
): PremiumBreakdown {
  // Normalize risk score to 0 - 100 scale
  const normScore = riskScore <= 1.0 ? Math.round(riskScore * 100) : Math.round(riskScore);

  const calc: PricingCalculationDetails = calculateAgriSurgePremium({
    areaAcres: params?.areaAcres ?? 5.0,
    crop: params?.crop ?? "RICE",
    riskScore: normScore,
    irrigationType: params?.irrigationType,
    soilType: params?.soilType,
  });

  return {
    basePremium: calc.baseExposure,
    riskScore: calc.riskScore,
    riskTier: calc.riskLevel.toLowerCase() as RiskTier,
    multiplier: calc.riskMultiplier,
    recommendedPremium: calc.recommendedPremium,
    details: calc,
  };
}
