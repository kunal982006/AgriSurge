import { NextResponse } from "next/server";
import { saveUnderwritingRecord, UnderwritingRecord } from "@/lib/underwriting/underwritingStore";

export async function POST(req: Request) {
  const policyCode = `UW-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const farmCode = `F-${Math.floor(10000 + Math.random() * 90000)}`;

  try {
    const data = await req.json();

    const {
      farmer,
      farm,
      crop,
      location,
      geoPolygon,
      area,
      environmentalData,
      riskAssessment,
      premiumRecommendation,
    } = data;

    if (!farm || !location || !riskAssessment || !premiumRecommendation) {
      return NextResponse.json({ error: "Missing required assessment data." }, { status: 400 });
    }

    const areaAcres = Number(area || 5.0);
    const areaHectares = Number((areaAcres * 0.40468564224).toFixed(4));
    const recPremium = Number(premiumRecommendation.recommendedPremium || 8530);

    const record: UnderwritingRecord = {
      id: policyCode,
      farmCode,
      farmerName: farmer?.name || "Ramesh Patil",
      farmName: farm?.name || "Patil Farm #1",
      region: farm?.region || location?.district || "Maharashtra",
      district: location?.district || farm?.region || "Ahilyanagar",
      taluka: location?.taluka,
      village: location?.village,
      latitude: Number(location?.latitude || 19.123),
      longitude: Number(location?.longitude || 74.456),
      cropCategory: crop === "Cotton" ? "Commercial / Fiber" : "Cereals / Grains",
      crop: crop || "RICE",
      cropVariety: data.cropVariety || "Basmati",
      sowingDate: data.sowingDate,
      growthStage: data.growthStage,
      irrigationType: data.irrigationType || "Rainfed",
      soilType: data.soilType || "Black Soil",
      areaAcres,
      areaHectares,
      geoJson: geoPolygon || null,

      environmentalData: environmentalData || null,

      riskScore: Number(riskAssessment.riskScore || 10),
      riskLevel: riskAssessment.riskTier || riskAssessment.riskLevel || "LOW",
      predictedYieldKgHa: Number(riskAssessment.predictedYieldKgHa || 1838.5),
      expectedYieldKgHa: Number(riskAssessment.expectedYieldKgHa || 1522.0),
      yieldDeviationPct: Number(riskAssessment.yieldDeviationPct || 20.8),
      riskFactors: riskAssessment.factors || [],
      modelMetadata: riskAssessment.modelMetadata || null,

      coverageAmount: recPremium * 10,
      baseExposure: Number(premiumRecommendation.basePremium || 9206.75),
      riskMultiplier: Number(premiumRecommendation.multiplier || 0.90),
      underwritingAdjAmount: Number(premiumRecommendation.details?.underwritingAdjAmount || 240.30),
      recommendedPremium: recPremium,
      pricingModelVersion: "v2.0",

      status: "UNDER_REVIEW",
      submittedAt: new Date().toISOString(),
      auditTrail: [
        {
          id: `aud-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          action: "Application Submitted for Underwriting",
          actor: "AgriSurge Workflow System",
          status: "UNDER_REVIEW",
          notes: `Submitted with Risk Score ${riskAssessment.riskScore}% (${riskAssessment.riskTier || "LOW"}) and Recommended Premium ₹${recPremium.toLocaleString("en-IN")}.`,
        },
      ],
    };

    const saved = await saveUnderwritingRecord(record);

    return NextResponse.json({
      success: true,
      assessmentId: saved.id,
      status: saved.status,
    });
  } catch (error) {
    console.error("Underwriting submission error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit underwriting policy." },
      { status: 500 }
    );
  }
}
