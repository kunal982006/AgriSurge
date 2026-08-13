import { NextRequest, NextResponse } from "next/server";
import { predictRisk } from "@/lib/ml/riskClient";
import { calculatePremium } from "@/lib/pricing/pricingEngine";
import { RiskPredictionInput } from "@/lib/ml/types";

// POST /api/risk/analyze
// Orchestrates: ML risk prediction -> pricing engine. Kept as two distinct
// steps/response sections so the client never conflates a model output
// with a pricing decision.
export async function POST(req: NextRequest) {
  let body: Partial<RiskPredictionInput> & { basePremium?: number };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number" ||
    !body.crop ||
    typeof body.rainfallMm !== "number" ||
    typeof body.temperatureC !== "number" ||
    typeof body.humidityPct !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing required fields: latitude, longitude, crop, rainfallMm, temperatureC, humidityPct." },
      { status: 400 }
    );
  }

  try {
    const prediction = await predictRisk(body as RiskPredictionInput);
    const pricing = calculatePremium(prediction.riskScore, body.basePremium);

    return NextResponse.json({ prediction, pricing });
  } catch (err) {
    console.error("Risk analysis failed:", err);
    return NextResponse.json({ error: "Risk model service is currently unavailable." }, { status: 502 });
  }
}
