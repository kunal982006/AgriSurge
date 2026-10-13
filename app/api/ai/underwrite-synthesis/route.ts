import { NextRequest, NextResponse } from "next/server";
import { generateGeminiUnderwritingSynthesis, isGeminiAvailable } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!isGeminiAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: "Gemini API key is not configured.",
        },
        { status: 503 }
      );
    }

    const synthesis = await generateGeminiUnderwritingSynthesis({
      policyId: body.policyId || body.id,
      farmCode: body.farmCode,
      farmerName: body.farmerName,
      district: body.district || body.region,
      crop: body.crop,
      areaAcres: Number(body.areaAcres || 5),
      riskScore: Number(body.riskScore ?? 30),
      riskLevel: String(body.riskLevel || "LOW"),
      predictedYieldKgHa: body.predictedYieldKgHa,
      expectedYieldKgHa: body.expectedYieldKgHa,
      yieldDeviationPct: body.yieldDeviationPct,
      recommendedPremium: body.recommendedPremium,
      riskFactors: body.riskFactors,
      environmentalData: body.environmentalData,
    });

    return NextResponse.json({
      success: true,
      synthesis,
      model: "gemini-3.8-flash",
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[API /api/ai/underwrite-synthesis] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to generate underwriting synthesis",
      },
      { status: 500 }
    );
  }
}
