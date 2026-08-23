/**
 * AgriSurge Policy Data Adapter
 *
 * Pure computation utilities that transform raw UnderwritingRecord[] data
 * into the shapes consumed by Reports & Analytics and Farm Map.
 *
 * No random values. No fallback demo data. Returns empty arrays when no data.
 */

import { UnderwritingRecord } from "@/lib/underwriting/underwritingStore";

// ─── Shared types ──────────────────────────────────────────────────────────

export type MapFarm = {
  id: string;           // policy/underwriting ID e.g. "UW-2026-84433"
  farmCode: string;     // e.g. "F-10293"
  farmName: string;
  farmerName: string;
  district: string;
  village: string;
  region: string;
  crop: string;
  cropVariety: string;
  areaAcres: number;
  latitude: number;
  longitude: number;
  riskScore: number;    // 0–1 (normalised from 0–100)
  riskLevel: "low" | "moderate" | "high";
  recommendedPremium: number;
  status: string;
  submittedAt: string;
};

export type TrendPoint = { month: string; avgRisk: number };
export type PremiumPoint = { month: string; premium: number };
export type RegionalRiskPoint = { region: string; avgRisk: number };
export type CropRiskPoint = { crop: string; avgRisk: number };
export type RiskDistributionPoint = { level: string; count: number; fill: string };

export type AnalyticsPayload = {
  riskTrend: TrendPoint[];
  premiumTrend: PremiumPoint[];
  regionalRisk: RegionalRiskPoint[];
  cropRisk: CropRiskPoint[];
  riskDistribution: RiskDistributionPoint[];
  mapFarms: MapFarm[];
  totalPolicies: number;
  highRiskCount: number;
  avgRiskScore: number;         // 0–1
  totalPremium: number;
};

// ─── Normalisation helpers ──────────────────────────────────────────────────

/** Normalise riskLevel string to lowercase canonical form. */
function normaliseLevel(level: string): "low" | "moderate" | "high" {
  const l = String(level).toLowerCase();
  if (l === "high") return "high";
  if (l === "moderate") return "moderate";
  return "low";
}

/** Convert riskScore stored as 0–100 to 0–1. */
function toFraction(score: number): number {
  // Store may save it already as 0–1 (from old DB path) or as 0–100 (standard workflow)
  if (score <= 1) return score;
  return score / 100;
}

/** Format a Date to "MMM YYYY" label for charts */
function toMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

