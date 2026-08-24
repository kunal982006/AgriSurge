import { UnderwritingRecord, AuditEvent } from "@/lib/underwriting/underwritingStore";
import {
  MapFarm,
  RiskDistributionPoint,
  TrendPoint,
  normalizePolicyForMap,
  computeRiskDistribution,
  computeRiskTrend,
} from "@/lib/policy/policyDataAdapter";

// ─── Types ───────────────────────────────────────────────────────────────────

export type HealthTier = "Healthy" | "Watch" | "Elevated" | "Critical";

export interface PortfolioSummary {
  totalPolicies: number;
  approvedPolicies: number;
  underReviewPolicies: number;
  needsInfoPolicies: number;
  rejectedPolicies: number;
  draftPolicies: number;
  highRiskCount: number;
  moderateRiskCount: number;
  lowRiskCount: number;
  averageRiskScore: number;          // 0–100 percentage
  averageRiskScoreFraction: number;  // 0–1
  healthTier: HealthTier;
  healthTierColor: "emerald" | "amber" | "orange" | "red";
  healthDescription: string;
  totalCoverage: number;             // Sum Insured in ₹ INR
  totalPremium: number;              // Total Recommended Premium in ₹ INR
  totalAreaAcres: number;
}

export interface RecentActivityItem {
  id: string;
  policyId: string;
  farmName: string;
  farmerName: string;
  crop: string;
  action: string;
  actor: string;
  status: string;
  notes?: string;
  timestamp: string;
  relativeTime: string;
  riskLevel: "low" | "moderate" | "high";
  severity: "info" | "success" | "warning" | "danger";
}

export interface RecentAssessmentItem {
  id: string;
  farmCode: string;
  farmName: string;
  farmerName: string;
  location: string;
  district: string;
  crop: string;
  cropVariety: string;
  areaAcres: number;
  riskScore: number;
  riskLevel: "low" | "moderate" | "high";
  coverageAmount: number;
  recommendedPremium: number;
  status: string;
  submittedAt: string;
  dateFormatted: string;
}

export interface TopCropStat {
  crop: string;
  count: number;
  avgRisk: number;
  totalPremium: number;
}

export interface TopDistrictStat {
  district: string;
  count: number;
  avgRisk: number;
  totalPremium: number;
}

export interface OverviewDashboardPayload {
  summary: PortfolioSummary;
  riskDistribution: RiskDistributionPoint[];
  mapFarms: MapFarm[];
  recentAssessments: RecentAssessmentItem[];
  recentActivity: RecentActivityItem[];
  riskTrend: TrendPoint[];
  topCrops: TopCropStat[];
  topDistricts: TopDistrictStat[];
  availableRegions: string[];
  availableCrops: string[];
  availableStatuses: string[];
  lastUpdated: string;
}

// ─── Formatters & Helpers ───────────────────────────────────────────────────

/** Format number to Indian Rupees format (e.g. ₹3,00,000 or ₹2.45L) */
export function formatINR(amount: number, compact = false): string {
  if (isNaN(amount) || amount === 0) return "₹0";

  if (compact) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
  }

  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Format relative time e.g. "2h ago", "Yesterday", "14 Aug" */
export function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";

    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "Recently";
  }
}

/** Normalize risk level to lowercase string */
function toRiskLevel(level: string): "low" | "moderate" | "high" {
  const l = String(level).toLowerCase();
  if (l === "high") return "high";
  if (l === "moderate") return "moderate";
  return "low";
}

/** Determine portfolio health tier from average risk score (0–100) */
function computeHealthTier(avgScore: number): {
  tier: HealthTier;
  color: "emerald" | "amber" | "orange" | "red";
  description: string;
} {
  if (avgScore <= 35) {
    return {
      tier: "Healthy",
      color: "emerald",
      description: "Portfolio risk is well-contained within safe underwriting parameters.",
    };
  }
  if (avgScore <= 55) {
    return {
      tier: "Watch",
      color: "amber",
      description: "Moderate exposure profile. Standard underwriting margins maintained.",
    };
  }
  if (avgScore <= 72) {
    return {
      tier: "Elevated",
      color: "orange",
      description: "Elevated vulnerability. Heightened monitoring recommended.",
    };
  }
  return {
    tier: "Critical",
    color: "red",
    description: "High concentration of adverse risk factors across insured portfolio.",
  };
}

/** Classify audit event severity */
function classifyEventSeverity(
  status: string,
  riskLevel: string
): "info" | "success" | "warning" | "danger" {
  const s = status.toUpperCase();
  const r = riskLevel.toUpperCase();
  if (s === "APPROVED") return "success";
  if (s === "REJECTED" || r === "HIGH") return "danger";
  if (s === "NEEDS_INFORMATION" || r === "MODERATE") return "warning";
  return "info";
}

