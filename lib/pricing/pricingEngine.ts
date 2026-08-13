import { PremiumBreakdown, PricingRuleThreshold, RiskTier } from "./types";
import { DEFAULT_BASE_PREMIUM, DEFAULT_PRICING_RULES } from "./pricingRules";

/**
 * Pricing engine.
 *
 * IMPORTANT — separation of concerns:
 * The ML service answers "what is the estimated agricultural/crop failure risk?"
 * This module answers "given that risk score, what premium should be recommended?"
 * The multiplier below is a configured underwriting rule, not a model output,
 * and any recommendation produced here should be reviewed by an authorized
 * underwriting team before a policy is issued.
 */
export function resolveRiskTier(
  riskScore: number,
  rules: PricingRuleThreshold[] = DEFAULT_PRICING_RULES
): PricingRuleThreshold {
  const match = rules.find((r) => riskScore >= r.minScore && riskScore < r.maxScore);
  return match ?? rules[rules.length - 1];
}

export function calculatePremium(
  riskScore: number,
  basePremium: number = DEFAULT_BASE_PREMIUM,
  rules: PricingRuleThreshold[] = DEFAULT_PRICING_RULES
): PremiumBreakdown {
  const rule = resolveRiskTier(riskScore, rules);
  const recommendedPremium = Math.round(basePremium * rule.multiplier);

  return {
    basePremium,
    riskScore,
    riskTier: rule.tier as RiskTier,
    multiplier: rule.multiplier,
    recommendedPremium,
  };
}