/** Get YYYY-MM key for grouping */
function toMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "0000-00";
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${yr}-${mo}`;
}

// ─── Public API ────────────────────────────────────────────────────────────

/** Convert a raw UnderwritingRecord to a map-ready MapFarm. Returns null if
 *  coordinates are missing or clearly invalid (0,0). */
export function normalizePolicyForMap(r: UnderwritingRecord): MapFarm | null {
  const lat = Number(r.latitude);
  const lng = Number(r.longitude);
  if (!lat || !lng || (lat === 0 && lng === 0)) return null;
  if (isNaN(lat) || isNaN(lng)) return null;

  return {
    id: r.id,
    farmCode: r.farmCode,
    farmName: r.farmName || r.farmCode,
    farmerName: r.farmerName || "Unknown",
    district: r.district || r.region || "Unknown",
    village: r.village || "",
    region: r.region || r.district || "Maharashtra",
    crop: r.crop || "Unknown",
    cropVariety: r.cropVariety || "",
    areaAcres: Number(r.areaAcres) || 0,
    latitude: lat,
    longitude: lng,
    riskScore: toFraction(Number(r.riskScore)),
    riskLevel: normaliseLevel(r.riskLevel),
    recommendedPremium: Number(r.recommendedPremium) || 0,
    status: r.status || "UNDER_REVIEW",
    submittedAt: r.submittedAt,
  };
}

/** Risk trend: average risk score per calendar month, sorted oldest→newest */
export function computeRiskTrend(records: UnderwritingRecord[]): TrendPoint[] {
  if (records.length === 0) return [];

  const byMonth = new Map<string, { sum: number; count: number; label: string }>();

  for (const r of records) {
    const key = toMonthKey(r.submittedAt);
    const label = toMonthLabel(r.submittedAt);
    const score = toFraction(Number(r.riskScore));
    const existing = byMonth.get(key);
    if (existing) {
      existing.sum += score;
      existing.count += 1;
    } else {
      byMonth.set(key, { sum: score, count: 1, label });
    }
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ month: v.label, avgRisk: v.sum / v.count }));
}

/** Premium trend: total recommended premium per calendar month, sorted oldest→newest */
export function computePremiumTrend(records: UnderwritingRecord[]): PremiumPoint[] {
  if (records.length === 0) return [];

  const byMonth = new Map<string, { sum: number; label: string }>();

  for (const r of records) {
    const key = toMonthKey(r.submittedAt);
    const label = toMonthLabel(r.submittedAt);
    const prem = Number(r.recommendedPremium) || 0;
    const existing = byMonth.get(key);
    if (existing) {
      existing.sum += prem;
    } else {
      byMonth.set(key, { sum: prem, label });
    }
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ month: v.label, premium: v.sum }));
}

/** Regional risk: average risk score grouped by district (falling back to region) */
export function computeRegionalRisk(records: UnderwritingRecord[]): RegionalRiskPoint[] {
  if (records.length === 0) return [];

  const byRegion = new Map<string, { sum: number; count: number }>();

  for (const r of records) {
    const region = r.district || r.region || "Unknown";
    const score = toFraction(Number(r.riskScore));
    const existing = byRegion.get(region);
    if (existing) {
      existing.sum += score;
      existing.count += 1;
    } else {
      byRegion.set(region, { sum: score, count: 1 });
    }
  }

  return Array.from(byRegion.entries())
    .map(([region, v]) => ({ region, avgRisk: v.sum / v.count }))
    .sort((a, b) => b.avgRisk - a.avgRisk);
}

/** Crop risk: average risk score grouped by crop name */
export function computeCropRisk(records: UnderwritingRecord[]): CropRiskPoint[] {
  if (records.length === 0) return [];

  const byCrop = new Map<string, { sum: number; count: number }>();

  for (const r of records) {
    const crop = r.crop || "Unknown";
    const score = toFraction(Number(r.riskScore));
    const existing = byCrop.get(crop);
    if (existing) {
      existing.sum += score;
      existing.count += 1;
    } else {
      byCrop.set(crop, { sum: score, count: 1 });
    }
  }

  return Array.from(byCrop.entries())
    .map(([crop, v]) => ({ crop, avgRisk: v.sum / v.count }))
    .sort((a, b) => b.avgRisk - a.avgRisk);
}

/** Risk distribution: count of LOW / MODERATE / HIGH risk policies */
export function computeRiskDistribution(records: UnderwritingRecord[]): RiskDistributionPoint[] {
  let low = 0, moderate = 0, high = 0;

  for (const r of records) {
    const lvl = normaliseLevel(r.riskLevel);
    if (lvl === "high") high++;
    else if (lvl === "moderate") moderate++;
    else low++;
  }

  return [
    { level: "Low",      count: low,      fill: "var(--color-emerald)" },
    { level: "Moderate", count: moderate, fill: "var(--color-amber)"   },
    { level: "High",     count: high,     fill: "var(--color-red)"     },
  ];
}

/** Build the complete analytics payload from raw records */
export function buildAnalyticsPayload(records: UnderwritingRecord[]): AnalyticsPayload {
  const mapFarms = records
    .map(normalizePolicyForMap)
    .filter((f): f is MapFarm => f !== null);

  const totalRisk = records.reduce((s, r) => s + toFraction(Number(r.riskScore)), 0);

  return {
    riskTrend:         computeRiskTrend(records),
    premiumTrend:      computePremiumTrend(records),
    regionalRisk:      computeRegionalRisk(records),
    cropRisk:          computeCropRisk(records),
    riskDistribution:  computeRiskDistribution(records),
    mapFarms,
    totalPolicies:     records.length,
    highRiskCount:     records.filter(r => normaliseLevel(r.riskLevel) === "high").length,
    avgRiskScore:      records.length > 0 ? totalRisk / records.length : 0,
    totalPremium:      records.reduce((s, r) => s + (Number(r.recommendedPremium) || 0), 0),
  };
}
