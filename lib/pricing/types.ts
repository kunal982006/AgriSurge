import { PricingCalculationDetails } from "./pricingConfig";

export type RiskTier = "low" | "moderate" | "high";

export type PricingRuleThreshold = {
  tier: RiskTier;
  minScore: number; // inclusive
  maxScore: number; // exclusive, 1.0 for the top tier
  multiplier: number;
};

export type PremiumBreakdown = {
  basePremium: number;
  riskScore: number;
  riskTier: RiskTier;
  multiplier: number;
  recommendedPremium: number;
  details?: PricingCalculationDetails;
};
