import { PricingRuleThreshold } from "./types";

// Configurable underwriting rules. In production these should be loaded from
// the `risk_configuration` / `pricing_rules` database tables (see db/schema.ts)
// and editable from Settings > Pricing Rules, not hardcoded.
export const DEFAULT_PRICING_RULES: PricingRuleThreshold[] = [
  { tier: "low", minScore: 0, maxScore: 0.4, multiplier: 1.0 },
  { tier: "moderate", minScore: 0.4, maxScore: 0.7, multiplier: 1.5 },
  { tier: "high", minScore: 0.7, maxScore: 1.0001, multiplier: 3.0 },
];

export const DEFAULT_BASE_PREMIUM = 10000;
