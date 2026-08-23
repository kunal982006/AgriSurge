import { NextRequest, NextResponse } from "next/server";
import { getAllUnderwritingRecords } from "@/lib/underwriting/underwritingStore";
import {
  buildAnalyticsPayload,
  normalizePolicyForMap,
  computeRiskTrend,
  computePremiumTrend,
  computeRegionalRisk,
  computeCropRisk,
  computeRiskDistribution,
} from "@/lib/policy/policyDataAdapter";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regionFilter = searchParams.get("region") || "ALL";
    const cropFilter   = searchParams.get("crop")   || "ALL";
    const riskFilter   = searchParams.get("risk")   || "ALL";
    // type=map returns only the map-ready farms for the farm-map page
    const type = searchParams.get("type") || "full";

    let records = await getAllUnderwritingRecords();

    // Collect available filter options BEFORE filtering
    const availableRegions = Array.from(
      new Set(records.map((r) => r.district || r.region).filter(Boolean))
    ).sort();
    const availableCrops = Array.from(new Set(records.map((r) => r.crop).filter(Boolean))).sort();

    // Apply filters
    if (regionFilter !== "ALL") {
      records = records.filter(
        (r) => (r.district || r.region || "").toUpperCase() === regionFilter.toUpperCase()
      );
    }
    if (cropFilter !== "ALL") {
      records = records.filter(
        (r) => r.crop.toUpperCase() === cropFilter.toUpperCase()
      );
    }
    if (riskFilter !== "ALL") {
      records = records.filter(
        (r) => String(r.riskLevel).toUpperCase() === riskFilter.toUpperCase()
      );
    }

    // Map-only fast path for Farm Map page
    if (type === "map") {
      const mapFarms = records
        .map(normalizePolicyForMap)
        .filter((f) => f !== null);

      return NextResponse.json({
        success: true,
        mapFarms,
        availableRegions,
        availableCrops,
        totalPolicies: records.length,
      });
    }

    // Full analytics payload for Reports page
    const payload = buildAnalyticsPayload(records);

    return NextResponse.json({
      success: true,
      ...payload,
      availableRegions,
      availableCrops,
    });
  } catch (err) {
    console.error("[/api/analytics] Error:", err);
    return NextResponse.json(
      { error: "Failed to compute analytics." },
      { status: 500 }
    );
  }
}