// ─── Main Aggregator ─────────────────────────────────────────────────────────

export function buildOverviewAnalytics(
  allRecords: UnderwritingRecord[],
  filter?: { region?: string; crop?: string; status?: string }
): OverviewDashboardPayload {
  // Extract all available filter values from the unfiltered dataset
  const availableRegions = Array.from(
    new Set(allRecords.map((r) => r.district || r.region).filter(Boolean))
  ).sort();
  const availableCrops = Array.from(
    new Set(allRecords.map((r) => r.crop).filter(Boolean))
  ).sort();
  const availableStatuses = Array.from(
    new Set(allRecords.map((r) => r.status).filter(Boolean))
  ).sort();

  // Apply filters if provided
  let filtered = allRecords;

  if (filter?.region && filter.region !== "ALL") {
    filtered = filtered.filter(
      (r) => (r.district || r.region || "").toUpperCase() === filter.region!.toUpperCase()
    );
  }
  if (filter?.crop && filter.crop !== "ALL") {
    filtered = filtered.filter(
      (r) => (r.crop || "").toUpperCase() === filter.crop!.toUpperCase()
    );
  }
  if (filter?.status && filter.status !== "ALL") {
    filtered = filtered.filter(
      (r) => (r.status || "").toUpperCase() === filter.status!.toUpperCase()
    );
  }

  // 1. Portfolio Summary Calculations
  let totalScoreSum = 0;
  let totalCoverage = 0;
  let totalPremium = 0;
  let totalAreaAcres = 0;
  let approvedPolicies = 0;
  let underReviewPolicies = 0;
  let needsInfoPolicies = 0;
  let rejectedPolicies = 0;
  let draftPolicies = 0;
  let highRiskCount = 0;
  let moderateRiskCount = 0;
  let lowRiskCount = 0;

  for (const r of filtered) {
    const rawScore = Number(r.riskScore) || 0;
    // Normalize score if stored as 0–1 fraction
    const score = rawScore <= 1 ? rawScore * 100 : rawScore;
    totalScoreSum += score;

    totalCoverage += Number(r.coverageAmount) || 0;
    totalPremium += Number(r.recommendedPremium) || 0;
    totalAreaAcres += Number(r.areaAcres) || 0;

    const s = (r.status || "").toUpperCase();
    if (s === "APPROVED" || s === "ACTIVE") approvedPolicies++;
    else if (s === "UNDER_REVIEW") underReviewPolicies++;
    else if (s === "NEEDS_INFORMATION") needsInfoPolicies++;
    else if (s === "REJECTED") rejectedPolicies++;
    else if (s === "DRAFT") draftPolicies++;

    const lvl = toRiskLevel(r.riskLevel);
    if (lvl === "high") highRiskCount++;
    else if (lvl === "moderate") moderateRiskCount++;
    else lowRiskCount++;
  }

  const totalPolicies = filtered.length;
  const averageRiskScore = totalPolicies > 0 ? Math.round(totalScoreSum / totalPolicies) : 0;
  const averageRiskScoreFraction = averageRiskScore / 100;
  const healthInfo = computeHealthTier(averageRiskScore);

  const summary: PortfolioSummary = {
    totalPolicies,
    approvedPolicies,
    underReviewPolicies,
    needsInfoPolicies,
    rejectedPolicies,
    draftPolicies,
    highRiskCount,
    moderateRiskCount,
    lowRiskCount,
    averageRiskScore,
    averageRiskScoreFraction,
    healthTier: healthInfo.tier,
    healthTierColor: healthInfo.color,
    healthDescription: healthInfo.description,
    totalCoverage,
    totalPremium,
    totalAreaAcres,
  };

  // 2. Risk Distribution
  const riskDistribution = computeRiskDistribution(filtered);

  // 3. Map Farms
  const mapFarms = filtered
    .map(normalizePolicyForMap)
    .filter((f): f is MapFarm => f !== null);

  // 4. Recent Assessments (sorted newest first)
  const sortedByDate = [...filtered].sort((a, b) => {
    const timeA = new Date(a.submittedAt).getTime();
    const timeB = new Date(b.submittedAt).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  const recentAssessments: RecentAssessmentItem[] = sortedByDate.slice(0, 8).map((r) => {
    const rawScore = Number(r.riskScore) || 0;
    const score = rawScore <= 1 ? rawScore * 100 : rawScore;
    const locationParts = [r.village, r.district || r.region].filter(Boolean);
    const location = locationParts.join(", ") || r.region || "Maharashtra";

    return {
      id: r.id,
      farmCode: r.farmCode,
      farmName: r.farmName || r.farmCode,
      farmerName: r.farmerName || "Farmer",
      location,
      district: r.district || r.region || "Maharashtra",
      crop: r.crop || "Crop",
      cropVariety: r.cropVariety || "",
      areaAcres: Number(r.areaAcres) || 0,
      riskScore: Math.round(score),
      riskLevel: toRiskLevel(r.riskLevel),
      coverageAmount: Number(r.coverageAmount) || 0,
      recommendedPremium: Number(r.recommendedPremium) || 0,
      status: r.status || "UNDER_REVIEW",
      submittedAt: r.submittedAt,
      dateFormatted: new Date(r.submittedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  });

  // 5. Recent Activity Feed (extracted from real audit trails across all policies)
  const allEvents: RecentActivityItem[] = [];

  for (const r of filtered) {
    if (r.auditTrail && Array.isArray(r.auditTrail)) {
      for (const ev of r.auditTrail) {
        allEvents.push({
          id: ev.id || `ev-${Math.random()}`,
          policyId: r.id,
          farmName: r.farmName || r.farmCode,
          farmerName: r.farmerName || "Applicant",
          crop: r.crop,
          action: ev.action,
          actor: ev.actor || "System",
          status: ev.status || r.status,
          notes: ev.notes || ev.reason,
          timestamp: ev.timestamp,
          relativeTime: formatRelativeTime(ev.timestamp),
          riskLevel: toRiskLevel(r.riskLevel),
          severity: classifyEventSeverity(ev.status || r.status, r.riskLevel),
        });
      }
    } else {
      // Fallback: create an initial submission event if auditTrail missing
      allEvents.push({
        id: `sub-${r.id}`,
        policyId: r.id,
        farmName: r.farmName || r.farmCode,
        farmerName: r.farmerName || "Applicant",
        crop: r.crop,
        action: `Application Submitted (${r.status})`,
        actor: "AgriSurge System",
        status: r.status,
        timestamp: r.submittedAt,
        relativeTime: formatRelativeTime(r.submittedAt),
        riskLevel: toRiskLevel(r.riskLevel),
        severity: classifyEventSeverity(r.status, r.riskLevel),
      });
    }
  }

  // Sort events newest first
  allEvents.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  const recentActivity = allEvents.slice(0, 10);

  // 6. Risk Trend
  const riskTrend = computeRiskTrend(filtered);

  // 7. Top Crops Aggregation
  const cropMap = new Map<string, { count: number; scoreSum: number; premiumSum: number }>();
  for (const r of filtered) {
    const c = r.crop || "Unknown";
    const rawScore = Number(r.riskScore) || 0;
    const score = rawScore <= 1 ? rawScore * 100 : rawScore;
    const prem = Number(r.recommendedPremium) || 0;

    const existing = cropMap.get(c);
    if (existing) {
      existing.count += 1;
      existing.scoreSum += score;
      existing.premiumSum += prem;
    } else {
      cropMap.set(c, { count: 1, scoreSum: score, premiumSum: prem });
    }
  }

  const topCrops: TopCropStat[] = Array.from(cropMap.entries())
    .map(([crop, val]) => ({
      crop,
      count: val.count,
      avgRisk: Math.round(val.scoreSum / val.count),
      totalPremium: val.premiumSum,
    }))
    .sort((a, b) => b.count - a.count || b.totalPremium - a.totalPremium);

  // 8. Top Districts Aggregation
  const distMap = new Map<string, { count: number; scoreSum: number; premiumSum: number }>();
  for (const r of filtered) {
    const d = r.district || r.region || "Unknown";
    const rawScore = Number(r.riskScore) || 0;
    const score = rawScore <= 1 ? rawScore * 100 : rawScore;
    const prem = Number(r.recommendedPremium) || 0;

    const existing = distMap.get(d);
    if (existing) {
      existing.count += 1;
      existing.scoreSum += score;
      existing.premiumSum += prem;
    } else {
      distMap.set(d, { count: 1, scoreSum: score, premiumSum: prem });
    }
  }

  const topDistricts: TopDistrictStat[] = Array.from(distMap.entries())
    .map(([district, val]) => ({
      district,
      count: val.count,
      avgRisk: Math.round(val.scoreSum / val.count),
      totalPremium: val.premiumSum,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    summary,
    riskDistribution,
    mapFarms,
    recentAssessments,
    recentActivity,
    riskTrend,
    topCrops,
    topDistricts,
    availableRegions,
    availableCrops,
    availableStatuses,
    lastUpdated: new Date().toISOString(),
  };
}
