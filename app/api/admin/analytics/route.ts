import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  farmers,
  insuranceAccounts,
  farms,
  policies,
  riskPredictions,
  premiumPredictions,
  farmerAssessments,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  // 1. Enforce Server-Side Role Authorization
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const db = getDb();

    // 2. Fetch Core Entity Data from Neon PostgreSQL
    const [
      allFarmers,
      allInsurers,
      allFarms,
      allPoliciesWithRisk,
      allFarmerAssessments,
    ] = await Promise.all([
      db.select().from(farmers).orderBy(desc(farmers.createdAt)),
      db.select().from(insuranceAccounts).orderBy(desc(insuranceAccounts.createdAt)),
      db.select().from(farms),
      db
        .select({
          policy: policies,
          farm: farms,
          farmer: farmers,
          risk: riskPredictions,
          premium: premiumPredictions,
        })
        .from(policies)
        .leftJoin(farms, eq(policies.farmId, farms.id))
        .leftJoin(farmers, eq(farms.farmerId, farmers.id))
        .leftJoin(premiumPredictions, eq(policies.premiumPredictionId, premiumPredictions.id))
        .leftJoin(riskPredictions, eq(premiumPredictions.riskPredictionId, riskPredictions.id))
        .orderBy(desc(policies.createdAt)),
      db.select().from(farmerAssessments).orderBy(desc(farmerAssessments.createdAt)),
    ]);

    // 3. User KPIs
    const totalFarmers = allFarmers.length;
    const totalInsurance = allInsurers.length;
    const totalUsers = totalFarmers + totalInsurance;

    // 4. Assessment Counts
    const institutionalAssessmentsCount = allPoliciesWithRisk.length;
    const farmerAssessmentsCount = allFarmerAssessments.length;
    const totalAssessments = institutionalAssessmentsCount + farmerAssessmentsCount;

    // 5. Farmer vs Insurance User Comparison
    const userComparison = {
      farmers: totalFarmers,
      insuranceCompanies: totalInsurance,
      totalUsers,
      farmerPercentage: totalUsers > 0 ? Number(((totalFarmers / totalUsers) * 100).toFixed(1)) : 0,
      insurancePercentage: totalUsers > 0 ? Number(((totalInsurance / totalUsers) * 100).toFixed(1)) : 0,
    };

    // User Registration Timeline (grouped by Month Year)
    const timelineMap: Record<string, { month: string; farmers: number; insurance: number; total: number; sortKey: string }> = {};

    const formatMonthKey = (dateInput: Date | string) => {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return null;
      const monthStr = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { monthStr, sortKey };
    };

    allFarmers.forEach((f) => {
      const res = formatMonthKey(f.createdAt);
      if (!res) return;
      if (!timelineMap[res.monthStr]) {
        timelineMap[res.monthStr] = { month: res.monthStr, farmers: 0, insurance: 0, total: 0, sortKey: res.sortKey };
      }
      timelineMap[res.monthStr].farmers += 1;
      timelineMap[res.monthStr].total += 1;
    });

    allInsurers.forEach((i) => {
      const res = formatMonthKey(i.createdAt);
      if (!res) return;
      if (!timelineMap[res.monthStr]) {
        timelineMap[res.monthStr] = { month: res.monthStr, farmers: 0, insurance: 0, total: 0, sortKey: res.sortKey };
      }
      timelineMap[res.monthStr].insurance += 1;
      timelineMap[res.monthStr].total += 1;
    });

    const userRegistrationTimeline = Object.values(timelineMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // 6. District-Wise Farmer Distribution & Top District
    const districtCountMap: Record<string, number> = {};

    // Check farmer regions and farm locations
    allFarmers.forEach((f) => {
      const dist = f.region && f.region !== "Maharashtra" ? f.region : null;
      if (dist) {
        districtCountMap[dist] = (districtCountMap[dist] || 0) + 1;
      }
    });

    // Supplement with farms districts
    allFarms.forEach((fm) => {
      const dist = fm.region && fm.region !== "Maharashtra" ? fm.region : (fm.location?.split(",")?.[1]?.trim()) || null;
      if (dist && dist.length > 2) {
        districtCountMap[dist] = (districtCountMap[dist] || 0) + 1;
      }
    });

    // Supplement with farmer assessments
    allFarmerAssessments.forEach((fa) => {
      if (fa.district && fa.district.length > 2) {
        districtCountMap[fa.district] = (districtCountMap[fa.district] || 0) + 1;
      }
    });

    const districtDistribution = Object.entries(districtCountMap)
      .map(([district, count]) => ({
        district,
        count,
        percentage: totalFarmers > 0 ? Number(((count / (totalFarmers || 1)) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const topDistrict = districtDistribution.length > 0
      ? districtDistribution[0]
      : { district: "Ahilyanagar", count: 0, percentage: 0 };

    // 7. Low, Medium, and High Risk Assessment Distribution
    let lowRiskCount = 0;
    let moderateRiskCount = 0;
    let highRiskCount = 0;

    allPoliciesWithRisk.forEach((p) => {
      const lvl = (p.risk?.riskLevel || "").toLowerCase();
      if (lvl === "high") highRiskCount += 1;
      else if (lvl === "moderate" || lvl === "medium") moderateRiskCount += 1;
      else lowRiskCount += 1;
    });

    allFarmerAssessments.forEach((fa) => {
      const est = Number(fa.premiumEstimate || 0);
      if (est > 12000) highRiskCount += 1;
      else if (est > 8000) moderateRiskCount += 1;
      else lowRiskCount += 1;
    });

    const totalRiskEvaluations = lowRiskCount + moderateRiskCount + highRiskCount;
    const riskDistribution = [
      {
        level: "Low",
        count: lowRiskCount,
        percentage: totalRiskEvaluations > 0 ? Number(((lowRiskCount / totalRiskEvaluations) * 100).toFixed(1)) : 0,
        fill: "#10b981", // emerald
      },
      {
        level: "Moderate / Medium",
        count: moderateRiskCount,
        percentage: totalRiskEvaluations > 0 ? Number(((moderateRiskCount / totalRiskEvaluations) * 100).toFixed(1)) : 0,
        fill: "#f59e0b", // amber
      },
      {
        level: "High",
        count: highRiskCount,
        percentage: totalRiskEvaluations > 0 ? Number(((highRiskCount / totalRiskEvaluations) * 100).toFixed(1)) : 0,
        fill: "#ef4444", // red
      },
    ];

    // 8. Total and Average Estimated Premium & District-Wise Premium
    let sumPremium = 0;
    let premiumItemCount = 0;
    const districtPremiumMap: Record<string, { totalPremium: number; count: number; avgPremium: number }> = {};
    const premiumTrendMap: Record<string, { month: string; premium: number; count: number; sortKey: string }> = {};

    allPoliciesWithRisk.forEach((item) => {
      const rec = Number(item.premium?.recommendedPremium || 0);
      if (rec > 0) {
        sumPremium += rec;
        premiumItemCount += 1;

        const dist = item.farm?.region || "Maharashtra";
        if (!districtPremiumMap[dist]) {
          districtPremiumMap[dist] = { totalPremium: 0, count: 0, avgPremium: 0 };
        }
        districtPremiumMap[dist].totalPremium += rec;
        districtPremiumMap[dist].count += 1;

        const res = formatMonthKey(item.policy.createdAt);
        if (res) {
          if (!premiumTrendMap[res.monthStr]) {
            premiumTrendMap[res.monthStr] = { month: res.monthStr, premium: 0, count: 0, sortKey: res.sortKey };
          }
          premiumTrendMap[res.monthStr].premium += rec;
          premiumTrendMap[res.monthStr].count += 1;
        }
      }
    });

    allFarmerAssessments.forEach((fa) => {
      const prem = Number(fa.premiumEstimate || 0);
      if (prem > 0) {
        sumPremium += prem;
        premiumItemCount += 1;

        const dist = fa.district || "Maharashtra";
        if (!districtPremiumMap[dist]) {
          districtPremiumMap[dist] = { totalPremium: 0, count: 0, avgPremium: 0 };
        }
        districtPremiumMap[dist].totalPremium += prem;
        districtPremiumMap[dist].count += 1;

        const res = formatMonthKey(fa.createdAt);
        if (res) {
          if (!premiumTrendMap[res.monthStr]) {
            premiumTrendMap[res.monthStr] = { month: res.monthStr, premium: 0, count: 0, sortKey: res.sortKey };
          }
          premiumTrendMap[res.monthStr].premium += prem;
          premiumTrendMap[res.monthStr].count += 1;
        }
      }
    });

    const averageEstimatedPremium = premiumItemCount > 0 ? Math.round(sumPremium / premiumItemCount) : 0;

    const districtWisePremium = Object.entries(districtPremiumMap)
      .map(([district, val]) => ({
        district,
        totalPremium: Math.round(val.totalPremium),
        avgPremium: val.count > 0 ? Math.round(val.totalPremium / val.count) : 0,
        count: val.count,
      }))
      .sort((a, b) => b.totalPremium - a.totalPremium);

    const premiumTrends = Object.values(premiumTrendMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Risk category vs estimated premium
    const riskVsPremiumMap = {
      Low: { total: 0, count: 0 },
      Moderate: { total: 0, count: 0 },
      High: { total: 0, count: 0 },
    };

    allPoliciesWithRisk.forEach((p) => {
      const rec = Number(p.premium?.recommendedPremium || 0);
      const lvl = (p.risk?.riskLevel || "").toLowerCase();
      const cat = lvl === "high" ? "High" : lvl === "moderate" || lvl === "medium" ? "Moderate" : "Low";
      riskVsPremiumMap[cat].total += rec;
      riskVsPremiumMap[cat].count += 1;
    });

    allFarmerAssessments.forEach((fa) => {
      const prem = Number(fa.premiumEstimate || 0);
      const cat = prem > 12000 ? "High" : prem > 8000 ? "Moderate" : "Low";
      riskVsPremiumMap[cat].total += prem;
      riskVsPremiumMap[cat].count += 1;
    });

    const riskVsPremium = [
      {
        category: "Low Risk",
        totalPremium: Math.round(riskVsPremiumMap.Low.total),
        avgPremium: riskVsPremiumMap.Low.count > 0 ? Math.round(riskVsPremiumMap.Low.total / riskVsPremiumMap.Low.count) : 0,
        count: riskVsPremiumMap.Low.count,
        fill: "#2563eb",
      },
      {
        category: "Moderate Risk",
        totalPremium: Math.round(riskVsPremiumMap.Moderate.total),
        avgPremium: riskVsPremiumMap.Moderate.count > 0 ? Math.round(riskVsPremiumMap.Moderate.total / riskVsPremiumMap.Moderate.count) : 0,
        count: riskVsPremiumMap.Moderate.count,
        fill: "#f59e0b",
      },
      {
        category: "High Risk",
        totalPremium: Math.round(riskVsPremiumMap.High.total),
        avgPremium: riskVsPremiumMap.High.count > 0 ? Math.round(riskVsPremiumMap.High.total / riskVsPremiumMap.High.count) : 0,
        count: riskVsPremiumMap.High.count,
        fill: "#ef4444",
      },
    ];

    // 9. Recent Registrations (Combined Farmers & Insurance Accounts)
    const combinedRegistrations = [
      ...allFarmers.map((f) => ({
        id: `FARMER-${f.id}`,
        name: f.name,
        type: "Farmer",
        phone: f.phone || "—",
        organization: "Independent Agriculture",
        region: f.region || "Maharashtra",
        createdAt: f.createdAt,
      })),
      ...allInsurers.map((i) => ({
        id: `INS-${i.id}`,
        name: i.name,
        type: "Insurance Carrier",
        phone: i.phone,
        organization: i.organization,
        region: "Institutional HQ",
        createdAt: i.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 10. Recent Assessments (Policies & Wizard Assessments)
    const combinedAssessments = [
      ...allPoliciesWithRisk.map((p) => {
        const snap = (p.policy.assessmentSnapshot as any) || {};
        return {
          id: p.policy.policyCode,
          type: "Underwriting Application",
          farmerName: p.farmer?.name || snap.farmerName || "Farmer",
          crop: p.farm?.crop || snap.crop || "Agricultural Crop",
          district: p.farm?.region || snap.district || "Maharashtra",
          riskLevel: p.risk?.riskLevel ? (p.risk.riskLevel === "low" ? "Low" : p.risk.riskLevel === "high" ? "High" : "Moderate") : "Low",
          riskScorePct: p.risk?.riskScore ? Math.round(Number(p.risk.riskScore) * 100) : 25,
          recommendedPremium: Number(p.premium?.recommendedPremium || snap.recommendedPremium || 0),
          status: p.policy.status || "UNDER_REVIEW",
          createdAt: p.policy.createdAt,
        };
      }),
      ...allFarmerAssessments.map((fa) => ({
        id: fa.assessmentCode,
        type: "Farmer Advisory Assessment",
        farmerName: fa.farmerName || "Farmer",
        crop: fa.selectedCrop,
        district: fa.district || "Maharashtra",
        riskLevel: Number(fa.premiumEstimate || 0) > 10000 ? "High" : Number(fa.premiumEstimate || 0) > 7500 ? "Moderate" : "Low",
        riskScorePct: Number(fa.premiumEstimate || 0) > 10000 ? 68 : Number(fa.premiumEstimate || 0) > 7500 ? 45 : 22,
        recommendedPremium: Number(fa.premiumEstimate || 0),
        status: fa.status || "COMPLETED",
        createdAt: fa.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const payload = {
      summary: {
        totalUsers,
        totalFarmers,
        totalInsurance,
        totalAssessments,
        totalEstimatedPremium: Math.round(sumPremium),
        averageEstimatedPremium,
        topDistrict,
      },
      userComparison,
      userRegistrationTimeline,
      districtDistribution,
      riskDistribution,
      districtWisePremium,
      premiumTrends,
      riskVsPremium,
      recentRegistrations: combinedRegistrations.slice(0, 50),
      recentAssessments: combinedAssessments.slice(0, 50),
    };

    return NextResponse.json({
      success: true,
      data: payload,
      ...payload,
    });
  } catch (err: any) {
    console.error("[/api/admin/analytics] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load database analytics." },
      { status: 500 }
    );
  }
}
